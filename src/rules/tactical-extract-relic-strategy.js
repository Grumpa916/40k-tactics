import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getUnitStateAtTurnStart } from "./scoring-evidence-state.js";
import {
  getExtractRelicState,
  isExtractRelicCentralObjective,
  isExtractRelicMissionForPlayer
} from "./extract-relic-state.js";
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
  return history.map((event, index) => ({ event, index }))
    .filter(({ event, index }) => event?.type === "victory_points.awarded" && !reversedIndices.has(index) && (!event.id || !reversedIds.has(event.id)))
    .filter(({ event }) => event.payload?.playerId === playerId)
    .map(({ event }) => event.payload);
}

function primaryGameRemaining(state, playerId) {
  const used = effectiveAwardEntries(state, playerId)
    .filter((entry) => entry.category === "primary")
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  return Math.max(0, 45 - used);
}

function currentTurnMissionAwards(state, playerId, missionId, round, turn) {
  return effectiveAwardEntries(state, playerId).filter((entry) =>
    entry.category === "primary" &&
    entry.missionDefinitionId === missionId &&
    entry.round === round &&
    entry.turn === turn
  );
}

function commandAwardAmount(entries) {
  return entries.filter((entry) => entry.scoringTiming === "command-phase" ||
    (typeof entry.opportunityKey === "string" && entry.opportunityKey.endsWith(":command-phase")))
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
}

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round < 5 && String(phase ?? "") !== "command";
}

