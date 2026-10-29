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

function trapEvent(terrainAreaId, index) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId: `trapper-${index}`,
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

test("Death Trap Movement preserves the only controlled non-home objective after its terrain is already trapped", () => {
  const map = getEventCompanionMapForForceDispositions("Disruption", "Take and Hold", "A");
  assert.ok(map);
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(label === "Expansion 1" ? "p1" : label === "Defender Home" ? "p2" : null)
  }));
  const held = objectives.find((objective) => objective.layoutObjective === "Expansion 1");
  assert.ok(held);
  const state = {
    phase: "movement",
    turn: 2,
    activePlayer: "p1",
    battle: { status: "active", round: 2, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1" }, { id: "p2" }],
    battlefieldMap: { missionSetup: { myDisposition: "Disruption", opponentDisposition: "Take and Hold", layout: "A" } },
    objectives,
    units: [{
      id: "holder",
      ownerId: "p1",
      name: "Holder",
      status: "deployed",
      position: { ...held.position },
      battleShocked: false,
      wounds: 5,
      startingStrength: 1,
      currentStrength: 1,
      profile: { characteristics: { movement: 6, objectiveControl: 4, toughness: 5, save: 3, wounds: 5 } }
    }],
    history: [],
    scoring: {
      turnSnapshots: [{
        turn: 2,
        playerId: "p1",
        objectives: objectives.map((objective) => ({ id: objective.id, control: objective.control })),
        units: [{ id: "holder", ownerId: "p1", status: "deployed", wounds: 5, position: { ...held.position } }]
      }],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: { p1: { units: [] }, p2: { units: [] } }
  };
  const terrain = getDeathTrapTerrainOptions(state, { playerId: "p1", perspectivePlayerId: "p1" });
  state.history = terrain.map((entry, index) => trapEvent(entry.terrainAreaId, index));

  const result = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  const holder = result.recommendations.find((item) => item.unitId === "holder");
  assert.ok(holder);
  const options = [holder, ...(holder.alternatives ?? [])];
  const heldRoute = options.find((item) => item.objectiveId === held.id);
  assert.ok(heldRoute, "the already-trapped held objective should remain represented in Movement advice");
  assert.equal(heldRoute.primaryStrategySignal?.controlVpLeverage, 4);
  assert.ok(heldRoute.primaryStrategySignal?.vpLeverage >= 4);
  assert.match(`${heldRoute.recommendation ?? ""} ${heldRoute.reason ?? ""}`, /4 VP|binary 4 VP|only controlled non-home/i);
});
