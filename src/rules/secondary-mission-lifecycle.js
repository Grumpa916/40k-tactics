import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { UNIT_STATUS } from "../state/unit.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";

export const SECONDARY_MISSION_MODES = Object.freeze({
  FIXED: "fixed",
  TACTICAL: "tactical"
});

export const SECONDARY_MISSION_STATUS = Object.freeze({
  ACTIVE: "active",
  SCORED: "scored",
  DISCARDED: "discarded",
  RETURNED_TO_DECK: "returned-to-deck"
});

function normalizeMissionDefinition(definition) {
  if (!definition || typeof definition.id !== "string" || !definition.id) {
    throw new TypeError("A secondary mission definition with an id is required.");
  }
  if (definition.category !== "secondary") {
    throw new Error("Only definitions categorized as secondary can enter the secondary mission lifecycle.");
  }
  return Object.freeze({ ...definition });
}

function missionList(state) {
  const list = state?.scoring?.secondaryMissions;
  return Array.isArray(list) ? list : [];
}

function withMissionList(state, secondaryMissions) {
  return {
    ...state,
    scoring: {
      ...(state.scoring ?? {}),
      secondaryMissions
    }
  };
}

/**
 * Return a player's configured mode. The legacy battle-wide field remains a
 * fallback for old saves and existing callers that have not migrated yet.
 */
export function getSecondaryMissionMode(state, playerId = null) {
  if (playerId && state?.scoring?.secondaryMissionModeByPlayer?.[playerId]) {
    return state.scoring.secondaryMissionModeByPlayer[playerId];
  }
  return state?.scoring?.secondaryMissionMode ?? null;
}

/** Set Fixed/Tactical independently for a player, before that player records cards. */
export function setSecondaryMissionMode(state, { mode, playerId = null } = {}) {
  if (!Object.values(SECONDARY_MISSION_MODES).includes(mode)) {
    throw new TypeError("Secondary mission mode must be Fixed or Tactical.");
  }
  const existing = missionList(state);
  if (playerId && existing.some((entry) => entry.playerId === playerId)) {
    throw new Error("A player's secondary mission mode cannot change after that player has entered a card.");
  }
  if (!playerId && existing.length > 0) {
    throw new Error("Secondary mission mode cannot change after a card has been entered.");
  }
  if (!playerId && state?.scoring?.secondaryMissionMode === mode) return state;
  if (playerId && getSecondaryMissionMode(state, playerId) === mode) return state;
  const scoring = { ...(state.scoring ?? {}) };
  if (playerId) {
    scoring.secondaryMissionModeByPlayer = {
      ...(scoring.secondaryMissionModeByPlayer ?? {}),
      [playerId]: mode
    };
  } else {
    scoring.secondaryMissionMode = mode;
  }
  const next = { ...state, scoring };
  return appendHistoryEntry(next, createEvent("secondary_mission.mode_set", {
    mode,
    ...(playerId ? { playerId } : {})
  }));
}

function requireTurnPosition(round, turn) {
  if (!Number.isInteger(round) || round < 0 || !Number.isInteger(turn) || turn < 0) {
    throw new TypeError("Round and turn must be non-negative integers.");
  }
}

function requireOwnedActiveMission(state, instanceId, playerId, action) {
  if (!instanceId) throw new TypeError("A secondary mission instance id is required.");
  if (!playerId) throw new TypeError("The " + action + " player is required.");
  const existing = missionList(state);
  const index = existing.findIndex((entry) => entry.instanceId === instanceId);
  if (index < 0) throw new Error("Secondary mission instance not found.");
  const entry = existing[index];
  if (entry.playerId !== playerId) {
    throw new Error("Only the owning player can " + action + " this secondary mission.");
  }
  if (entry.status !== SECONDARY_MISSION_STATUS.ACTIVE) {
    throw new Error("Only an active secondary mission can be " + action + ".");
  }
  return { existing, index, entry };
}

const NO_MANS_LAND_OBJECTIVE_NAMES = new Set(["Central 1", "Central 2", "Expansion 1", "Expansion 2"]);

function isNoMansLandObjective(objective) {
  const layoutName = objective?.layoutObjective ?? objective?.name ?? "";
  return NO_MANS_LAND_OBJECTIVE_NAMES.has(String(layoutName)) ||
    objective?.zone === "no-mans-land";
}

