import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync(new URL("../../src/ui/battle-shell.js", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../../battle.html", import.meta.url), "utf8");

test("live phase navigation opens an expandable mission review overlay", () => {
  assert.match(shell, /data-toggle-mission-review/);
  assert.match(shell, /data-battle-mission-summary-host/);
  assert.match(shell, /role="dialog" aria-modal="true"/);
  assert.match(shell, /data-close-mission-review/);
  assert.match(shell, /function handleMissionReview\(/);
  assert.match(shell, /function handleMissionReviewKeydown\(/);
  assert.match(shell, /event\.key !== "Escape"/);
  assert.match(page, /\.battle-shell__mission-review\[hidden\] \{ display:none !important; \}/);
  assert.doesNotMatch(shell, /tabletopExperiment \? '' : '<div data-battle-mission-summary-host>/);
});
