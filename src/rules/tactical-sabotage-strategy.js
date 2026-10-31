import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getSabotageState, isSabotageMissionForPlayer } from "./sabotage-state.js";
import { clamp01 } from "./tactical-context-utils.js";

function players(state) {
  return Array.isArray(state?.players) ? state.players : [];
}

function defaultPerspectivePlayerId(state) {
  return players(state)[0]?.id ?? state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
}

function missionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!playerId || !setup?.myDisposition || !setup?.opponentDisposition) return null;
  const definitions = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
  if (!definitions) return null;
  return playerId === perspectivePlayerId ? definitions.myMission : definitions.opponentMission;
}

function effectiveAwardEntries(state, playerId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  const reversedIds = new Set(history
    .filter((event) => ["victory_points.award_undone", "victory_points.adjustment_undone"].includes(event?.type))
    .map((event) => event.payload?.originalAwardEventId)
    .filter((id) => id != null));
  const reversedIndices = new Set(history
    .filter((event) => ["victory_points.award_undone", "victory_points.adjustment_undone"].includes(event?.type))
    .map((event) => event.payload?.originalAwardEventIndex)
    .filter((index) => Number.isInteger(index)));

  return history
    .map((event, index) => ({ event, index }))
    .filter(({ event, index }) => event?.type === "victory_points.awarded" &&
      !reversedIndices.has(index) && (!event.id || !reversedIds.has(event.id)))
    .filter(({ event }) => event.payload?.playerId === playerId)
    .map(({ event }) => ({ eventId: event.id ?? null, ...event.payload }));
}

function currentTurnMissionAwards(state, playerId, missionId, round, turn) {
  return effectiveAwardEntries(state, playerId).filter((entry) =>
    entry.category === "primary" &&
    entry.missionDefinitionId === missionId &&
    entry.round === round &&
    entry.turn === turn
  );
}

function commandAwardAmountForTurn(entries) {
  return entries
    .filter((entry) => entry.scoringTiming === "command-phase" ||
      (typeof entry.opportunityKey === "string" && entry.opportunityKey.endsWith(":command-phase")))
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
}

function primaryGameRemaining(state, playerId) {
  const used = effectiveAwardEntries(state, playerId)
    .filter((entry) => entry.category === "primary")
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  return Math.max(0, 45 - used);
}

function projectedMissionPrimaryVp(rawMissionVp, actualMissionVpThisTurn, additionalPrimaryAllowance) {
  const raw = Math.max(0, Number(rawMissionVp) || 0);
  const actual = Math.max(0, Number(actualMissionVpThisTurn) || 0);
  const allowance = Math.max(0, Number(additionalPrimaryAllowance) || 0);
  const desired = Math.max(actual, Math.min(15, raw));
  return actual + Math.min(Math.max(0, desired - actual), allowance);
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function controlSnapshot(state, playerId, perspectivePlayerId) {
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const ownHomeIds = Object.freeze(objectives
    .filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId))
    .map((objective) => objective.id));
  const roleKnown = ownHomeIds.length > 0;
  const known = objectives.length > 0 && roleKnown && objectives.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({ known: false, roleKnown, ownHomeIds, controlledIds: Object.freeze([]), nonHomeControlled: 0, nonHomeControlledIds: Object.freeze([]) });
  }
  const controlled = objectives.filter((objective) => controlledBy(objective.control, playerId));
  const nonHome = controlled.filter((objective) => !ownHomeIds.includes(objective.id));
  return Object.freeze({
    known: true,
    roleKnown,
    ownHomeIds,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlled: nonHome.length,
    nonHomeControlledIds: Object.freeze(nonHome.map((objective) => objective.id))
  });
}

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round <= 4 && String(phase ?? "") !== "command";
}

function pendingRawVp(sabotage) {
  return sabotage.pendingAttempts.reduce((sum, attempt) => sum + (attempt.enemyTerritory ? 5 : 3), 0);
}

