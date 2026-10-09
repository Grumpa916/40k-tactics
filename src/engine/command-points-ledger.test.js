import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import {
  recordCommandPointChange,
  getCommandPointBalance,
  getCommandPointHistory
} from "./command-points-ledger.js";

test("records a Command Point gain with balance and history", () => {
  const initial = createGameState({ turn: 1, battle: { round: 1 }, commandPoints: { p1: 0 } });
  const next = recordCommandPointChange(initial, {
    playerId: "p1", amount: 1, reason: "gain", note: "Command phase", turn: 1, round: 1
  });
  assert.equal(getCommandPointBalance(next, "p1"), 1);
  assert.equal(next.history.at(-1).type, "command_points.changed");
  assert.deepEqual(next.history.at(-1).payload, {
    playerId: "p1", amount: 1, reason: "gain", note: "Command phase",
    turn: 1, round: 1, balanceBefore: 0, balanceAfter: 1
  });
  assert.equal(initial.commandPoints.p1, 0);
  assert.equal(initial.history.length, 0);
});

test("records spending and preserves object-shaped balance metadata", () => {
  const state = createGameState({ commandPoints: { p1: { current: 3, source: "test" } } });
  const next = recordCommandPointChange(state, { playerId: "p1", amount: -2, reason: "spend", note: "Re-roll" });
  assert.deepEqual(next.commandPoints.p1, { current: 1, source: "test" });
  assert.equal(getCommandPointHistory(next, "p1").length, 1);
});

test("rejects invalid amounts, reasons, and spending below zero", () => {
  const state = createGameState({ commandPoints: { p1: 1 } });
  assert.throws(() => recordCommandPointChange(state, { playerId: "p1", amount: 0, reason: "gain" }), /non-zero integer/);
  assert.throws(() => recordCommandPointChange(state, { playerId: "p1", amount: -1, reason: "gain" }), /gain must use a positive/);
  assert.throws(() => recordCommandPointChange(state, { playerId: "p1", amount: 1, reason: "spend" }), /spend must use a negative/);
  assert.throws(() => recordCommandPointChange(state, { playerId: "p1", amount: 2, reason: "spend" }), /spend must use a negative/);
  assert.throws(() => recordCommandPointChange(state, { playerId: "p1", amount: -2, reason: "adjustment" }), /cannot be negative/);
});

test("filters Command Point history by player", () => {
  let state = createGameState();
  state = recordCommandPointChange(state, { playerId: "p1", amount: 1, reason: "gain" });
  state = recordCommandPointChange(state, { playerId: "p2", amount: 1, reason: "gain" });
  assert.equal(getCommandPointHistory(state).length, 2);
  assert.equal(getCommandPointHistory(state, "p1").length, 1);
});
