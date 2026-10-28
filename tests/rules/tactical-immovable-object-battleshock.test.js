import test from "node:test";
import assert from "node:assert/strict";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { move = 8, oc = 3, rosterUnitId = id, battleShocked = false } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    battleShocked,
    position: { x, y },
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function rosterUnit(id, { move = 8, oc = 3, weapons = [] } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons
    }
  };
}

test("Battle-shocked zero-OC unit is not credited with an Immovable Object central capture", () => {
  const state = {
    phase: "movement",
    turn: 5,
    activePlayer: "p1",
    battle: { status: "active", round: 5, activePlayerId: "p1" },
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
      objective("event-companion:Central 1", "Central 1", null, 30, 22),
      objective("event-companion:Central 2", "Central 2", null, 36, 22),
      objective("event-companion:Expansion 2", "Expansion 2", "p2", 44, 22),
      objective("event-companion:Defender Home", "Defender Home", null, 52, 22)
    ],
    units: [
      unit("runner", "p1", 27, 22, { battleShocked: true, rosterUnitId: "r-runner" }),
      unit("target", "p2", 34, 22, { move: 6, oc: 2, rosterUnitId: "r-target" })
    ],
    history: [],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner", { weapons: [{ name: "Rifle", range: 18, attacks: 2, skill: "3+", strength: 5, ap: -1, damage: 2 }] })] },
      p2: { units: [rosterUnit("r-target", { move: 6, oc: 2 })] }
    }
  };

  const result = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  assert.equal(runner.battleShocked, true);
  assert.equal(runner.effectiveOc, 0);
  const options = [runner, ...(runner.alternatives ?? [])];
  assert.equal(options.some((item) => item.primaryStrategySignal?.central && item.primaryStrategySignal?.vpLeverage >= 8), false);
});
