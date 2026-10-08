import test from "node:test";
import assert from "node:assert/strict";
import { createShootingScreen } from "../../src/ui/shooting-screen.js";

test("Shooting screen module exposes a browser-safe screen factory", () => {
  assert.equal(typeof createShootingScreen, "function");
});
