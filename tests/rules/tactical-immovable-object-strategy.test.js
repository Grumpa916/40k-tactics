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

function state({ round = 2, phase = "movement", centralOne = "p1", centralTwo = "p2" } = {}) {
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
        opponentDisposition: "Purge the Foe",
        layout: "A"
      }
    },
    victoryPoints: { p1: 10, p2: 10 },
    commandPoints: { p1: 2, p2: 2 },
    objectives: [
      objective("event-companion:Attacker Home", "Attacker Home", "p1", 8, 22),
      objective("event-companion:Expansion 1", "Expansion 1", "p1", 20, 22),
      objective("event-companion:Central 1", "Central 1", centralOne, 30, 22),
      objective("event-companion:Central 2", "Central 2", centralTwo, 36, 22),
      objective("event-companion:Expansion 2", "Expansion 2", "p2", 44, 22),
      objective("event-companion:Defender Home", "Defender Home", null, 52, 22)
    ],
    units: [
      unit("runner", "p1", 27, 22, { move: 8, oc: 3, rosterUnitId: "r-runner" }),
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

test("Immovable Object combines one central award with five VP per controlled non-home objective", () => {
  const context = getPrimaryStrategyContext(state(), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Immovable Object");
  assert.equal(context.centralControlled, 1);
  assert.equal(context.centralConditionSatisfied, true);
  assert.equal(context.centralVp, 3);
  assert.equal(context.nonHomeControlled, 2);
  assert.equal(context.nonHomeVp, 10);
  assert.equal(context.rawRecordedVp, 13);
  assert.equal(context.cappedRecordedVp, 13);
  assert.match(context.summary.join(" "), /central objective|5 VP each/i);
});

test("the sole controlled central objective carries eight VP of combined mission leverage from Round 2", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Central 1",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(signal.central, true);
  assert.equal(signal.ownHome, false);
  assert.equal(signal.vpLeverage, 8);
  assert.match(signal.reason, /5 VP|only controlled central|3 VP/i);
});

test("a second central objective does not invent a second three VP central award", () => {
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
  assert.equal(signal.central, true);
  assert.equal(signal.vpLeverage, 5);
  assert.match(signal.reason, /already supported by another controlled central objective|does not add a second 3 VP/i);
});

test("the home objective has no direct Immovable Object VP leverage", () => {
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
  assert.match(signal.reason, /excluded|no direct Primary VP/i);
});

test("Round 1 scores only the central condition while non-home positions prepare Round 2", () => {
  const context = getPrimaryStrategyContext(state({ round: 1 }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.nonHomeScoringActive, false);
  assert.equal(context.nonHomeVp, 0);
  assert.equal(context.centralVp, 3);
  assert.equal(context.rawRecordedVp, 3);
  assert.match(context.reason, /Protect at least one central objective|Round 2/i);
});

test("Round 5 central capture can carry eight VP at one end-of-turn checkpoint and respects the round cap", () => {
  const s = state({ round: 5, centralOne: "p2", centralTwo: null });
  s.objectives.find((item) => item.layoutObjective === "Expansion 2").control = control("p1");
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.nonHomeCheckpointTiming, "end-of-turn");
  assert.equal(context.centralConditionSatisfied, false);
  assert.equal(context.nonHomeControlled, 2);
  assert.equal(context.rawRecordedVp, 10);

  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Central 1",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.vpLeverage, 8);
  assert.match(signal.reason, /Round 5|5 VP|3 VP/i);

  s.objectives.find((item) => item.layoutObjective === "Central 1").control = control("p1");
  const capped = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(capped.rawRecordedVp, 18);
  assert.equal(capped.cappedRecordedVp, 15);
});

test("Immovable Object gives enemy kills no direct Primary premium", () => {
  const s = state({ phase: "shooting" });
  const strategic = getTargetStrategicContext(s, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId: "target" });
  assert.equal(strategic.primaryStrategy.active, true);
  assert.equal(strategic.primaryStrategy.missionName, "Immovable Object");
  assert.equal(strategic.primaryStrategy.nextKillVpLeverage, 0);
  assert.ok(strategic.primaryStrategy.targetingScore <= 0.1);
  assert.match(strategic.primaryStrategy.assumptions.join(" "), /no direct kill-scoring condition/i);
});

test("movement advisor elevates central objective mission leverage and does not elevate the home objective", () => {
  const s = state({ centralOne: "p2", centralTwo: null });
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy.missionName, "Immovable Object");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  const centralOption = options.find((item) => item.primaryStrategySignal?.central);
  assert.ok(centralOption, "runner should retain a central objective among its top Immovable Object options");
  assert.ok(centralOption.primaryStrategySignal.vpLeverage >= 8);
  assert.match(centralOption.reason, /central|3 VP/i);
  assert.equal(options.some((item) => item.primaryStrategySignal?.ownHome && item.primaryStrategySignal.vpLeverage > 0), false);
});
