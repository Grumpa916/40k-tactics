import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import {
  getEnemyUnitDestructionsForTurn,
  getFriendlyUnitDestructionsForTurn,
  getTurnSnapshot
} from "./scoring-evidence-state.js";
import { clamp01 } from "./tactical-context-utils.js";

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

function objectiveText(objective) {
  return String(objective?.name ?? objective?.id ?? "");
}

function objectiveLayoutName(objective) {
  if (objective?.layoutObjective) return String(objective.layoutObjective);
  const id = String(objective?.id ?? "");
  if (id.startsWith("event-companion:")) return id.slice("event-companion:".length);
  return objectiveText(objective);
}

function isHomeObjective(objective) {
  return /home/i.test(objectiveText(objective)) || /home/i.test(objectiveLayoutName(objective));
}

function isCentralObjective(objective) {
  return /cent(er|ral)/i.test(objectiveText(objective)) || /cent(er|ral)/i.test(objectiveLayoutName(objective));
}

function isOpponentHomeObjective(state, objective, playerId) {
  const text = `${objectiveText(objective)} ${objectiveLayoutName(objective)}`;
  if (/opponent.*home|enemy.*home/i.test(text)) return true;
  if (/my.*home/i.test(text)) return false;

  const layout = objectiveLayoutName(objective);
  const attacker = state?.preGameSetup?.attackerPlayerId ?? null;
  const defender = state?.preGameSetup?.defenderPlayerId ?? null;
  if (layout === "Attacker Home" && attacker) return attacker !== playerId;
  if (layout === "Defender Home" && defender) return defender !== playerId;
  return false;
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function objectiveSnapshot(state, playerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const known = all.length > 0 && all.every((objective) => objective?.control != null);
  if (!known) {
    return Object.freeze({
      known: false,
      controlled: 0,
      opponentControlled: 0,
      nonHomeControlled: 0,
      centralControlled: 0,
      opponentHomeControlled: 0,
      margin: 0,
      controlledIds: Object.freeze([]),
      nonHomeControlledIds: Object.freeze([]),
      centralControlledIds: Object.freeze([]),
      opponentHomeControlledIds: Object.freeze([])
    });
  }

  const controlled = all.filter((objective) => controlledBy(objective?.control, playerId));
  const opponentControlled = all.filter((objective) =>
    objective?.control?.controlState === "controlled" &&
    objective?.control?.controllerId != null &&
    objective.control.controllerId !== playerId
  );
  const nonHomeControlled = controlled.filter((objective) => !isHomeObjective(objective));
  const centralControlled = controlled.filter((objective) => isCentralObjective(objective));
  const opponentHomeControlled = controlled.filter((objective) => isOpponentHomeObjective(state, objective, playerId));

  return Object.freeze({
    known: true,
    controlled: controlled.length,
    opponentControlled: opponentControlled.length,
    nonHomeControlled: nonHomeControlled.length,
    centralControlled: centralControlled.length,
    opponentHomeControlled: opponentHomeControlled.length,
    margin: controlled.length - opponentControlled.length,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id)),
    centralControlledIds: Object.freeze(centralControlled.map((objective) => objective.id)),
    opponentHomeControlledIds: Object.freeze(opponentHomeControlled.map((objective) => objective.id))
  });
}

