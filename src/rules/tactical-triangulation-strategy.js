import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import {
  getTriangulationState,
  getTriangulationTierVp,
  isTriangulationMissionForPlayer
} from "./triangulation-state.js";
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

function projectedMissionPrimaryVp(rawMissionVp, actualMissionVpThisTurn, additionalPrimaryAllowance) {
  const raw = Math.max(0, Number(rawMissionVp) || 0);
  const actual = Math.max(0, Number(actualMissionVpThisTurn) || 0);
  const allowance = Math.max(0, Number(additionalPrimaryAllowance) || 0);
  const desired = Math.max(actual, Math.min(15, raw));
  return actual + Math.min(Math.max(0, desired - actual), allowance);
}

function primaryGameRemaining(state, playerId) {
  const used = effectiveAwardEntries(state, playerId)
    .filter((entry) => entry.category === "primary")
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  return Math.max(0, 45 - used);
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
  const nonHomeControlled = controlled.filter((objective) => !homeIds.includes(objective.id));
  return Object.freeze({
    known: true,
    homeRoleKnown,
    homeIds,
    controlledCount: controlled.length,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlled: nonHomeControlled.length,
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id))
  });
}

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round < 5 && String(phase ?? "") !== "command";
}

export function getTriangulationPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isTriangulationMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Triangulation strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const phase = state?.phase ?? null;
  const triangulation = getTriangulationState(state, { playerId, perspectivePlayerId });
  const controls = controlSnapshot(state, playerId, perspectivePlayerId);
  const checkpointCompleted = commandCheckpointCompleted(round, phase);
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, turn);
  const actualMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const commandAwardAmount = round >= 2 && round < 5 ? commandAwardAmountForTurn(awardsThisTurn) : 0;
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);

  const liveControlVp = round >= 2 && controls.known && controls.nonHomeControlled > 0 ? 4 : 0;
  const controlVpForProjection = round < 2
    ? 0
    : checkpointCompleted
      ? commandAwardAmount
      : liveControlVp;
  const triangulatedTierVp = round >= 2 ? triangulation.triangulatedTierVp : 0;
  const rawAdvisoryVp = triangulatedTierVp + controlVpForProjection;
  const cappedAdvisoryVp = projectedMissionPrimaryVp(rawAdvisoryVp, actualMissionVpThisTurn, additionalPrimaryAllowance);

  const nextTierVp = round >= 2 ? getTriangulationTierVp(triangulation.triangulatedCount + 1) : 0;
  const rawWithNextTriangulation = nextTierVp + controlVpForProjection;
  const projectedWithNextTriangulation = projectedMissionPrimaryVp(rawWithNextTriangulation, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const nextTriangulationVpLeverage = triangulation.actionAvailableThisTurn
    ? Math.max(0, projectedWithNextTriangulation - cappedAdvisoryVp)
    : 0;

  const pendingTierVp = triangulation.pendingObjectiveIds.length > 0
    ? getTriangulationTierVp(triangulation.triangulatedCount + 1)
    : triangulatedTierVp;
  const pendingProjectedVp = projectedMissionPrimaryVp(pendingTierVp + controlVpForProjection, actualMissionVpThisTurn, additionalPrimaryAllowance);
  const pendingTriangulationVpLeverage = Math.max(0, pendingProjectedVp - cappedAdvisoryVp);

  const projectedAdditionalThisTurn = Math.max(0, pendingProjectedVp - actualMissionVpThisTurn);
  const remainingGameAfterProjectedTurn = Math.max(0, remainingPrimaryGameVp - projectedAdditionalThisTurn);
  const endgameControlThresholdMet = controls.known && controls.controlledCount >= 4;
  const endgameVpIfThreshold = endgameControlThresholdMet ? Math.min(10, remainingGameAfterProjectedTurn) : 0;

  let objectivePreservationScore = 0.32;
  if (round >= 2 && controls.known && controls.nonHomeControlled === 1) objectivePreservationScore = checkpointCompleted ? 0.55 : 0.82;
  if (round === 5 && controls.known && controls.nonHomeControlled === 1) objectivePreservationScore = 0.9;
  if (controls.known && controls.controlledCount === 4) objectivePreservationScore = Math.max(objectivePreservationScore, 0.84);
  if (triangulation.pendingObjectiveIds.length > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const triangulationProgress = triangulation.triangulatedCount === 0
    ? "No objectives are yet recorded as triangulated. The first completed Triangulate Action establishes the 3 VP tier from Round 2 onwards."
    : `${triangulation.triangulatedCount} objective${triangulation.triangulatedCount === 1 ? " is" : "s are"} recorded as triangulated, currently worth ${triangulatedTierVp} raw end-of-turn VP from the second battle round onwards.`;
  const pendingProgress = triangulation.pendingObjectiveIds.length > 0
    ? `A Triangulate attempt is awaiting its end-of-turn control check. If completed, the current triangulation tier can rise from ${triangulatedTierVp} to ${pendingTierVp} VP before caps.`
    : triangulation.actionAvailableThisTurn
      ? `Triangulate is still available this turn; completing one more eligible objective can add up to ${nextTriangulationVpLeverage} Primary VP this turn before longer-term recurring value.`
      : round < 2
        ? "Triangulate becomes available from Round 2."
        : "Triangulate has already been started this turn; its once-per-turn use is spent even if the attempt later fails.";
  const controlProgress = round < 2
    ? "The binary 4 VP non-home objective condition begins in Round 2."
    : !controls.known
      ? "Objective control or home-objective role evidence is incomplete; exact non-home control and endgame projections remain player-confirmed."
      : checkpointCompleted
        ? `The Round ${round} Command checkpoint has passed; ${commandAwardAmount} VP from that checkpoint is recorded. Captures now stage the next checkpoint rather than scoring retroactively.`
        : controls.nonHomeControlled > 0
          ? "At least one non-home objective is controlled, satisfying the binary 4 VP control condition at the active checkpoint before caps."
          : "No non-home objective is controlled; taking one can satisfy the binary 4 VP control condition at the active checkpoint.";
  const endgameProgress = !controls.known
    ? "The 10 VP end-of-battle four-objective condition cannot be projected until objective control is complete."
    : endgameControlThresholdMet
      ? `Four or more objectives are currently controlled, meeting the 10 VP end-of-battle threshold for up to ${endgameVpIfThreshold} VP after the 45 VP Primary cap.`
      : `${Math.max(0, 4 - controls.controlledCount)} more controlled objective${4 - controls.controlledCount === 1 ? " is" : "s are"} needed to meet the 10 VP end-of-battle threshold.`;

  let reason;
  if (!triangulation.homeRoleKnown) {
    reason = "Confirm the player's home objective before relying on Triangulate eligibility; the home objective cannot be triangulated.";
  } else if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is filled, so additional triangulation and objective control should not distort tactical priorities for Primary scoring.";
  } else if (triangulation.pendingObjectiveIds.length > 0 && pendingTriangulationVpLeverage > 0) {
    reason = "A Triangulate Action is already in progress. Preserve the acting unit's control of that objective through end of turn so the marker becomes permanent and advances the recurring tier.";
  } else if (triangulation.triangulatedCount < 3) {
    reason = "Build toward three persistent triangulated objectives. Each completed marker permanently improves the recurring end-of-turn tier, with the third objective increasing it from 6 VP to 10 VP before caps.";
  } else if (round >= 2 && controls.known && controls.nonHomeControlled === 0 && !checkpointCompleted) {
    reason = "The maximum triangulation tier is established; the clearest remaining current-turn Primary opportunity is the binary 4 VP non-home control condition.";
  } else if (controls.known && controls.controlledCount < 4) {
    reason = "Triangulation coverage is established. Preserve the recurring tier while building toward four controlled objectives for the 10 VP end-of-battle condition.";
  } else {
    reason = "Primary conditions are well established. Preserve the triangulated network and enough objective control to protect the active checkpoint and endgame threshold.";
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
    homeRoleKnown: triangulation.homeRoleKnown,
    playerHomeObjectiveIds: triangulation.playerHomeObjectiveIds,
    triangulatedObjectiveIds: triangulation.triangulatedObjectiveIds,
    pendingTriangulationObjectiveIds: triangulation.pendingObjectiveIds,
    triangulatedCount: triangulation.triangulatedCount,
    triangulatedTierVp,
    actionAvailableThisTurn: triangulation.actionAvailableThisTurn,
    actionUsedThisTurn: triangulation.usedThisTurn,
    nextTriangulationVpLeverage,
    pendingTriangulationVpLeverage,
    pendingTierVp,
    objectiveStateKnown: controls.known,
    controlledObjectiveCount: controls.controlledCount,
    controlledObjectiveIds: controls.controlledIds,
    nonHomeControlled: controls.nonHomeControlled,
    nonHomeControlledIds: controls.nonHomeControlledIds,
    commandCheckpointCompleted: checkpointCompleted,
    commandAwardAmount,
    liveControlVp,
    controlVpForProjection,
    actualMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    endgameControlThresholdMet,
    endgameVpIfThreshold,
    nextKillVpLeverage: 0,
    targetingScore: 0.05,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      triangulationProgress,
      pendingProgress,
      controlProgress,
      endgameProgress,
      `Current recorded Triangulation conditions project ${cappedAdvisoryVp}/15 Primary VP this turn before a pending Action completes.`
    ]),
    reason,
    assumptions: Object.freeze([
      "A Triangulate attempt only becomes a persistent marker after its end-of-turn Action review is explicitly confirmed completed.",
      "Triangulate starts once per turn from Round 2 in the Shooting phase at a non-home objective that does not already have one of this player's operation markers.",
      "Completion requires the acting unit to control the selected objective at end of turn; range and control remain tabletop-confirmed.",
      "A triangulated objective stays triangulated after completion; later control is not required for the recurring 3/6/10 VP tier.",
      "Rounds 2-4 resolve the binary 4 VP non-home control condition in the Command phase; Round 5 resolves it at end of turn.",
      "The 10 VP end-of-battle condition requires control of four or more objectives and is separate from the 15 VP battle-round cap, but still respects the 45 VP Primary game cap.",
      "Triangulation has no direct kill-scoring condition, so enemy target destruction receives no automatic Primary VP premium."
    ])
  });
}

