import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import {
  getGatherIntelObjectiveOptions,
  getGatherIntelState,
  isGatherIntelCentralObjective,
  isGatherIntelMissionForPlayer
} from "./gather-intel-state.js";
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
  const central = objectives.filter(isGatherIntelCentralObjective);
  const centralRoleKnown = central.length > 0;
  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown,
      centralRoleKnown,
      homeIds,
      centralIds: Object.freeze(central.map((objective) => objective.id)),
      controlledCount: 0,
      controlledIds: Object.freeze([]),
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([]),
      centralControlled: 0,
      centralControlledIds: Object.freeze([])
    });
  }
  const controlled = objectives.filter((objective) => controlledBy(objective.control, playerId));
  const nonHome = controlled.filter((objective) => !homeIds.includes(objective.id));
  const centralControlled = central.filter((objective) => controlledBy(objective.control, playerId));
  return Object.freeze({
    known: true,
    homeRoleKnown,
    centralRoleKnown,
    homeIds,
    centralIds: Object.freeze(central.map((objective) => objective.id)),
    controlledCount: controlled.length,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlled: nonHome.length,
    nonHomeControlledIds: Object.freeze(nonHome.map((objective) => objective.id)),
    centralControlled: centralControlled.length,
    centralControlledIds: Object.freeze(centralControlled.map((objective) => objective.id))
  });
}

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round <= 4 && String(phase ?? "") !== "command";
}

function pendingOpponentHome(gather) {
  const opponentHomeIds = new Set(gather.opponentHomeObjectiveIds ?? []);
  return (gather.pendingObjectiveIds ?? []).some((objectiveId) => opponentHomeIds.has(objectiveId));
}

