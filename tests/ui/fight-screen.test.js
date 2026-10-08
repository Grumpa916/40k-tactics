import test from "node:test";
import assert from "node:assert/strict";
import { createFightScreen } from "../../src/ui/fight-screen.js";

test("Fight screen module exposes a browser-safe screen factory", () => {
  assert.equal(typeof createFightScreen, "function");
});
