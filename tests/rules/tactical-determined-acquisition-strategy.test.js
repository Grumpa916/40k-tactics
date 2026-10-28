import test from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getMovementStrategicRecommendations as getBaseMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";
import { getTargetStrategicContext } from "../../src/rules/tactical-target-context.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y = 22) {
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { move = 6, oc = 2, rosterUnitId = id, battleShocked = false } = {}) {
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

function snapshotObjective(id, controllerId) {
  return { id, control: control(controllerId) };
}

function state({ round = 2, phase = "movement", expansionTwo = "p1", includeSnapshot = true, runnerBattleShocked = false } = {}) {
  const turn = round;
  const objectives = [
    objective("event-companion:Attacker Home", "Attacker Home", "p1", 52),
    objective("event-companion:Expansion 1", "Expansion 1", "p1", 42),
    objective("event-companion:Central 1", "Central 1", "p2", 34),
    objective("event-companion:Central 2", "Central 2", "p2", 26),
    objective("event-companion:Expansion 2", "Expansion 2", expansionTwo, 18),
    objective("event-companion:Defender Home", "Defender Home", "p2", 8)
  ];
  const startObjectives = [
    snapshotObjective("event-companion:Attacker Home", "p1"),
    snapshotObjective("event-companion:Expansion 1", "p1"),
    snapshotObjective("event-companion:Central 1", "p2"),
    snapshotObjective("event-companion:Central 2", "p2"),
    snapshotObjective("event-companion:Expansion 2", "p2"),
    snapshotObjective("event-companion:Defender Home", "p2")
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
        myDisposition: "Take and Hold",
        opponentDisposition: "Disruption",
        layout: "A"
      }
    },
    victoryPoints: { p1: 10, p2: 10 },
    commandPoints: { p1: 2, p2: 2 },
    objectives,
    units: [
      unit("runner", "p1", 22, 22, { move: 8, oc: 3, rosterUnitId: "r-runner", battleShocked: runnerBattleShocked }),
      unit("holder", "p1", 42, 22, { move: 6, oc: 3, rosterUnitId: "r-holder" }),
      unit("target", "p2", 17, 22, { move: 6, oc: 2, rosterUnitId: "r-target" })
    ],
    history: [],
    scoring: {
      turnSnapshots: includeSnapshot ? [{ turn, playerId: "p1", objectives: startObjectives }] : [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [
        rosterUnit("r-runner", { move: 8, oc: 3, weapons: [{ name: "Rifle", range: 18, attacks: 2, skill: "3+", strength: 5, ap: -1, damage: 2 }] }),
        rosterUnit("r-holder", { move: 6, oc: 3 })
      ] },
      p2: { units: [rosterUnit("r-target")] }
    }
  };
}

test("Determined Acquisition combines acquisition, control, and enemy-territory value", () => {
  const context = getPrimaryStrategyContext(state(), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Determined Acquisition");
  assert.equal(context.turnStartKnown, true);
  assert.deepEqual(context.newlyControlledObjectiveIds, ["event-companion:Expansion 2"]);
  assert.equal(context.acquisitionVp, 2);
  assert.equal(context.controlledObjectives, 3);
  assert.equal(context.baseControlVp, 9);
  assert.equal(context.enemyTerritoryControlled, 1);
  assert.deepEqual(context.enemyTerritoryControlledObjectiveIds, ["event-companion:Expansion 2"]);
  assert.equal(context.enemyTerritoryBonusVp, 3);
  assert.equal(context.rawRecordedVp, 14);
  assert.equal(context.cappedRecordedVp, 14);
});

test("a newly acquired enemy-territory objective carries eight VP of combined leverage", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Expansion 2",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(signal.enemyTerritory, true);
  assert.equal(signal.acquisitionEligible, true);
  assert.equal(signal.acquisitionAlreadySecured, true);
  assert.equal(signal.acquisitionVpLeverage, 2);
  assert.equal(signal.checkpointVpLeverage, 6);
  assert.equal(signal.vpLeverage, 8);
  assert.match(signal.reason, /2 VP acquisition|enemy territory|another 3 VP/i);
});

test("an objective controlled at turn start has no acquisition award", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Expansion 1",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(signal.startedControlled, true);
  assert.equal(signal.acquisitionEligible, false);
  assert.equal(signal.acquisitionVpLeverage, 0);
  assert.equal(signal.checkpointVpLeverage, 3);
  assert.equal(signal.vpLeverage, 3);
  assert.match(signal.reason, /already controlled this objective at turn start/i);
});