function turnStartAcquisitionContext(state, playerId) {
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const snapshot = getTurnSnapshot(state, turn);
  if (!snapshot) {
    return Object.freeze({
      known: false,
      eligibleObjectiveIds: Object.freeze([]),
      newlyControlledObjectiveIds: Object.freeze([])
    });
  }

  const startById = new Map((snapshot.objectives ?? []).map((objective) => [objective.id, objective]));
  const relevant = objectives.filter((objective) => !isHomeObjective(objective));
  const known = relevant.every((objective) => startById.has(objective.id));
  if (!known) {
    return Object.freeze({
      known: false,
      eligibleObjectiveIds: Object.freeze([]),
      newlyControlledObjectiveIds: Object.freeze([])
    });
  }

  const eligible = relevant.filter((objective) => {
    const start = startById.get(objective.id);
    return !controlledBy(start?.control, playerId);
  });
  const newlyControlled = eligible.filter((objective) => controlledBy(objective?.control, playerId));

  return Object.freeze({
    known: true,
    eligibleObjectiveIds: Object.freeze(eligible.map((objective) => objective.id)),
    newlyControlledObjectiveIds: Object.freeze(newlyControlled.map((objective) => objective.id))
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
    nonHomeControlledObjectiveIds: objectives.nonHomeControlledIds,
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

function unstoppableForceContext(state, playerId, mission) {
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const objectives = objectiveSnapshot(state, playerId);
  const acquisition = turnStartAcquisitionContext(state, playerId);
  const enemyKills = getEnemyUnitDestructionsForTurn(state, playerId, turn).length;
  const basicKillNeeded = Math.max(0, 1 - enemyKills);
  const newControlSatisfied = round >= 2 && acquisition.known
    ? acquisition.newlyControlledObjectiveIds.length > 0
    : round >= 2 ? null : false;
  const centralEndBattleSatisfied = objectives.known ? objectives.centralControlled > 0 : null;

  let rawRecordedVp = enemyKills >= 1 ? 3 : 0;
  if (round >= 2 && objectives.known) rawRecordedVp += objectives.nonHomeControlled * 4;
  if (round >= 2 && newControlSatisfied) rawRecordedVp += 3;

  const nextKillVpLeverage = enemyKills < 1 ? 3 : 0;
  const targetingScore = basicKillNeeded > 0 ? 0.82 : 0.1;
  const objectivePreservationScore = !objectives.known
    ? 0.35
    : round < 2
      ? 0.5
      : objectives.nonHomeControlled === 0
        ? 0.82
        : objectives.nonHomeControlled === 1
          ? 0.9
          : 0.78;

  const objectiveProgress = objectives.known
    ? round >= 2
      ? `${objectives.nonHomeControlled} non-home objective${objectives.nonHomeControlled === 1 ? "" : "s"} controlled; that represents ${objectives.nonHomeControlled * 4} VP at the next applicable control checkpoint before the round cap.`
      : `${objectives.nonHomeControlled} non-home objective${objectives.nonHomeControlled === 1 ? "" : "s"} controlled; Round 1 positioning can set up later control scoring.`
    : "Objective control is incomplete; confirm all objective controllers before relying on non-home scoring advice.";
  const acquisitionProgress = round < 2
    ? "The 3 VP new-control condition is not active until Round 2."
    : !acquisition.known
      ? "Turn-start objective control is unavailable; confirm whether a non-home objective was newly taken this turn."
      : acquisition.newlyControlledObjectiveIds.length > 0
        ? `${acquisition.newlyControlledObjectiveIds.length} non-home objective${acquisition.newlyControlledObjectiveIds.length === 1 ? "" : "s"} now controlled that you did not control at turn start; the 3 VP new-control condition is currently satisfied.`
        : `No newly controlled non-home objective is recorded yet; ${acquisition.eligibleObjectiveIds.length} non-home objective${acquisition.eligibleObjectiveIds.length === 1 ? " was" : "s were"} not controlled by you at turn start.`;
  const killProgress = basicKillNeeded > 0
    ? "Need 1 enemy unit kill for the 3 VP destroy condition."
    : "The 3 VP destroy condition is currently satisfied by recorded kills.";
  const endgameProgress = centralEndBattleSatisfied === true
    ? "A central objective is currently controlled; preserving central access matters for the 5 VP end-of-battle condition."
    : "No central objective is currently controlled; central access matters for the 5 VP end-of-battle condition.";

  const reason = round >= 2 && objectives.known && objectives.nonHomeControlled === 0
    ? "No non-home objective is currently controlled. Unstoppable Force rewards each controlled non-home objective, so establishing one is the highest-confidence Primary need."
    : round >= 2 && acquisition.known && acquisition.newlyControlledObjectiveIds.length === 0 && acquisition.eligibleObjectiveIds.length > 0
      ? "No new non-home capture is recorded this turn. Taking an eligible objective can add the 3 VP new-control condition while improving future non-home control scoring."
      : basicKillNeeded > 0
        ? "The first enemy unit destroyed this turn is worth 3 VP; prefer a high-probability finish when it does not compromise objective control."
        : round >= 4 && centralEndBattleSatisfied === false
          ? "Current turn scoring is in good shape; begin protecting a route to a central objective for the 5 VP end-of-battle condition."
          : "Recorded Unstoppable Force conditions are favorable; preserve non-home control and avoid abandoning scoring positions for low-value damage.";

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
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledObjectiveIds: objectives.nonHomeControlledIds,
    centralControlled: objectives.centralControlled,
    centralControlledObjectiveIds: objectives.centralControlledIds,
    enemyKillsThisTurn: enemyKills,
    basicKillNeeded,
    nextKillVpLeverage,
    turnStartControlKnown: acquisition.known,
    eligibleNewControlObjectiveIds: acquisition.eligibleObjectiveIds,
    newlyControlledNonHomeObjectiveIds: acquisition.newlyControlledObjectiveIds,
    newControlSatisfied,
    nonHomeControlVpPerObjective: 4,
    newControlVpLeverage: round >= 2 ? 3 : 0,
    centralEndBattleVpLeverage: 5,
    centralEndBattleSatisfied,
    rawRecordedVp,
    cappedRecordedVp: Math.min(15, rawRecordedVp),
    targetingScore,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      objectiveProgress,
      acquisitionProgress,
      killProgress,
      endgameProgress,
      `Recorded current-turn conditions represent up to ${Math.min(15, rawRecordedVp)}/15 Primary VP before timing and player confirmation; the 5 VP central end-of-battle condition is tracked separately.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Only recorded objective control, turn-start snapshots and destruction events are used.",
      "Non-home control is scored only at the mission's applicable checkpoint; Movement advice treats those objectives as setup/preservation value rather than silently awarding VP.",
      "The 3 VP new-control condition requires a non-home objective you did not control at the start of the turn; missing turn-start evidence remains player-confirmed.",
      "The central end-of-battle condition is tracked separately from the 15 VP current-round outlook."
    ])
  });
}

function meatgrinderContext(state, playerId, mission) {
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
  const comparisonSatisfied = round >= 2 ? enemyKills > friendlyLossesLastTurn : null;
  const nonHomeSatisfied = round >= 2 && objectives.known ? objectives.nonHomeControlled >= 1 : round >= 2 ? null : false;
  const opponentHomeSatisfied = round >= 2 && objectives.known ? objectives.opponentHomeControlled >= 1 : round >= 2 ? null : false;

  let rawRecordedVp = enemyKills >= 1 ? 3 : 0;
  if (round >= 2 && nonHomeSatisfied) rawRecordedVp += 4;
  if (round >= 2 && comparisonSatisfied) rawRecordedVp += 5;
  if (round >= 2 && opponentHomeSatisfied) rawRecordedVp += 5;

  let nextKillVpLeverage = enemyKills < 1 ? 3 : 0;
  if (round >= 2 && !comparisonSatisfied && enemyKills + 1 > friendlyLossesLastTurn) nextKillVpLeverage += 5;

  const targetingScore = basicKillNeeded > 0
    ? nextKillVpLeverage >= 8 ? 0.95 : 0.88
    : comparisonKillsNeeded > 0
      ? 0.82
      : 0.12;
  const objectivePreservationScore = !objectives.known
    ? 0.35
    : round < 2
      ? 0.45
      : opponentHomeSatisfied
        ? 0.96
        : objectives.nonHomeControlled === 0
          ? 0.86
          : 0.72;

  const killProgress = basicKillNeeded > 0
    ? `Need ${basicKillNeeded} enemy unit kill${basicKillNeeded === 1 ? "" : "s"} for the 3 VP destroy condition.`
    : "The 3 VP destroy condition is currently satisfied by recorded kills.";
  const comparisonProgress = round < 2
    ? "The 5 VP kill-comparison condition is not active until Round 2."
    : comparisonKillsNeeded > 0
      ? `You lost ${friendlyLossesLastTurn} recorded unit${friendlyLossesLastTurn === 1 ? "" : "s"} last turn; need ${comparisonKillsNeeded} more enemy kill${comparisonKillsNeeded === 1 ? "" : "s"} this turn to exceed that total for 5 VP.`
      : `Recorded kills already exceed the ${friendlyLossesLastTurn} friendly unit${friendlyLossesLastTurn === 1 ? "" : "s"} lost last turn for the 5 VP comparison condition.`;
  const nonHomeProgress = round < 2
    ? "The 4 VP non-home control condition begins in Round 2."
    : !objectives.known
      ? "Objective control is incomplete; confirm whether you control at least one non-home objective."
      : nonHomeSatisfied
        ? `${objectives.nonHomeControlled} non-home objective${objectives.nonHomeControlled === 1 ? " is" : "s are"} controlled; the mission needs only one for its 4 VP control condition.`
        : "No non-home objective is currently controlled; securing any one can satisfy the 4 VP control condition.";
  const opponentHomeProgress = round < 2
    ? "The 5 VP opponent-home condition begins in Round 2."
    : !objectives.known
      ? "Opponent-home control is not fully known; confirm it before relying on this condition."
      : opponentHomeSatisfied
        ? "The opponent's home objective is currently controlled for the 5 VP end-of-turn condition."
        : "The opponent's home objective is not currently controlled; taking it is worth 5 VP at the applicable end-of-turn check.";

  const reason = basicKillNeeded > 0
    ? nextKillVpLeverage >= 8
      ? "The first enemy unit destroyed this turn can satisfy both the 3 VP destroy condition and the 5 VP kill-comparison condition. Prefer a high-probability finish when the mission trade is otherwise acceptable."
      : "The first enemy unit destroyed this turn is worth 3 VP; prefer a high-probability finish when it does not compromise the objective plan."
    : comparisonKillsNeeded > 0
      ? `${comparisonProgress} Finishing another enemy unit has elevated Primary value.`
      : round >= 2 && nonHomeSatisfied === false
        ? "Kill conditions are currently covered, but Meatgrinder still needs one non-home objective for 4 VP. Establish a durable scoring position rather than collecting extra low-value damage."
        : round >= 3 && opponentHomeSatisfied === false
          ? "Current basic scoring is covered. The opponent's home objective is the remaining 5 VP positional swing and should receive more pressure when the route is credible."
          : "Recorded Meatgrinder conditions are favorable; preserve one non-home scoring position and avoid unnecessary friendly losses that raise next turn's kill-comparison threshold.";

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
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledObjectiveIds: objectives.nonHomeControlledIds,
    nonHomeSatisfied,
    opponentHomeControlled: objectives.opponentHomeControlled,
    opponentHomeControlledObjectiveIds: objectives.opponentHomeControlledIds,
    opponentHomeSatisfied,
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
      killProgress,
      comparisonProgress,
      nonHomeProgress,
      opponentHomeProgress,
      `Recorded current-turn conditions represent up to ${Math.min(15, rawRecordedVp)}/15 Primary VP before timing and player confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Only recorded objective control and destruction events are used.",
      "Meatgrinder needs at least one non-home objective; additional non-home objectives do not add more VP to that condition.",
      "The opponent-home condition is identified from saved objective roles and setup perspective; incomplete role evidence remains player-confirmed.",
      "A unit lost during the opponent's turn raises the next-turn 5 VP kill-comparison threshold, so avoid giving away expendable units without a scoring return."
    ])
  });
}