export function getTriangulationObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, actionVpLeverage: 0, stagingVpLeverage: 0, reason: "Objective strategy requires player and objective identifiers." });
  }
  const context = primaryStrategy ?? getTriangulationPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, actionVpLeverage: 0, stagingVpLeverage: 0, reason: context.reason });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: true, score: 0, vpLeverage: 0, actionVpLeverage: 0, stagingVpLeverage: 0, reason: "Objective is not present in the recorded battlefield state." });

  const ownHome = context.playerHomeObjectiveIds.includes(objectiveId);
  const triangulated = context.triangulatedObjectiveIds.includes(objectiveId);
  const pending = context.pendingTriangulationObjectiveIds.includes(objectiveId);
  const controlled = control === "controlled" || objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId;

  if (context.remainingPrimaryGameVp === 0) {
    return Object.freeze({
      active: true,
      score: 0.03,
      vpLeverage: 0,
      actionVpLeverage: 0,
      stagingVpLeverage: 0,
      ownHome,
      triangulated,
      pending,
      controlled,
      reason: "The 45 VP Primary game cap is filled, so this objective has no remaining Triangulation VP leverage."
    });
  }

  let actionVpLeverage = 0;
  if (!ownHome && !triangulated && !pending && context.actionAvailableThisTurn) {
    actionVpLeverage = context.nextTriangulationVpLeverage;
  }
  if (pending) actionVpLeverage = context.pendingTriangulationVpLeverage;

  let controlVpLeverage = 0;
  let stagingVpLeverage = 0;
  if (context.round >= 2 && context.objectiveStateKnown && !ownHome) {
    const soleControlledNonHome = controlled && context.nonHomeControlled === 1;
    if (context.round >= 5 || !context.commandCheckpointCompleted) {
      if (context.nonHomeControlled === 0 && !controlled) controlVpLeverage = Math.min(4, context.additionalPrimaryAllowance, context.remainingPrimaryGameVp);
      else if (soleControlledNonHome) controlVpLeverage = Math.min(4, context.additionalPrimaryAllowance + context.controlVpForProjection, context.remainingPrimaryGameVp);
    } else if (context.nonHomeControlled === 0 && !controlled || soleControlledNonHome) {
      stagingVpLeverage = 4;
    }
  }

  let endgameVpLeverage = 0;
  if (context.objectiveStateKnown) {
    if (!controlled && context.controlledObjectiveCount === 3) endgameVpLeverage = Math.min(10, context.remainingPrimaryGameVp);
    if (controlled && context.controlledObjectiveCount === 4) endgameVpLeverage = Math.min(10, context.remainingPrimaryGameVp);
  }

  const vpLeverage = Math.max(actionVpLeverage, controlVpLeverage, endgameVpLeverage);
  const strongestLeverage = Math.max(actionVpLeverage, controlVpLeverage, stagingVpLeverage, endgameVpLeverage);
  let reason;
  if (pending) {
    reason = actionVpLeverage > 0
      ? `A Triangulate Action is pending here. Keeping the acting unit in control through end of turn can improve the capped recurring tier by ${actionVpLeverage} VP this turn.`
      : "A Triangulate Action is pending here. Preserve control through end of turn so the objective becomes permanently triangulated.";
  } else if (!ownHome && !triangulated && actionVpLeverage > 0 && actionVpLeverage >= Math.max(controlVpLeverage, stagingVpLeverage, endgameVpLeverage)) {
    reason = `This objective is eligible for Triangulate. Completing it can improve the capped recurring tier by ${actionVpLeverage} VP this turn and leaves a permanent marker for later turns.`;
  } else if (controlVpLeverage > 0 && controlVpLeverage >= Math.max(actionVpLeverage, stagingVpLeverage, endgameVpLeverage)) {
    reason = controlled
      ? "This objective is carrying the binary 4 VP non-home control condition at the active checkpoint."
      : "Taking this non-home objective can satisfy the binary 4 VP control condition at the active checkpoint.";
  } else if (endgameVpLeverage > 0 && endgameVpLeverage >= Math.max(actionVpLeverage, controlVpLeverage, stagingVpLeverage)) {
    reason = controlled
      ? "This objective is one of exactly four currently controlled objectives; losing it can drop the 10 VP end-of-battle threshold."
      : "Controlling this objective would raise the recorded total from three to four and meet the 10 VP end-of-battle threshold before the game cap.";
  } else if (stagingVpLeverage > 0 && stagingVpLeverage >= Math.max(actionVpLeverage, controlVpLeverage, endgameVpLeverage)) {
    reason = "The current Command checkpoint has passed; controlling this non-home objective now stages the binary 4 VP condition for the next scoring checkpoint.";
  } else if (triangulated) {
    reason = "This objective is already triangulated, so its marker no longer requires control. Preserve it only when control or the four-objective endgame threshold still matters.";
  } else if (ownHome) {
    reason = "Your home objective cannot be triangulated, but it still counts toward the four-objective end-of-battle control threshold.";
  } else {
    reason = context.actionAvailableThisTurn
      ? "This non-home objective is eligible for Triangulate, but the next marker does not currently increase capped VP; use it only for future resilience or setup."
      : "Triangulate is unavailable for another objective this turn; use this objective for control or future-turn staging instead.";
  }

  const score = clamp01(
    pending ? 0.76 + actionVpLeverage / 20 :
      actionVpLeverage > 0 ? 0.62 + actionVpLeverage / 18 :
        controlVpLeverage > 0 ? 0.64 + controlVpLeverage / 20 :
          endgameVpLeverage > 0 ? 0.58 + endgameVpLeverage / 30 :
            stagingVpLeverage > 0 ? 0.34 :
              triangulated ? 0.1 : ownHome ? 0.08 : 0.16
  );

  return Object.freeze({
    active: true,
    score,
    vpLeverage,
    actionVpLeverage,
    controlVpLeverage,
    stagingVpLeverage,
    endgameVpLeverage,
    ownHome,
    nonHome: !ownHome,
    triangulated,
    pending,
    controlled,
    purpose,
    reason
  });
}

export { isTriangulationMissionForPlayer } from "./triangulation-state.js";
