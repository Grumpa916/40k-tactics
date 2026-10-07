import test from "node:test";
import assert from "node:assert/strict";
import { createTurn } from "../../src/state/turn.js";

test("creates a turn at its start step", () => {
  assert.deepEqual(
    createTurn({ number: 1, activePlayerId: "p1" }),
    { number: 1, activePlayerId: "p1", phase: "start_turn" }
  );
});

test("turn state accepts the end step", () => {
  assert.deepEqual(
    createTurn({ number: 2, activePlayerId: "p2", phase: "end_turn" }),
    { number: 2, activePlayerId: "p2", phase: "end_turn" }
  );
});
