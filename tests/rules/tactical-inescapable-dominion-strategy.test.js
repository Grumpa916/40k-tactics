import test from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getMovementStrategicRecommendations as getBaseMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";
import { enhanceInescapableDominionMovementRecommendations } from "../../src/rules/tactical-inescapable-dominion-movement.js";
import { getTargetStrategicContext } from "../../src/rules/tactical-target-context.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { oc = 2, move = 6, battleShocked = false, rosterUnitId = id } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    position: { x, y },
    battleShocked,
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function rosterUnit(id, { move = 6, oc = 2 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: { characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" }, weapons: [] }
  };
}

function state({
  round = 2,
  phase = "movement",
  controllers = ["p1", "p1", "p2", "p2", null],
  runnerBattleShocked = false
} = {}) {
  const objectives = [
    objective("attacker-home", "Attacker Home", controllers[0], 50, 5),
    objective("expansion-1", "Expansion 1", controllers[1], 18, 12),
    objective("central-1", "Central 1", controllers[2], 30, 22),
    objective("expansion-2", "Expansion 2", controllers[3], 42, 32),
    objective("defender-home", "Defender Home", controllers[4], 10, 39)
  ];
  return {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { status: "active", round, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Take and Hold", opponentDisposition: "Priority Assets", layout: "A" } },
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    objectives,
    units: [
      unit("runner", "p1", 24, 22, { oc: 3, move: 8, battleShocked: runnerBattleShocked, rosterUnitId: "r-runner" }),
      unit("holder", "p1", 18, 12, { oc: 3, move: 6, rosterUnitId: "r-holder" }),
      unit("enemy", "p2", 31, 22, { oc: 2, move: 6, rosterUnitId: "r-enemy" })
    ],
    history: [],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner", { move: 8, oc: 3 }), rosterUnit("r-holder", { move: 6, oc: 3 })] },
      p2: { units: [rosterUnit("r-enemy", { move: 6, oc: 2 })] }
    }
  };
}

test("Round 1 scores only the three-objective end-of-turn threshold", () => {
  const s = state({ round: 1, controllers: ["p1", "p1", "p1", "p2", "p2"] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.missionName, "Inescapable Dominion");
  assert.equal(context.twoObjectiveActive, false);
  assert.equal(context.threeObjectiveSatisfied, true);
  assert.equal(context.threeObjectiveVp, 4);
  assert.equal(context.majorityActive, false);
  assert.equal(context.rawRecordedVp, 4);
});

test("Round 2 recognizes the two-objective threshold without inventing majority or three-objective VP", () => {
  const context = getPrimaryStrategyContext(state(), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.controlledObjectives, 2);
  assert.equal(context.opponentControlledObjectives, 2);
  assert.equal(context.twoObjectiveSatisfied, true);
  assert.equal(context.twoObjectiveVp, 5);
  assert.equal(context.threeObjectiveSatisfied, false);
  assert.equal(context.majoritySatisfied, false);
  assert.equal(context.rawRecordedVp, 5);
});

test("three objectives plus objective majority represent thirteen round VP from Round 2 onward", () => {
  const s = state({ controllers: ["p1", "p1", "p1", "p2", null] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.twoObjectiveVp, 5);
  assert.equal(context.threeObjectiveVp, 4);
  assert.equal(context.majorityVp, 4);
  assert.equal(context.rawRecordedVp, 13);
  assert.equal(context.cappedRecordedVp, 13);
});

test("Round 5 objective swing can cross both the three-objective and majority thresholds", () => {
  const s = state({ round: 5, controllers: ["p1", "p1", "p2", "p2", "p2"] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "central-1",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(context.roundCheckpointTiming, "end-of-turn");
  assert.equal(signal.controlledAfterTake, 3);
  assert.equal(signal.marginAfterTake, 1);
  assert.equal(signal.vpLeverage, 8);
  assert.match(signal.reason, /three-objective threshold/i);
  assert.match(signal.reason, /majority/i);
});

test("opponent home objective adds a separate five VP end-of-battle opportunity", () => {
  const s = state({ round: 5, controllers: ["p1", "p1", "p2", "p2", "p1"] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.opponentHomeControlled, true);
  assert.equal(context.endBattleVp, 5);
  assert.equal(context.rawRecordedVp, 13);
  assert.equal(context.cappedRecordedVp, 13);
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "defender-home",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(signal.opponentHome, true);
  assert.ok(signal.vpLeverage >= 5);
});

test("a two-objective position identifies the third objective as the next direct end-of-turn breakpoint", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "central-1",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.ok(signal.vpLeverage >= 4);
  assert.match(signal.reason, /three-objective threshold/i);
});

test("Inescapable Dominion gives no automatic Primary kill premium", () => {
  const s = state({ phase: "shooting" });
  const context = getTargetStrategicContext(s, { playerId: "p1", targetUnitId: "enemy" });
  assert.equal(context.primaryStrategy.missionName, "Inescapable Dominion");
  assert.equal(context.primaryStrategy.nextKillVpLeverage, 0);
  assert.ok(context.primaryStrategy.targetingScore <= 0.05);
});

test("movement router exposes Inescapable Dominion strategy and retains threshold-aware objective options", () => {
  const s = state();
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy?.missionName, "Inescapable Dominion");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  assert.ok(options.some((item) => item.primaryStrategySignal?.missionName === "Inescapable Dominion"));
});

test("Battle-shocked or zero-usable-OC formations receive no Dominion-specific movement elevation", () => {
  const s = state({ runnerBattleShocked: true });
  const base = getBaseMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const enhanced = enhanceInescapableDominionMovementRecommendations(s, base, { playerId: "p1", perspectivePlayerId: "p1" });
  const before = base.recommendations.find((item) => item.unitId === "runner");
  const after = enhanced.recommendations.find((item) => item.unitId === "runner");
  assert.ok(before && after);
  assert.equal(after.score, before.score);
  assert.equal(after.objectiveId, before.objectiveId);
});