test("the home objective can score control VP but is excluded from acquisition VP", () => {
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
  assert.equal(signal.acquisitionVpLeverage, 0);
  assert.equal(signal.checkpointVpLeverage, 3);
  assert.equal(signal.vpLeverage, 3);
  assert.match(signal.reason, /home objective is excluded from the 2 VP/i);
});

test("Round 1 scores only newly acquired non-home objectives", () => {
  const context = getPrimaryStrategyContext(state({ round: 1 }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.controlScoringActive, false);
  assert.equal(context.baseControlVp, 0);
  assert.equal(context.enemyTerritoryBonusVp, 0);
  assert.equal(context.acquisitionVp, 2);
  assert.equal(context.rawRecordedVp, 2);
  assert.match(context.reason, /Round 1 is an acquisition race/i);
});

test("Round 5 makes a newly acquired enemy-territory objective an eight VP same-turn play", () => {
  const s = state({ round: 5 });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.controlCheckpointTiming, "end-of-turn");
  assert.equal(context.rawRecordedVp, 14);
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Expansion 2",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(signal.vpLeverage, 8);
  assert.match(signal.reason, /Round 5 resolves both components|8 VP of same-turn leverage/i);
});

test("territory-boundary objectives do not receive an automatic enemy-territory bonus", () => {
  const s = state();
  const boundary = s.objectives.find((item) => item.layoutObjective === "Central 2");
  boundary.position.x = 30;
  boundary.control = control("p1");
  const start = s.scoring.turnSnapshots[0].objectives.find((item) => item.id === boundary.id);
  start.control = control("p1");
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.ok(context.territoryUncertainControlledObjectiveIds.includes(boundary.id));
  assert.equal(context.enemyTerritoryControlled, 1);
  assert.equal(context.enemyTerritoryBonusVp, 3);
  assert.equal(context.rawRecordedVp, 17);
  assert.equal(context.cappedRecordedVp, 15);
});

test("missing turn-start evidence keeps acquisition VP player-confirmed", () => {
  const context = getPrimaryStrategyContext(state({ includeSnapshot: false }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.turnStartKnown, false);
  assert.equal(context.acquisitionVp, 0);
  assert.match(context.reason, /turn-start snapshot is unavailable/i);
  assert.match(context.summary.join(" "), /confirm which non-home objectives/i);
});

test("Determined Acquisition gives enemy kills no direct Primary premium", () => {
  const s = state({ phase: "shooting" });
  const strategic = getTargetStrategicContext(s, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId: "target" });
  assert.equal(strategic.primaryStrategy.active, true);
  assert.equal(strategic.primaryStrategy.missionName, "Determined Acquisition");
  assert.equal(strategic.primaryStrategy.nextKillVpLeverage, 0);
  assert.ok(strategic.primaryStrategy.targetingScore <= 0.1);
  assert.match(strategic.primaryStrategy.assumptions.join(" "), /no direct kill-scoring condition/i);
});

test("movement advisor elevates an eligible enemy-territory acquisition", () => {
  const s = state({ expansionTwo: "p2" });
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy.missionName, "Determined Acquisition");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  const acquisition = options.find((item) => item.objectiveId === "event-companion:Expansion 2" && item.primaryStrategySignal?.missionName === "Determined Acquisition");
  assert.ok(acquisition, "runner should retain the nearby enemy-territory acquisition among its top options");
  assert.equal(acquisition.primaryStrategySignal.acquisitionEligible, true);
  assert.equal(acquisition.primaryStrategySignal.enemyTerritory, true);
  assert.equal(acquisition.primaryStrategySignal.vpLeverage, 8);
  assert.match(acquisition.reason, /2 VP acquisition|enemy territory/i);
});

test("Battle-shocked movement does not receive Determined Acquisition mission elevation", () => {
  const s = state({ round: 5, expansionTwo: "p2", runnerBattleShocked: true });
  const base = getBaseMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const baseRunner = base.recommendations.find((item) => item.unitId === "runner");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(baseRunner);
  assert.ok(runner);
  assert.equal(runner.effectiveOc, 0);
  assert.equal(runner.battleShocked, true);
  assert.equal(runner.score, baseRunner.score);
  assert.equal(runner.objectiveId, baseRunner.objectiveId);
  assert.equal(runner.recommendation, baseRunner.recommendation);
});
