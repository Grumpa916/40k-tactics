import test from "node:test";
import assert from "node:assert/strict";
import { createChargeScreen } from "../../src/ui/charge-screen.js";

test("Charge screen module exposes a browser-safe screen factory", () => {
  assert.equal(typeof createChargeScreen, "function");
});
