import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import {
  getEnemyUnitDestructionsForTurn,
  getFriendlyUnitDestructionsForTurn
} from "./scoring-evidence-state.js";

function playerIds(state) {
  return (Array.isArray(state?.players) ? state.players : []).map((player) => player?.id).filter(Boolean);
}

function resolvePrimaryMission(state, playerId, perspectivePlayerId = null) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition) return null;
  const definitions = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
  if (!definitions) return null;
  const ids = playerIds(state);
  const perspective = perspectivePlayerId ?? ids[0] ?? playerId;
  return playerId === perspective ? definitions.myMission : definitions.opponentMission;
}

function objectiveSnapshot(state, playerId) {
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const known = objectives.length > 0 && objectives.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({ known: false, controlled: 0, opponentControlled: 0, nonHomeControlled: 0, margin: 0 });
  }

  const controlled = objectives.filter((objective) =>
    objective?.control?.controlState === "controlled" && objective?.control?.controllerId === playerId
  );
  const opponentControlled = objectives.filter((objective) =>
    objective?.control?.controlState === "controlled" &&
    objective?.control?.controllerId != null &&
    objective.control.controllerId !== playerId
  );
  const nonHomeControlled = controlled.filter((objective) => !/home/i.test(objective?.name ?? objective?.id ?? ""));

  return Object.freeze({
    known: true,
    controlled: controlled.length,
    opponentControlled: opponentControlled.length,
    nonHomeControlled: nonHomeControlled.length,
    margin: controlled.length - opponentControlled.length
  });
}

function inactive(reason, mission = null) {
  return Object.freeze({
    active: false,
    supported: false,
    missionId: mission?.id ?? null,
    missionName: mission?.name ?? null,
    targetingScore: 0,
    objectivePreservationScore: 0,
    nextKillVpLeverage: 0,
    summary: Object.freeze([]),
    reason
  });
}

function destroyersWrathContext(state, playerId, mission) {
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const previousTurn = Math.max(0, turn - 1);
  const objectives = objectiveSnapshot(state, playerId);
  const enemyKills = getEnemyUnitDestructionsForTurn(state, playerId, turn).length;
  const friendlyLossesLastTurn = turn > 0
    ? getFriendlyUnitDestructionsForTurn(state, playerId, previousTurn).length
    : 0;

  const basicKillNeeded = Math.max(0, 1 - enemyKills);
  const comparisonTarget = friendlyLossesLastTurn + 1;
  const comparisonKillsNeeded = round >= 2 ? Math.max(0, comparisonTarget - enemyKills) : null;
  const majoritySatisfied = objectives.known ? objectives.margin > 0 : null;
  const nonHomeSatisfied = objectives.known ? objectives.nonHomeControlled >= 1 : null;
  const comparisonSatisfied = round >= 2 ? enemyKills > friendlyLossesLastTurn : null;

  let rawRecordedVp = enemyKills >= 1 ? 3 : 0;
  if (round >= 2 && nonHomeSatisfied) rawRecordedVp += 4;
  if (round >= 2 && majoritySatisfied) rawRecordedVp += 6;
  if (round >= 2 && comparisonSatisfied) rawRecordedVp += 4;

  let nextKillVpLeverage = enemyKills < 1 ? 3 : 0;
  if (round >= 2 && !comparisonSatisfied && enemyKills + 1 > friendlyLossesLastTurn) nextKillVpLeverage += 4;

  const targetingScore = basicKillNeeded > 0
    ? 0.9
    : comparisonKillsNeeded > 0
      ? 0.72
      : 0.12;

  const objectivePreservationScore = !objectives.known
    ? 0.35
    : objectives.margin === 1
      ? 0.9
      : objectives.margin <= 0
        ? 0.78
        : 0.5;

  const killProgress = basicKillNeeded > 0
    ? `Need ${basicKillNeeded} enemy unit kill${basicKillNeeded === 1 ? "" : "s"} for the 3 VP destroy condition.`
    : "The 3 VP destroy condition is currently satisfied by recorded kills.";
  const comparisonProgress = round < 2
    ? "The kill-comparison condition is not active until Round 2."
    : comparisonKillsNeeded > 0
      ? `You lost ${friendlyLossesLastTurn} recorded unit${friendlyLossesLastTurn === 1 ? "" : "s"} last turn; need ${comparisonKillsNeeded} more enemy kill${comparisonKillsNeeded === 1 ? "" : "s"} this turn to exceed that total.`
      : `Recorded kills already exceed the ${friendlyLossesLastTurn} friendly unit${friendlyLossesLastTurn === 1 ? "" : "s"} lost last turn.`;
  const objectiveProgress = objectives.known
    ? `Objectives: ${objectives.controlled}-${objectives.opponentControlled}; ${objectives.nonHomeControlled} non-home controlled.`
    : "Objective control is incomplete; confirm all objective controllers before relying on majority advice.";

  const reason = basicKillNeeded > 0
    ? `${killProgress} Prefer a high-probability finishing target over spreading damage when the mission value is otherwise comparable.`
    : comparisonKillsNeeded > 0
      ? `${comparisonProgress} Finishing another unit has elevated Primary value.`
      : majoritySatisfied === false
        ? "Recorded kill conditions are currently covered; the larger Primary opportunity is improving objective control."
        : "Recorded Destroyer's Wrath conditions are currently favorable; avoid unnecessary exposure that gives the opponent easy unit kills.";

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Purge the Foe",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn,
    objectiveStateKnown: objectives.known,
    controlledObjectives: objectives.controlled,
    opponentControlledObjectives: objectives.opponentControlled,
    objectiveMargin: objectives.margin,
    nonHomeControlled: objectives.nonHomeControlled,
    majoritySatisfied,
    nonHomeSatisfied,
    enemyKillsThisTurn: enemyKills,
    friendlyLossesLastTurn,
    basicKillNeeded,
    comparisonKillTarget: round >= 2 ? comparisonTarget : null,
    comparisonKillsNeeded,
    comparisonSatisfied,
    nextKillVpLeverage,
    rawRecordedVp,
    cappedRecordedVp: Math.min(15, rawRecordedVp),
    targetingScore,
    objectivePreservationScore,
    protectCheapUnits: round >= 1,
    summary: Object.freeze([
      objectiveProgress,
      killProgress,
      comparisonProgress,
      `Recorded conditions currently represent up to ${Math.min(15, rawRecordedVp)}/15 Primary VP before timing and player confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Only recorded objective control and destruction events are used.",
      "The 15 VP per-round Primary cap is applied to the outlook, but scoring timing remains mission-card and player confirmed.",
      "A unit lost during the opponent's turn increases the next-turn kill-comparison threshold; preserving expendable units can therefore have Primary value."
    ])
  });
}

export function getPrimaryStrategyContext(state, { playerId, perspectivePlayerId = null } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const mission = resolvePrimaryMission(state, playerId, perspectivePlayerId);
  if (!mission) return inactive("Primary Mission strategy is unavailable until both Force Dispositions are recorded.");
  if (mission.id !== "primary-destroyers-wrath") {
    return inactive(`Primary strategy modeling is not yet enabled for ${mission.name}.`, mission);
  }
  return destroyersWrathContext(state, playerId, mission);
}
