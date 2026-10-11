import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import { setEventCompanionMissionSetup } from "./battlefield-map-transitions.js";

test("Event Companion mission setup is saved in battlefield map state and history", () => {
  const initial = createGameState();
  const next = setEventCompanionMissionSetup(initial, {
    myDisposition: "Take and Hold",
    opponentDisposition: "Disruption",
    layout: "B"
  });
  assert.deepEqual(next.battlefieldMap.missionSetup, {
    myDisposition: "Take and Hold",
    opponentDisposition: "Disruption",
    layout: "B"
  });
  assert.equal(next.history.at(-1).type, "battlefield_map.event_companion_mission_setup_set");
  assert.equal(initial.battlefieldMap, undefined);
});

test("Event Companion mission setup can save one disposition before the other", () => {
  const next = setEventCompanionMissionSetup(createGameState(), {
    myDisposition: "Take and Hold",
    opponentDisposition: null,
    layout: "A"
  });
  assert.equal(next.battlefieldMap.missionSetup.myDisposition, "Take and Hold");
  assert.equal(next.battlefieldMap.missionSetup.opponentDisposition, null);
});

test("Event Companion mission setup rejects invalid dispositions and layouts", () => {
  const state = createGameState();
  assert.throws(() => setEventCompanionMissionSetup(state, {
    myDisposition: "Unknown", opponentDisposition: "Disruption", layout: "A"
  }), /valid Force Disposition/);
  assert.throws(() => setEventCompanionMissionSetup(state, {
    myDisposition: "Take and Hold", opponentDisposition: "Disruption", layout: "D"
  }), /layout A, B, or C/);
});

test("Event Companion mission setup locks after deployment begins", () => {
  const state = createGameState({ battle: { status: "deployment" } });
  assert.throws(() => setEventCompanionMissionSetup(state, {
    myDisposition: "Take and Hold", opponentDisposition: "Disruption", layout: "A"
  }), /locked after deployment begins/);
});
