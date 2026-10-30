import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import {
  getSecureAssetObjectiveOptions,
  getSecureAssetState,
  isSecureAssetMissionForPlayer
} from "./secure-asset-state.js";
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
  const home = objectives.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const homeIds = Object.freeze(home.map((objective) => objective.id));
  const homeRoleKnown = homeIds.length > 0;
  const known = objectives.length > 0 && homeRoleKnown && objectives.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown,
      homeIds,
      controlledCount: 0,
      controlledIds: Object.freeze([]),
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([])
    });
  }
  const controlled = objectives.filter((objective) => controlledBy(objective.control, playerId));
  const nonHome = controlled.filter((objective) => !homeIds.includes(objective.id));
  return Object.freeze({
    known: true,
    homeRoleKnown,
    homeIds,
    controlledCount: controlled.length,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlled: nonHome.length,
    nonHomeControlledIds: Object.freeze(nonHome.map((objective) => objective.id))
  });
}

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round <= 4 && String(phase ?? "") !== "command";
}

export function getSecureAssetPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isSecureAssetMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Secure Asset strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const secure = getSecureAssetState(state, { playerId, perspectivePlayerId });
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const checkpointCompleted = commandCheckpointCompleted(round, phase);
  const commandAwardAmount = round >= 2 && round <= 4 ? commandAwardAmountForTurn(awardsThisTurn) : 0;

  const liveControlVp = round >= 2 && controls.known
    ? (controls.nonHomeControlled > 0 ? 4 : 0) + (controls.controlledCount >= 3 ? 4 : 0)
    : 0;
  const controlVpForProjection = round >= 2 && round <= 4
    ? checkpointCompleted ? commandAwardAmount : liveControlVp
    : round >= 5 ? liveControlVp : 0;
  const actionRawVp = secure.completedThisTurnCount > 0 ? 4 : 0;
  const killRawVp = secure.centralKillSatisfied ? 2 : 0;
  const rawAdvisoryVp = actionRawVp + killRawVp + controlVpForProjection;
  const cappedAdvisoryVp = projectedMissionPrimaryVp(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);

  const pendingActionRawVp = secure.pendingObjectiveIds.length > 0 ? 4 : 0;
  const withPendingAction = projectedMissionPrimaryVp(rawAdvisoryVp + pendingActionRawVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const pendingActionVpLeverage = Math.max(0, withPendingAction - cappedAdvisoryVp);
  const options = getSecureAssetObjectiveOptions(state, { playerId, perspectivePlayerId });
  const withNextAction = projectedMissionPrimaryVp(rawAdvisoryVp + pendingActionRawVp + (secure.actionAvailableThisTurn ? 4 : 0), actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextActionVpLeverage = secure.actionAvailableThisTurn ? Math.max(0, withNextAction - withPendingAction) : 0;
  const withKill = projectedMissionPrimaryVp(rawAdvisoryVp + pendingActionRawVp + (secure.centralKillSatisfied ? 0 : 2), actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextKillVpLeverage = !secure.centralKillSatisfied && secure.remainingCentralTargetIds.length > 0
    ? Math.max(0, withKill - withPendingAction)
    : 0;

  const targetIsCentralCandidate = !!targetUnitId && secure.remainingCentralTargetIds.includes(targetUnitId);
  let targetingScore = 0.05;
  if (secure.remainingCentralTargetIds.length > 0 && nextKillVpLeverage > 0) targetingScore = 0.45 + nextKillVpLeverage * 0.12;
  if (targetIsCentralCandidate) targetingScore += 0.22;
  if (secure.centralKillSatisfied || remainingPrimaryGameVp === 0) targetingScore = Math.min(targetingScore, 0.12);
  targetingScore = clamp01(targetingScore);

  let objectivePreservationScore = 0.3;
  if (secure.pendingObjectiveIds.length > 0) objectivePreservationScore = 0.96;
  if (round >= 2 && controls.known && controls.nonHomeControlled === 1 && !checkpointCompleted) objectivePreservationScore = Math.max(objectivePreservationScore, 0.84);
  if (round >= 2 && controls.known && controls.controlledCount === 3 && !checkpointCompleted) objectivePreservationScore = Math.max(objectivePreservationScore, 0.82);
  if (round === 5 && controls.known && (controls.nonHomeControlled === 1 || controls.controlledCount === 3)) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const actionProgress = secure.completedThisTurnCount > 0
    ? "Secure Asset is completed this turn, satisfying the 4 VP end-of-turn Action condition before caps."
    : secure.pendingObjectiveIds.length > 0
      ? `Secure Asset is pending on ${secure.pendingObjectiveIds.join(", ")}; preserve the acting unit's control through end of turn for up to ${pendingActionVpLeverage} additional Primary VP.`
      : secure.actionAvailableThisTurn
        ? `Secure Asset is still available once this turn. An eligible non-home objective can add up to ${nextActionVpLeverage} Primary VP before caps.`
        : "Secure Asset has no remaining Action use this turn or no eligible non-home objective is recorded.";
  const killProgress = secure.centralKillSatisfied
    ? "The 2 VP central-objective destruction condition is already satisfied this turn."
    : !secure.centralKillEvidenceKnown
      ? "Turn-start central-objective kill evidence is incomplete; confirm any qualifying enemy destruction on the tabletop."
      : secure.remainingCentralTargetIds.length > 0
        ? `${secure.remainingCentralTargetIds.length} enemy unit${secure.remainingCentralTargetIds.length === 1 ? "" : "s"} began the turn within recorded central-objective range and remain relevant to the 2 VP destruction condition.`
        : "No recorded enemy unit began the turn within central-objective range, so the 2 VP destruction condition currently has no map-supported target.";
  const controlProgress = round < 2
    ? "The recurring non-home and three-objective control conditions begin in Round 2."
    : !controls.known
      ? "Objective control or home-objective role evidence is incomplete; confirm the control thresholds on the tabletop."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${commandAwardAmount} VP from that checkpoint is recorded. Later movement cannot retroactively change it.`
        : `${controls.nonHomeControlled > 0 ? "The 4 VP non-home condition is currently met." : "The 4 VP non-home condition is not currently met."} ${controls.controlledCount >= 3 ? "The 4 VP three-objective condition is currently met." : `You currently control ${controls.controlledCount}/3 objectives for the second 4 VP condition.`}`;

  let reason;
  if (!secure.homeRoleKnown) {
    reason = "Confirm the player's home objective before relying on Secure Asset Action eligibility or non-home control scoring.";
  } else if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is filled, so Secure Asset should no longer distort movement, Action, or target choices for additional Primary scoring.";
  } else if (secure.pendingObjectiveIds.length > 0 && pendingActionVpLeverage > 0) {
    reason = "A Secure Asset attempt is in progress. Protect the acting unit's control of that objective through end of turn before spending resources on lower-value Primary opportunities.";
  } else if (secure.actionAvailableThisTurn && nextActionVpLeverage > 0) {
    reason = "Secure Asset is a once-per-turn 4 VP opportunity. Prefer an eligible non-home objective the acting unit can realistically control through end of turn, then preserve it.";
  } else if (nextKillVpLeverage > 0) {
    reason = "The Action opportunity is covered or unavailable. Prioritize a qualifying enemy that began the turn within central-objective range to secure the separate 2 VP destruction condition.";
  } else if (round >= 2 && controls.known && !checkpointCompleted && (controls.nonHomeControlled === 0 || controls.controlledCount < 3)) {
    reason = "Build the active control checkpoint: hold at least one non-home objective and reach three total objectives for the two separate 4 VP conditions.";
  } else {
    reason = "Current Secure Asset scoring is largely covered. Preserve threshold objectives and avoid sacrificing units solely for Primary value that is already capped or satisfied.";
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
    targetUnitId,
    homeRoleKnown: secure.homeRoleKnown,
    playerHomeObjectiveIds: secure.playerHomeObjectiveIds,
    centralObjectiveIds: secure.centralObjectiveIds,
    usedActionThisTurn: secure.usedThisTurn,
    completedActionsThisTurn: secure.completedThisTurnCount,
    pendingObjectiveIds: secure.pendingObjectiveIds,
    eligibleActionObjectiveIds: Object.freeze(options.map((option) => option.objectiveId)),
    actionAvailableThisTurn: secure.actionAvailableThisTurn,
    centralKillEvidenceKnown: secure.centralKillEvidenceKnown,
    enemyStartedInCentralRangeIds: secure.enemyStartedInCentralRangeIds,
    qualifyingDestroyedUnitIds: secure.qualifyingDestroyedUnitIds,
    remainingCentralTargetIds: secure.remainingCentralTargetIds,
    centralKillSatisfied: secure.centralKillSatisfied,
    objectiveStateKnown: controls.known,
    controlledObjectiveCount: controls.controlledCount,
    controlledObjectiveIds: controls.controlledIds,
    nonHomeControlled: controls.nonHomeControlled,
    nonHomeControlledIds: controls.nonHomeControlledIds,
    commandCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    controlVpForProjection,
    actionRawVp,
    killRawVp,
    pendingActionVpLeverage,
    nextActionVpLeverage,
    nextKillVpLeverage,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    targetingScore,
    objectivePreservationScore,
    protectCheapUnits: secure.pendingObjectiveIds.length > 0,
    summary: Object.freeze([
      actionProgress,
      killProgress,
      controlProgress,
      `Current recorded Secure Asset conditions project ${cappedAdvisoryVp}/15 Primary VP this round before unresolved tabletop checks.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Secure Asset starts in the Shooting phase, is limited to one use per turn, targets an objective other than the player's home objective, and completes at end of turn only if the acting unit controls that objective.",
      "The 2 VP destruction condition is binary and uses the enemy unit's recorded turn-start position; the map is approximate, so tabletop objective range remains authoritative.",
      "Rounds 2-4 control scoring is fixed at the Command checkpoint; Round 5 uses the end-of-turn control state instead.",
      "Primary scoring is capped at 15 VP per battle round and 45 VP for the battle."
    ])
  });
}

