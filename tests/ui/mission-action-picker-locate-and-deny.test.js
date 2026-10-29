import test from "node:test";
import assert from "node:assert/strict";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { getLocateAndDenySetup, getLocateAndDenyTerrainOptions } from "../../src/rules/locate-and-deny-state.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function state() {
  const map = getEventCompanionMapForForceDispositions("Disruption", "Priority Assets", "A");
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(label === "Attacker Home" ? "p1" : label === "Defender Home" ? "p2" : null)
  }));
  return {
    phase: "shooting",
    turn: 2,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round: 2, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Disruption", opponentDisposition: "Priority Assets", layout: "A" } },
    objectives,
    units: [{ id: "runner", ownerId: "p1", name: "runner", status: "deployed", position: { ...objectives[0].position } }],
    history: [],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } }
  };
}

test("Locate and Deny setup picker shows only eligible terrain and keeps setup capture separate from Sensor Sweep", () => {
  const seed = state();
  const setup = getLocateAndDenySetup(seed, { playerId: "p1" });
  const terrain = getLocateAndDenyTerrainOptions(seed, { playerId: "p1" });
  const eligible = terrain.filter((item) => item.eligible);
  const ineligible = terrain.filter((item) => item.withinOwnDeploymentZone === true);
  assert.ok(eligible.length >= setup.expectedMarkerCount);

  const html = createMissionActionPicker().render(seed, "runner");
  assert.match(html, /Record Locate and Deny setup/);
  assert.match(html, new RegExp(`${setup.expectedMarkerCount}`));
  for (const item of eligible) assert.match(html, new RegExp(`data-locate-setup-terrain=["']${item.terrainAreaId}["']`));
  // Some official layouts legitimately have no terrain wholly within this player's deployment zone.
  // When they do, the picker must still exclude those ineligible terrain areas.
  for (const item of ineligible) assert.doesNotMatch(html, new RegExp(`data-locate-setup-terrain=["']${item.terrainAreaId}["']`));
  assert.doesNotMatch(html, /Central objective for Sensor Sweep/);
});
