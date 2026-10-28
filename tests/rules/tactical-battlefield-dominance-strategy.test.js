import test from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getTargetStrategicContext } from "../../src/rules/tactical-target-context.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { move = 6, oc = 2, rosterUnitId = id } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    position: { x, y },
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
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

function state({ round = 2, phase = "movement", homeController = "p1" } = {}) {
  return {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { status: "active", round, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Take and Hold",
        opponentDisposition: "Take and Hold",
        layout: "A"
      }
    },
    victoryPoints: { p1: 10, p2: 10 },
    commandPoints: { p1: 2, p2: 2 },
    objectives: [
      objective("event-companion:Attacker Home", "Attacker Home", homeController, 8, 22),
      objective("event-companion:Expansion 1", "Expansion 1", "p1", 20, 22),
      objective("event-companion:Central 1", "Central 1", "p1", 30, 22),
      objective("event-companion:Central 2", "Central 2", "p2", 36, 22),
      objective("event-companion:Expansion 2", "Expansion 2", "p2", 44, 22),
      objective("event-companion:Defender Home", "Defender Home", null, 52, 22)
    ],
    units: [
      unit("runner", "p1", 12, 22, { move: 8, oc: 3, rosterUnitId: "r-runner" }),
      unit("holder", "p1", 20, 22, { move: 6, oc: 3, rosterUnitId: "r-holder" }),
      unit("target", "p2", 34, 22, { move: 6, oc: 2, rosterUnitId: "r-target" })
    ],
    history: [],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: [
        rosterUnit("r-runner", { move: 8, oc: 3, weapons: [{ name: "Rifle", range: 18, attacks: 2, skill: "3+", strength: 5, ap: -1, damage: 2 }] }),
        rosterUnit("r-holder", { move: 6, oc: 3 })
      ] },
      p2: { units: [rosterUnit("r-target")] }
    }
  };
}

test("Battlefield Dominance models the Round 2 majority and home multiplier together", () => {
  const context = getPrimaryStrategyContext(state(), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Battlefield Dominance");
  assert.equal(context.controlledObjectives, 3);
  assert.equal(context.opponentControlledObjectives, 2);
  assert.equal(context.majoritySatisfied, true);
  assert.equal(context.majorityVp, 2);
  assert.equal(context.playerHomeControlled, true);
  assert.equal(context.nonHomeControlled, 2);
  assert.equal(context.baseObjectiveVp, 9);
  assert.equal(context.homeBonusVp, 4);
  assert.equal(context.rawRecordedVp, 15);
  assert.equal(context.cappedRecordedVp, 15);
  assert.match(context.summary.join(" "), /two pressures|final 2 VP objective-majority/i);
});

test("losing the home objective exposes its multiplier value", () => {
  const s = state({ homeController: "p2" });
  s.objectives.find((item) => item.layoutObjective === "Expansion 2").control = control(null);
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.controlledObjectives, 2);
  assert.equal(context.opponentControlledObjectives, 2);
  assert.equal(context.playerHomeControlled, false);
  assert.equal(context.homeBonusVp, 0);
  assert.equal(context.homeRestoreVpLeverage, 7);
  assert.equal(context.rawRecordedVp, 6);
  assert.match(context.reason, /7 VP|Recovering your home objective/i);

  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Attacker Home",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.active, true);
  assert.equal(signal.ownHome, true);
  assert.equal(signal.vpLeverage, 9);
  assert.ok(signal.score >= 0.5);
  assert.match(signal.reason, /unlock 4 VP|multiplier/i);
  assert.match(signal.reason, /2 VP end-of-turn objective-majority/i);
});

test("Round 1 uses only the objective-majority scoring condition", () => {
  const context = getPrimaryStrategyContext(state({ round: 1 }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.objectiveScoringActive, false);
  assert.equal(context.baseObjectiveVp, 0);
  assert.equal(context.homeBonusVp, 0);
  assert.equal(context.majoritySatisfied, true);
  assert.equal(context.rawRecordedVp, 2);
  assert.equal(context.nextKillVpLeverage, 0);
  assert.match(context.summary.join(" "), /only Battlefield Dominance scoring window is 2 VP/i);
});

test("Round 5 moves per-objective scoring to end of turn and drops the majority VP", () => {
  const context = getPrimaryStrategyContext(state({ round: 5 }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.objectiveCheckpointTiming, "end-of-turn");
  assert.equal(context.majorityRelevant, false);
  assert.equal(context.majorityVp, 0);
  assert.equal(context.rawRecordedVp, 13);
  assert.match(context.reason, /Round 5 scores at end of turn/i);
});

test("a non-home objective is worth five VP while the home multiplier is active", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Central 2",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.ownHome, false);
  assert.ok(signal.vpLeverage >= 5);
  assert.match(signal.reason, /worth 5 VP/i);
});

test("Battlefield Dominance gives enemy kills no direct Primary premium", () => {
  const s = state({ phase: "shooting" });
  const strategic = getTargetStrategicContext(s, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId: "target" });
  assert.equal(strategic.primaryStrategy.active, true);
  assert.equal(strategic.primaryStrategy.missionName, "Battlefield Dominance");
  assert.equal(strategic.primaryStrategy.nextKillVpLeverage, 0);
  assert.ok(strategic.primaryStrategy.targetingScore <= 0.1);
  assert.match(strategic.primaryStrategy.assumptions.join(" "), /no direct kill-scoring condition/i);
});

test("movement advisor can elevate recovery of the home objective", () => {
  const s = state({ homeController: "p2" });
  s.objectives.find((item) => item.layoutObjective === "Expansion 2").control = control(null);
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy.missionName, "Battlefield Dominance");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  const homeOption = options.find((item) => item.primaryStrategySignal?.ownHome);
  assert.ok(homeOption, "runner should retain the home objective among its top Battlefield Dominance options");
  assert.ok(homeOption.primaryStrategySignal.vpLeverage >= 7);
  assert.match(homeOption.reason, /home objective|multiplier/i);
});
