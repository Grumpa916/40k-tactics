import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("mission panels preserve explicit closed state across shell refreshes", () => {
  const source = fs.readFileSync(new URL("../../src/ui/battle-shell.js", import.meta.url), "utf8");
  assert.match(source, /missionOpenStates = openStates;/);
  assert.doesNotMatch(source, /missionOpenStates = \{ \.\.\.missionOpenStates, \.\.\.openStates \};/);
});

test("redundant secondary-manager copy is removed from the live Command view", () => {
  const source = fs.readFileSync(new URL("../../src/ui/command-screen.js", import.meta.url), "utf8");
  assert.match(source, /const secondaryMissionManager = state\.phase === "command"/);
  assert.doesNotMatch(source, /<h2>Enter secondary mission cards<\/h2>/);
  assert.doesNotMatch(source, /<h3>Secondary mission history<\/h3>/);
  assert.doesNotMatch(source, /The catalog contains names and Fixed\/Tactical availability/);
});

test("secondary mission cards show mission text without the old verification warning", () => {
  const source = fs.readFileSync(new URL("../../src/ui/mission-summary-panel.js", import.meta.url), "utf8");
  assert.match(source, /<strong>Mission text<\/strong>/);
  assert.doesNotMatch(source, /Rules text or scoring criteria are not fully verified/);
  assert.doesNotMatch(source, /Check the printed card/);
});
