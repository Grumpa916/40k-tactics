import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../../src/ui/shooting-screen.js", import.meta.url), "utf8");

test("target selects defer rerender while ranged weapons use one-tap tiles", () => {
  assert.match(source, /function deferRenderAfterSelectDismissal\(select\)/);
  assert.match(source, /select\?\.blur\?\.\(\)/);
  assert.match(source, /requestAnimationFrame \?\? \(callback => globalThis\.setTimeout\(callback, 0\)\)/);
  assert.match(source, /nextFrame\(\(\) => nextFrame\(render\)\)/);
  assert.ok(source.includes('querySelectorAll("[data-shoot-weapon-choice]")'));
  assert.match(source, /deferRenderAfterSelectDismissal\(select\)/);
});