export function getSecureAssetObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId || !isSecureAssetMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Secure Asset is not active for this objective." });
  }

  const strategy = primaryStrategy ?? getSecureAssetPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const objective = (state?.objectives ?? []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Objective is not available." });

  const ownHome = strategy.playerHomeObjectiveIds.includes(objectiveId);
  const central = strategy.centralObjectiveIds.includes(objectiveId);
  const pending = strategy.pendingObjectiveIds.includes(objectiveId);
  const eligibleAction = strategy.eligibleActionObjectiveIds.includes(objectiveId);
  const controlled = control === "controlled" || controlledBy(objective.control, playerId);
  const controlWindowOpen = strategy.round >= 2 && (strategy.round >= 5 || !strategy.commandCheckpointCompleted);

  let nonHomeVpLeverage = 0;
  if (controlWindowOpen && !ownHome && strategy.nonHomeControlled === 0 && !controlled) nonHomeVpLeverage = 4;

  let threeObjectiveVpLeverage = 0;
  if (controlWindowOpen && !controlled && strategy.controlledObjectiveCount === 2) threeObjectiveVpLeverage = 4;

  let actionVpLeverage = 0;
  if (pending) actionVpLeverage = strategy.pendingActionVpLeverage;
  else if (eligibleAction) actionVpLeverage = strategy.nextActionVpLeverage;

  const rawVpLeverage = nonHomeVpLeverage + threeObjectiveVpLeverage + actionVpLeverage;
  const vpLeverage = Math.min(strategy.additionalPrimaryAllowance, rawVpLeverage);
  let score = 0.08 + vpLeverage * 0.09;
  if (pending) score += 0.3;
  if (eligibleAction) score += 0.18;
  if (central && strategy.remainingCentralTargetIds.length > 0 && !strategy.centralKillSatisfied) score += 0.06;
  if (controlled && !ownHome && strategy.nonHomeControlled === 1 && controlWindowOpen) score += 0.16;
  if (controlled && strategy.controlledObjectiveCount === 3 && controlWindowOpen) score += 0.14;
  if (ownHome && !controlled && strategy.controlledObjectiveCount === 2 && controlWindowOpen) score += 0.1;
  if (strategy.remainingPrimaryGameVp === 0) score = Math.min(score, 0.12);
  score = clamp01(score);

  let reason;
  if (pending) {
    reason = `Secure Asset is pending here. Preserve the acting unit's control through end of turn; this objective carries up to ${actionVpLeverage} current-round Action VP leverage.`;
  } else if (ownHome) {
    reason = threeObjectiveVpLeverage > 0
      ? `Your home objective cannot be selected for Secure Asset, but controlling it can complete the three-objective threshold for ${threeObjectiveVpLeverage} VP.`
      : "Your home objective cannot be selected for the Secure Asset Action; its value here is ordinary control and threshold support.";
  } else if (eligibleAction) {
    reason = `This non-home objective is eligible for the once-per-turn Secure Asset Action and offers up to ${actionVpLeverage} Action VP leverage${nonHomeVpLeverage || threeObjectiveVpLeverage ? ` plus ${nonHomeVpLeverage + threeObjectiveVpLeverage} VP of control-threshold leverage` : ""}. Confirm tabletop range and end-of-turn control.`;
  } else if (nonHomeVpLeverage || threeObjectiveVpLeverage) {
    reason = `Controlling this objective can add up to ${nonHomeVpLeverage + threeObjectiveVpLeverage} VP at the active Secure Asset control checkpoint.`;
  } else if (controlled && !ownHome && controlWindowOpen) {
    reason = "Preserve this non-home objective; it supports one or both active Secure Asset control thresholds.";
  } else {
    reason = "This objective has ordinary board-control value but no additional immediate Secure Asset leverage beyond the current plan.";
  }

  return Object.freeze({
    active: true,
    score,
    vpLeverage,
    rawVpLeverage,
    nonHomeVpLeverage,
    threeObjectiveVpLeverage,
    actionVpLeverage,
    ownHome,
    central,
    pending,
    eligibleActionObjective: eligibleAction,
    controlled,
    purpose,
    reason
  });
}
