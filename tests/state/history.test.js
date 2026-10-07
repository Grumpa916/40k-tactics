import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { appendHistoryEntry, getHistory } from "../../src/state/history.js";

test("appends events without mutating prior state", () => {
  const state = createGameState();
  const event = { type: "PHASE_CHANGED", payload: { phase: "movement" } };
  const next = appendHistoryEntry(state, event);
  assert.deepEqual(state.history, []);
  assert.deepEqual(next.history, [event]);
  assert.deepEqual(getHistory(next), [event]);
});