export function getPrimaryStrategyContext(state, { playerId, perspectivePlayerId = null } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  const mission = resolvePrimaryMission(state, playerId, perspectivePlayerId);
  if (!mission) return inactive("Primary Mission strategy is unavailable until both Force Dispositions are recorded.");
  if (mission.id === "primary-destroyers-wrath") return destroyersWrathContext(state, playerId, mission);
  if (mission.id === "primary-unstoppable-force") return unstoppableForceContext(state, playerId, mission);
  if (mission.id === "primary-meatgrinder") return meatgrinderContext(state, playerId, mission);
  return inactive(`Primary strategy modeling is not yet enabled for ${mission.name}.`, mission);
}

function unstoppableObjectiveSignal(state, playerId, objective, control, purpose, context) {
  if (isHomeObjective(objective)) {
    return Object.freeze({ active: true, score: 0, vpLeverage: 0, reason: "Home objectives do not receive Unstoppable Force non-home scoring value." });
  }

  const round = context.round;
  const controlledNow = control === "controlled" || controlledBy(objective?.control, playerId);
  const newlyEligible = context.turnStartControlKnown && context.eligibleNewControlObjectiveIds.includes(objective.id);
  const newlyControlled = context.newlyControlledNonHomeObjectiveIds.includes(objective.id);
  const central = isCentralObjective(objective);
  let score = round >= 2 ? 0.2 : 0.1;
  let vpLeverage = 0;
  const notes = [];

  if (round >= 2) {
    vpLeverage += 4;
    if (controlledNow) {
      score += purpose === "hold-objective" ? 0.16 : 0.1;
      notes.push("This non-home objective supports the 4 VP control scoring at the next applicable checkpoint.");
    } else {
      score += 0.16;
      notes.push("Taking this non-home objective can improve the 4 VP-per-objective control position at the next applicable checkpoint.");
    }

    if (newlyEligible) {
      vpLeverage += 3;
      if (newlyControlled) {
        score += 0.16;
        notes.push("You did not control it at turn start and control it now, so preserving it protects the 3 VP new-control condition through the scoring check.");
      } else {
        score += 0.18;
        notes.push("You did not control it at turn start, so taking it this turn can satisfy the 3 VP new-control condition.");
      }
    }
  } else {
    notes.push("Round 1 positioning here can set up later non-home control scoring.");
  }

  if (central) {
    const centralBoost = round >= 5 ? 0.2 : round >= 4 ? 0.12 : 0.05;
    score += centralBoost;
    vpLeverage += 5;
    notes.push("It is central, so preserving access also matters for the 5 VP end-of-battle condition.");
  }

  return Object.freeze({
    active: true,
    score: clamp01(score),
    vpLeverage,
    newlyEligible,
    newlyControlled,
    central,
    reason: notes.join(" ")
  });
}

