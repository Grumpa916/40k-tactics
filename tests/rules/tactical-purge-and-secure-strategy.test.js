import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

function unit(id, ownerId, x, y, { move = 6, oc = 2, rosterUnitId = id, battleShocked = false, status = "deployed", wounds = 5 } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status,
    position: { x, y },
    battleShocked,
    wounds,
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

function snapshotObjective(id, controllerId) {
  return { id, control: control(controllerId) };
}

function killEvent({ turn = 2, targetId = "near-target", attackerId = "runner" } = {}) {
  return {
    type: "combat.attack_resolved",
    payload: {
      turn,
      phase: "shooting",
      attackerId,
      targetId,
      targetOwnerId: "p2",
      stateDelta: { target: { unitId: targetId, statusBefore: "deployed", statusAfter: "destroyed" } }
    }
  };
}

function state({
  round = 2,
  phase = "movement",
  centralController = "p1",
  expansionTwoController = "p2",
  includeSnapshot = true,
  runnerBattleShocked = false,
  history = []
} = {}) {
  const turn = round;
  const objectives = [
    objective("event-companion:Attacker Home", "Attacker Home", "p1", 50, 5),
    objective("event-companion:Expansion 1", "Expansion 1", "p1", 15, 12),
    objective("event-companion:Central 1", "Central 1", centralController, 30, 22),
    objective("event-companion:Expansion 2", "Expansion 2", expansionTwoController, 45, 32),
    objective("event-companion:Defender Home", "Defender Home", "p2", 10, 39)
  ];
  const startObjectives = [
    snapshotObjective("event-companion:Attacker Home", "p1"),
    snapshotObjective("event-companion:Expansion 1", "p1"),
    snapshotObjective("event-companion:Central 1", "p2"),
    snapshotObjective("event-companion:Expansion 2", "p2"),
    snapshotObjective("event-companion:Defender Home", "p2")
  ];
  const units = [
    unit("runner", "p1", 15, 12, { move: 8, oc: 3, rosterUnitId: "r-runner", battleShocked: runnerBattleShocked }),
    unit("holder", "p1", 15, 12, { move: 6, oc: 3, rosterUnitId: "r-holder" }),
    unit("far-attacker", "p1", 36, 4, { move: 6, oc: 2, rosterUnitId: "r-far" }),
    unit("near-target", "p2", 30, 22, { move: 6, oc: 2, rosterUnitId: "r-near-target", status: history.some((event) => event?.payload?.targetId === "near-target") ? "destroyed" : "deployed", wounds: history.some((event) => event?.payload?.targetId === "near-target") ? 0 : 5 }),
    unit("far-target", "p2", 38, 40, { move: 6, oc: 2, rosterUnitId: "r-far-target" })
  ];
  const snapshotUnits = units.map((item) => ({
    id: item.id,
    ownerId: item.ownerId,
    status: "deployed",
    wounds: 5,
    position: item.id === "near-target" ? { x: 30, y: 22 } : { ...item.position }
  }));

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
        opponentDisposition: "Reconnaissance",
        layout: "A"
      }
    },
    victoryPoints: { p1: 10, p2: 10 },
    commandPoints: { p1: 2, p2: 2 },
    objectives,
    units,
    history,
    scoring: {
      turnSnapshots: includeSnapshot ? [{ turn, playerId: "p1", objectives: startObjectives, units: snapshotUnits }] : [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [
        rosterUnit("r-runner", { move: 8, oc: 3, weapons: [{ name: "Rifle", range: 18, attacks: 2, skill: "3+", strength: 5, ap: -1, damage: 2 }] }),
        rosterUnit("r-holder", { move: 6, oc: 3 }),
        rosterUnit("r-far", { move: 6, oc: 2 })
      ] },
      p2: { units: [rosterUnit("r-near-target"), rosterUnit("r-far-target")] }
    }
  };
}

