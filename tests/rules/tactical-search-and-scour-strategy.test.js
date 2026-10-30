import test from "node:test";
import assert from "node:assert/strict";
import { createTurnSnapshot } from "../../src/rules/scoring-evidence-state.js";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { getBattlefieldTerritoryContext } from "../../src/rules/battlefield-territory.js";
import { getPrimaryObjectiveStrategySignal, getPrimaryStrategyContext } from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getSearchAndScourState } from "../../src/rules/search-and-scour-state.js";

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
      weapons: [{ name: "Rifle", type: "ranged", characteristics: { range: 24, attacks: 2, skill: 3, strength: 4, ap: 0, damage: 1 } }]
    }
  };
}

function unit(id, ownerId, position, { status = "deployed", move = 8, oc = 2 } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status,
    position: { ...position },
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    metadata: { rosterUnitId: `r-${id}`, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function commandAward(round = 2, amount = 4) {
  return {
    id: `search-command-${round}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId: "primary-search-and-scour",
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

function centroid(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return { x: xs.reduce((a, b) => a + b, 0) / xs.length, y: ys.reduce((a, b) => a + b, 0) / ys.length };
}

function seed({ round = 2, phase = "command", history = [], centralController = "p1", secondCentralController = "p2" } = {}) {
  const state = {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Reconnaissance", opponentDisposition: "Priority Assets", layout: "A" } },
    objectives: [
      { id: "home-p1", name: "Attacker Home", layoutObjective: "Attacker Home", position: { x: 8, y: 38 }, control: control("p1") },
      { id: "central-1", name: "Central 1", layoutObjective: "Central 1", position: { x: 25, y: 18 }, control: control(centralController) },
      { id: "central-2", name: "Central 2", layoutObjective: "Central 2", position: { x: 35, y: 26 }, control: control(secondCentralController) },
      { id: "home-p2", name: "Defender Home", layoutObjective: "Defender Home", position: { x: 52, y: 6 }, control: control("p2") }
    ],
    units: [
      unit("scout-a", "p1", { x: 24, y: 18 }),
      unit("scout-b", "p1", { x: 34, y: 26 }),
      unit("enemy-a", "p2", { x: 45, y: 10 }),
      unit("enemy-b", "p2", { x: 48, y: 12 })
    ],
    history: [...history],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-scout-a"), rosterUnit("r-scout-b")] },
      p2: { units: [rosterUnit("r-enemy-a"), rosterUnit("r-enemy-b")] }
    }
  };
  return state;
}

function strategy(state, targetUnitId = null) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1", targetUnitId });
}

function putEnemyAtTerrainStart(state, unitIds = ["enemy-a"]) {
  const map = getEventCompanionMapForForceDispositions("Reconnaissance", "Priority Assets", "A");
  const terrain = Object.values(map.terrainGeometry ?? {})[0];
  assert.ok(terrain?.points?.length >= 3);
  const start = centroid(terrain.points);
  for (const id of unitIds) {
    const target = state.units.find((unit) => unit.id === id);
    target.position = { ...start };
  }
  state.scoring.turnSnapshots = [createTurnSnapshot(state, { turn: state.turn, round: state.battle.round, playerId: "p1" })];
  return start;
}

test("router selects the dedicated Search and Scour strategy", () => {
  const state = seed({ round: 2, phase: "command" });
  const result = strategy(state);
  assert.equal(result.missionId, "primary-search-and-scour");
  assert.equal(result.supported, true);
});

test("central control and each non-home objective contribute their Search and Scour values", () => {
  const state = seed({ round: 2, phase: "command", centralController: "p1", secondCentralController: "p1" });
  const result = strategy(state);
  assert.equal(result.centralControlVp, 3);
  assert.equal(result.nonHomeControlledCount, 2);
  assert.equal(result.nonHomeControlRawVp, 8);
  assert.equal(result.controlVpForProjection, 8);
  assert.equal(result.rawAdvisoryVp, 11);

  const signal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "central-1"
  });
  assert.equal(signal.centralVpLeverage, 3);
  assert.equal(signal.nonHomeVpLeverage, 4);
});

test("terrain-start destruction scores only one binary 2 VP condition even with multiple qualifying kills", () => {
  const state = seed({ round: 2, phase: "end_turn" });
  putEnemyAtTerrainStart(state, ["enemy-a", "enemy-b"]);
  state.history.push(
    { type: "unit.destroyed", payload: { unitId: "enemy-a", ownerId: "p2", turn: 2, round: 2 } },
    { type: "unit.destroyed", payload: { unitId: "enemy-b", ownerId: "p2", turn: 2, round: 2 } }
  );
  const search = getSearchAndScourState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(search.qualifyingKills.length, 2);
  assert.equal(search.terrainKillSatisfied, true);
  assert.equal(search.terrainKillVp, 2);
});

test("a live target that began the turn in terrain carries 2 VP kill leverage until the condition is satisfied", () => {
  const state = seed({ round: 2, phase: "shooting" });
  putEnemyAtTerrainStart(state, ["enemy-a"]);
  const before = strategy(state, "enemy-a");
  assert.equal(before.targetOpportunity.startedInTerrain, true);
  assert.equal(before.nextKillVpLeverage, 2);

  state.history.push({ type: "unit.destroyed", payload: { unitId: "enemy-b", ownerId: "p2", turn: 2, round: 2 } });
  const snapshot = state.scoring.turnSnapshots[0];
  const enemyBStart = snapshot.units.find((unit) => unit.id === "enemy-b");
  enemyBStart.position = { ...snapshot.units.find((unit) => unit.id === "enemy-a").position };
  const after = strategy(state, "enemy-a");
  assert.equal(after.terrainKillSatisfied, true);
  assert.equal(after.nextKillVpLeverage, 0);
});

test("movement after the Round 2 Command checkpoint does not retroactively add newly controlled non-home objectives", () => {
  const state = seed({ round: 2, phase: "movement", history: [commandAward(2, 4)], centralController: "p1", secondCentralController: "p1" });
  const result = strategy(state);
  assert.equal(result.nonHomeControlRawVp, 8);
  assert.equal(result.commandCheckpointCompleted, true);
  assert.equal(result.controlVpForProjection, 4);

  const signal = getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "central-2"
  });
  assert.equal(signal.nonHomeVpLeverage, 0);
  assert.equal(signal.nextCheckpointVpLeverage, 4);
});

test("Round 5 uses live end-of-turn non-home control instead of a passed Command checkpoint", () => {
  const state = seed({ round: 5, phase: "movement", centralController: "p1", secondCentralController: "p1" });
  const result = strategy(state);
  assert.equal(result.commandCheckpointCompleted, false);
  assert.equal(result.nonHomeControlRawVp, 8);
  assert.equal(result.controlVpForProjection, 8);
});

test("deployed enemies clearly inside your territory are endgame blockers while reserves with stale coordinates are ignored", () => {
  const state = seed({ round: 5, phase: "movement" });
  const territory = getBattlefieldTerritoryContext(state, { playerId: "p1" });
  assert.ok(territory?.myTerritory);
  const inside = {
    x: territory.myTerritory.x + territory.myTerritory.width / 2,
    y: territory.myTerritory.y + territory.myTerritory.height / 2
  };
  state.units.find((unit) => unit.id === "enemy-a").position = { ...inside };
  const reserve = state.units.find((unit) => unit.id === "enemy-b");
  reserve.position = { ...inside };
  reserve.status = "reserves";

  const result = strategy(state, "enemy-a");
  assert.deepEqual(result.territoryBlockerUnitIds, ["enemy-a"]);
  assert.equal(result.targetOpportunity.territoryBlocker, true);
  assert.equal(result.targetEndgameVpLeverage, 5);
});

test("movement routing exposes Search and Scour objective strategy", () => {
  const state = seed({ round: 2, phase: "movement", centralController: "p2", secondCentralController: "p2" });
  const movement = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(movement.primaryStrategy?.missionId, "primary-search-and-scour");
  assert.ok((movement.recommendations ?? []).some((entry) => entry.primaryStrategySignal?.central === true || entry.alternatives?.some((alt) => alt.primaryStrategySignal?.central === true)));
});

test("45 VP Primary cap suppresses additional Search and Scour leverage", () => {
  const state = seed({ round: 5, phase: "movement", history: priorPrimaryAwards(45), centralController: "p1", secondCentralController: "p1" });
  const result = strategy(state);
  assert.equal(result.remainingPrimaryGameVp, 0);
  assert.equal(result.additionalPrimaryAllowance, 0);
  assert.equal(result.cappedAdvisoryVp, 0);
  assert.equal(result.objectivePreservationScore <= 0.15, true);
});
