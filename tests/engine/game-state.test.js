import test from "node:test";
import assert from "node:assert/strict";
import { createGameState, GAME_STATE_VERSION } from "../../src/engine/game-state.js";

test("creates the canonical initial game state", () => {
  const state = createGameState();
  assert.equal(state.version, GAME_STATE_VERSION);
  assert.equal(state.phase, "setup");
  assert.equal(state.turn, 0);
  assert.equal(state.activePlayer, null);
  assert.deepEqual(state.units, []);
  assert.deepEqual(state.history, []);
});