export function getPendingSecondaryMissionCardChoice(state, playerId = state?.activePlayer) {
  return playerId ? state?.scoring?.secondaryMissionCardChoicePendingByPlayer?.[playerId] ?? null : null;
}

export function getSecondaryMissionCardChoiceOptions(state, { playerId, choiceType } = {}) {
  if (!playerId) throw new TypeError("A player id is required.");
  const units = Array.isArray(state?.units) ? state.units : [];
  if (choiceType === "beacon") {
    return units.filter((unit) => unit.ownerId === playerId &&
      [UNIT_STATUS.DEPLOYED, UNIT_STATUS.EMBARKED].includes(unit.status));
  }
  if (choiceType === "burden-trust") {
    return units.filter((unit) => unit.ownerId === playerId && unit.status === UNIT_STATUS.DEPLOYED);
  }
  if (choiceType === "tempting-target") {
    return (Array.isArray(state?.objectives) ? state.objectives : [])
      .filter((objective) => objective?.id && isNoMansLandObjective(objective) &&
        !isPlayerHomeObjective(state, objective, playerId) &&
        !(state.players ?? []).some((player) => player.id !== playerId &&
          isPlayerHomeObjective(state, objective, player.id)));
  }
  return [];
}

export function getActiveBurdenTrustAssignments(state, entry, {
  turn = state?.turn ?? 0
} = {}) {
  if (entry?.definitionId !== "secondary-burden-of-trust" ||
      entry?.status !== SECONDARY_MISSION_STATUS.ACTIVE) return [];
  return (entry.cardState?.burdenTrustAssignments ?? [])
    .filter((assignment) => Number.isInteger(assignment.expiresAtTurn) && turn < assignment.expiresAtTurn)
    .map((assignment) => ({ ...assignment }));
}

