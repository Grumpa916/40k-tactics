import test from "node:test";
import assert from "node:assert/strict";
import { createTurn } from "../../src/state/turn.js";

test("creates a command phase turn", () => {
  assert.deepEqual(
    createTurn({ number: 1, activePlayerId: "p1" }),
    { number: 1, activePlayerId: "p1", phase: "command" }
  );
});