export function getSabotagePrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state)
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isSabotageMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextActionVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Sabotage strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const sabotage = getSabotageState(state, { playerId, perspectivePlayerId });
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const checkpointCompleted = commandCheckpointCompleted(round, phase);
  const commandAwardAmount = round >= 2 && round <= 4 ? commandAwardAmountForTurn(awardsThisTurn) : 0;

  const liveControlVp = round >= 2 && controls.known && controls.nonHomeControlled > 0 ? 4 : 0;
  const controlVpForProjection = round >= 2 && round <= 4
    ? checkpointCompleted ? commandAwardAmount : liveControlVp
    : round >= 5 ? liveControlVp : 0;
  const actionRawVp = sabotage.actionRawVp;
  const rawAdvisoryVp = actionRawVp + controlVpForProjection;
  const cappedAdvisoryVp = projectedMissionPrimaryVp(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);

  const pendingActionRawVp = pendingRawVp(sabotage);
  const withPendingActions = projectedMissionPrimaryVp(rawAdvisoryVp + pendingActionRawVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const pendingActionVpLeverage = Math.max(0, withPendingActions - cappedAdvisoryVp);
  const bestEligibleActionRawVp = sabotage.objectiveOptions.reduce((best, option) => Math.max(best, option.potentialVp), 0);
  const withNextAction = projectedMissionPrimaryVp(rawAdvisoryVp + pendingActionRawVp + bestEligibleActionRawVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextActionVpLeverage = sabotage.actionAvailableThisTurn ? Math.max(0, withNextAction - withPendingActions) : 0;
  const remainingRoundVpAfterPending = Math.max(0, 15 - withPendingActions);

  let objectivePreservationScore = 0.24;
  if (sabotage.pendingAttempts.length > 0 && pendingActionVpLeverage > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (round >= 2 && controls.known && controls.nonHomeControlled === 1 && !checkpointCompleted) objectivePreservationScore = Math.max(objectivePreservationScore, 0.84);
  if (round === 5 && controls.known && controls.nonHomeControlled === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const completedText = sabotage.completedThisTurnCount > 0
    ? `${sabotage.completedThisTurnCount} Sabotage Action${sabotage.completedThisTurnCount === 1 ? " has" : "s have"} completed this turn for ${actionRawVp} raw VP before caps${sabotage.enemyTerritoryCompletedCount ? `, including ${sabotage.enemyTerritoryCompletedCount} enemy-territory bonus${sabotage.enemyTerritoryCompletedCount === 1 ? "" : "es"}` : ""}.`
    : "No Sabotage Action has completed this turn yet.";
  const pendingText = sabotage.pendingAttempts.length > 0
    ? `${sabotage.pendingAttempts.length} Sabotage attempt${sabotage.pendingAttempts.length === 1 ? " is" : "s are"} pending across different objectives for up to ${pendingActionVpLeverage} additional Primary VP after caps.`
    : "No Sabotage attempts are currently pending.";
  const availableText = sabotage.actionAvailableThisTurn && nextActionVpLeverage > 0
    ? `Additional Sabotage attempts remain available at unreserved non-home objectives; the best current option adds up to ${nextActionVpLeverage} Primary VP after caps.`
    : "No additional Sabotage Action currently adds Primary VP, either because no eligible objective remains or the scoring cap is already covered.";
  const controlText = round < 2
    ? "The recurring 4 VP non-home control condition begins in Round 2."
    : !controls.known
      ? "Objective control or home-objective role evidence is incomplete; confirm the recurring control condition on the tabletop."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${commandAwardAmount} VP from that checkpoint is recorded.`
        : controls.nonHomeControlled > 0
          ? "The recurring 4 VP non-home control condition is currently met."
          : "The recurring 4 VP non-home control condition is not currently met.";

  let reason;
  if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is filled, so Sabotage should no longer distort Action or objective choices for additional Primary scoring.";
  } else if (sabotage.pendingAttempts.length > 0 && pendingActionVpLeverage > 0) {
    reason = "Protect pending Sabotage units and keep control of their selected objectives through end of turn before committing resources to lower-value opportunities.";
  } else if (sabotage.actionAvailableThisTurn && nextActionVpLeverage > 0) {
    reason = "Sabotage has no per-turn Action limit. Use additional eligible units on different non-home objectives while the 15 VP round cap still leaves room, prioritizing enemy-territory objectives for the cumulative +2 VP bonus.";
  } else if (round >= 2 && controls.known && !checkpointCompleted && controls.nonHomeControlled === 0) {
    reason = "Build the active control checkpoint by securing at least one objective other than your home objective for 4 VP.";
  } else {
    reason = "Current Sabotage scoring is largely covered. Preserve any objective carrying the recurring control condition and avoid spending units on Actions that cannot add VP under the caps.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Priority Assets",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn,
    phase,
    objectiveStateKnown: controls.known,
    homeRoleKnown: controls.roleKnown,
    playerHomeObjectiveIds: controls.ownHomeIds,
    controlledObjectiveIds: controls.controlledIds,
    nonHomeControlled: controls.nonHomeControlled,
    nonHomeControlledIds: controls.nonHomeControlledIds,
    commandCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    controlVpForProjection,
    actionRawVp,
    completedActionsThisTurn: sabotage.completedThisTurnCount,
    enemyTerritoryCompletedCount: sabotage.enemyTerritoryCompletedCount,
    uncertainTerritoryCompletedCount: sabotage.uncertainTerritoryCompletedCount,
    pendingAttempts: sabotage.pendingAttempts,
    reservedObjectiveIds: sabotage.reservedObjectiveIds,
    eligibleObjectiveIds: sabotage.eligibleObjectiveIds,
    objectiveOptions: sabotage.objectiveOptions,
    pendingActionRawVp,
    pendingActionVpLeverage,
    nextActionVpLeverage,
    bestEligibleActionRawVp,
    remainingRoundVpAfterPending,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    targetingScore: 0,
    objectivePreservationScore,
    protectCheapUnits: sabotage.pendingAttempts.length > 0,
    summary: Object.freeze([
      completedText,
      pendingText,
      availableText,
      controlText,
      `Current recorded Sabotage conditions project ${cappedAdvisoryVp}/15 Primary VP this round before unresolved tabletop checks.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Sabotage starts in the Shooting phase and may be started by multiple units in the same phase, but each must select a different non-home objective.",
      "A Sabotage Action completes at end of turn only if the acting unit remains eligible at its selected objective and that objective is controlled; physical range and control remain tabletop-authoritative.",
      "Each completed Sabotage is worth 3 VP, with a cumulative +2 VP for each completing unit that is within range of one or more objectives in the opponent's territory.",
      "Rounds 2-4 non-home control scoring is fixed at the Command checkpoint; Round 5 uses the end-of-turn control state instead.",
      "Primary scoring is capped at 15 VP per battle round and 45 VP for the battle."
    ])
  });
}

