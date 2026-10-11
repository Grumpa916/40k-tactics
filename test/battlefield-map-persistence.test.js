import test from "node:test";
import assert from "node:assert/strict";
import { saveCurrentBattle, restoreSavedBattle } from "../src/application/battle-persistence.js";

function makeSession(initialState) {
  let state = initialState;
  return {
    getState: () => state,
    replaceState(next) { state = JSON.parse(JSON.stringify(next)); },
    readState: () => state
  };
}

test("cloud persistence snapshot retains Event Companion setup and distinct map positions", async () => {
  const originalState = {
    version: 1,
    phase: "setup",
    players: [{ id: "me", name: "My Army" }, { id: "opponent", name: "Opponent" }],
    units: [{ id: "unit-1", ownerId: "me", status: "ready", position: null }],
    objectives: [],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Take and Hold",
        opponentDisposition: "Disruption",
        layout: "B"
      },
      deploymentPlan: { "unit-1": { x: 12.5, y: 8 } },
      actualDeployment: {},
      declaredReserves: {}
    }
  };
  let persisted;
  const store = {
    async save(record) { persisted = JSON.parse(JSON.stringify(record)); return { id: "save-1", name: record.name }; },
    async load() { return { id: "save-1", name: persisted.name, game_state: persisted.state }; }
  };
  const session = makeSession(originalState);

  await saveCurrentBattle(store, session, { name: "Map persistence test" });
  assert.deepEqual(persisted.state.battlefieldMap.missionSetup, originalState.battlefieldMap.missionSetup);
  assert.deepEqual(persisted.state.battlefieldMap.deploymentPlan, originalState.battlefieldMap.deploymentPlan);
  assert.deepEqual(persisted.state.battlefieldMap.actualDeployment, {});

  session.replaceState({ version: 1, phase: "setup", players: [], units: [], objectives: [] });
  await restoreSavedBattle(store, session, "save-1");

  assert.deepEqual(session.readState().battlefieldMap.missionSetup, originalState.battlefieldMap.missionSetup);
  assert.deepEqual(session.readState().battlefieldMap.deploymentPlan, originalState.battlefieldMap.deploymentPlan);
  assert.deepEqual(session.readState().battlefieldMap.actualDeployment, {});
});

test("actual deployment updates do not overwrite the saved planning position", async () => {
  const { setActualDeploymentPosition } = await import("../src/engine/battlefield-map-transitions.js");
  const state = {
    battle: { status: "deployment" },
    units: [{ id: "unit-1", ownerId: "me", status: "ready", position: null }],
    history: [],
    battlefieldMap: {
      missionSetup: { myDisposition: "Take and Hold", opponentDisposition: "Disruption", layout: "B" },
      deploymentPlan: { "unit-1": { x: 12.5, y: 8 } },
      actualDeployment: {}
    }
  };

  const next = setActualDeploymentPosition(state, {
    unitId: "unit-1",
    playerId: "me",
    position: { x: 30, y: 20 }
  });

  assert.deepEqual(next.battlefieldMap.deploymentPlan["unit-1"], { x: 12.5, y: 8 });
  assert.deepEqual(next.battlefieldMap.actualDeployment["unit-1"], { x: 30, y: 20 });
  assert.deepEqual(next.battlefieldMap.missionSetup, state.battlefieldMap.missionSetup);
});


test("cloud save and resume preserve canonical objective identities, positions, and control", async () => {
  const objectives = [
    {
      id: "event-companion:Defender Home",
      name: "Defender Home",
      label: "Defender Home",
      layoutObjective: "Defender Home",
      position: { x: 6, y: 6 },
      control: { id: "event-companion:Defender Home", controllerId: "me", contestingPlayerIds: [], controlState: "controlled" }
    },
    {
      id: "event-companion:Attacker Home",
      name: "Attacker Home",
      label: "Attacker Home",
      layoutObjective: "Attacker Home",
      position: { x: 54, y: 38 },
      control: { id: "event-companion:Attacker Home", controllerId: null, contestingPlayerIds: ["me", "opponent"], controlState: "contested" }
    },
    { id: "event-companion:Central 1", name: "Central 1", label: "Central 1", layoutObjective: "Central 1", position: { x: 30, y: 22 }, control: null },
    { id: "event-companion:Expansion 1", name: "Expansion 1", label: "Expansion 1", layoutObjective: "Expansion 1", position: { x: 18, y: 22 }, control: null },
    { id: "event-companion:Expansion 2", name: "Expansion 2", label: "Expansion 2", layoutObjective: "Expansion 2", position: { x: 42, y: 22 }, control: null }
  ];
  const originalState = {
    version: 1,
    phase: "command",
    turn: 2,
    activePlayer: "me",
    players: [{ id: "me", name: "My Army" }, { id: "opponent", name: "Opponent" }],
    units: [],
    objectives,
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Take and Hold",
        opponentDisposition: "Disruption",
        layout: "B"
      },
      deploymentPlan: {},
      actualDeployment: {},
      declaredReserves: {}
    }
  };
  let persisted;
  const store = {
    async save(record) { persisted = JSON.parse(JSON.stringify(record)); return { id: "save-objectives", name: record.name }; },
    async load() { return { id: "save-objectives", name: persisted.name, game_state: persisted.state }; }
  };
  const session = makeSession(originalState);

  await saveCurrentBattle(store, session, { name: "Objective control persistence test" });
  session.replaceState({ version: 1, phase: "setup", players: [], units: [], objectives: [] });
  await restoreSavedBattle(store, session, "save-objectives");

  assert.deepEqual(session.readState().objectives, objectives);
  assert.equal(session.readState().objectives[0].control.controllerId, "me");
  assert.deepEqual(session.readState().objectives[1].control.contestingPlayerIds, ["me", "opponent"]);
  assert.deepEqual(session.readState().battlefieldMap.missionSetup, originalState.battlefieldMap.missionSetup);
});
