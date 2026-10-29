import test from "node:test";
import assert from "node:assert/strict";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { getDeathTrapTerrainOptions } from "../../src/rules/death-trap-state.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function centroid(points) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
}

function trapEvent(terrainAreaId) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId: "runner",
      playerId: "p1",
      round: 2,
      turn: 2,
      actionType: "mission_action",
      actionId: "primary-death-trap",
      missionInstanceId: "primary:p1:primary-death-trap",
      missionDefinitionId: "primary-death-trap",
      missionName: "Death Trap — Booby Trap",
      reviewTiming: "end-of-turn",
      terrainAreaId,
      actionCompletedImmediately: true,
      rulesConfirmed: true
    }
  };
}

function killEvent(targetId) {
  return {
    type: "combat.attack_resolved",
    payload: {
      turn: 2,
      phase: "shooting",
      attackerId: "runner",
      targetId,
      targetOwnerId: "p2",
      stateDelta: { target: { unitId: targetId, statusBefore: "deployed", statusAfter: "destroyed" } }
    }
  };
}

test("Death Trap Movement does not promise a second 3 VP kill combo after the destruction condition is already satisfied", () => {
  const map = getEventCompanionMapForForceDispositions("Disruption", "Take and Hold", "A");
  assert.ok(map);
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(label === "Expansion 1" ? "p1" : null)
  }));
  const state = {
    phase: "movement",
    turn: 2,
    activePlayer: "p1",
    battle: { status: "active", round: 2, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1" }, { id: "p2" }],
    battlefieldMap: { missionSetup: { myDisposition: "Disruption", opponentDisposition: "Take and Hold", layout: "A" } },
    objectives,
    units: [],
    history: [],
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: { p1: { units: [] }, p2: { units: [] } }
  };
  const eligible = getDeathTrapTerrainOptions(state, { playerId: "p1", perspectivePlayerId: "p1" })
    .filter((entry) => entry.boobyTrapEligibleByGeometry !== false);
  assert.ok(eligible.length >= 2);
  const trapped = eligible[0];
  const untrapped = eligible.find((entry) => entry.terrainAreaId !== trapped.terrainAreaId);
  assert.ok(untrapped);
  const trappedPosition = centroid(map.terrainGeometry[trapped.terrainAreaId].points);
  const untrappedPosition = centroid(map.terrainGeometry[untrapped.terrainAreaId].points);
  state.units = [
    {
      id: "runner", ownerId: "p1", name: "Runner", status: "deployed", position: untrappedPosition,
      battleShocked: false, wounds: 5, startingStrength: 1, currentStrength: 1,
      profile: { characteristics: { movement: 8, objectiveControl: 3, toughness: 5, save: 3, wounds: 5 } }
    },
    { id: "enemy-a", ownerId: "p2", name: "Enemy A", status: "destroyed", position: trappedPosition, wounds: 0, startingStrength: 1, currentStrength: 0 },
    { id: "enemy-b", ownerId: "p2", name: "Enemy B", status: "destroyed", position: untrappedPosition, wounds: 0, startingStrength: 1, currentStrength: 0 }
  ];
  state.scoring.turnSnapshots = [{
    turn: 2,
    playerId: "p1",
    objectives: objectives.map((objective) => ({ id: objective.id, control: objective.control })),
    units: [
      { id: "runner", ownerId: "p1", status: "deployed", wounds: 5, position: { ...untrappedPosition } },
      { id: "enemy-a", ownerId: "p2", status: "deployed", wounds: 5, position: { ...trappedPosition } },
      { id: "enemy-b", ownerId: "p2", status: "deployed", wounds: 5, position: { ...untrappedPosition } }
    ]
  }];
  state.history = [trapEvent(trapped.terrainAreaId), killEvent("enemy-a"), killEvent("enemy-b")];

  const result = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(result.primaryStrategy?.trappedKillSatisfied, true);
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  assert.equal(options.some((item) => Number(item.killComboVpLeverage) > 0), false);
  assert.equal(options.some((item) => /unlock the 3 VP destruction condition/i.test(`${item.recommendation ?? ""} ${item.reason ?? ""}`)), false);
});