function meatgrinderObjectiveSignal(state, playerId, objective, control, purpose, context) {
  const round = context.round;
  const controlledNow = control === "controlled" || controlledBy(objective?.control, playerId);
  const opponentHome = isOpponentHomeObjective(state, objective, playerId);
  const nonHome = !isHomeObjective(objective) || opponentHome;
  if (!nonHome && !opponentHome) {
    return Object.freeze({ active: true, score: 0, vpLeverage: 0, opponentHome: false, reason: "Your home objective does not directly satisfy a Meatgrinder objective-control condition." });
  }

  let score = round >= 2 ? 0.08 : 0.04;
  let vpLeverage = 0;
  const notes = [];

  if (round >= 2 && nonHome) {
    const thisObjectiveAlreadySupportsCondition = controlledNow && context.nonHomeSatisfied;
    if (!context.nonHomeSatisfied) {
      vpLeverage += 4;
      score += 0.24;
      notes.push("Meatgrinder needs at least one non-home objective for 4 VP, so taking this objective can establish that condition.");
    } else if (thisObjectiveAlreadySupportsCondition) {
      vpLeverage += 4;
      score += purpose === "hold-objective" ? 0.22 : 0.14;
      notes.push("This controlled non-home objective currently supports the 4 VP condition; preserving at least one such objective matters.");
    } else {
      score += 0.02;
      notes.push("You already control a different non-home objective, so taking another does not add VP to Meatgrinder's 4 VP non-home condition by itself.");
    }
  } else if (nonHome) {
    notes.push("Round 1 positioning here can establish the non-home control needed from Round 2 onward.");
  }

  if (opponentHome) {
    if (round >= 2) {
      vpLeverage += 5;
      score += controlledNow ? 0.28 : 0.34;
      notes.push(controlledNow
        ? "This is the opponent's home objective; holding it protects the separate 5 VP end-of-turn condition."
        : "This is the opponent's home objective; taking it can satisfy the separate 5 VP end-of-turn condition.");
    } else {
      score += 0.1;
      notes.push("This is the opponent's home objective; Round 1 pressure can stage the separate 5 VP condition that begins in Round 2.");
    }
  }

  return Object.freeze({
    active: true,
    score: clamp01(score),
    vpLeverage,
    opponentHome,
    reason: notes.join(" ")
  });
}

export function getPrimaryObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = null,
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  }
  const context = primaryStrategy ?? getPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  }

  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  }

  if (context.missionId === "primary-unstoppable-force") {
    return unstoppableObjectiveSignal(state, playerId, objective, control, purpose, context);
  }
  if (context.missionId === "primary-meatgrinder") {
    return meatgrinderObjectiveSignal(state, playerId, objective, control, purpose, context);
  }
  return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
}