test("Purge and Secure combines non-home control with one new-capture award", () => {
  const context = getPrimaryStrategyContext(state(), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Purge and Secure");
  assert.equal(context.nonHomeControlled, 2);
  assert.equal(context.controlVp, 8);
  assert.equal(context.acquisitionSatisfied, true);
  assert.deepEqual(context.newlyControlledObjectiveIds, ["event-companion:Central 1"]);
  assert.equal(context.acquisitionVp, 3);
  assert.equal(context.killVp, 0);
  assert.equal(context.rawRecordedVp, 11);
});

test("multiple new non-home objectives still produce only one three VP acquisition award", () => {
  const context = getPrimaryStrategyContext(state({ expansionTwoController: "p1" }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.newlyControlledObjectiveIds.length, 2);
  assert.equal(context.acquisitionVp, 3);
  assert.equal(context.controlVp, 12);
  assert.equal(context.rawRecordedVp, 15);
  assert.equal(context.cappedRecordedVp, 15);
});

test("the home objective is excluded from Purge and Secure control and acquisition value", () => {
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
  assert.equal(signal.checkpointVpLeverage, 0);
  assert.equal(signal.acquisitionVpLeverage, 0);
  assert.match(signal.reason, /excluded from both/i);
});

test("Round 1 has only the objective-linked destruction scoring window", () => {
  const context = getPrimaryStrategyContext(state({ round: 1 }), { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.controlScoringActive, false);
  assert.equal(context.controlVp, 0);
  assert.equal(context.acquisitionVp, 0);
  assert.equal(context.killVp, 0);
  assert.match(context.summary[0], /Round 1/i);
});

test("Round 5 gives a new non-home objective seven VP of same-turn objective leverage", () => {
  const s = state({ round: 5 });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Central 1",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(context.controlCheckpointTiming, "end-of-turn");
  assert.equal(signal.checkpointVpLeverage, 4);
  assert.equal(signal.acquisitionVpLeverage, 3);
  assert.equal(signal.vpLeverage, 7);
  assert.match(signal.reason, /Round 5 resolves both/i);
});

test("null turn-start control keeps the new-capture award player-confirmed", () => {
  const s = state();
  s.scoring.turnSnapshots[0].objectives.find((item) => item.id === "event-companion:Central 1").control = null;
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.turnStartKnown, false);
  assert.equal(context.acquisitionSatisfied, false);
  assert.equal(context.acquisitionVp, 0);
  assert.match(context.summary.join(" "), /Turn-start control is incomplete/i);
});

test("a target that began the turn near an objective carries three VP kill leverage", () => {
  const s = state({ phase: "shooting" });
  const context = getPrimaryStrategyContext(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    attackerId: "far-attacker",
    targetUnitId: "near-target"
  });
  assert.equal(context.mapSupportedKillSatisfied, false);
  assert.equal(context.killOpportunity.targetStartedNearObjective, true);
  assert.equal(context.killOpportunity.attackerNearObjective, false);
  assert.equal(context.nextKillVpLeverage, 3);
  assert.ok(context.targetingScore >= 0.8);
});

test("an attacker near an objective can create the kill opportunity against an otherwise ordinary target", () => {
  const s = state({ phase: "shooting" });
  const context = getPrimaryStrategyContext(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    attackerId: "runner",
    targetUnitId: "far-target"
  });
  assert.equal(context.killOpportunity.targetStartedNearObjective, false);
  assert.equal(context.killOpportunity.attackerNearObjective, true);
  assert.equal(context.nextKillVpLeverage, 3);
  assert.match(context.reason, /selected attacker is currently near/i);
});

test("an ordinary kill target gets no Purge and Secure premium when neither positioning branch is supported", () => {
  const s = state({ phase: "shooting" });
  const context = getPrimaryStrategyContext(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    attackerId: "far-attacker",
    targetUnitId: "far-target"
  });
  assert.equal(context.killOpportunity.targetStartedNearObjective, false);
  assert.equal(context.killOpportunity.attackerNearObjective, false);
  assert.equal(context.nextKillVpLeverage, 0);
  assert.ok(context.targetingScore <= 0.12);
});

test("a recorded destruction with target turn-start objective proximity supports only one three VP kill award", () => {
  const s = state({
    phase: "fight",
    history: [killEvent(), killEvent({ targetId: "second-near", attackerId: "runner" })]
  });
  s.units.push(unit("second-near", "p2", 30, 22, { rosterUnitId: "r-second", status: "destroyed", wounds: 0 }));
  s.scoring.turnSnapshots[0].units.push({ id: "second-near", ownerId: "p2", status: "deployed", wounds: 5, position: { x: 30, y: 22 } });
  s.armyRosters.p2.units.push(rosterUnit("r-second"));
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId: "far-target", attackerId: "runner" });
  assert.equal(context.mapSupportedQualifyingKillCount, 2);
  assert.equal(context.mapSupportedKillSatisfied, true);
  assert.equal(context.killVp, 3);
  assert.equal(context.nextKillVpLeverage, 0);
  assert.equal(context.rawRecordedVp, 14);
});

test("Purge and Secure outlook obeys the fifteen VP round cap", () => {
  const s = state({ expansionTwoController: "p1", history: [killEvent()] });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(context.controlVp, 12);
  assert.equal(context.acquisitionVp, 3);
  assert.equal(context.killVp, 3);
  assert.equal(context.rawRecordedVp, 18);
  assert.equal(context.cappedRecordedVp, 15);
});

test("movement advisor elevates an eligible new non-home capture", () => {
  const s = state({ centralController: "p2" });
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy.missionName, "Purge and Secure");
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  const capture = options.find((item) => item.objectiveId === "event-companion:Central 1" && item.primaryStrategySignal?.missionName === "Purge and Secure");
  assert.ok(capture, "runner should retain the eligible non-home capture among its top mission options");
  assert.equal(capture.primaryStrategySignal.acquisitionEligible, true);
  assert.equal(capture.primaryStrategySignal.acquisitionVpLeverage, 3);
});

test("Battle-shocked movement receives no Purge and Secure mission elevation", () => {
  const s = state({ round: 5, centralController: "p2", runnerBattleShocked: true });
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

test("Shooting and Fight adapters pass the source attacker into strategic target context", () => {
  const shooting = readFileSync(new URL("../../src/rules/tactical-shooting-comparison.js", import.meta.url), "utf8");
  const fight = readFileSync(new URL("../../src/rules/tactical-fight-opportunities.js", import.meta.url), "utf8");
  assert.match(shooting, /getTargetStrategicContext\(state, \{[\s\S]*?attackerId: sourceAttacker\?\.id \?\? attackerId,[\s\S]*?targetUnitId: item\.targetUnitId/);
  assert.match(fight, /getTargetStrategicContext\(state, \{[\s\S]*?attackerId: sourceAttacker\.id,[\s\S]*?targetUnitId: target\.id/);
});
