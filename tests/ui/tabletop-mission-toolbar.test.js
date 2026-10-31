import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync(new URL("../../src/ui/battle-shell.js", import.meta.url), "utf8");
const workspace = fs.readFileSync(new URL("../../src/ui/prototype-workspace.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../../src/ui/styles/prototype-workspace.css", import.meta.url), "utf8");

test("Missions is a visible, labeled control in the tabletop phase toolbar", () => {
  assert.match(shell, /layoutMode !== "tabletop" && PHASES\.some/);
  assert.match(shell, /renderPrototypeWorkspaceTools\(\{ missionReviewOpen \}\)/);
  assert.match(workspace, /prototype-missions-button[^>]*data-toggle-mission-review/);
  assert.match(workspace, /Missions<\/button>/);
  assert.match(workspace, /live-controls-3/);
  assert.match(styles, /prototype-missions-button/);
});
