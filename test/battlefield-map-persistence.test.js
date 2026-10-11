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
