import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync(new URL("../../src/ui/battle-shell.js", import.meta.url), "utf8");
const panel = fs.readFileSync(new URL("../../src/ui/mission-review-panel.js", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../battle.html", import.meta.url), "utf8");

test("live phase navigation opens an expandable mission review overlay", () => {
  assert.match(shell, /renderMissionReviewToggle/);
  assert.match(shell, /renderMissionReviewPanel/);
  assert.match(panel, /data-battle-mission-summary-host/);
  assert.match(panel, /role="dialog" aria-modal="true"/);
  assert.match(panel, /data-close-mission-review/);
  assert.match(panel, /data-toggle-mission-review/);
  assert.match(panel, /event\.key !== "Escape"/);
  assert.match(page, /\.battle-shell__mission-review\[hidden\] \{ display:none !important; \}/);
  assert.doesNotMatch(shell, /tabletopExperiment \? '' : '<div data-battle-mission-summary-host>/);
});
