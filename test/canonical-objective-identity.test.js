import test from "node:test";
import assert from "node:assert/strict";
import { setEventCompanionMissionSetup } from "../src/engine/battlefield-map-transitions.js";
import { getBattlePrimaryMissions, getEventCompanionMapLayout } from "../src/rules/event-companion-map-catalog.js";
import { renderBattlefieldMap } from "../src/ui/battlefield-map.js";

function state(objectives = []) {
  return {
    players: [{ id: "me", name: "My Army" }, { id: "opponent", name: "Opponent" }],
    units: [],
    objectives,
    history: [],
    battlefieldMap: {}
  };
}

function setup(layout, current = state()) {
  return setEventCompanionMissionSetup(current, {
    myDisposition: "Take and Hold",
    opponentDisposition: "Disruption",
    layout
  });
}

test("selecting a verified layout creates five stable canonical objectives at catalog coordinates", () => {
  const next = setup("A");
  const missions = getBattlePrimaryMissions("Take and Hold", "Disruption");
  const geometry = getEventCompanionMapLayout(missions.myMission, missions.opponentMission, "A");
  const names = ["Defender Home", "Attacker Home", "Central 1", "Expansion 1", "Expansion 2"];

  assert.equal(next.objectives.length, 5);
  for (const name of names) {
    const objective = next.objectives.find((item) => item.id === "event-companion:" + name);
    assert.ok(objective, "missing canonical objective " + name);
    assert.equal(objective.name, name);
    assert.equal(objective.layoutObjective, name);
    assert.deepEqual(objective.position, geometry.objectivePositions[name]);
  }

  const html = renderBattlefieldMap(next, { mode: "planning", perspectivePlayerId: "me" });
  assert.equal((html.match(/data-layout-objective=/g) ?? []).length, 5);
  assert.equal((html.match(/data-map-objective-id=/g) ?? []).length, 5);
});

test("changing layout updates canonical positions without losing recorded control", () => {
  const first = setup("A");
  const center = first.objectives.find((item) => item.id === "event-companion:Central 1");
  const withControl = {
    ...first,
    objectives: first.objectives.map((item) => item.id === center.id
      ? { ...item, control: { id: item.id, controllerId: "me", contestingPlayerIds: [], controlState: "controlled" } }
      : item)
  };
  const next = setup("B", withControl);
  const missions = getBattlePrimaryMissions("Take and Hold", "Disruption");
  const geometry = getEventCompanionMapLayout(missions.myMission, missions.opponentMission, "B");
  const updatedCenter = next.objectives.find((item) => item.id === center.id);

  assert.equal(next.objectives.length, 5);
  assert.deepEqual(updatedCenter.position, geometry.objectivePositions["Central 1"]);
  assert.deepEqual(updatedCenter.control, {
    id: center.id, controllerId: "me", contestingPlayerIds: [], controlState: "controlled"
  });
});

test("explicitly linked existing objective keeps its application ID and control record", () => {
  const existing = {
    id: "legacy-home-record",
    name: "Existing home objective",
    layoutObjective: "Defender Home",
    position: { x: 1, y: 1 },
    control: { id: "legacy-home-record", controllerId: "opponent", contestingPlayerIds: [], controlState: "controlled" }
  };
  const next = setup("A", state([existing]));
  const home = next.objectives.find((item) => item.id === "legacy-home-record");

  assert.equal(next.objectives.length, 5);
  assert.deepEqual(home.position, getEventCompanionMapLayout(
    getBattlePrimaryMissions("Take and Hold", "Disruption").myMission,
    getBattlePrimaryMissions("Take and Hold", "Disruption").opponentMission,
    "A"
  ).objectivePositions["Defender Home"]);
  assert.deepEqual(home.control, existing.control);
  assert.equal(next.objectives.some((item) => item.id === "event-companion:Defender Home"), false);
});

test("unlinked legacy objectives are preserved but never guessed as layout objectives", () => {
  const legacy = { id: "old-center", name: "Old center", position: { x: 30, y: 22 } };
  const next = setup("A", state([legacy]));
  assert.equal(next.objectives.length, 6);
  assert.deepEqual(next.objectives.find((item) => item.id === "old-center"), legacy);

  const html = renderBattlefieldMap(next, { mode: "live", perspectivePlayerId: "me" });
  assert.equal((html.match(/data-layout-objective=/g) ?? []).length, 5);
  assert.doesNotMatch(html, /data-map-objective-id="old-center"/);
});

test("six-objective Event Companion layouts include two central objectives", () => {
  const initial = state();
  const next = setEventCompanionMissionSetup(initial, {
    myDisposition: "Purge the Foe",
    opponentDisposition: "Take and Hold",
    layout: "A"
  });
  const geometry = getEventCompanionMapLayout(
    getBattlePrimaryMissions("Purge the Foe", "Take and Hold").myMission,
    getBattlePrimaryMissions("Purge the Foe", "Take and Hold").opponentMission,
    "A"
  );
  assert.ok(geometry.objectivePositions["Central 1"]);
  assert.ok(geometry.objectivePositions["Central 2"]);
  assert.equal(next.objectives.length, 6);
  assert.ok(next.objectives.some((item) => item.layoutObjective === "Central 1"));
  assert.ok(next.objectives.some((item) => item.layoutObjective === "Central 2"));
  assert.ok(next.objectives.some((item) => item.layoutObjective === "Defender Home"));
  assert.ok(next.objectives.some((item) => item.layoutObjective === "Attacker Home"));
  const html = renderBattlefieldMap(next, { mode: "planning", perspectivePlayerId: "me" });
  assert.equal((html.match(/data-layout-objective=/g) ?? []).length, 6);
});

test("switching from six to five objectives removes stale Central 2 without adding generic home markers", () => {
  const six = setEventCompanionMissionSetup(state(), {
    myDisposition: "Purge the Foe",
    opponentDisposition: "Take and Hold",
    layout: "A"
  });
  const five = setup("A", six);
  assert.equal(five.objectives.length, 5);
  assert.equal(five.objectives.some((item) => item.layoutObjective === "Central 2"), false);
  assert.deepEqual(five.objectives.map((item) => item.layoutObjective).sort(), [
    "Attacker Home", "Central 1", "Defender Home", "Expansion 1", "Expansion 2"
  ]);
});
