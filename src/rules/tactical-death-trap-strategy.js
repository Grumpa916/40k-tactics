import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getUnitStateAtTurnStart } from "./scoring-evidence-state.js";
import {
  getDeathTrapState,
  getDeathTrapTerrainAreaForPosition,
  isDeathTrapMissionForPlayer
} from "./death-trap-state.js";
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

function targetKillOpportunity(state, deathTrap, targetUnitId) {
  if (!targetUnitId || deathTrap.trappedKillSatisfied) {
    return Object.freeze({ active: false, terrainAreaId: null, trapped: false, canTrapLater: false, vpLeverage: 0 });
  }
  const start = getUnitStateAtTurnStart(state, targetUnitId, deathTrap.turn);
  const area = getDeathTrapTerrainAreaForPosition(state, start?.position);
  if (!area) return Object.freeze({ active: true, terrainAreaId: null, trapped: false, canTrapLater: false, vpLeverage: 0 });
  const terrain = deathTrap.terrain.find((item) => item.terrainAreaId === area.terrainAreaId) ?? null;
  const trapped = terrain?.trapped === true;
  return Object.freeze({
    active: true,
    terrainAreaId: area.terrainAreaId,
    trapped,
    canTrapLater: !trapped,
    vpLeverage: 3,
    confirmedByMap: trapped,
    conditionalOnLaterTrap: !trapped
  });
}

function timingSummary(round) {
  if (round === 1) return "Round 1: Death Trap scores newly trapped terrain and the trapped-terrain destruction condition at end of turn; non-home control begins in Round 2.";
  if (round < 5) return `Round ${round}: non-home control checks at the end of Command phase; newly trapped terrain and the trapped-terrain destruction condition score at end of turn.`;
  return "Round 5: non-home control, newly trapped terrain and the trapped-terrain destruction condition all resolve by end of turn, so movement, Actions and combat can all change the same scoring checkpoint.";
}

export { isDeathTrapMissionForPlayer } from "./death-trap-state.js";