export function getSabotageObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId || !isSabotageMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Sabotage is not active for this objective." });
  }

  const strategy = primaryStrategy ?? getSabotagePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const objective = (state?.objectives ?? []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Objective is not available." });

  const ownHome = strategy.playerHomeObjectiveIds.includes(objectiveId);
  const controlled = control === "controlled" || controlledBy(objective.control, playerId);
  const controlWindowOpen = strategy.round >= 2 && (strategy.round >= 5 || !strategy.commandCheckpointCompleted);
  const option = strategy.objectiveOptions.find((item) => item.objectiveId === objectiveId) ?? null;
  const pending = strategy.pendingAttempts.find((attempt) => attempt.objectiveId === objectiveId) ?? null;

  let controlVpLeverage = 0;
  if (controlWindowOpen && !ownHome) {
    if (controlled && strategy.nonHomeControlled === 1) controlVpLeverage = 4;
    if (!controlled && strategy.nonHomeControlled === 0) controlVpLeverage = 4;
  }
  const actionRawVp = pending?.projectedVp ?? option?.potentialVp ?? 0;
  const actionVpLeverage = Math.min(strategy.remainingPrimaryGameVp, strategy.remainingRoundVpAfterPending + (pending ? strategy.pendingActionVpLeverage : strategy.nextActionVpLeverage), actionRawVp || 0);
  const rawVpLeverage = controlVpLeverage + actionVpLeverage;
  const vpLeverage = Math.min(strategy.remainingPrimaryGameVp, rawVpLeverage);

  let score = 0.06 + controlVpLeverage * 0.1 + actionVpLeverage * 0.08;
  if (pending) score += 0.24;
  if (option?.enemyTerritory) score += 0.14;
  if (controlled && (controlVpLeverage > 0 || pending)) score += 0.14;
  if (strategy.remainingPrimaryGameVp === 0) score = Math.min(score, 0.12);
  score = clamp01(score);

  let reason;
  if (ownHome) {
    reason = "Your home objective is excluded from both the Sabotage Action and the recurring 4 VP control condition.";
  } else if (pending) {
    reason = `Preserve this objective and the acting unit through end of turn: a pending Sabotage here is worth ${pending.projectedVp} raw VP${pending.enemyTerritory ? " including the +2 VP enemy-territory bonus" : pending.territoryUncertain ? "; the +2 VP territory bonus requires tabletop confirmation" : ""}.`;
  } else if (option) {
    reason = `This is an available Sabotage objective worth ${option.potentialVp} raw VP if the Action completes${option.enemyTerritory ? " including the +2 VP enemy-territory bonus" : option.territoryUncertain ? "; enemy-territory bonus eligibility needs tabletop confirmation" : ""}.`;
  } else if (controlVpLeverage > 0) {
    reason = controlled
      ? "Preserve this non-home objective; it currently carries Sabotage's binary 4 VP control condition."
      : "Taking this non-home objective can establish Sabotage's binary 4 VP control condition at the active checkpoint.";
  } else {
    reason = "This objective has ordinary board-control value but no additional immediate Sabotage leverage beyond the current plan.";
  }

  return Object.freeze({
    active: true,
    score,
    vpLeverage,
    rawVpLeverage,
    controlVpLeverage,
    actionVpLeverage,
    actionRawVp,
    ownHome,
    controlled,
    pending: Boolean(pending),
    eligibleForAction: Boolean(option),
    enemyTerritory: Boolean(option?.enemyTerritory ?? pending?.enemyTerritory),
    territoryUncertain: Boolean(option?.territoryUncertain ?? pending?.territoryUncertain),
    purpose,
    reason
  });
}

export { isSabotageMissionForPlayer } from "./sabotage-state.js";
