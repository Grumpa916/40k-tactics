import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import {
  drawSecondaryMission,
  discardSecondaryMission,
  recordSecondaryMissionScored,
  returnSecondaryMissionToDeck,
  getActiveSecondaryMissionDefinitions,
  getSecondaryMissionHistory,
  SECONDARY_MISSION_STATUS
} from "./secondary-mission-lifecycle.js";

const definition = {
  id: "sec-1",
  name: "Demo secondary",
  category: "secondary",
  timing: "end-of-turn",
  conditions: [{ evidence: "unit.status", args: {} }]
};

function drawFor(playerId = "p1", state = createGameState()) {
  return drawSecondaryMission(state, { definition, playerId, round: 1, turn: 1 });
}

function onlyEntry(state, playerId = "p1") {
  return getSecondaryMissionHistory(state, playerId)[0];
}

test("drawing a secondary makes it active and preserves draw timing", () => {
  const state = drawSecondaryMission(createGameState({ battle: { round: 2 }, turn: 4 }), {
    definition,
    playerId: "p1"
  });
  const entry = onlyEntry(state);
  assert.equal(entry.status, SECONDARY_MISSION_STATUS.ACTIVE);
  assert.equal(entry.drawnRound, 2);
  assert.equal(entry.drawnTurn, 4);
  assert.deepEqual(getActiveSecondaryMissionDefinitions(state, "p1").map((item) => item.id), ["sec-1"]);
  assert.equal(state.scoring.secondaryMissions.length, 1);
});

test("scoring is terminal, records one scoring event, and does not award VP", () => {
  const initial = drawFor();
  const entry = onlyEntry(initial);
  const next = recordSecondaryMissionScored(initial, {
    instanceId: entry.instanceId,
    playerId: "p1",
    round: 1,
    turn: 2,
    notes: "Player confirmed card completed"
  });
  const scored = onlyEntry(next);
  assert.equal(scored.status, SECONDARY_MISSION_STATUS.SCORED);
  assert.equal(scored.scoredRound, 1);
  assert.equal(scored.scoredTurn, 2);
  assert.deepEqual(scored.scoringHistory, [{ round: 1, turn: 2, notes: "Player confirmed card completed" }]);
  assert.deepEqual(getActiveSecondaryMissionDefinitions(next, "p1"), []);
  assert.equal(next.scoring.secondaryMissions.length, 1);
  assert.equal(next.scoring.victoryPoints, undefined);
  assert.equal(onlyEntry(initial).status, SECONDARY_MISSION_STATUS.ACTIVE);
});

test("a scored secondary cannot be scored, discarded, or returned to deck again", () => {
  let state = drawFor();
  const entry = onlyEntry(state);
  state = recordSecondaryMissionScored(state, {
    instanceId: entry.instanceId,
    playerId: "p1",
    round: 1,
    turn: 2
  });
  assert.throws(() => recordSecondaryMissionScored(state, {
    instanceId: entry.instanceId, playerId: "p1", round: 2, turn: 4
  }), /Only an active secondary mission can be score/);
  assert.throws(() => discardSecondaryMission(state, {
    instanceId: entry.instanceId, playerId: "p1", round: 2, turn: 4
  }), /Only an active secondary mission can be discard/);
  assert.throws(() => returnSecondaryMissionToDeck(state, {
    instanceId: entry.instanceId, playerId: "p1", round: 2, turn: 4
  }), /Only an active secondary mission can be return/);
  assert.equal(onlyEntry(state).scoringHistory.length, 1);
});

test("discarding removes a secondary from active opportunities but retains history", () => {
  let state = drawFor();
  const entry = onlyEntry(state);
  state = discardSecondaryMission(state, {
    instanceId: entry.instanceId, playerId: "p1", round: 1, turn: 2
  });
  assert.deepEqual(getActiveSecondaryMissionDefinitions(state, "p1"), []);
  assert.equal(onlyEntry(state).status, SECONDARY_MISSION_STATUS.DISCARDED);
  assert.equal(onlyEntry(state).discardedRound, 1);
  assert.equal(onlyEntry(state).discardedTurn, 2);
});

test("returning a card to deck is distinct from discarding and preserves its instance history", () => {
  let state = drawFor();
  const entry = onlyEntry(state);
  state = returnSecondaryMissionToDeck(state, {
    instanceId: entry.instanceId, playerId: "p1", round: 1, turn: 2
  });
  const returned = onlyEntry(state);
  assert.equal(returned.status, SECONDARY_MISSION_STATUS.RETURNED_TO_DECK);
  assert.equal(returned.returnedToDeckRound, 1);
  assert.equal(returned.returnedToDeckTurn, 2);
  assert.deepEqual(getActiveSecondaryMissionDefinitions(state, "p1"), []);
  assert.equal(getSecondaryMissionHistory(state).length, 1);
  assert.throws(() => returnSecondaryMissionToDeck(state, {
    instanceId: entry.instanceId, playerId: "p1", round: 1, turn: 3
  }), /Only an active secondary mission can be return/);
});

test("a returned card can be drawn again as a new instance", () => {
  let state = drawFor();
  const first = onlyEntry(state);
  state = returnSecondaryMissionToDeck(state, {
    instanceId: first.instanceId, playerId: "p1", round: 1, turn: 2
  });
  state = drawSecondaryMission(state, { definition, playerId: "p1", round: 2, turn: 3 });
  const history = getSecondaryMissionHistory(state, "p1");
  assert.equal(history.length, 2);
  assert.notEqual(history[0].instanceId, history[1].instanceId);
  assert.equal(history[0].status, SECONDARY_MISSION_STATUS.RETURNED_TO_DECK);
  assert.equal(history[1].status, SECONDARY_MISSION_STATUS.ACTIVE);
});

test("rejects primary definitions and duplicate active mission draws", () => {
  assert.throws(() => drawSecondaryMission(createGameState(), {
    definition: { ...definition, category: "primary" }, playerId: "p1"
  }), /categorized as secondary/);
  const state = drawFor();
  assert.throws(() => drawSecondaryMission(state, { definition, playerId: "p1" }), /already active/);
});

test("only the owning player may score, discard, or return an active secondary", () => {
  const state = drawFor();
  const entry = onlyEntry(state);
  assert.throws(() => recordSecondaryMissionScored(state, {
    instanceId: entry.instanceId, playerId: "p2"
  }), /owning player/);
  assert.throws(() => discardSecondaryMission(state, {
    instanceId: entry.instanceId, playerId: "p2"
  }), /owning player/);
  assert.throws(() => returnSecondaryMissionToDeck(state, {
    instanceId: entry.instanceId, playerId: "p2"
  }), /owning player/);
});