export function getDeathTrapPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isDeathTrapMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Death Trap strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const deathTrap = getDeathTrapState(state, { playerId, perspectivePlayerId });
  const round = deathTrap.round;
  const killOpportunity = targetKillOpportunity(state, deathTrap, targetUnitId);
  const rawRecordedVp = deathTrap.trapVp + deathTrap.trappedKillVp + deathTrap.nonHomeControlVp;
  const cappedRecordedVp = Math.min(15, rawRecordedVp);
  const nextKillVpLeverage = deathTrap.trappedKillSatisfied ? 0 : killOpportunity.vpLeverage;
  const targetingScore = deathTrap.trappedKillSatisfied
    ? 0.06
    : killOpportunity.confirmedByMap
      ? 0.84
      : killOpportunity.conditionalOnLaterTrap
        ? 0.58
        : 0.1;

  let objectivePreservationScore = deathTrap.controlKnown ? 0.5 : 0.34;
  if (round >= 2 && deathTrap.nonHomeControlledCount === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (deathTrap.trappedThisTurnCount > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.76);
  if (round === 5) objectivePreservationScore = Math.max(objectivePreservationScore, 0.92);

  const trapProgress = !deathTrap.terrainKnown
    ? "Verified terrain geometry is unavailable for this battlefield selection; track Booby Trap markers manually."
    : `${deathTrap.trappedThisTurnCount} terrain area${deathTrap.trappedThisTurnCount === 1 ? "" : "s"} trapped this turn, including ${deathTrap.objectiveTrappedThisTurnCount} objective terrain area${deathTrap.objectiveTrappedThisTurnCount === 1 ? "" : "s"}; recorded trap value is ${deathTrap.trapVp} VP before the round cap.`;
  const killProgress = deathTrap.trappedKillSatisfied
    ? `${deathTrap.qualifyingKills.length} recorded enemy destruction${deathTrap.qualifyingKills.length === 1 ? "" : "s"} began the turn in terrain that is now trapped; this supports the single 3 VP destruction condition.`
    : deathTrap.enemyKillsThisTurn > 0
      ? `${deathTrap.enemyKillsThisTurn} enemy destruction${deathTrap.enemyKillsThisTurn === 1 ? " is" : "s are"} recorded this turn, but no saved turn-start position currently proves the enemy began in terrain that is trapped by end of turn.`
      : "No enemy destruction is recorded this turn; the first enemy destroyed after starting the turn in a terrain area that is trapped by end of turn can score 3 VP.";
  const controlProgress = round < 2
    ? "The 4 VP non-home control condition begins in Round 2."
    : !deathTrap.controlKnown
      ? "Objective control is incomplete; confirm controllers before relying on the 4 VP non-home condition."
      : deathTrap.nonHomeControlledCount > 0
        ? `At least one non-home objective is controlled, supporting the 4 VP condition at the applicable checkpoint.`
        : "No non-home objective is controlled; establishing one is worth 4 VP at the next applicable checkpoint.";

  let reason;
  if (killOpportunity.confirmedByMap) {
    reason = `This target began the turn in ${killOpportunity.terrainAreaId}, which is already trapped. Destroying it can satisfy the 3 VP Death Trap destruction condition.`;
  } else if (killOpportunity.conditionalOnLaterTrap) {
    reason = `This target began the turn in ${killOpportunity.terrainAreaId}. Destroying it can still support the 3 VP condition if that terrain is trapped by end of turn; the Event Companion FAQ confirms the trap does not need to exist when the unit is destroyed.`;
  } else if (deathTrap.trapVp < 10 && deathTrap.terrainKnown) {
    reason = "Booby Trap Actions are the mission's most repeatable scoring lever. Objective terrain is especially valuable because a newly trapped objective terrain area is worth 5 VP before the round cap.";
  } else if (round >= 2 && deathTrap.nonHomeControlledCount === 0) {
    reason = "The 4 VP non-home control condition is currently unsecured. Preserve trap scoring while establishing at least one durable non-home objective.";
  } else {
    reason = "The current Death Trap position is favorable. Preserve the binary non-home control condition and use additional Booby Trap Actions only where they improve the remaining round-cap value or enable the 3 VP trapped-terrain kill condition.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Disruption",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn: deathTrap.turn,
    targetUnitId,
    terrainKnown: deathTrap.terrainKnown,
    terrain: deathTrap.terrain,
    trappedTerrainIds: deathTrap.trappedTerrainIds,
    trappedThisTurnIds: deathTrap.trappedThisTurnIds,
    objectiveTrappedThisTurnIds: deathTrap.objectiveTrappedThisTurnIds,
    trappedThisTurnCount: deathTrap.trappedThisTurnCount,
    objectiveTrappedThisTurnCount: deathTrap.objectiveTrappedThisTurnCount,
    trapVp: deathTrap.trapVp,
    trappedKillSatisfied: deathTrap.trappedKillSatisfied,
    trappedKillVp: deathTrap.trappedKillVp,
    qualifyingKillCount: deathTrap.qualifyingKills.length,
    killOpportunity,
    nextKillVpLeverage,
    targetingScore,
    controlStateKnown: deathTrap.controlKnown,
    nonHomeControlled: deathTrap.nonHomeControlledCount,
    nonHomeControlSatisfied: deathTrap.nonHomeControlSatisfied,
    nonHomeControlVp: deathTrap.nonHomeControlVp,
    controlCheckpointTiming: round >= 5 ? "end-of-turn" : round >= 2 ? "end-of-command" : null,
    objectivePreservationScore,
    rawRecordedVp,
    cappedRecordedVp,
    protectCheapUnits: false,
    summary: Object.freeze([
      timingSummary(round),
      trapProgress,
      killProgress,
      controlProgress,
      `Recorded conditions currently represent up to ${cappedRecordedVp}/15 Primary VP for the round before tabletop confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Booby Trap terrain markers are persistent unless a rule explicitly removes them.",
      "A terrain area trapped this turn is worth 2 VP, plus 3 additional VP if that terrain area contains an objective.",
      "The trapped-terrain destruction condition scores 3 VP once per turn, not per destroyed unit.",
      "Per the Event Companion FAQ, the terrain area only needs to be trapped by the scoring check; it did not need to be trapped when the enemy unit was destroyed.",
      "Turn-start enemy position and Event Companion terrain geometry are advisory evidence; tabletop confirmation remains authoritative.",
      "The 4 VP control condition is binary: controlling additional non-home objectives does not add more Death Trap VP.",
      "The 15 VP Primary cap is applied to the current-round outlook."
    ])
  });
}

export function getDeathTrapObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getDeathTrapPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (state?.objectives ?? []).find((item) => item.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const ownHome = isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId);
  const controlledNow = control === "controlled" || (objective?.control?.controlState === "controlled" && objective.control.controllerId === playerId);
  const terrain = context.terrain.find((entry) => entry.objectiveIds?.includes(objectiveId)) ?? null;
  const trapAvailable = !!terrain && !terrain.trapped && !ownHome;
  const trapVpLeverage = trapAvailable ? 5 : 0;
  let controlVpLeverage = 0;
  if (context.round >= 2 && !ownHome && context.controlStateKnown) {
    if (controlledNow && context.nonHomeControlled === 1) controlVpLeverage = 4;
    if (!controlledNow && context.nonHomeControlled === 0) controlVpLeverage = 4;
  }
  let score = 0.08;
  if (trapVpLeverage) score += 0.42;
  if (controlVpLeverage) score += 0.34;
  if (controlledNow && purpose === "hold-objective") score += 0.08;
  if (context.round === 5 && (trapVpLeverage || controlVpLeverage)) score += 0.08;
  score = clamp01(score);

  const notes = [];
  if (ownHome) notes.push("Your home objective does not satisfy Death Trap's 4 VP non-home control condition and is not elevated as an objective-based Booby Trap target.");
  if (trapAvailable) notes.push(`${terrain.terrainAreaId} contains this objective and is not yet trapped; a valid Booby Trap Action there can be worth 5 VP this turn before the round cap.`);
  if (terrain?.trapped) notes.push(`${terrain.terrainAreaId} is already trapped, so this objective cannot generate another terrain-trap award.`);
  if (controlVpLeverage && controlledNow) notes.push("This is your only controlled non-home objective, so losing it can cost the binary 4 VP control condition.");
  if (controlVpLeverage && !controlledNow) notes.push("You currently control no non-home objective; taking this one can establish the binary 4 VP control condition at the next applicable checkpoint.");
  if (!controlVpLeverage && !ownHome && context.round >= 2 && context.nonHomeControlled > 0) notes.push("The 4 VP non-home control condition is already supported elsewhere, so another objective adds resilience rather than a second 4 VP award.");

  return Object.freeze({
    active: true,
    missionName: context.missionName,
    objectiveId,
    ownHome,
    controlledNow,
    terrainAreaId: terrain?.terrainAreaId ?? null,
    terrainTrapped: terrain?.trapped ?? null,
    trapAvailable,
    trapVpLeverage,
    controlVpLeverage,
    vpLeverage: trapVpLeverage + controlVpLeverage,
    score,
    reason: notes.join(" ")
  });
}
