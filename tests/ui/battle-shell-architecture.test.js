import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setupContinueLabel, setupTabLabel } from "../../src/ui/setup-navigation-labels.js";
import { phaseLabel, renderScoreAdjustStyles } from "../../src/ui/battle-shell-scoreboard.js";

const shell = readFileSync(new URL("../../src/ui/battle-shell.js", import.meta.url), "utf8");
const command = readFileSync(new URL("../../src/ui/command-screen.js", import.meta.url), "utf8");

const BATTLE_SHELL_MAX_BYTES = 50 * 1024;

test("battle shell remains a coordinator below the 50 KiB growth guardrail", () => {
  const bytes = Buffer.byteLength(shell, "utf8");
  assert.ok(
    bytes <= BATTLE_SHELL_MAX_BYTES,
    `battle-shell.js is ${bytes} bytes; extract focused behavior before exceeding ${BATTLE_SHELL_MAX_BYTES}`
  );
});

test("battle shell delegates scoreboard and setup label rendering to focused modules", () => {
  assert.match(shell, /from ["']\.\/battle-shell-scoreboard\.js["']/);
  assert.match(shell, /from ["']\.\/setup-navigation-labels\.js["']/);
  assert.doesNotMatch(shell, /function renderScoreAdjustOverlay\s*\(/);
  assert.doesNotMatch(shell, /function renderStatusSummaryContent\s*\(/);
  assert.doesNotMatch(shell, /function setupTabLabel\s*\(/);
  assert.doesNotMatch(shell, /function setupContinueLabel\s*\(/);
});

test("extracted shell helpers preserve phase and setup navigation labels", () => {
  assert.equal(phaseLabel("command"), "Command");
  assert.equal(phaseLabel("deployment"), "Deployment");
  assert.equal(setupTabLabel("battlefield"), "Step 3 · Terrain Setup");
  assert.equal(setupContinueLabel("army-selection"), "Continue to Prepare Game");
  assert.match(renderScoreAdjustStyles(), /battle-shell__score-adjust-backdrop/);
});

test("shell markup and Command secondary presentation stay in focused modules", () => {
  assert.match(shell, /from ["']\.\/battle-shell-view\.js["']/);
  assert.doesNotMatch(shell, /function renderShell\s*\(/);
  assert.match(command, /from ["']\.\/command-secondary-view\.js["']/);
  assert.ok(Buffer.byteLength(command, "utf8") <= 50 * 1024,
    "Command screen should extract focused behavior before growing past 50 KiB");
});
