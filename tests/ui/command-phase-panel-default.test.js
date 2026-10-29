import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../../src/ui/battle-shell.js", import.meta.url), "utf8");

test("right references panel opens when Command starts or is selected", () => {
  assert.match(source, /let rightPanelCollapsed = false/);
  assert.match(source, /if \(actualPhase === "command"\) rightPanelCollapsed = false/);
  assert.match(source, /function openRightPanel\(\)/);
  assert.match(source, /if \(nextPhase === "command"\) openRightPanel\(\)/);
  assert.match(source, /openRightPanel\(\);\s*viewedPhase = "command"/);
  assert.match(source, /data-right-collapsed", "false"/);
  assert.match(source, /aria-expanded", "true"/);
});
