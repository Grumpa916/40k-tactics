import test from "node:test";
import assert from "node:assert/strict";
import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { createGameState } from "../state/game-state.js";
import { setEventCompanionMissionSetup } from "./battlefield-map-transitions.js";

function assertObjectivesMatchPage(state, page) {
  const expected = EVENT_COMPANION_MAP_CATALOG.layouts.find((layout) => Number(layout.page) === Number(page));
  assert.ok(expected, `Event Companion page ${page} exists in the verified map catalog`);
  for (const [name, position] of Object.entries(expected.objectivePositions ?? {})) {
    const objective = (state.objectives ?? []).find((item) => item?.layoutObjective === name);
    assert.ok(objective, `${name} is synchronized from page ${page}`);
    assert.deepEqual(objective.position, position, `${name} uses page ${page}'s verified position`);
  }
}

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

test("setup uses the Page 18 map for Take and Hold vs Reconnaissance layout A", () => {
  const next = setEventCompanionMissionSetup(createGameState(), {
    myDisposition: "Take and Hold",
    opponentDisposition: "Reconnaissance",
    layout: "A"
  });
  assertObjectivesMatchPage(next, 18);
});

test("reversing those dispositions still resolves the same mission-pair map block", () => {
  const next = setEventCompanionMissionSetup(createGameState(), {
    myDisposition: "Reconnaissance",
    opponentDisposition: "Take and Hold",
    layout: "C"
  });
  assertObjectivesMatchPage(next, 20);
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