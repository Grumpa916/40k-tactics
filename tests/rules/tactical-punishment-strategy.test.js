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
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { oc = 2, move = 6, rosterUnitId = id } = {}) {
  return {
    id, ownerId, name: id, status: "deployed", position: { x, y }, wounds: 5,
    startingStrength: 1, currentStrength: 1, startingWounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function rosterUnit(id, move = 6, oc = 2) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: { characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" }, weapons: [] }
  };
}

function state() {
  return {
    phase: "shooting", turn: 3, activePlayer: "p1",
    battle: { status: "active", round: 3, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Purge the Foe", opponentDisposition: "Disruption", layout: "A" } },
    victoryPoints: { p1: 18, p2: 18 }, commandPoints: { p1: 2, p2: 2 },
    objectives: [
      objective("event-companion:Attacker Home", "Attacker Home", "p1", 8, 22),
      objective("event-companion:Expansion 1", "Expansion 1", "p1", 18, 22),
      objective("event-companion:Central 1", "Central 1", "p1", 26, 22),
      objective("event-companion:Expansion 2", "Expansion 2", "p2", 34, 22),
      objective("event-companion:Defender Home", "Defender Home", "p2", 44, 22),
      objective("event-companion:Central 2", "Central 2", null, 30, 30)
    ],
    units: [
      unit("scorer", "p1", 24, 22, { oc: 4, move: 10, rosterUnitId: "r-scorer" }),
      unit("condemned", "p2", 28, 22, { rosterUnitId: "r-condemned" }),
      unit("other-target", "p2", 32, 22, { rosterUnitId: "r-other" })
    ],
    history: [],
    scoring: {
      turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" },
      punishmentCondemnations: [{ playerId: "p1", round: 3, turn: 3, unitIds: ["condemned"], unitNames: ["condemned"], tabletopEligibilityConfirmed: true }]
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-scorer", 10, 4)] },
      p2: { units: [rosterUnit("r-condemned"), rosterUnit("r-other")] }
    }
  };
}

test("Punishment tracks condemned-unit, non-home and majority conditions separately", () => {
  const context = getPrimaryStrategyContext(state(), { playerId: "p1" });
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Punishment");
  assert.deepEqual(context.condemnedUnitIds, ["condemned"]);
  assert.equal(context.condemnedLeftSatisfied, false);
  assert.equal(context.nonHomeSatisfied, true);
  assert.equal(context.majoritySatisfied, true);
  assert.equal(context.rawRecordedVp, 9);
  assert.equal(context.cappedRecordedVp, 9);
  assert.equal(context.opponentHomeEndBattleVpLeverage, 8);
});

test("Punishment gives only the recorded condemned target five VP of direct kill leverage", () => {
  const s = state();
  const condemned = getTargetStrategicContext(s, { playerId: "p1", targetUnitId: "condemned" });
  const other = getTargetStrategicContext(s, { playerId: "p1", targetUnitId: "other-target" });
  assert.equal(condemned.primaryStrategy.targetCondemned, true);
  assert.equal(condemned.primaryStrategy.nextKillVpLeverage, 5);
  assert.ok(condemned.primaryStrategy.targetingScore >= 0.9);
  assert.match(condemned.reason, /recorded as condemned|direct 5 VP Punishment/i);
  assert.equal(other.primaryStrategy.targetCondemned, false);
  assert.equal(other.primaryStrategy.nextKillVpLeverage, 0);
  assert.match(other.primaryStrategy.reason, /not recorded as condemned/i);
});

test("Punishment recognizes a condemned unit leaving the battlefield and caps current-round outlook correctly", () => {
  const s = state();
  s.history.push({ type: "unit.entered_reserves", payload: { unitId: "condemned", playerId: "p2", turn: 3, round: 3, phase: "movement" } });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", targetUnitId: "condemned" });
  assert.equal(context.condemnedLeftSatisfied, true);
  assert.deepEqual(context.condemnedLeftUnitIds, ["condemned"]);
  assert.equal(context.rawRecordedVp, 14);
  assert.equal(context.cappedRecordedVp, 14);
  assert.equal(context.nextKillVpLeverage, 0);
});

test("Punishment objective signal protects a one-objective majority lead", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  assert.equal(context.objectiveMargin, 1);
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    objectiveId: "event-companion:Central 1",
    control: "controlled",
    purpose: "hold-objective",
    primaryStrategy: context
  });
  assert.equal(signal.active, true);
  assert.ok(signal.vpLeverage >= 5);
  assert.match(signal.reason, /lead is only one|majority/i);
});

test("Punishment opponent home carries the separate eight VP endgame value", () => {
  const s = state();
  const context = getPrimaryStrategyContext(s, { playerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    objectiveId: "event-companion:Defender Home",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(signal.opponentHome, true);
  assert.ok(signal.vpLeverage >= 8);
  assert.match(signal.reason, /8 VP end-of-battle condition/);
});

test("Punishment movement advice carries majority and opponent-home value", () => {
  const s = state();
  s.phase = "movement";
  const result = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy.missionName, "Punishment");
  const scorer = result.recommendations.find((item) => item.unitId === "scorer");
  const options = [scorer, ...(scorer?.alternatives ?? [])];
  assert.ok(options.some((item) => item?.primaryStrategySignal?.active));
  const home = options.find((item) => item?.objectiveId === "event-companion:Defender Home");
  if (home) {
    assert.equal(home.primaryStrategySignal.opponentHome, true);
    assert.ok(home.primaryStrategySignal.vpLeverage >= 8);
  }
});