export function getGatherIntelPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isGatherIntelMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Gather Intel strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const gather = getGatherIntelState(state, { playerId, perspectivePlayerId });
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const checkpointCompleted = commandCheckpointCompleted(round, phase);
  const commandAwardAmount = round >= 2 && round <= 4 ? commandAwardAmountForTurn(awardsThisTurn) : 0;

  const roundOneCentralVp = round === 1 && controls.known && controls.centralControlled > 0 ? 6 : 0;
  const liveNonHomeVp = round >= 2 && controls.known && controls.nonHomeControlled > 0 ? 4 : 0;
  const controlVpForProjection = round === 1
    ? roundOneCentralVp
    : round >= 2 && round <= 4
      ? checkpointCompleted ? commandAwardAmount : liveNonHomeVp
      : round >= 5 ? liveNonHomeVp : 0;

  const completedExtractRawVp = round >= 2 ? gather.completedThisTurnCount * 7 : 0;
  const rawAdvisoryVp = controlVpForProjection + completedExtractRawVp;
  const cappedAdvisoryVp = projectedMissionPrimaryVp(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const pendingExtractRawVp = round >= 2 ? gather.pendingObjectiveIds.length * 7 : 0;
  const projectedWithPending = projectedMissionPrimaryVp(rawAdvisoryVp + pendingExtractRawVp, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const pendingExtractVpLeverage = Math.max(0, projectedWithPending - cappedAdvisoryVp);
  const options = getGatherIntelObjectiveOptions(state, { playerId, perspectivePlayerId });
  const projectedWithOneMore = projectedMissionPrimaryVp(rawAdvisoryVp + pendingExtractRawVp + 7, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextExtractVpLeverage = options.length > 0 ? Math.max(0, projectedWithOneMore - projectedWithPending) : 0;

  const projectedMarkerCount = gather.markerCount + gather.pendingObjectiveIds.length;
  const projectedThreeMarkerThreshold = projectedMarkerCount >= 3;
  const projectedOpponentHomeMarker = gather.markerAtOpponentHome || pendingOpponentHome(gather);
  const currentEndgameMarkerVp = (gather.threeMarkerThresholdMet ? 5 : 0) + (gather.markerAtOpponentHome ? 5 : 0);
  const projectedEndgameMarkerVp = (projectedThreeMarkerThreshold ? 5 : 0) + (projectedOpponentHomeMarker ? 5 : 0);
  const pendingEndgameVpLeverage = Math.max(0, projectedEndgameMarkerVp - currentEndgameMarkerVp);

  let objectivePreservationScore = 0.28;
  if (round === 1 && controls.known && controls.centralControlled === 1) objectivePreservationScore = 0.86;
  if (round >= 2 && controls.known && controls.nonHomeControlled === 1) objectivePreservationScore = checkpointCompleted ? 0.52 : 0.82;
  if (round === 5 && controls.known && controls.nonHomeControlled === 1) objectivePreservationScore = 0.9;
  if (gather.pendingObjectiveIds.length > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.94);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const roundOneProgress = round !== 1
    ? "The 6 VP Round 1 central-objective window has passed."
    : !controls.known || !controls.centralRoleKnown
      ? "Central-objective control is incomplete; confirm the battlefield objective roles before relying on the Round 1 6 VP condition."
      : controls.centralControlled > 0
        ? "At least one central objective is controlled, satisfying the Round 1 6 VP end-of-turn condition before caps."
        : "No central objective is currently controlled; taking one is worth 6 VP at the end of Round 1 before caps.";
  const controlProgress = round < 2
    ? "The recurring 4 VP non-home objective condition begins in Round 2."
    : !controls.known
      ? "Objective control or home-objective role evidence is incomplete; exact non-home control remains player-confirmed."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${commandAwardAmount} VP from that checkpoint is recorded. New captures stage the next checkpoint rather than scoring retroactively.`
        : controls.nonHomeControlled > 0
          ? `At least one non-home objective is controlled, satisfying the 4 VP ${round === 5 ? "end-of-turn" : "Command"} condition before caps.`
          : `No non-home objective is controlled; gaining one can satisfy the 4 VP ${round === 5 ? "end-of-turn" : "Command"} condition.`;
  const extractProgress = round < 2
    ? "Extract Intelligence unlocks in Round 2."
    : `${gather.completedThisTurnCount} Extract Intelligence action${gather.completedThisTurnCount === 1 ? " has" : "s have"} completed this turn and ${gather.pendingObjectiveIds.length} attempt${gather.pendingObjectiveIds.length === 1 ? " is" : "s are"} awaiting the end-of-turn control check. Pending attempts can add up to ${pendingExtractVpLeverage} current-round Primary VP before caps.`;
  const markerProgress = `${gather.markerCount} persistent Gather Intel operation marker${gather.markerCount === 1 ? " is" : "s are"} recorded. ${gather.threeMarkerThresholdMet ? "The 3-marker endgame condition is met." : `${Math.max(0, 3 - gather.markerCount)} more completed marker${3 - gather.markerCount === 1 ? " is" : "s are"} needed for the 5 VP three-marker endgame condition.`} ${gather.markerAtOpponentHome ? "A marker at the opponent home objective also meets the separate 5 VP endgame condition." : "A completed Extract Intelligence at the opponent home objective can establish the separate 5 VP endgame condition."}`;

  let reason;
  if (!gather.homeRoleKnown) {
    reason = "Confirm both home objectives before relying on Extract Intelligence eligibility or the opponent-home endgame bonus.";
  } else if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is filled, so Gather Intel should no longer distort movement or action choices for additional Primary scoring.";
  } else if (round === 1 && controls.known && controls.centralControlled === 0) {
    reason = "Round 1 is a unique 6 VP window: prioritize safe central-objective control before Extract Intelligence becomes available next round.";
  } else if (gather.pendingObjectiveIds.length > 0 && (pendingExtractVpLeverage > 0 || pendingEndgameVpLeverage > 0)) {
    reason = "One or more Extract Intelligence attempts are in progress. Preserve each acting unit's control of its selected objective through end of turn so the 7 VP action and persistent marker can complete.";
  } else if (gather.markerCount < 3) {
    reason = "Build the intelligence network across different non-home objectives. Completed Extract Intelligence actions score 7 VP each and the third persistent marker unlocks a separate 5 VP endgame condition.";
  } else if (!gather.markerAtOpponentHome && options.some((option) => option.opponentHome)) {
    reason = "The three-marker threshold is established. An Extract Intelligence completion at the opponent home objective can add the separate 5 VP endgame marker condition.";
  } else if (round >= 2 && controls.known && controls.nonHomeControlled === 0 && !checkpointCompleted) {
    reason = "The marker network is established, but the active 4 VP non-home control condition is not. Secure a non-home objective before the current checkpoint.";
  } else if (nextExtractVpLeverage > 0) {
    reason = "Additional Extract Intelligence completions can still add current-round Primary VP. Spread eligible units across different unmarked non-home objectives rather than duplicating one target.";
  } else {
    reason = "Current Gather Intel scoring is near the round cap or its key marker thresholds are established. Preserve active control and avoid sacrificing units solely for redundant Primary value.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Reconnaissance",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn,
    phase,
    targetUnitId,
    homeRoleKnown: gather.homeRoleKnown,
    playerHomeObjectiveIds: gather.playerHomeObjectiveIds,
    opponentHomeObjectiveIds: gather.opponentHomeObjectiveIds,
    centralObjectiveIds: gather.centralObjectiveIds,
    markerObjectiveIds: gather.markerObjectiveIds,
    markerCount: gather.markerCount,
    threeMarkerThresholdMet: gather.threeMarkerThresholdMet,
    markerAtOpponentHome: gather.markerAtOpponentHome,
    projectedMarkerCount,
    projectedThreeMarkerThreshold,
    projectedOpponentHomeMarker,
    currentEndgameMarkerVp,
    projectedEndgameMarkerVp,
    pendingEndgameVpLeverage,
    pendingObjectiveIds: gather.pendingObjectiveIds,
    pendingAttempts: gather.pendingAttempts,
    completedExtractsThisTurn: gather.completedThisTurnCount,
    completedExtractRawVp,
    pendingExtractVpLeverage,
    nextExtractVpLeverage,
    eligibleExtractObjectiveIds: Object.freeze(options.map((option) => option.objectiveId)),
    actionAvailableThisTurn: gather.actionAvailableThisTurn,
    objectiveStateKnown: controls.known,
    controlledObjectiveCount: controls.controlledCount,
    nonHomeControlled: controls.nonHomeControlled,
    nonHomeControlledIds: controls.nonHomeControlledIds,
    centralControlled: controls.centralControlled,
    centralControlledIds: controls.centralControlledIds,
    commandCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    controlVpForProjection,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    nextKillVpLeverage: 0,
    targetingScore: 0.05,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      roundOneProgress,
      controlProgress,
      extractProgress,
      markerProgress,
      `Current recorded Gather Intel conditions project ${cappedAdvisoryVp}/15 Primary VP this round before unresolved Extract Intelligence attempts.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Extract Intelligence starts in the Shooting phase from Round 2 and has unlimited uses, but each acting unit that starts it that phase must select a different eligible objective.",
      "The player's home objective and any objective already carrying one of that player's Gather Intel operation markers are ineligible.",
      "An Extract Intelligence attempt only becomes a persistent operation marker after its end-of-turn Action review is explicitly confirmed completed.",
      "Completion requires the acting unit to control its selected objective at end of turn; map distance is advisory and tabletop range/control remain authoritative.",
      "Gather Intel operation markers persist because this mission does not provide a rule to remove them.",
      "Primary scoring is capped at 15 VP per battle round and 45 VP for the battle."
    ])
  });
}

