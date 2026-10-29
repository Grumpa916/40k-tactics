import test from "node:test";
import assert from "node:assert/strict";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { getDeathTrapTerrainOptions } from "../../src/rules/death-trap-state.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";

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

function trapEvent(terrainAreaId, unitId) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
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

function seed({ phase = "shooting" } = {}) {
  const map = getEventCompanionMapForForceDispositions("Disruption", "Take and Hold", "A");
  assert.ok(map);
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(label === "Attacker Home" || label === "Expansion 1" ? "p1" : label === "Defender Home" ? "p2" : null)
  }));
  const state = {
    phase,
    turn: 2,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round: 2, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
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
  const terrain = getDeathTrapTerrainOptions(state, { playerId: "p1", perspectivePlayerId: "p1" });
  const ineligible = terrain.find((entry) => entry.boobyTrapEligibleByGeometry === false && !entry.containsObjective);
  assert.ok(ineligible, "Layout A should contain ordinary terrain wholly inside the attacker's deployment zone");
  const runnerPosition = centroid(map.terrainGeometry[ineligible.terrainAreaId].points);
  state.units = [
    {
      id: "runner",
      ownerId: "p1",
      name: "Runner",
      status: "deployed",
      position: runnerPosition,
      battleShocked: false,
      wounds: 5,
      startingStrength: 1,
      currentStrength: 1,
      profile: { characteristics: { movement: 8, objectiveControl: 3, toughness: 5, save: 3, wounds: 5 } }
    },
    {
      id: "enemy",
      ownerId: "p2",
      name: "Enemy",
      status: "deployed",
      position: { x: 30, y: 22 },
      wounds: 5,
      startingStrength: 1,
      currentStrength: 1,
      profile: { characteristics: { movement: 6, objectiveControl: 2, toughness: 5, save: 3, wounds: 5 } }
    }
  ];
  state.scoring.turnSnapshots = [{
    turn: 2,
    playerId: "p1",
    objectives: objectives.map((objective) => ({ id: objective.id, control: objective.control })),
    units: state.units.map((unit) => ({ id: unit.id, ownerId: unit.ownerId, status: unit.status, wounds: unit.wounds, position: { ...unit.position } }))
  }];
  return { state, map, ineligible };
}

test("Death Trap identifies ordinary terrain wholly inside your deployment zone as ineligible", () => {
  const { ineligible } = seed();
  assert.equal(ineligible.withinOwnDeploymentZone, true);
  assert.equal(ineligible.containsEligibleObjective, false);
  assert.equal(ineligible.boobyTrapEligibleByGeometry, false);
});

test("Death Trap picker hides and engine rejects terrain known to be inside your deployment zone", () => {
  const { state, ineligible } = seed();
  const html = createMissionActionPicker().render(state, "runner");
  assert.doesNotMatch(html, new RegExp(`value=["']${ineligible.terrainAreaId}["']`));
  assert.throws(() => recordShootingActivation(state, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-death-trap",
    missionInstanceId: "primary:p1:primary-death-trap",
    terrainAreaId: ineligible.terrainAreaId,
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  }), /wholly within your deployment zone/);
});

test("Death Trap Movement never recommends the only remaining terrain when it is deployment-zone ineligible", () => {
  const { state, ineligible } = seed({ phase: "movement" });
  const allTerrain = getDeathTrapTerrainOptions(state, { playerId: "p1", perspectivePlayerId: "p1" });
  state.history = allTerrain
    .filter((entry) => entry.terrainAreaId !== ineligible.terrainAreaId)
    .map((entry, index) => trapEvent(entry.terrainAreaId, `trapper-${index}`));
  const result = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  assert.equal(options.some((item) => item.terrainAreaId === ineligible.terrainAreaId), false);
  assert.equal(options.some((item) => item.purpose === "booby-trap-terrain"), false);
});
