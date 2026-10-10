import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

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
 * Choose the battle-wide secondary mission mode before recording any cards.
 * Mode is stored once in scoring state and copied onto every drawn definition.
 */
export function setSecondaryMissionMode(state, { mode } = {}) {
  if (!Object.values(SECONDARY_MISSION_MODES).includes(mode)) {
    throw new TypeError("Secondary mission mode must be Fixed or Tactical.");
  }
  const existing = missionList(state);
  if (existing.length > 0) {
    throw new Error("Secondary mission mode cannot change after a card has been entered.");
  }
  if (state?.scoring?.secondaryMissionMode === mode) return state;
  const next = {
    ...state,
    scoring: {
      ...(state.scoring ?? {}),
      secondaryMissionMode: mode
    }
  };
  return appendHistoryEntry(next, createEvent("secondary_mission.mode_set", { mode }));
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
  const selectedMode = state?.scoring?.secondaryMissionMode ?? null;
  if (selectedMode && Array.isArray(normalized.availableModes) &&
      !normalized.availableModes.includes(selectedMode)) {
    throw new Error("This secondary card is not available in the selected " + selectedMode + " mode.");
  }
  const missionDefinition = selectedMode
    ? Object.freeze({ ...normalized, missionMode: selectedMode })
    : normalized;
  const existing = missionList(state);
  if (selectedMode === SECONDARY_MISSION_MODES.TACTICAL) {
    if (state.phase !== "command") {
      throw new Error("Tactical secondary cards can only be drawn during the Command phase.");
    }
    if (state.activePlayer && state.activePlayer !== playerId) {
      throw new Error("Only the active player can draw Tactical secondary cards during their Command phase.");
    }
    const drawnThisCommandPhase = existing.filter((item) =>
      item.playerId === playerId && item.drawnRound === round && item.drawnTurn === turn &&
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
      item.playerId === playerId && item.definition?.missionMode === SECONDARY_MISSION_MODES.FIXED
    ).length;
    if (fixedCardCount >= 2) {
      throw new Error("Each player can select only two Fixed secondary cards for the battle.");
    }
  }
  if (selectedMode === SECONDARY_MISSION_MODES.TACTICAL && existing.some((item) =>
      item.playerId === playerId && item.definitionId === missionDefinition.id)) {
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
  if (entry.isRedrawReplacement) {
    const pending = { ...(next.scoring?.secondaryMissionRedrawPendingByPlayer ?? {}) };
    delete pending[playerId];
    return {
      ...next,
      scoring: { ...next.scoring, secondaryMissionRedrawPendingByPlayer: pending }
    };
  }
  return next;
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
  notes = null
} = {}) {
  requireTurnPosition(round, turn);
  const { existing, index, entry } = requireOwnedActiveMission(state, instanceId, playerId, "score");
  const scoringEvent = Object.freeze({ round, turn, notes });
  const isFixed = (state?.scoring?.secondaryMissionMode ?? entry.definition?.missionMode) === SECONDARY_MISSION_MODES.FIXED;
  const updated = Object.freeze({
    ...entry,
    status: isFixed ? SECONDARY_MISSION_STATUS.ACTIVE : SECONDARY_MISSION_STATUS.SCORED,
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
  if ((state?.scoring?.secondaryMissionMode ?? entry.definition?.missionMode) === SECONDARY_MISSION_MODES.FIXED) {
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
  if ((state?.scoring?.secondaryMissionMode ?? entry.definition?.missionMode) === SECONDARY_MISSION_MODES.FIXED) {
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
