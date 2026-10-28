import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('mission Action picker no longer shows a generic Verify at selector', () => {
  const source=fs.readFileSync(new URL('../../src/ui/mission-action-picker.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/>Verify at<select/);
  assert.match(source,/Scoring check/);
  assert.match(source,/Set automatically from the active mission/);
  assert.match(source,/Action requirements met/);
  assert.match(source,/Physical card confirms this is a Shooting-phase Action/);
});

test('mission Action picker limits selectable timing to mission-provided windows', () => {
  const source=fs.readFileSync(new URL('../../src/ui/mission-action-picker.js',import.meta.url),'utf8');
  assert.match(source,/allowedTimings\.map\(id=>/);
  assert.doesNotMatch(source,/Object\.entries\(labels\)\.map/);
});

test('iPad Action picker uses one readable column and a full-width confirmation row', () => {
  const css=fs.readFileSync(new URL('../../src/ui/styles/mission-action-picker.css',import.meta.url),'utf8');
  assert.match(css,/shoot-tabletop__action-picker\.mission-action-picker\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/mission-action-picker__confirm\{display:grid!important;grid-template-columns:28px minmax\(0,1fr\)!important/);
  assert.match(css,/mission-action-picker__note/);
});

test('mission Action options expose structured Shooting Action metadata', () => {
  const source=fs.readFileSync(new URL('../../src/rules/mission-action-state.js',import.meta.url),'utf8');
  assert.match(source,/getCompleteSecondaryMissionById/);
  assert.match(source,/knownShootingAction:missionAction\?\.phase === 'shooting'/);
  assert.match(source,/actionSummary:missionAction\?\.summary/);
});