export function getGatherIntelObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId || !isGatherIntelMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Gather Intel is not active for this objective." });
  }

  const strategy = primaryStrategy ?? getGatherIntelPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const objective = (state?.objectives ?? []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Objective is not available." });

  const round = strategy.round;
  const ownHome = strategy.playerHomeObjectiveIds.includes(objectiveId);
  const opponentHome = strategy.opponentHomeObjectiveIds.includes(objectiveId);
  const central = strategy.centralObjectiveIds.includes(objectiveId);
  const hasMarker = strategy.markerObjectiveIds.includes(objectiveId);
  const pending = strategy.pendingObjectiveIds.includes(objectiveId);
  const eligible = strategy.eligibleExtractObjectiveIds.includes(objectiveId);
  const controlled = control === "controlled" || controlledBy(objective.control, playerId);

  let controlVpLeverage = 0;
  if (round === 1 && central && strategy.centralControlled === 0 && !controlled) controlVpLeverage = 6;
  if (round >= 2 && !ownHome && strategy.nonHomeControlled === 0 && !strategy.commandCheckpointCompleted && !controlled) controlVpLeverage = 4;

  let actionVpLeverage = 0;
  if (pending) {
    const pendingCount = Math.max(1, strategy.pendingObjectiveIds.length);
    actionVpLeverage = Math.min(7, strategy.pendingExtractVpLeverage / pendingCount || 0);
  } else if (eligible) {
    actionVpLeverage = strategy.nextExtractVpLeverage;
  }

  const projectedMarkerIds = new Set([...strategy.markerObjectiveIds, ...strategy.pendingObjectiveIds]);
  let endgameVpLeverage = 0;
  const contributesNewMarker = eligible && !projectedMarkerIds.has(objectiveId);
  if (contributesNewMarker && strategy.projectedMarkerCount < 3 && strategy.projectedMarkerCount === 2) endgameVpLeverage += 5;
  if ((eligible || pending) && opponentHome && !strategy.projectedOpponentHomeMarker) endgameVpLeverage += 5;
  if (pending) {
    const markerCountWithoutThis = strategy.projectedMarkerCount - 1;
    if (strategy.projectedThreeMarkerThreshold && markerCountWithoutThis < 3) endgameVpLeverage += 5;
    if (opponentHome && strategy.projectedOpponentHomeMarker && !strategy.markerAtOpponentHome) endgameVpLeverage += 5;
  }

  const cappedCurrentLeverage = Math.min(strategy.additionalPrimaryAllowance, controlVpLeverage + actionVpLeverage);
  let score = 0.08 + cappedCurrentLeverage * 0.09 + endgameVpLeverage * 0.035;
  if (pending) score += 0.28;
  if (eligible && strategy.markerCount < 3) score += 0.12;
  if (eligible && opponentHome && !strategy.markerAtOpponentHome) score += 0.12;
  if (hasMarker) score -= 0.08;
  if (ownHome) score = Math.min(score, 0.2);
  if (strategy.remainingPrimaryGameVp === 0) score = Math.min(score, 0.12);
  score = clamp01(score);

  let reason;
  if (ownHome) {
    reason = "Your home objective cannot be used for Extract Intelligence; only ordinary control value remains here.";
  } else if (pending) {
    reason = `An Extract Intelligence attempt is already pending here. Preserve the acting unit's control through end of turn; this objective carries up to ${actionVpLeverage} current-round VP leverage plus ${endgameVpLeverage} endgame marker leverage.`;
  } else if (hasMarker) {
    reason = "This objective already carries your Gather Intel operation marker, so it cannot be selected for another Extract Intelligence action.";
  } else if (round === 1 && central) {
    reason = `This central objective carries ${controlVpLeverage || 6} VP of Round 1 control value. Extract Intelligence does not unlock until Round 2.`;
  } else if (eligible) {
    reason = `This is an eligible unmarked non-home objective for Extract Intelligence. It offers up to ${actionVpLeverage} current-round VP leverage${endgameVpLeverage ? ` and ${endgameVpLeverage} VP of endgame marker leverage` : ""}; confirm tabletop range before starting the Action.`;
  } else if (controlVpLeverage > 0) {
    reason = `Controlling this non-home objective can add ${controlVpLeverage} VP at the active Gather Intel checkpoint.`;
  } else {
    reason = "This objective has ordinary board-control value but no additional immediate Gather Intel leverage beyond the current plan.";
  }

  return Object.freeze({
    active: true,
    score,
    vpLeverage: cappedCurrentLeverage,
    rawVpLeverage: controlVpLeverage + actionVpLeverage,
    controlVpLeverage,
    actionVpLeverage,
    endgameVpLeverage,
    ownHome,
    opponentHome,
    central,
    hasMarker,
    pending,
    eligibleExtractObjective: eligible,
    controlled,
    purpose,
    reason
  });
}