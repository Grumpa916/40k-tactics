import test from "node:test";
import assert from "node:assert/strict";
import { createEvent } from "../../src/events/event.js";

test("creates a typed event with payload and metadata", () => {
  assert.deepEqual(
    createEvent("PHASE_CHANGED", { phase: "movement" }, { source: "engine" }),
    {
      type: "PHASE_CHANGED",
      payload: { phase: "movement" },
      metadata: { source: "engine" }
    }
  );
});
