import test from "node:test";
import assert from "node:assert/strict";
import * as engine from "../../src/engine/index.js";

test("engine entrypoint exposes Fight state query", () => {
  assert.equal(typeof engine.getFightState, "function");
});
