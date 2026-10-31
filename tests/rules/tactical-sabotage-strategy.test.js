import test from "node:test";
import assert from "node:assert/strict";
import { getMissionActionOptions } from "../../src/rules/mission-action-state.js";
import { getSabotageObjectiveOptions, getSabotageState } from "../../src/rules/sabotage-state.js";
import { getPrimaryObjectiveStrategySignal, getPrimaryStrategyContext } from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";
import { reviewMissionAction } from "../../src/engine/mission-action-transitions.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function rosterUnit(id, { move = 8, oc = 2 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: [{ name: "test gun", type: "ranged", range: "24\"", attacks: 1, skill: "3+", strength: 4, ap: 0, damage: 1 }]
    }
  };
}

function unit(id, ownerId, position, { move = 8, oc = 2, status = "deployed", battleShocked = false } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status,
    battleShocked,
    position: { ...position },
    wounds: status === "destroyed" ? 0 : 5,
    startingStrength: 1,
    currentStrength: status === "destroyed" ? 0 : 1,
    startingWounds: 5,
    metadata: { rosterUnitId: `r-${id}`, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function sabotageAttempt(objectiveId, { round = 2, turn = round, unitId = "runner" } = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-sabotage",
      missionInstanceId: "primary:p1:primary-sabotage",
      missionDefinitionId: "primary-sabotage",
      missionName: "Sabotage — Sabotage",
      reviewTiming: "end-of-turn",
      objectiveId,
      rulesConfirmed: true
    }
  };
}

function sabotageReview({ round = 2, turn = round, unitId = "runner", outcome = "completed" } = {}) {
  return {
    type: "mission_action.reviewed",
    payload: {
      actionKey: `${round}:${turn}:${unitId}`,
      playerId: "p1",
      checkpoint: "end-of-turn",
      outcome,
      missionInstanceId: "primary:p1:primary-sabotage",
      round,
      turn
    }
  };
}