/** Record a required When Drawn selection or a turn-based Burden of Trust assignment. */
export function recordSecondaryMissionCardChoice(state, {
  instanceId,
  playerId,
  choiceType,
  unitId = null,
  objectiveId = null,
  guardAssignments = [],
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  requireTurnPosition(round, turn);
  if (state.phase !== "command" || (state.activePlayer && state.activePlayer !== playerId)) {
    throw new Error("Secondary card choices are recorded during the owning player's Command phase.");
  }
  const { existing, index, entry } = requireOwnedActiveMission(state, instanceId, playerId, "update");
  if (getSecondaryMissionMode(state, playerId) !== SECONDARY_MISSION_MODES.TACTICAL) {
    throw new Error("These card-specific choices apply to Tactical secondary cards.");
  }
  const cardState = { ...(entry.cardState ?? {}) };
  let eventType;
  let eventPayload;

  if (choiceType === "beacon" && entry.definitionId === "secondary-beacon") {
    if (entry.drawnRound !== round || entry.drawnTurn !== turn) {
      throw new Error("Select the Beacon unit immediately when the card is drawn.");
    }
    if (cardState.beaconUnitId) throw new Error("The Beacon unit cannot be replaced after it is selected.");
    const unit = state.units?.find((item) => item.id === unitId && item.ownerId === playerId &&
      [UNIT_STATUS.DEPLOYED, UNIT_STATUS.EMBARKED].includes(item.status));
    if (!unit) throw new Error("Choose your unit on the battlefield or embarked within a Transport on the battlefield.");
    cardState.beaconUnitId = unit.id;
    cardState.beaconSelectedRound = round;
    cardState.beaconSelectedTurn = turn;
    eventType = "secondary_mission.beacon_selected";
    eventPayload = { playerId, instanceId, unitId: unit.id, round, turn };
  } else if (choiceType === "tempting-target" && entry.definitionId === "secondary-a-tempting-target") {
    if (entry.drawnRound !== round || entry.drawnTurn !== turn) {
      throw new Error("Choose the Tempting Target immediately when the card is drawn.");
    }
    if (cardState.temptingTargetObjectiveId) throw new Error("The Tempting Target objective cannot be changed after selection.");
    const objective = getSecondaryMissionCardChoiceOptions(state, { playerId, choiceType })
      .find((item) => item.id === objectiveId);
    if (!objective) throw new Error("The opponent must select an eligible No Man's Land objective, excluding both home objectives.");
    const opponent = (state.players ?? []).find((player) => player.id !== playerId);
    cardState.temptingTargetObjectiveId = objective.id;
    cardState.temptingTargetSelectedByPlayerId = opponent?.id ?? null;
    cardState.temptingTargetSelectedRound = round;
    cardState.temptingTargetSelectedTurn = turn;
    eventType = "secondary_mission.tempting_target_selected";
    eventPayload = { playerId, selectedByPlayerId: opponent?.id ?? null, instanceId, objectiveId: objective.id, round, turn };
  } else if (choiceType === "burden-trust" && entry.definitionId === "secondary-burden-of-trust") {
    if (!Array.isArray(guardAssignments)) throw new TypeError("Burden of Trust guard assignments must be a list.");
    const objectives = Array.isArray(state.objectives) ? state.objectives : [];
    const seenObjectives = new Set();
    const normalizedAssignments = guardAssignments.filter((item) => item?.unitId).map((item) => {
      if (!item.objectiveId || seenObjectives.has(item.objectiveId)) {
        throw new Error("Each Burden of Trust objective can be assigned only once.");
      }
      seenObjectives.add(item.objectiveId);
      if (!objectives.some((objective) => objective.id === item.objectiveId)) {
        throw new Error("Choose an objective on this battlefield.");
      }
      const unit = state.units?.find((candidate) => candidate.id === item.unitId &&
        candidate.ownerId === playerId && candidate.status === UNIT_STATUS.DEPLOYED);
      if (!unit) throw new Error("Choose one of your deployed units to guard each objective.");
      return { objectiveId: item.objectiveId, unitId: unit.id };
    }).map((item) => ({ ...item, assignedRound: round, assignedTurn: turn, expiresAtTurn: turn + 2 }));
    cardState.burdenTrustAssignments = normalizedAssignments;
    cardState.burdenTrustHistory = [
      ...(cardState.burdenTrustHistory ?? []),
      { round, turn, assignments: normalizedAssignments.map((item) => ({ ...item })) }
    ];
    eventType = "secondary_mission.burden_trust_assignments_recorded";
    eventPayload = { playerId, instanceId, round, turn, assignments: normalizedAssignments };
  } else {
    throw new Error("This choice does not apply to the selected active secondary card.");
  }

  const updatedEntry = Object.freeze({ ...entry, cardState: Object.freeze(cardState) });
  const next = withMissionList(state, existing.map((item, itemIndex) => itemIndex === index ? updatedEntry : item));
  const scoring = { ...next.scoring };
  if (choiceType === "beacon" || choiceType === "tempting-target") {
    const pending = { ...(scoring.secondaryMissionCardChoicePendingByPlayer ?? {}) };
    if (pending[playerId]?.instanceId === instanceId) delete pending[playerId];
    scoring.secondaryMissionCardChoicePendingByPlayer = pending;
  }
  return appendHistoryEntry({ ...next, scoring }, createEvent(eventType, eventPayload));
}

const RULE_REPLACEMENT_RULES = Object.freeze({
  "secondary-a-grievous-blow": { condition: "Confirm no enemy unit with Starting Strength 13+ is on the battlefield." },
  "secondary-behind-enemy-lines": { firstRoundOnly: true, prompt: "This card may be replaced when drawn in the first battle round." },
  "secondary-bring-it-down": { condition: "Confirm no enemy model with 10+ Wounds is on the battlefield." },
  "secondary-cleanse": { pairedMissionId: "secondary-plunder", prompt: "Plunder must already be active for you." },
  "secondary-defend-stronghold": { firstRoundOnly: true, mandatory: true, prompt: "This card must be replaced if drawn in the first battle round." },
  "secondary-forward-position": { firstRoundOnly: true, prompt: "This card may be replaced when drawn in the first battle round." },
  "secondary-plunder": { pairedMissionId: "secondary-cleanse", prompt: "Cleanse must already be active for you." }
});

export function getPendingSecondaryMissionRuleReplacement(state, playerId = state?.activePlayer) {
  return playerId ? state?.scoring?.secondaryMissionRuleReplacementPendingByPlayer?.[playerId] ?? null : null;
}

export function getSecondaryMissionReplacementOpportunity(state, entry, {
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  if (!entry || entry.status !== SECONDARY_MISSION_STATUS.ACTIVE) {
    return { eligible: false, reason: "Only an active card can be returned." };
  }
  const playerId = entry.playerId;
  if (getSecondaryMissionMode(state, playerId) !== SECONDARY_MISSION_MODES.TACTICAL) {
    return { eligible: false, reason: "When Drawn replacements apply only to Tactical cards." };
  }
  if (state.phase !== "command" || (state.activePlayer && state.activePlayer !== playerId)) {
    return { eligible: false, reason: "Resolve this card during its owner's Command phase." };
  }
  if (entry.drawnRound !== round || entry.drawnTurn !== turn) {
    return { eligible: false, reason: "When Drawn replacements must be resolved immediately after the card is drawn." };
  }
  const pending = getPendingSecondaryMissionRuleReplacement(state, playerId);
  if (pending && (pending.stage === "draw" || pending.instanceId !== entry.instanceId)) {
    return { eligible: false, reason: "Resolve the pending card replacement first." };
  }
  const rule = RULE_REPLACEMENT_RULES[entry.definitionId];
  if (!rule) return { eligible: false, reason: "This card has no replacement rule." };
  if (rule.firstRoundOnly && round !== 1) {
    return { eligible: false, reason: "This replacement is available only when the card is drawn in battle round 1." };
  }
  if (rule.pairedMissionId && !missionList(state).some((item) =>
    item.playerId === playerId && item.definitionId === rule.pairedMissionId &&
    item.status === SECONDARY_MISSION_STATUS.ACTIVE)) {
    return { eligible: false, reason: rule.prompt };
  }
  return {
    eligible: true,
    mandatory: rule.mandatory === true,
    requiresConfirmation: Boolean(rule.condition),
    confirmationPrompt: rule.condition ?? null,
    reason: rule.prompt ?? rule.condition ?? "The card's When Drawn rule allows a replacement."
  };
}

/** Return a Tactical card under its printed When Drawn replacement rule. */
export function returnSecondaryMissionForRule(state, {
  instanceId,
  playerId,
  conditionConfirmed = false,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  requireTurnPosition(round, turn);
  const { entry } = requireOwnedActiveMission(state, instanceId, playerId, "return");
  const opportunity = getSecondaryMissionReplacementOpportunity(state, entry, { round, turn });
  if (!opportunity.eligible) throw new Error(opportunity.reason);
  if (opportunity.requiresConfirmation && conditionConfirmed !== true) {
    throw new Error("Confirm the printed card's replacement condition before returning it.");
  }
  const returned = returnSecondaryMissionToDeck(state, { instanceId, playerId, round, turn });
  const pendingByPlayer = {
    ...(returned.scoring?.secondaryMissionRuleReplacementPendingByPlayer ?? {}),
    [playerId]: { instanceId, definitionId: entry.definitionId, round, turn, stage: "draw" }
  };
  const updated = {
    ...returned,
    scoring: { ...returned.scoring, secondaryMissionRuleReplacementPendingByPlayer: pendingByPlayer }
  };
  return appendHistoryEntry(updated, createEvent("secondary_mission.returned_for_rule_replacement", {
    playerId, instanceId, definitionId: entry.definitionId, round, turn, conditionConfirmed
  }));
}

/** Add a newly drawn secondary mission without changing the player's VP score. */
export function drawSecondaryMission(state, {
  definition,
  playerId,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  if (!playerId) throw new TypeError("The player drawing the secondary mission is required.");
  requireTurnPosition(round, turn);
  const normalized = normalizeMissionDefinition(definition);
  const selectedMode = getSecondaryMissionMode(state, playerId);
  if (selectedMode && Array.isArray(normalized.availableModes) &&
      !normalized.availableModes.includes(selectedMode)) {
    throw new Error("This secondary card is not available in the selected " + selectedMode + " mode.");
  }
  const missionDefinition = selectedMode
    ? Object.freeze({ ...normalized, missionMode: selectedMode })
    : normalized;
  const existing = missionList(state);
  let isRuleReplacement = false;
  if (selectedMode === SECONDARY_MISSION_MODES.TACTICAL) {
    if (state.phase !== "command") {
      throw new Error("Tactical secondary cards can only be drawn during the Command phase.");
    }
    if (state.activePlayer && state.activePlayer !== playerId) {
      throw new Error("Only the active player can draw Tactical secondary cards during their Command phase.");
    }
    const pendingCardChoice = getPendingSecondaryMissionCardChoice(state, playerId);
    if (pendingCardChoice) throw new Error("Resolve the " + pendingCardChoice.choiceType + " choice before drawing another Tactical card.");
    const pendingRuleReplacement = state.scoring?.secondaryMissionRuleReplacementPendingByPlayer?.[playerId] ?? null;
    if (pendingRuleReplacement && pendingRuleReplacement.round === round &&
        pendingRuleReplacement.turn === turn && pendingRuleReplacement.stage === "return") {
      throw new Error("Return Defend Stronghold before drawing its required replacement card.");
    }
    if (pendingRuleReplacement && (pendingRuleReplacement.round !== round || pendingRuleReplacement.turn !== turn)) {
      throw new Error("Resolve the pending secondary card replacement before drawing another Tactical card.");
    }
    isRuleReplacement = Boolean(pendingRuleReplacement?.stage === "draw");
    const drawnThisCommandPhase = existing.filter((item) =>
      item.playerId === playerId && item.drawnRound === round && item.drawnTurn === turn &&
      item.status !== SECONDARY_MISSION_STATUS.RETURNED_TO_DECK &&
      item.isRedrawReplacement !== true
    ).length;
    const pendingRedraw = state.scoring?.secondaryMissionRedrawPendingByPlayer?.[playerId];
    const isRedrawReplacement = Boolean(pendingRedraw &&
      pendingRedraw.round === round && pendingRedraw.turn === turn);
    if (drawnThisCommandPhase >= 2 && !isRedrawReplacement) {
      throw new Error("Two Tactical secondary cards have already been recorded for this Command phase.");
    }
  }
  if (selectedMode === SECONDARY_MISSION_MODES.FIXED) {
    const fixedCardCount = existing.filter((item) =>
      item.playerId === playerId && (getSecondaryMissionMode(state, playerId) ?? item.definition?.missionMode) === SECONDARY_MISSION_MODES.FIXED
    ).length;
    if (fixedCardCount >= 2) {
      throw new Error("Each player can select only two Fixed secondary cards for the battle.");
    }
  }
  if (selectedMode === SECONDARY_MISSION_MODES.TACTICAL && existing.some((item) =>
      item.playerId === playerId && item.definitionId === missionDefinition.id &&
      item.status !== SECONDARY_MISSION_STATUS.RETURNED_TO_DECK)) {
    throw new Error("This Tactical card has already been drawn and cannot be drawn again.");
  }
  if (existing.some((item) => item.playerId === playerId &&
      item.definitionId === missionDefinition.id && item.status === SECONDARY_MISSION_STATUS.ACTIVE)) {
    throw new Error("This secondary mission is already active for that player.");
  }
  const entry = Object.freeze({
    instanceId: playerId + ":" + normalized.id + ":" + round + ":" + turn + ":" + (existing.length + 1),
    definitionId: missionDefinition.id,
    definition: missionDefinition,
    playerId,
    ...(selectedMode === SECONDARY_MISSION_MODES.TACTICAL &&
      state.scoring?.secondaryMissionRedrawPendingByPlayer?.[playerId]?.round === round &&
      state.scoring?.secondaryMissionRedrawPendingByPlayer?.[playerId]?.turn === turn
      ? { isRedrawReplacement: true } : {}),
    ...(selectedMode === SECONDARY_MISSION_MODES.TACTICAL && isRuleReplacement
      ? { isRuleReplacement: true } : {}),
    status: SECONDARY_MISSION_STATUS.ACTIVE,
    drawnRound: round,
    drawnTurn: turn,
    scoringHistory: [],
    scoredRound: null,
    scoredTurn: null,
    discardedRound: null,
    discardedTurn: null,
    returnedToDeckRound: null,
    returnedToDeckTurn: null
  });
  const next = withMissionList(state, [...existing, entry]);
  const scoring = { ...next.scoring };
  if (entry.isRedrawReplacement) {
    const pending = { ...(scoring.secondaryMissionRedrawPendingByPlayer ?? {}) };
    delete pending[playerId];
    scoring.secondaryMissionRedrawPendingByPlayer = pending;
  }
  if (isRuleReplacement) {
    const pending = { ...(scoring.secondaryMissionRuleReplacementPendingByPlayer ?? {}) };
    delete pending[playerId];
    scoring.secondaryMissionRuleReplacementPendingByPlayer = pending;
  }
  if (selectedMode === SECONDARY_MISSION_MODES.TACTICAL &&
      entry.definitionId === "secondary-defend-stronghold" && round === 1) {
    scoring.secondaryMissionRuleReplacementPendingByPlayer = {
      ...(scoring.secondaryMissionRuleReplacementPendingByPlayer ?? {}),
      [playerId]: { instanceId: entry.instanceId, definitionId: entry.definitionId, round, turn, stage: "return" }
    };
  }
  if (selectedMode === SECONDARY_MISSION_MODES.TACTICAL &&
      ["secondary-beacon", "secondary-a-tempting-target"].includes(entry.definitionId)) {
    const choiceType = entry.definitionId === "secondary-beacon" ? "beacon" : "tempting-target";
    scoring.secondaryMissionCardChoicePendingByPlayer = {
      ...(scoring.secondaryMissionCardChoicePendingByPlayer ?? {}),
      [playerId]: { instanceId: entry.instanceId, definitionId: entry.definitionId, choiceType, round, turn }
    };
  }
  return { ...next, scoring };
}

/**
 * Mark a secondary card scored as a terminal lifecycle transition.
 * This records history only; the separate scoring flow confirms any VP award.
 */
export function recordSecondaryMissionScored(state, {
  instanceId,
  playerId,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0,
  retireAfterScoring = false,
  notes = null
} = {}) {
  requireTurnPosition(round, turn);
  const { existing, index, entry } = requireOwnedActiveMission(state, instanceId, playerId, "score");
  const scoringEvent = Object.freeze({ round, turn, notes });
  const isFixed = (getSecondaryMissionMode(state, playerId) ?? entry.definition?.missionMode) === SECONDARY_MISSION_MODES.FIXED;
  const updated = Object.freeze({
    ...entry,
    status: isFixed && !retireAfterScoring ? SECONDARY_MISSION_STATUS.ACTIVE : SECONDARY_MISSION_STATUS.SCORED,
    scoredRound: round,
    scoredTurn: turn,
    scoringHistory: [...(entry.scoringHistory ?? []), scoringEvent]
  });
  return withMissionList(state, existing.map((item, i) => i === index ? updated : item));
}

/** Discard an active secondary card without awarding VP or CP. */
export function discardSecondaryMission(state, {
  instanceId,
  playerId,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  requireTurnPosition(round, turn);
  const { existing, index, entry } = requireOwnedActiveMission(state, instanceId, playerId, "discard");
  if ((getSecondaryMissionMode(state, playerId) ?? entry.definition?.missionMode) === SECONDARY_MISSION_MODES.FIXED) {
    throw new Error("Fixed secondary cards cannot be discarded.");
  }
  const updated = Object.freeze({
    ...entry,
    status: SECONDARY_MISSION_STATUS.DISCARDED,
    discardedRound: round,
    discardedTurn: turn
  });
  return withMissionList(state, existing.map((item, i) => i === index ? updated : item));
}

/**
 * Return an active card to the deck. The historical instance remains terminal
 * in state; if drawn again, it should be represented by a new instance.
 * Rule-specific permission to return a card is enforced by the calling flow.
 */
export function returnSecondaryMissionToDeck(state, {
  instanceId,
  playerId,
  round = state?.battle?.round ?? 0,
  turn = state?.turn ?? 0
} = {}) {
  requireTurnPosition(round, turn);
  const { existing, index, entry } = requireOwnedActiveMission(state, instanceId, playerId, "return");
  if ((getSecondaryMissionMode(state, playerId) ?? entry.definition?.missionMode) === SECONDARY_MISSION_MODES.FIXED) {
    throw new Error("Fixed secondary cards cannot be returned to the deck.");
  }
  const updated = Object.freeze({
    ...entry,
    status: SECONDARY_MISSION_STATUS.RETURNED_TO_DECK,
    returnedToDeckRound: round,
    returnedToDeckTurn: turn
  });
  return withMissionList(state, existing.map((item, i) => i === index ? updated : item));
}

export function getActiveSecondaryMissionDefinitions(state, playerId) {
  if (!playerId) throw new TypeError("A player id is required.");
  return missionList(state)
    .filter((entry) => entry.playerId === playerId && entry.status === SECONDARY_MISSION_STATUS.ACTIVE)
    .map((entry) => entry.definition);
}

export function getSecondaryMissionHistory(state, playerId = null) {
  return missionList(state)
    .filter((entry) => playerId == null || entry.playerId === playerId)
    .map((entry) => ({ ...entry, scoringHistory: [...(entry.scoringHistory ?? [])] }));
}
