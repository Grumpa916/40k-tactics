import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import {
  recordVictoryPointsAward,
  getVictoryPointScore,
  getVictoryPointHistory,
  undoLatestVictoryPointsAward,
  getLatestUndoableVictoryPointsAward
} from "./victory-points-ledger.js";

test("records a confirmed VP award and updates only that player's score", () => {
  const initial = createGameState({ turn: 2, battle: { round: 1 }, victoryPoints: { p1: 5, p2: 3 } });
  const next = recordVictoryPointsAward(initial, {
    playerId: "p1", amount: 4, reason: "Hold objective", turn: 2, round: 1
  });
  assert.equal(getVictoryPointScore(next, "p1"), 9);
  assert.equal(getVictoryPointScore(next, "p2"), 3);
  assert.deepEqual(getVictoryPointHistory(next, "p1"), [{
    playerId: "p1", amount: 4, reason: "Hold objective", turn: 2, round: 1,
    scoreBefore: 5, scoreAfter: 9
  }]);
  assert.equal(initial.victoryPoints.p1, 5);
  assert.equal(initial.history.length, 0);
  assert.equal(next.history.at(-1).type, "victory_points.awarded");
});

test("records VP awards for both players and filters history", () => {
  let state = createGameState();
  state = recordVictoryPointsAward(state, { playerId: "p1", amount: 3, reason: "Primary" });
  state = recordVictoryPointsAward(state, { playerId: "p2", amount: 5, reason: "Secondary" });
  assert.equal(getVictoryPointScore(state, "p1"), 3);
  assert.equal(getVictoryPointScore(state, "p2"), 5);
  assert.equal(getVictoryPointHistory(state).length, 2);
  assert.equal(getVictoryPointHistory(state, "p2")[0].reason, "Secondary");
});

test("rejects invalid awards and invalid round metadata", () => {
  const state = createGameState();
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: 0, reason: "Primary" }), /positive integer/);
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: -1, reason: "Primary" }), /positive integer/);
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: 1.5, reason: "Primary" }), /positive integer/);
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: 1, reason: "  " }), /reason is required/);
  assert.throws(() => recordVictoryPointsAward(state, { playerId: "p1", amount: 1, reason: "Primary", round: -1 }), /Round must be/);
});


test("undoes only the latest VP award and appends an auditable reversal", () => {
  let state = createGameState({ victoryPoints: { p1: 5, p2: 3 } });
  state = recordVictoryPointsAward(state, {
    playerId: "p1", amount: 4, reason: "Hold objective",
    missionDefinitionId: "primary-1", category: "primary", opportunityKey: "round-1-end"
  });
  assert.equal(getLatestUndoableVictoryPointsAward(state, "p1").amount, 4);

  const undone = undoLatestVictoryPointsAward(state, {
    playerId: "p1", reason: "Entered the wrong amount", round: 1, turn: 2
  });
  assert.equal(getVictoryPointScore(undone, "p1"), 5);
  assert.equal(getVictoryPointScore(undone, "p2"), 3);
  assert.equal(undone.history.length, 2);
  assert.equal(undone.history[0].type, "victory_points.awarded");
  assert.equal(undone.history[1].type, "victory_points.award_undone");
  assert.equal(undone.history[1].payload.amount, 4);
  assert.equal(undone.history[1].payload.reason, "Entered the wrong amount");
  assert.equal(undone.history[1].payload.missionDefinitionId, "primary-1");
  assert.equal(getLatestUndoableVictoryPointsAward(undone, "p1"), null);
  assert.equal(state.victoryPoints.p1, 9);
});

test("refuses to undo when another history event followed the award", () => {
  let state = createGameState();
  state = recordVictoryPointsAward(state, { playerId: "p1", amount: 2, reason: "Primary" });
  state = { ...state, history: [...state.history, { type: "mission.scoring_event", payload: {} }] };
  assert.equal(getLatestUndoableVictoryPointsAward(state, "p1"), null);
  assert.throws(() => undoLatestVictoryPointsAward(state, { playerId: "p1" }), /Only the latest history event/);
  assert.equal(getVictoryPointScore(state, "p1"), 2);
});

test("refuses undo if current score does not match the award result", () => {
  let state = createGameState({ victoryPoints: { p1: 9 } });
  state = recordVictoryPointsAward(state, { playerId: "p1", amount: 4, reason: "Primary" });
  state = { ...state, victoryPoints: { ...state.victoryPoints, p1: 10 } };
  assert.equal(getLatestUndoableVictoryPointsAward(state, "p1"), null);
  assert.throws(() => undoLatestVictoryPointsAward(state, { playerId: "p1" }), /no longer matches/);
  assert.equal(getVictoryPointScore(state, "p1"), 10);
});

test("refuses undo when the latest VP award belongs to the other player", () => {
  let state = createGameState();
  state = recordVictoryPointsAward(state, { playerId: "p1", amount: 2, reason: "Primary" });
  state = recordVictoryPointsAward(state, { playerId: "p2", amount: 3, reason: "Secondary" });
  assert.equal(getLatestUndoableVictoryPointsAward(state, "p1"), null);
  assert.throws(() => undoLatestVictoryPointsAward(state, { playerId: "p1" }), /latest history event/);
});