function commandAward(round = 2, amount = 4) {
  return {
    id: `sabotage-command-${round}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId: "primary-sabotage",
      scoringTiming: "command-phase",
      opportunityKey: `${round}:${round}:p1:command-phase`,
      round,
      turn: round,
      scoreBefore: 0,
      scoreAfter: amount
    }
  };
}

function priorPrimaryAwards(total) {
  const result = [];
  let remaining = total;
  let index = 0;
  while (remaining > 0) {
    const amount = Math.min(15, remaining);
    result.push({
      id: `prior-primary-${index}`,
      type: "victory_points.awarded",
      payload: {
        playerId: "p1",
        amount,
        category: "primary",
        missionDefinitionId: `prior-${index}`,
        scoringTiming: "end-of-turn",
        opportunityKey: `prior:${index}`,
        round: index + 1,
        turn: 40 + index,
        scoreBefore: index * 15,
        scoreAfter: index * 15 + amount
      }
    });
    remaining -= amount;
    index += 1;
  }
  return result;
}

function seed({
  round = 2,
  phase = "shooting",
  history = [],
  controls = { home: true, central1: true, central2: false, enemyHome: false },
  runnerBattleShocked = false
} = {}) {
  const map = getEventCompanionMapForForceDispositions("Priority Assets", "Priority Assets", "A");
  assert.ok(map, "Sabotage Layout A geometry must exist");
  const attackerHome = map.objectivePositions["Attacker Home"];
  const defenderHome = map.objectivePositions["Defender Home"];
  const central1 = map.objectivePositions["Central 1"];
  const central2 = map.objectivePositions["Central 2"];
  assert.ok(attackerHome && defenderHome && central1 && central2, "Sabotage Layout A objectives must use catalog geometry");

  const objectives = [
    { id: "home-p1", name: "Attacker Home", layoutObjective: "Attacker Home", position: { ...attackerHome }, control: control(controls.home ? "p1" : null) },
    { id: "central-1", name: "Central 1", layoutObjective: "Central 1", position: { ...central1 }, control: control(controls.central1 ? "p1" : null) },
    { id: "central-2", name: "Central 2", layoutObjective: "Central 2", position: { ...central2 }, control: control(controls.central2 ? "p1" : "p2") },
    { id: "home-p2", name: "Defender Home", layoutObjective: "Defender Home", position: { ...defenderHome }, control: control(controls.enemyHome ? "p1" : "p2") }
  ];
  const units = [
    unit("runner", "p1", central1, { battleShocked: runnerBattleShocked }),
    unit("runner-two", "p1", central2),
    unit("runner-three", "p1", defenderHome),
    unit("home-guard", "p1", attackerHome),
    unit("enemy", "p2", defenderHome)
  ];
  return {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Priority Assets", opponentDisposition: "Priority Assets", layout: "A" } },
    objectives,
    units,
    history: [...history],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner"), rosterUnit("r-runner-two"), rosterUnit("r-runner-three"), rosterUnit("r-home-guard")] },
      p2: { units: [rosterUnit("r-enemy")] }
    }
  };
}

function strategy(state) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1" });
}

test("Sabotage routes to its dedicated strategy and picker lists non-home objectives with territory value", () => {
  const state = seed();
  const result = strategy(state);
  assert.equal(result.missionId, "primary-sabotage");
  assert.equal(result.actionAvailableThisTurn, undefined);
  assert.equal(result.objectiveOptions.some((item) => item.objectiveId === "home-p1"), false);
  assert.equal(result.objectiveOptions.length, 3);

  const options = getSabotageObjectiveOptions(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(options.some((item) => item.objectiveId === "home-p1"), false);
  assert.equal(options.some((item) => item.objectiveId === "home-p2"), true);
  const enemyTerritory = options.find((item) => item.objectiveId === "home-p2");
  assert.equal(enemyTerritory?.enemyTerritory, true);
  assert.equal(enemyTerritory?.potentialVp, 5);

  const html = createMissionActionPicker().render(state, "runner");
  assert.match(html, /Objective to Sabotage/);
  assert.match(html, /different non-home objective/i);
  assert.match(html, /5 VP/);
});

test("multiple Sabotage attempts may start in one Shooting phase but each must use a different objective", () => {
  let state = seed();
  state = recordShootingActivation(state, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-sabotage",
    missionInstanceId: "primary:p1:primary-sabotage",
    objectiveId: "central-1",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });

  const afterFirst = getSabotageState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.deepEqual(afterFirst.reservedObjectiveIds, ["central-1"]);
  assert.equal(afterFirst.actionAvailableThisTurn, true);
  assert.equal(getSabotageObjectiveOptions(state, { playerId: "p1" }).some((item) => item.objectiveId === "central-1"), false);
  assert.equal(getMissionActionOptions(state, "p1").some((item) => item.definitionId === "primary-sabotage"), true);

  assert.throws(() => recordShootingActivation(state, {
    unitId: "runner-two",
    actionType: "mission_action",
    actionId: "primary-sabotage",
    missionInstanceId: "primary:p1:primary-sabotage",
    objectiveId: "central-1",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  }), /different non-home objective/i);

  state = recordShootingActivation(state, {
    unitId: "runner-two",
    actionType: "mission_action",
    actionId: "primary-sabotage",
    missionInstanceId: "primary:p1:primary-sabotage",
    objectiveId: "central-2",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });
  assert.deepEqual(new Set(getSabotageState(state, { playerId: "p1" }).reservedObjectiveIds), new Set(["central-1", "central-2"]));
});

test("Sabotage review requires the selected objective to be controlled and the acting unit to remain deployed", () => {
  const action = sabotageAttempt("central-1");
  const completed = reviewMissionAction(seed({ phase: "end_turn", history: [action] }), {
    actionKey: "2:2:runner",
    playerId: "p1",
    checkpoint: "end-of-turn",
    outcome: "completed"
  });
  assert.equal(completed.history.at(-1)?.type, "mission_action.reviewed");
  assert.equal(completed.history.at(-1)?.payload?.outcome, "completed");

  const noControl = seed({
    phase: "end_turn",
    history: [action],
    controls: { home: true, central1: false, central2: false, enemyHome: false }
  });
  assert.throws(() => reviewMissionAction(noControl, {
    actionKey: "2:2:runner",
    playerId: "p1",
    checkpoint: "end-of-turn",
    outcome: "completed"
  }), /control the selected objective/i);

  const destroyed = seed({ phase: "end_turn", history: [action] });
  destroyed.units = destroyed.units.map((item) => item.id === "runner" ? { ...item, status: "destroyed", wounds: 0 } : item);
  assert.throws(() => reviewMissionAction(destroyed, {
    actionKey: "2:2:runner",
    playerId: "p1",
    checkpoint: "end-of-turn",
    outcome: "completed"
  }), /acting unit remains on the battlefield/i);
});

test("completed Sabotage Actions score 3 VP each plus 2 VP for each enemy-territory completion", () => {
  const state = seed({
    phase: "end_turn",
    controls: { home: true, central1: true, central2: false, enemyHome: true },
    history: [
      sabotageAttempt("central-1", { unitId: "runner" }),
      sabotageReview({ unitId: "runner" }),
      sabotageAttempt("home-p2", { unitId: "runner-three" }),
      sabotageReview({ unitId: "runner-three" })
    ]
  });
  const sabotage = getSabotageState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(sabotage.completedThisTurnCount, 2);
  assert.equal(sabotage.enemyTerritoryCompletedCount, 1);
  assert.equal(sabotage.actionRawVp, 8);
  assert.equal(strategy(state).actionRawVp, 8);
});

test("Round 2 Command projects the binary 4 VP non-home condition and locks the recorded checkpoint afterward", () => {
  const atCommand = seed({ round: 2, phase: "command" });
  const commandResult = strategy(atCommand);
  assert.equal(commandResult.controlVpForProjection, 4);
  assert.equal(commandResult.commandCheckpointCompleted, false);

  const afterCommand = seed({
    round: 2,
    phase: "movement",
    history: [commandAward(2, 4)],
    controls: { home: true, central1: false, central2: false, enemyHome: false }
  });
  const locked = strategy(afterCommand);
  assert.equal(locked.commandCheckpointCompleted, true);
  assert.equal(locked.commandAwardAmount, 4);
  assert.equal(locked.controlVpForProjection, 4);
});

test("Round 5 uses the live end-of-turn non-home control state", () => {
  const state = seed({ round: 5, phase: "end_turn", controls: { home: true, central1: true, central2: false, enemyHome: false } });
  const result = strategy(state);
  assert.equal(result.commandCheckpointCompleted, false);
  assert.equal(result.controlVpForProjection, 4);
});

test("Sabotage projection respects the 15 VP battle-round cap across completed and additional Actions", () => {
  const state = seed({
    round: 2,
    phase: "shooting",
    history: [
      commandAward(2, 4),
      sabotageAttempt("central-1", { unitId: "runner" }),
      sabotageReview({ unitId: "runner" }),
      sabotageAttempt("home-p2", { unitId: "runner-three" }),
      sabotageReview({ unitId: "runner-three" })
    ],
    controls: { home: true, central1: true, central2: false, enemyHome: true }
  });
  const result = strategy(state);
  assert.equal(result.controlVpForProjection, 4);
  assert.equal(result.actionRawVp, 8);
  assert.equal(result.cappedAdvisoryVp, 12);
  assert.equal(result.nextActionVpLeverage, 3);
});

test("45 VP Primary cap suppresses additional Sabotage leverage", () => {
  const state = seed({ round: 3, phase: "movement", history: priorPrimaryAwards(45) });
  const result = strategy(state);
  assert.equal(result.remainingPrimaryGameVp, 0);
  assert.equal(result.additionalPrimaryAllowance, 0);
  assert.equal(result.pendingActionVpLeverage, 0);
  assert.equal(result.nextActionVpLeverage, 0);
  assert.equal(result.objectivePreservationScore <= 0.15, true);
  assert.match(result.reason, /45 VP Primary game cap/);
});

test("Sabotage objective signal does not invent Action leverage after the remaining game allowance is covered", () => {
  const state = seed({
    round: 4,
    phase: "shooting",
    history: [
      ...priorPrimaryAwards(42),
      sabotageAttempt("central-1", { round: 4, turn: 4, unitId: "runner" }),
      sabotageReview({ round: 4, turn: 4, unitId: "runner" })
    ]
  });
  const result = strategy(state);
  assert.equal(result.remainingPrimaryGameVp, 3);
  assert.equal(result.cappedAdvisoryVp, 3);
  assert.equal(result.nextActionVpLeverage, 0);

  const signal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "home-p2"
  });
  assert.equal(signal.eligibleForAction, true);
  assert.equal(signal.actionRawVp, 5);
  assert.equal(signal.actionVpLeverage, 0);
});

test("Sabotage objective signals prioritize pending and enemy-territory Action value", () => {
  const pendingState = seed({
    round: 5,
    phase: "movement",
    history: [sabotageAttempt("home-p2", { round: 5, turn: 5, unitId: "runner-three" })],
    controls: { home: true, central1: true, central2: false, enemyHome: true }
  });
  const signal = getPrimaryObjectiveStrategySignal(pendingState, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "home-p2"
  });
  assert.equal(signal.active, true);
  assert.equal(signal.pending, true);
  assert.equal(signal.enemyTerritory, true);
  assert.equal(signal.actionRawVp, 5);
  assert.match(signal.reason, /pending Sabotage|enemy-territory/i);
});

test("Sabotage movement routing exposes Action destinations and suppresses control-dependent elevation for Battle-shocked units", () => {
  const normal = seed({ round: 2, phase: "movement", controls: { home: true, central1: false, central2: false, enemyHome: false } });
  const movement = getMovementStrategicRecommendations(normal, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(movement.primaryStrategy?.missionId, "primary-sabotage");
  const choices = movement.recommendations.flatMap((item) => [item, ...(item.alternatives ?? [])]);
  assert.equal(choices.some((item) => item.primaryStrategySignal?.eligibleForAction === true), true);
  assert.equal(choices.some((item) => item.primaryStrategySignal?.enemyTerritory === true), true);

  const shocked = seed({
    round: 5,
    phase: "movement",
    runnerBattleShocked: true,
    controls: { home: true, central1: false, central2: false, enemyHome: false }
  });
  const shockedMovement = getMovementStrategicRecommendations(shocked, { playerId: "p1", perspectivePlayerId: "p1" });
  const runnerChoices = shockedMovement.recommendations
    .filter((item) => item.unitId === "runner")
    .flatMap((item) => [item, ...(item.alternatives ?? [])])
    .filter((item) => item.primaryStrategySignal?.actionVpLeverage > 0 || item.primaryStrategySignal?.controlVpLeverage > 0);
  assert.ok(runnerChoices.length > 0);
  assert.equal(runnerChoices.every((item) => item.score <= 0.22 || item.effectiveOc !== 0), true);
});