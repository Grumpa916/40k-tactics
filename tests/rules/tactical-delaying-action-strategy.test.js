import test from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getMovementStrategicRecommendations as getBaseMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { move = 6, oc = 2, rosterUnitId = id, battleShocked = false, status = "deployed" } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status,
    position: { x, y },
    battleShocked,
    wounds: status === "destroyed" ? 0 : 5,
    startingStrength: 1,
    currentStrength: status === "destroyed" ? 0 : 1,
    startingWounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function rosterUnit(id, { move = 6, oc = 2, weapons = [] } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons
    }
  };
}

function killEvent(index, turn) {
  return {
    type: "unit.destroyed",
    payload: { turn, unitId: `enemy-${index}`, ownerId: "p2" }
  };
}

function state({
  round = 2,
  phase = "movement",
  centralController = "p1",
  expansionOneController = "p2",
  expansionTwoController = "p2",
  nullObjectiveId = null,
  kills = 0,
  runnerBattleShocked = false,
  runnerOc = 3
} = {}) {
  const turn = round;
  const objectives = [
    objective("event-companion:Attacker Home", "Attacker Home", "p1", 50, 5),
    objective("event-companion:Expansion 1", "Expansion 1", expansionOneController, 18, 14),
    objective("event-companion:Central 1", "Central 1", centralController, 30, 22),
    objective("event-companion:Expansion 2", "Expansion 2", expansionTwoController, 42, 30),
    objective("event-companion:Defender Home", "Defender Home", "p2", 10, 39)
  ];
  if (nullObjectiveId) objectives.find((item) => item.id === nullObjectiveId).control = null;

  const units = [
    unit("runner", "p1", 28, 22, { move: 8, oc: runnerOc, rosterUnitId: "r-runner", battleShocked: runnerBattleShocked }),
    unit("holder", "p1", 30, 22, { move: 6, oc: 3, rosterUnitId: "r-holder" }),
    unit("enemy-live", "p2", 36, 24, { rosterUnitId: "r-enemy" }),
    ...Array.from({ length: kills }, (_, index) => unit(`enemy-${index + 1}`, "p2", 40, 30, { rosterUnitId: `r-enemy-${index + 1}`, status: "destroyed" }))
  ];

  return {
    phase,
    turn,
    activePlayer: "p1",
    battle: { status: "active", round, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Disruption",
        opponentDisposition: "Purge the Foe",
        layout: "A"
      }
    },
    victoryPoints: { p1: 10, p2: 10 },
    commandPoints: { p1: 2, p2: 2 },
    objectives,
    units,
    history: Array.from({ length: kills }, (_, index) => killEvent(index + 1, turn)),
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [
        rosterUnit("r-runner", { move: 8, oc: runnerOc, weapons: [{ name: "Rifle", range: 18, attacks: 2, skill: "3+", strength: 5, ap: -1, damage: 2 }] }),
        rosterUnit("r-holder", { move: 6, oc: 3 })
      ] },
      p2: { units: [
        rosterUnit("r-enemy"),
        ...Array.from({ length: kills }, (_, index) => rosterUnit(`r-enemy-${index + 1}`))
      ] }
    }
  };
}