function distance(first, second) {
  if (!Number.isFinite(first?.x) || !Number.isFinite(first?.y) || !Number.isFinite(second?.x) || !Number.isFinite(second?.y)) return null;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function targetKillOpportunity(state, relic, targetUnitId) {
  if (!targetUnitId || relic.objectiveRangeKillMapSatisfied) {
    return Object.freeze({ active: false, mapSupportsQualification: false, objectiveIds: Object.freeze([]), vpLeverage: 0 });
  }
  const start = getUnitStateAtTurnStart(state, targetUnitId, relic.turn);
  const objectives = (state?.objectives ?? []).filter((objective) => {
    const d = distance(start?.position, objective?.position);
    return Number.isFinite(d) && d <= 3;
  });
  return Object.freeze({
    active: true,
    mapSupportsQualification: objectives.length > 0,
    objectiveIds: Object.freeze(objectives.map((objective) => objective.id)),
    vpLeverage: objectives.length > 0 ? 3 : 0
  });
}

function projectedRoundVp(rawVp, recordedVp, allowance) {
  const raw = Math.max(0, Number(rawVp) || 0);
  const recorded = Math.max(0, Number(recordedVp) || 0);
  const available = Math.max(0, Number(allowance) || 0);
  const desired = Math.max(recorded, Math.min(15, raw));
  return recorded + Math.min(Math.max(0, desired - recorded), available);
}

export { isExtractRelicMissionForPlayer } from "./extract-relic-state.js";

export function getExtractRelicPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isExtractRelicMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      nextSensorSweepVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Extract Relic strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const relic = getExtractRelicState(state, { playerId, perspectivePlayerId });
  const round = relic.round;
  const phase = state?.phase ?? null;
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, relic.turn);
  const recordedMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const checkpointPassed = commandCheckpointCompleted(round, phase);
  const liveControlVp = round >= 2 && relic.controlKnown && relic.nonHomeControlledCount > 0 ? 4 : 0;
  const controlVpForRound = round < 2 ? 0 : checkpointPassed ? commandAwardAmount(awardsThisTurn) : liveControlVp;
  const actionVp = relic.sensorSweepCompletedThisTurn ? 4 : 0;
  const killVp = relic.objectiveRangeKillMapSatisfied ? 3 : 0;
  const lastMarkerVp = relic.activeOpponentMarkerCount === 1 && relic.lastMarkerPositionMapSatisfied ? 4 : 0;
  const rawAdvisoryVp = actionVp + killVp + lastMarkerVp + controlVpForRound;
  const cappedAdvisoryVp = projectedRoundVp(rawAdvisoryVp, recordedMissionVpThisTurn, additionalPrimaryAllowance);
  const projectedAdditionalRoundVp = Math.max(0, cappedAdvisoryVp - recordedMissionVpThisTurn);
  const remainingPrimaryGameAfterProjectedRound = Math.max(0, remainingPrimaryGameVp - projectedAdditionalRoundVp);
  const currentRoundAllowance = Math.max(0, Math.min(additionalPrimaryAllowance, 15 - recordedMissionVpThisTurn));
  const targetKill = targetKillOpportunity(state, relic, targetUnitId);
  const nextKillVpLeverage = Math.min(currentRoundAllowance, targetKill.vpLeverage);
  const nextSensorSweepVpLeverage = relic.sensorSweepCompletedThisTurn || !relic.sensorSweepAvailable
    ? 0
    : Math.min(currentRoundAllowance, 4);
  const pendingSensorSweepVpLeverage = relic.pendingSensorSweepAttempts.length > 0
    ? Math.min(currentRoundAllowance, 4)
    : 0;
  const lastMarkerCurrentVpLeverage = relic.activeOpponentMarkerCount === 1 && !relic.lastMarkerPositionMapSatisfied
    ? Math.min(currentRoundAllowance, 4)
    : 0;
  const endgameLastMarkerVpLeverage = relic.activeOpponentMarkerCount === 1
    ? Math.min(5, remainingPrimaryGameAfterProjectedRound)
    : 0;
  const endgameLastMarkerVp = relic.lastMarkerPositionMapSatisfied ? endgameLastMarkerVpLeverage : 0;
  const targetIsLastMarkerEnemy = !!targetUnitId && relic.activeOpponentMarkerCount === 1 && relic.enemyUnitIdsInLastMarkerTerrain.includes(targetUnitId);
  const targetLastMarkerCurrentVpLeverage = targetIsLastMarkerEnemy ? lastMarkerCurrentVpLeverage : 0;
  const targetCurrentVpLeverage = Math.min(currentRoundAllowance,
    (targetKill.mapSupportsQualification ? 3 : 0) + (targetIsLastMarkerEnemy && !relic.lastMarkerPositionMapSatisfied ? 4 : 0));
  const targetEndgameVpLeverage = targetIsLastMarkerEnemy
    ? Math.min(endgameLastMarkerVpLeverage, Math.max(0, remainingPrimaryGameAfterProjectedRound - targetCurrentVpLeverage))
    : 0;

  let targetingScore = 0.05;
  if (targetCurrentVpLeverage > 0) targetingScore += Math.min(0.5, targetCurrentVpLeverage * 0.075);
  if (targetEndgameVpLeverage > 0) targetingScore += round >= 5 ? 0.28 : 0.12;
  if (targetKill.mapSupportsQualification && targetIsLastMarkerEnemy && targetCurrentVpLeverage > 0) targetingScore += 0.05;
  if (remainingPrimaryGameVp === 0) targetingScore = Math.min(targetingScore, 0.08);
  targetingScore = clamp01(targetingScore);

  let objectivePreservationScore = relic.controlKnown ? 0.42 : 0.3;
  if (round >= 2 && relic.nonHomeControlledCount === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.84);
  if (relic.pendingSensorSweepAttempts.length > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.92);
  if (relic.sensorSweepAvailable && relic.activeOpponentMarkerCount > 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.78);
  if (relic.activeOpponentMarkerCount === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (remainingPrimaryGameVp === 0) objectivePreservationScore = Math.min(objectivePreservationScore, 0.15);

  const markerProgress = !relic.opponentMarkerMissionAvailable
    ? "The opponent is not using Locate and Deny, so the shared operation-marker pool is unavailable for Extract Relic automation. Confirm the physical mission setup."
    : !relic.opponentMarkerSetupComplete
      ? "Record the opponent's Locate and Deny operation-marker setup before relying on Sensor Sweep or last-marker strategy."
      : `${relic.activeOpponentMarkerCount}/${relic.startingOpponentMarkerCount} opponent operation markers remain; both players' completed Sensor Sweep Actions remove from this shared marker pool.`;
  const sweepProgress = !relic.opponentMarkerSetupComplete
    ? "Sensor Sweep guidance is withheld until the opponent marker setup is recorded."
    : relic.activeOpponentMarkerCount <= 1
      ? "Only one opponent operation marker remains, so Sensor Sweep cannot be started."
      : relic.sensorSweepUsedThisTurn
        ? relic.sensorSweepCompletedThisTurn
          ? "Sensor Sweep completed this turn, supporting the 4 VP Action condition and removing the selected opponent marker."
          : "Sensor Sweep has already been started this turn; its once-per-turn use is spent even if the end-turn review later fails."
        : `Sensor Sweep is available. Completing it from a central objective is worth 4 VP this turn before caps and reduces the opponent marker count from ${relic.activeOpponentMarkerCount} to ${relic.activeOpponentMarkerCount - 1}.`;
  const killProgress = relic.objectiveRangeKillMapSatisfied
    ? "Recorded turn-start map evidence supports the 3 VP objective-range destruction condition; confirm physical-tabletop range at scoring."
    : "The 3 VP objective-range destruction condition is still open; prioritize a suitable enemy that began the turn within range of an objective when tactically sound.";
  const controlProgress = round < 2
    ? "The binary 4 VP non-home control condition begins in Round 2."
    : !relic.controlKnown
      ? "Objective control is incomplete; confirm controllers before relying on the 4 VP non-home condition."
      : checkpointPassed
        ? `The Round ${round} Command checkpoint has passed; recorded Command-phase Primary awards are used rather than current control for this round's projection.`
        : relic.nonHomeControlledCount > 0
          ? "At least one non-home objective is controlled, satisfying the binary 4 VP control condition at the active checkpoint before caps."
          : "No non-home objective is controlled; taking one can establish the binary 4 VP condition.";
  const lastMarkerProgress = relic.activeOpponentMarkerCount !== 1
    ? "The 4 VP end-turn and 5 VP end-battle last-marker conditions become live when exactly one opponent operation marker remains."
    : relic.lastMarkerPositionMapSatisfied
      ? `${relic.lastOpponentMarkerTerrainAreaId} is the last opponent marker terrain. Approximate map evidence shows a friendly unit there and no enemy unit, supporting both last-marker awards subject to tabletop confirmation.`
      : `${relic.lastOpponentMarkerTerrainAreaId} is the last opponent marker terrain. Move a friendly unit into that terrain area and clear enemy units from it to enable the 4 VP end-turn and 5 VP end-battle conditions.`;

  let reason;
  if (!relic.opponentMarkerSetupComplete) {
    reason = "Extract Relic depends on the opponent's Locate and Deny marker locations. Record that physical setup before the advisor makes marker-removal or last-marker recommendations.";
  } else if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is filled, so Extract Relic scoring opportunities should no longer distort tactical priorities.";
  } else if (relic.pendingSensorSweepAttempts.length > 0) {
    reason = "Protect the unit and central objective used by the pending Sensor Sweep through end of turn so the Action can complete for 4 VP and remove its selected opponent marker.";
  } else if (relic.activeOpponentMarkerCount > 1 && relic.sensorSweepAvailable) {
    reason = "Sensor Sweep is the mission's progression lever: use a safe central objective to score 4 VP and reduce the shared opponent marker pool toward the one-marker state.";
  } else if (relic.activeOpponentMarkerCount === 1 && !relic.lastMarkerPositionMapSatisfied) {
    reason = `The relic is isolated at ${relic.lastOpponentMarkerTerrainAreaId}. Occupy that terrain area with a friendly unit and clear enemies to unlock the 4 VP end-turn and 5 VP end-battle conditions.`;
  } else if (round >= 2 && relic.nonHomeControlSatisfied === false) {
    reason = "The binary 4 VP non-home control condition is unsecured. Establish one durable non-home objective without abandoning the relic-position plan.";
  } else if (!relic.objectiveRangeKillMapSatisfied) {
    reason = "The 3 VP destruction condition is still open. Enemy units that began the turn within objective range receive extra finishing value, subject to tabletop confirmation.";
  } else {
    reason = "Extract Relic is on plan: preserve non-home control, exploit qualifying objective-range kills, and protect the last-marker terrain once the shared marker pool reaches one.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Priority Assets",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn: relic.turn,
    phase,
    targetUnitId,
    opponentId: relic.opponentId,
    opponentMarkerSetupComplete: relic.opponentMarkerSetupComplete,
    startingOpponentMarkerCount: relic.startingOpponentMarkerCount,
    activeOpponentMarkerCount: relic.activeOpponentMarkerCount,
    activeOpponentMarkerTerrainAreaIds: relic.activeOpponentMarkerTerrainAreaIds,
    removedOpponentMarkerTerrainAreaIds: relic.removedOpponentMarkerTerrainAreaIds,
    lastOpponentMarkerTerrainAreaId: relic.lastOpponentMarkerTerrainAreaId,
    lastMarkerPositionMapSatisfied: relic.lastMarkerPositionMapSatisfied,
    friendlyUnitIdsInLastMarkerTerrain: relic.friendlyUnitIdsInLastMarkerTerrain,
    enemyUnitIdsInLastMarkerTerrain: relic.enemyUnitIdsInLastMarkerTerrain,
    sensorSweepAvailable: relic.sensorSweepAvailable,
    sensorSweepUsedThisTurn: relic.sensorSweepUsedThisTurn,
    sensorSweepCompletedThisTurn: relic.sensorSweepCompletedThisTurn,
    pendingSensorSweepAttempts: relic.pendingSensorSweepAttempts,
    nextSensorSweepVpLeverage,
    pendingSensorSweepVpLeverage,
    objectiveRangeKillMapSatisfied: relic.objectiveRangeKillMapSatisfied,
    qualifyingMapKillCount: relic.qualifyingMapKills.length,
    targetKillOpportunity: targetKill,
    nextKillVpLeverage,
    targetIsLastMarkerEnemy,
    targetLastMarkerCurrentVpLeverage,
    targetCurrentVpLeverage,
    targetEndgameVpLeverage,
    targetingScore,
    controlStateKnown: relic.controlKnown,
    nonHomeControlled: relic.nonHomeControlledCount,
    nonHomeControlledObjectiveIds: relic.nonHomeControlledIds,
    nonHomeControlSatisfied: relic.nonHomeControlSatisfied,
    controlCheckpointCompleted: checkpointPassed,
    liveControlVp,
    controlVpForRound,
    lastMarkerCurrentVpLeverage,
    endgameLastMarkerVpLeverage,
    endgameLastMarkerVp,
    objectivePreservationScore,
    actionVp,
    killVp,
    lastMarkerVp,
    rawAdvisoryVp,
    cappedAdvisoryVp,
    projectedAdditionalRoundVp,
    remainingPrimaryGameAfterProjectedRound,
    recordedMissionVpThisTurn,
    additionalPrimaryAllowance,
    remainingPrimaryGameVp,
    protectCheapUnits: false,
    summary: Object.freeze([
      markerProgress,
      sweepProgress,
      killProgress,
      controlProgress,
      lastMarkerProgress,
      `Recorded/map-supported conditions currently project up to ${cappedAdvisoryVp}/15 Primary VP for the battle round before tabletop confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Extract Relic and the opponent's Locate and Deny mission use the same operation-marker pool; a completed Sensor Sweep by either player removes the selected marker.",
      "Sensor Sweep is once per turn, cannot be started when only one operation marker remains, and completes at end of turn only if the acting unit controls its selected central objective.",
      "A completed Extract Relic Sensor Sweep is worth 4 VP that turn before Primary caps.",
      "The objective-range destruction condition is binary and worth 3 VP; saved turn-start map position is advisory and tabletop range is authoritative.",
      "The non-home control condition is binary and worth 4 VP from Round 2: Command phase in Rounds 2-4, end of turn in Round 5.",
      "When exactly one opponent marker remains, the recorded map can only support—not prove—the same-terrain friendly-presence/no-enemy condition.",
      "The 5 VP end-of-battle last-marker award is outside the 15 VP battle-round cap but remains subject to the 45 VP Primary game cap."
    ])
  });
}

export function getExtractRelicObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId || !isExtractRelicMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Extract Relic is not active for this objective." });
  }
  const context = primaryStrategy ?? getExtractRelicPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  const objective = (state?.objectives ?? []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "Objective is not available." });

  const ownHome = isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId);
  const central = isExtractRelicCentralObjective(objective);
  const controlledNow = control === "controlled" || (objective?.control?.controlState === "controlled" && objective.control?.controllerId === playerId);
  const pending = context.pendingSensorSweepAttempts.some((attempt) => attempt.objectiveId === objectiveId);
  const eligibleSensorSweepObjective = central && context.sensorSweepAvailable;

  let controlVpLeverage = 0;
  if (context.round >= 2 && !ownHome && context.controlStateKnown && !context.controlCheckpointCompleted) {
    if (controlledNow && context.nonHomeControlled === 1) controlVpLeverage = 4;
    if (!controlledNow && context.nonHomeControlled === 0) controlVpLeverage = 4;
  }
  const actionVpLeverage = pending
    ? context.pendingSensorSweepVpLeverage
    : eligibleSensorSweepObjective
      ? context.nextSensorSweepVpLeverage
      : 0;
  const rawVpLeverage = controlVpLeverage + actionVpLeverage;
  const vpLeverage = Math.min(context.additionalPrimaryAllowance, rawVpLeverage);
  let score = 0.06 + vpLeverage * 0.075;
  if (pending) score += 0.28;
  else if (eligibleSensorSweepObjective) score += context.activeOpponentMarkerCount === 2 ? 0.24 : 0.14;
  if (!ownHome && context.round >= 2) score += 0.1;
  if (controlledNow && rawVpLeverage > 0) score += 0.07;
  if (context.remainingPrimaryGameVp === 0) score = Math.min(score, 0.12);
  score = clamp01(score);

  const notes = [];
  if (pending) notes.push("This central objective is tied to the pending Sensor Sweep; preserving control through end of turn protects the 4 VP Action completion and marker removal.");
  else if (eligibleSensorSweepObjective) notes.push(`A qualifying unit at this central objective can start Sensor Sweep and reduce the opponent marker count from ${context.activeOpponentMarkerCount} to ${context.activeOpponentMarkerCount - 1}.`);
  if (ownHome) notes.push("Your home objective does not satisfy Extract Relic's Round 2+ non-home control condition.");
  if (controlVpLeverage && controlledNow) notes.push("This is your only controlled non-home objective, so losing it can cost the binary 4 VP control condition.");
  if (controlVpLeverage && !controlledNow) notes.push("You currently control no non-home objective; taking this one can establish the binary 4 VP condition.");
  if (!controlVpLeverage && !ownHome && context.nonHomeControlled > 0) notes.push("The binary non-home control condition is already supported elsewhere; this objective adds resilience rather than another 4 VP award.");

  return Object.freeze({
    active: true,
    missionName: context.missionName,
    objectiveId,
    ownHome,
    central,
    controlledNow,
    pending,
    eligibleSensorSweepObjective,
    actionVpLeverage,
    controlVpLeverage,
    rawVpLeverage,
    vpLeverage,
    score,
    purpose,
    reason: notes.join(" ")
  });
}
