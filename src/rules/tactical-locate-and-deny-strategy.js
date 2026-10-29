import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getRemainingPrimaryVictoryPoints } from "../engine/victory-points-ledger.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getUnitStateAtTurnStart } from "./scoring-evidence-state.js";
import {
  getLocateAndDenyState,
  isLocateAndDenyMissionForPlayer
} from "./locate-and-deny-state.js";
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

function distance(first, second) {
  if (!Number.isFinite(first?.x) || !Number.isFinite(first?.y) || !Number.isFinite(second?.x) || !Number.isFinite(second?.y)) return null;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function targetOpportunity(state, locate, targetUnitId) {
  if (!targetUnitId || locate.objectiveRangeKillMapSatisfied) {
    return Object.freeze({ active: false, mapSupportsQualification: false, objectiveIds: Object.freeze([]), vpLeverage: 0 });
  }
  const start = getUnitStateAtTurnStart(state, targetUnitId, locate.turn);
  const objectives = (state?.objectives ?? []).filter((objective) => {
    const d = distance(start?.position, objective?.position);
    return Number.isFinite(d) && d <= 3;
  });
  return Object.freeze({
    active: true,
    mapSupportsQualification: objectives.length > 0,
    objectiveIds: Object.freeze(objectives.map((objective) => objective.id)),
    vpLeverage: objectives.length > 0 ? 4 : 0
  });
}

function commandCheckpointCompleted(round, phase) {
  return round >= 2 && round < 5 && String(phase ?? "") !== "command";
}

export { isLocateAndDenyMissionForPlayer } from "./locate-and-deny-state.js";

export function getLocateAndDenyPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isLocateAndDenyMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Locate and Deny strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const locate = getLocateAndDenyState(state, { playerId, perspectivePlayerId });
  const round = locate.round;
  const phase = state?.phase ?? null;
  const targetKill = targetOpportunity(state, locate, targetUnitId);
  const awardsThisTurn = currentTurnMissionAwards(state, playerId, mission.id, round, locate.turn);
  const recordedMissionVpThisTurn = awardsThisTurn.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const checkpointPassed = commandCheckpointCompleted(round, phase);
  const liveControlVp = round >= 2 && locate.controlKnown && locate.nonHomeControlledCount > 0 ? 4 : 0;
  const controlVpForRound = round < 2 ? 0 : checkpointPassed ? commandAwardAmount(awardsThisTurn) : liveControlVp;
  const killVp = locate.objectiveRangeKillMapSatisfied ? 4 : 0;
  const lastMarkerVp = locate.activeMarkerCount === 1 && locate.lastMarkerPositionMapSatisfied ? 4 : 0;
  const rawRecordedVp = killVp + lastMarkerVp + controlVpForRound;
  const additionalPrimaryAllowance = getRemainingPrimaryVictoryPoints(state, playerId);
  const cappedRecordedVp = Math.min(15, Math.max(recordedMissionVpThisTurn, Math.min(rawRecordedVp, recordedMissionVpThisTurn + additionalPrimaryAllowance)));
  const remainingPrimaryGameVp = primaryGameRemaining(state, playerId);
  const endgameLastMarkerVp = locate.activeMarkerCount === 1 && locate.lastMarkerPositionMapSatisfied
    ? Math.min(5, Math.max(0, remainingPrimaryGameVp - Math.max(0, cappedRecordedVp - recordedMissionVpThisTurn)))
    : 0;
  const nextKillVpLeverage = locate.objectiveRangeKillMapSatisfied ? 0 : targetKill.vpLeverage;
  const targetingScore = locate.objectiveRangeKillMapSatisfied ? 0.06 : targetKill.mapSupportsQualification ? 0.88 : 0.14;

  let objectivePreservationScore = locate.controlKnown ? 0.5 : 0.34;
  if (round >= 2 && locate.nonHomeControlledCount === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.88);
  if (locate.sensorSweepAvailable) objectivePreservationScore = Math.max(objectivePreservationScore, 0.82);
  if (locate.activeMarkerCount === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.94);

  const setupProgress = !locate.setupComplete
    ? `Record the ${locate.setup.expectedMarkerCount} start-of-battle operation-marker terrain areas before relying on marker strategy.`
    : `${locate.activeMarkerCount}/${locate.startingMarkerCount} Locate and Deny operation markers remain; ${locate.removedTerrainAreaIds.length} have been removed by completed Sensor Sweep Actions.`;
  const sweepProgress = !locate.setupComplete
    ? "Sensor Sweep routing is withheld until the marker setup is recorded."
    : locate.activeMarkerCount <= 1
      ? "Only one operation marker remains, so Sensor Sweep can no longer be started."
      : locate.sensorSweepUsedThisTurn
        ? "Sensor Sweep has already been started this turn; its once-per-turn use is spent even if completion later fails."
        : `Sensor Sweep is available this turn. A qualifying unit at a central objective can remove one of the ${locate.activeMarkerCount} remaining operation markers if it controls that objective at end of turn.`;
  const killProgress = locate.objectiveRangeKillMapSatisfied
    ? "Recorded turn-start map evidence supports the 4 VP objective-range destruction condition; confirm the physical-tabletop range at scoring."
    : "No recorded enemy destruction currently has turn-start map evidence within 3\" of an objective; the first qualifying destruction is worth 4 VP.";
  const controlProgress = round < 2
    ? "The binary 4 VP non-home control condition begins in Round 2."
    : !locate.controlKnown
      ? "Objective control is incomplete; confirm controllers before relying on the 4 VP non-home condition."
      : checkpointPassed
        ? `The Round ${round} Command checkpoint has passed; recorded Command-phase Primary awards are used rather than current control for this turn's cap projection.`
        : locate.nonHomeControlledCount > 0
          ? "At least one non-home objective is controlled, satisfying the 4 VP control condition at the current applicable checkpoint before caps."
          : "No non-home objective is controlled; establishing one can satisfy the binary 4 VP condition.";
  const lastMarkerProgress = locate.activeMarkerCount !== 1
    ? "The last-marker positioning award is not live until exactly one of your operation markers remains."
    : locate.lastMarkerPositionMapSatisfied
      ? `${locate.lastMarkerTerrainAreaId} is the last recorded marker terrain; approximate map evidence shows a friendly unit and no enemy unit there. Confirm the terrain-area condition on the tabletop for 4 VP at end of turn and 5 VP at end of battle.`
      : `${locate.lastMarkerTerrainAreaId} is the last recorded marker terrain. The saved map does not currently show the required friendly-presence/no-enemy state there.`;

  let reason;
  if (!locate.setupComplete) {
    reason = "Record the five Locate and Deny operation-marker terrain areas first. The advisor will not invent marker locations because the mission lets the player choose among eligible terrain areas.";
  } else if (remainingPrimaryGameVp === 0) {
    reason = "The 45 VP Primary game cap is already filled, so Locate and Deny mission levers should not distort tactical priorities for additional Primary scoring.";
  } else if (locate.activeMarkerCount > 1 && locate.sensorSweepAvailable) {
    reason = "Progress the marker plan with Sensor Sweep from a central objective while preserving enough board control to complete the Action. Each successful sweep moves the mission toward the one-marker scoring state.";
  } else if (locate.activeMarkerCount === 1 && !locate.lastMarkerPositionMapSatisfied) {
    reason = `The marker plan has reached its scoring state. Protect and occupy ${locate.lastMarkerTerrainAreaId} while excluding enemy units; this unlocks both the recurring 4 VP end-turn condition and the 5 VP end-of-battle condition.`;
  } else if (round >= 2 && locate.nonHomeControlSatisfied === false) {
    reason = "The binary 4 VP non-home objective condition is currently unsecured. Establish one durable non-home objective without abandoning the last-marker plan.";
  } else if (!locate.objectiveRangeKillMapSatisfied) {
    reason = "The 4 VP destruction condition is still open. Enemy units that began the turn within range of an objective receive elevated finishing value, but physical-tabletop range remains authoritative.";
  } else {
    reason = "Recorded Locate and Deny conditions are favorable. Preserve the last-marker terrain and non-home objective control rather than giving up scoring positions for redundant mission actions.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Disruption",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn: locate.turn,
    phase,
    targetUnitId,
    setupComplete: locate.setupComplete,
    setup: locate.setup,
    activeMarkerCount: locate.activeMarkerCount,
    activeMarkerTerrainAreaIds: locate.activeTerrainAreaIds,
    removedMarkerTerrainAreaIds: locate.removedTerrainAreaIds,
    sensorSweepAvailable: locate.sensorSweepAvailable,
    sensorSweepUsedThisTurn: locate.sensorSweepUsedThisTurn,
    lastMarkerTerrainAreaId: locate.lastMarkerTerrainAreaId,
    lastMarkerPositionMapSatisfied: locate.lastMarkerPositionMapSatisfied,
    friendlyUnitIdsInLastMarkerTerrain: locate.friendlyUnitIdsInLastMarkerTerrain,
    enemyUnitIdsInLastMarkerTerrain: locate.enemyUnitIdsInLastMarkerTerrain,
    objectiveRangeKillMapSatisfied: locate.objectiveRangeKillMapSatisfied,
    qualifyingMapKillCount: locate.qualifyingMapKills.length,
    targetKillOpportunity: targetKill,
    nextKillVpLeverage,
    targetingScore,
    controlStateKnown: locate.controlKnown,
    nonHomeControlled: locate.nonHomeControlledCount,
    nonHomeControlledObjectiveIds: locate.nonHomeControlledIds,
    nonHomeControlSatisfied: locate.nonHomeControlSatisfied,
    controlCheckpointCompleted: checkpointPassed,
    liveControlVp,
    controlVpForRound,
    objectivePreservationScore,
    rawRecordedVp,
    cappedRecordedVp,
    recordedMissionVpThisTurn,
    remainingPrimaryGameVp,
    endgameLastMarkerVp,
    protectCheapUnits: false,
    summary: Object.freeze([
      setupProgress,
      sweepProgress,
      killProgress,
      controlProgress,
      lastMarkerProgress,
      `Recorded/map-supported conditions currently project up to ${cappedRecordedVp}/15 Primary VP for this turn before tabletop confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Start-of-battle marker locations are explicitly recorded; the advisor never guesses which five eligible terrain areas were chosen.",
      "Sensor Sweep is once per turn and its use is spent when the Action is started, even if it later fails to complete.",
      "Sensor Sweep cannot be started when only one operation marker remains.",
      "A completed Sensor Sweep removes the explicitly selected operation marker; failed Action reviews do not remove it.",
      "The objective-range destruction check uses saved turn-start map position only as advisory evidence. Physical tabletop range is authoritative at scoring.",
      "The last-marker terrain occupancy check uses the saved map only as advisory evidence. Physical terrain-area occupancy is authoritative.",
      "The 4 VP non-home control condition is binary and does not multiply for extra objectives.",
      "Rounds 2-4 check non-home control in the Command phase; Round 5 checks it at end of turn.",
      "The 5 VP last-marker endgame award is outside the battle-round cap but still respects the 45 VP Primary game cap."
    ])
  });
}

export function getLocateAndDenyObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getLocateAndDenyPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (state?.objectives ?? []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const ownHome = isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId);
  const controlledNow = control === "controlled" || (objective?.control?.controlState === "controlled" && objective.control.controllerId === playerId);
  const text = `${objective?.name ?? ""} ${objective?.layoutObjective ?? ""} ${objective?.id ?? ""}`;
  const central = /cent(er|ral)/i.test(text);
  let controlVpLeverage = 0;
  if (context.round >= 2 && !ownHome && context.controlStateKnown && !context.controlCheckpointCompleted) {
    if (controlledNow && context.nonHomeControlled === 1) controlVpLeverage = 4;
    if (!controlledNow && context.nonHomeControlled === 0) controlVpLeverage = 4;
  }
  const sweepVpLeverage = context.sensorSweepAvailable && central ? (context.activeMarkerCount === 2 ? 4 : 2) : 0;
  let score = 0.06;
  if (controlVpLeverage) score += 0.38;
  if (sweepVpLeverage) score += context.activeMarkerCount === 2 ? 0.48 : 0.3;
  if (controlledNow && purpose === "hold-objective") score += 0.08;
  score = clamp01(score);
  const notes = [];
  if (ownHome) notes.push("Your home objective does not satisfy Locate and Deny's binary non-home control condition.");
  if (central && context.sensorSweepAvailable) notes.push(`A qualifying unit at this central objective can start the once-per-turn Sensor Sweep; completing it can reduce the marker count from ${context.activeMarkerCount} to ${context.activeMarkerCount - 1}.`);
  if (controlVpLeverage && controlledNow) notes.push("This is your only controlled non-home objective, so losing it can cost the 4 VP control condition at the applicable checkpoint.");
  if (controlVpLeverage && !controlledNow) notes.push("You currently control no non-home objective; taking this one can establish the binary 4 VP control condition.");
  if (!controlVpLeverage && !ownHome && context.nonHomeControlled > 0) notes.push("The binary control condition is already supported elsewhere; another non-home objective adds resilience rather than a second 4 VP award.");
  return Object.freeze({
    active: true,
    missionName: context.missionName,
    objectiveId,
    ownHome,
    central,
    controlledNow,
    controlVpLeverage,
    sweepVpLeverage,
    vpLeverage: controlVpLeverage + sweepVpLeverage,
    score,
    reason: notes.join(" ")
  });
}
