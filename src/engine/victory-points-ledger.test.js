import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import {
  recordVictoryPointsAward,
  getVictoryPointScore,
  getVictoryPointHistory
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
