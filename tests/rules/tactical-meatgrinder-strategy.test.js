import test from "node:test";
import assert from "node:assert/strict";
import { getPrimaryStrategyContext, getPrimaryObjectiveStrategySignal } from "../../src/rules/tactical-primary-strategy.js";
import { getTargetStrategicContext } from "../../src/rules/tactical-target-context.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return {
    id,
    name: id,
    layoutObjective,
    position: { x, y },
    control: control(controllerId)
  };
}

function unit(id, ownerId, x, y, { oc = 2, move = 6, rosterUnitId = id } = {}) {
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

function destroyed(turn, unitId, ownerId) {
  return { type: "unit.destroyed", payload: { turn, unitId, ownerId } };
}

function state() {
  return {
    phase: "shooting",
    turn: 3,
    activePlayer: "p1",
    battle: { status: "active", round: 3, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Purge the Foe", opponentDisposition: "Purge the Foe", layout: "A" } },
    victoryPoints: { p1: 18, p2: 18 },
    commandPoints: { p1: 2, p2: 2 },
    objectives: [
      objective("event-companion:Attacker Home", "Attacker Home", "p1", 8, 22),
      objective("event-companion:Expansion 1", "Expansion 1", "p1", 18, 22),
      objective("event-companion:Central 1", "Central 1", "p2", 24, 22),
      objective("event-companion:Defender Home", "Defender Home", "p2", 40, 22)
    ],
    units: [
      unit("scorer", "p1", 31, 22, { oc: 4, move: 10, rosterUnitId: "r-scorer" }),
      unit("target", "p2", 34, 22, { oc: 2, move: 6, rosterUnitId: "r-target" })
    ],
    history: [
      destroyed(2, "lost-friendly", "p1"),
      destroyed(3, "enemy-one", "p2")
    ],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: [rosterUnit("r-scorer", { move: 10, oc: 4, weapons: [{ name: "Rifle", range: 12, attacks: 2, skill: "3+", strength: 4, ap: 0, damage: 1 }] })] },
      p2: { units: [rosterUnit("r-target", { move: 6, oc: 2 })] }
    }
  };
}

test("Meatgrinder tracks first kill, comparison, one non-home objective and opponent home separately", () => {
  const context = getPrimaryStrategyContext(state(), { playerId: "p1" });
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Meatgrinder");
  assert.equal(context.enemyKillsThisTurn, 1);
  assert.equal(context.friendlyLossesLastTurn, 1);
  assert.equal(context.basicKillNeeded, 0);
  assert.equal(context.comparisonKillsNeeded, 1);
  assert.equal(context.comparisonSatisfied, false);
  assert.equal(context.nonHomeSatisfied, true);
  assert.equal(context.opponentHomeSatisfied, false);
  assert.equal(context.rawRecordedVp, 7);
  assert.equal(context.cappedRecordedVp, 7);
  assert.equal(context.nextKillVpLeverage, 5);
  assert.equal(context.protectCheapUnits, true);
});

test("Meatgrinder comparison and opponent-home conditions respect the 15 VP round cap", () => {
  const s = state();
  s.history.push(destroyed(3, "enemy-two", "p2"));
  s.objectives.find((item) => item.layoutObjective === "Defender Home").control = control("p1");
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  assert.equal(context.comparisonSatisfied, true);
  assert.equal(context.opponentHomeSatisfied, true);
  assert.equal(context.opponentHomeControlled, 1);
  assert.equal(context.rawRecordedVp, 17);
  assert.equal(context.cappedRecordedVp, 15);
});

test("Meatgrinder first kill can carry eight VP of target leverage when no friendly unit was lost last turn", () => {
  const s = state();
  s.history = [];
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  assert.equal(context.basicKillNeeded, 1);
  assert.equal(context.comparisonKillsNeeded, 1);
  assert.equal(context.nextKillVpLeverage, 8);
  assert.ok(context.targetingScore >= 0.9);

  const strategic = getTargetStrategicContext(s, { playerId: "p1", targetUnitId: "target" });
  assert.equal(strategic.primaryStrategy.missionName, "Meatgrinder");
  assert.equal(strategic.primaryStrategy.nextKillVpLeverage, 8);
  assert.match(strategic.reason, /Meatgrinder|first enemy unit|8/);
});

test("Meatgrinder does not keep adding non-home value after one is secured", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    objectiveId: "event-companion:Central 1",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.active, true);
  assert.equal(signal.vpLeverage, 0);
  assert.ok(signal.score < 0.2);
  assert.match(signal.reason, /already control a different non-home objective/i);
});

test("Meatgrinder recognizes perspective-aware opponent home as a separate five VP objective", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    objectiveId: "event-companion:Defender Home",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.active, true);
  assert.equal(signal.opponentHome, true);
  assert.equal(signal.vpLeverage, 5);
  assert.ok(signal.score >= 0.4);
  assert.match(signal.reason, /opponent's home objective/i);
});

test("Meatgrinder movement advice carries opponent-home mission value without new input", () => {
  const s = state();
  s.phase = "movement";
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy.missionName, "Meatgrinder");
  const scorer = result.recommendations.find((item) => item.unitId === "scorer");
  const options = [scorer, ...(scorer?.alternatives ?? [])];
  const home = options.find((item) => item?.objectiveId === "event-companion:Defender Home");
  assert.ok(home);
  assert.equal(home.primaryStrategySignal.opponentHome, true);
  assert.equal(home.primaryStrategySignal.vpLeverage, 5);
  assert.match(home.reason, /5 VP end-of-turn condition/);
});
