import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { renderMissionReviewPanel } from "../../src/ui/mission-review-panel.js";

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
  assert.match(page, /\.battle-shell__mission-review-dialog \{[^}]*max-height:calc\(100dvh - 32px\)[^}]*overflow-y:auto/);
  assert.doesNotMatch(shell, /tabletopExperiment \? '' : '<div data-battle-mission-summary-host>/);
});

test("mission review exposes scoring details on first open and respects later collapsed choices", () => {
  const summary = '<section class="battle-mission-summary">' +
    '<details class="battle-mission-summary__section" data-mission-summary-key="mission-section-primary"><summary>Primary</summary>' +
    '<div class="battle-mission-summary__section-content"><details class="battle-mission-summary__player" data-mission-summary-key="mission-primary-player-p1">' +
    '<summary>Consecrate</summary><div class="battle-mission-summary__detail">Primary scoring text</div></details></div></details>' +
    '<details class="battle-mission-summary__section" data-mission-summary-key="mission-section-secondary"><summary>Secondary</summary>' +
    '<div class="battle-mission-summary__section-content"><details class="battle-mission-summary__player" data-mission-summary-key="mission-secondary-player-p1">' +
    '<summary>You</summary><div class="battle-mission-summary__detail"><details class="battle-mission-summary__card" data-mission-summary-key="mission-secondary-card-a">' +
    '<summary>Cleanse</summary><div class="battle-mission-summary__detail">Secondary scoring text</div></details></div></details></div></details></section>';
  const initial = renderMissionReviewPanel(summary, { open: true });
  assert.equal((initial.match(/<details[^>]* open>/g) ?? []).length, 5);
  assert.match(initial, /Primary scoring text/);
  assert.match(initial, /Secondary scoring text/);

  const restored = renderMissionReviewPanel(summary, { open: true, openStates: { "mission-secondary-card-a": false } });
  assert.equal((restored.match(/<details[^>]* open>/g) ?? []).length, 4);
  assert.match(restored, /<details class="battle-mission-summary__card" data-mission-summary-key="mission-secondary-card-a"><summary>Cleanse/);
  assert.match(shell, /renderMissionReviewPanel\(persistentMissionSummary, \{ open: missionReviewOpen, openStates: missionOpenStates \}\)/);
});

test("landscape mission review keeps both missions side by side with separate scrolling", () => {
  const html = renderMissionReviewPanel('<section class="battle-mission-summary"><details class="battle-mission-summary__section"><summary>Primary</summary></details><details class="battle-mission-summary__section"><summary>Secondary</summary></details></section>', { open: true });
  assert.match(html, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(html, /grid-template-rows:minmax\(0,1fr\)/);
  assert.match(html, /battle-mission-summary__section\{min-height:0;max-height:100%;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch/);
  assert.match(html, /battle-mission-summary__section>summary\{position:sticky;top:0/);
  assert.match(html, /orientation:portrait[\s\S]*grid-template-columns:minmax\(0,1fr\)!important/);
});
