import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../src/ui/battle-demo.js', import.meta.url), 'utf8');

test('top-level mission summaries toggle exactly once on Safari', () => {
  assert.match(source, /bindMissionSummaryToggle/);
  assert.match(source, /\.battle-mission-summary__section > summary/);
  assert.match(source, /stopImmediatePropagation/);
  assert.match(source, /event\.preventDefault\?\.\(\)/);
  assert.match(source, /summary\.parentElement\.open = !summary\.parentElement\.open/);
});

test('native mission-summary protection is installed before the battle shell mounts', () => {
  const bindIndex = source.indexOf('bindMissionSummaryToggle(root);');
  const shellIndex = source.indexOf('createBattleShell(root');
  assert.ok(bindIndex >= 0);
  assert.ok(shellIndex >= 0);
  assert.ok(bindIndex < shellIndex);
});