test("Round 1 Delaying Action scores only two VP per enemy destroyed", () => {
  const context = getPrimaryStrategyContext(state({ round: 1, kills: 3 }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Delaying Action");
  assert.equal(context.enemyKillsThisTurn, 3);
  assert.equal(context.killVp, 6);
  assert.equal(context.controlScoringActive, false);
  assert.equal(context.controlVp, 0);
  assert.equal(context.centralExpansionVp, 0);
  assert.equal(context.rawRecordedVp, 6);
});

test("the non-home control award is binary rather than per objective", () => {
  const one = getPrimaryStrategyContext(state({ centralController: "p1", expansionOneController: "p2", expansionTwoController: "p2" }), { playerId: "p1", perspectivePlayerId: "p1" });
  const three = getPrimaryStrategyContext(state({ centralController: "p1", expansionOneController: "p1", expansionTwoController: "p1" }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(one.nonHomeControlled, 1);
  assert.equal(one.controlVp, 4);
  assert.equal(three.nonHomeControlled, 3);
  assert.equal(three.controlVp, 4);
});

test("central plus expansion scores three VP once even with multiple qualifying objectives", () => {
  const context = getPrimaryStrategyContext(state({ expansionOneController: "p1", expansionTwoController: "p1" }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.centralControlled, 1);
  assert.equal(context.expansionControlled, 2);
  assert.equal(context.centralExpansionSatisfied, true);
  assert.equal(context.centralExpansionVp, 3);
  assert.equal(context.controlVp, 4);
  assert.equal(context.rawRecordedVp, 7);
});

test("central control alone does not satisfy the central-plus-expansion condition", () => {
  const context = getPrimaryStrategyContext(state(), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.centralControlled, 1);
  assert.equal(context.expansionControlled, 0);
  assert.equal(context.centralExpansionSatisfied, false);
  assert.equal(context.centralExpansionVp, 0);
  assert.match(context.reason, /expansion objective/i);
});

test("every live enemy target carries two VP kill leverage before the round cap", () => {
  const context = getPrimaryStrategyContext(state({ phase: "shooting", kills: 1 }), {
    playerId: "p1",
    perspectivePlayerId: "p1",
    targetUnitId: "enemy-live"
  });
  assert.equal(context.killOpportunity.eligibleEnemy, true);
  assert.equal(context.nextKillVpLeverage, 2);
  assert.ok(context.targetingScore >= 0.6);
  assert.match(context.reason, /direct Delaying Action scoring target/i);
});

test("Delaying Action obeys the fifteen VP round cap and suppresses further kill leverage", () => {
  const context = getPrimaryStrategyContext(state({ phase: "shooting", kills: 4, expansionOneController: "p1" }), {
    playerId: "p1",
    perspectivePlayerId: "p1",
    targetUnitId: "enemy-live"
  });
  assert.equal(context.killVp, 8);
  assert.equal(context.controlVp, 4);
  assert.equal(context.centralExpansionVp, 3);
  assert.equal(context.rawRecordedVp, 15);
  assert.equal(context.cappedRecordedVp, 15);
  assert.equal(context.nextKillVpLeverage, 0);
  assert.ok(context.targetingScore <= 0.05);
});

test("extra kills beyond the round cap remain recorded but capped", () => {
  const context = getPrimaryStrategyContext(state({ kills: 5, expansionOneController: "p1" }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.killVp, 10);
  assert.equal(context.rawRecordedVp, 17);
  assert.equal(context.cappedRecordedVp, 15);
});

test("incomplete objective control does not fabricate Delaying Action objective VP", () => {
  const context = getPrimaryStrategyContext(state({ nullObjectiveId: "event-companion:Expansion 2" }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.objectiveStateKnown, false);
  assert.equal(context.controlVp, 0);
  assert.equal(context.centralExpansionVp, 0);
  assert.match(context.summary.join(" "), /Objective control is incomplete/i);
});

test("the home objective carries no Delaying Action mission leverage", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Attacker Home",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(signal.ownHome, true);
  assert.equal(signal.vpLeverage, 0);
  assert.match(signal.reason, /does not satisfy/i);
});

test("Rounds 2-4 Movement does not claim retroactive four VP control leverage", () => {
  const s = state({ round: 3, centralController: "p2", expansionOneController: "p2" });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Central 1",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(context.controlCheckpointTiming, "end-of-command");
  assert.equal(signal.controlVpLeverage, 0);
  assert.equal(signal.nextCheckpointSetup, true);
  assert.match(signal.reason, /Command-phase control checkpoint has already passed/i);
});

test("Round 5 can give a missing non-home objective four VP of same-turn control leverage", () => {
  const s = state({ round: 5, centralController: "p2", expansionOneController: "p2", expansionTwoController: "p2" });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Central 1",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(context.controlCheckpointTiming, "end-of-turn");
  assert.equal(context.controlSatisfied, false);
  assert.equal(signal.controlVpLeverage, 4);
  assert.equal(signal.pairVpLeverage, 0);
  assert.equal(signal.vpLeverage, 4);
});

test("taking the missing expansion completes the three VP end-of-turn pair", () => {
  const s = state({ centralController: "p1", expansionOneController: "p2" });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Expansion 1",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.role, "expansion");
  assert.equal(signal.pairVpLeverage, 3);
  assert.equal(signal.controlVpLeverage, 0);
  assert.match(signal.reason, /complete the 3 VP/i);
});

test("movement advisor retains the missing expansion as a Delaying Action mission option", () => {
  const s = state({ phase: "movement", centralController: "p1", expansionOneController: "p2", expansionTwoController: "p2" });
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy.missionName, "Delaying Action");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  const expansion = options.find((item) => item.objectiveId?.includes("Expansion") && item.primaryStrategySignal?.missionName === "Delaying Action" && item.primaryStrategySignal?.pairVpLeverage === 3);
  assert.ok(expansion, "runner should retain a missing expansion capture among its top Delaying Action options");
});

test("Battle-shocked movement receives no Delaying Action mission elevation", () => {
  const s = state({ phase: "movement", centralController: "p1", expansionOneController: "p2", runnerBattleShocked: true });
  const base = getBaseMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const baseRunner = base.recommendations.find((item) => item.unitId === "runner");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(baseRunner && runner);
  assert.equal(runner.score, baseRunner.score);
  assert.equal(runner.primaryStrategySignal?.missionName, baseRunner.primaryStrategySignal?.missionName);
});

test("zero-OC movement receives no Delaying Action mission elevation", () => {
  const s = state({ phase: "movement", centralController: "p1", expansionOneController: "p2", runnerOc: 0 });
  const base = getBaseMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const baseRunner = base.recommendations.find((item) => item.unitId === "runner");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(baseRunner && runner);
  assert.equal(runner.score, baseRunner.score);
});
