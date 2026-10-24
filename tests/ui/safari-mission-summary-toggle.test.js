import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../src/ui/battle-demo.js', import.meta.url), 'utf8');

test('top-level mission summaries keep native details toggling on Safari', () => {
  assert.match(source, /bindNativeMissionSummaryToggle/);
  assert.match(source, /\.battle-mission-summary__section > summary/);
  assert.match(source, /stopImmediatePropagation/);
  assert.doesNotMatch(source, /bindNativeMissionSummaryToggle[\s\S]*?preventDefault/);
});

test('native mission-summary protection is installed before the battle shell mounts', () => {
  const bindIndex = source.indexOf('bindNativeMissionSummaryToggle(root);');
  const shellIndex = source.indexOf('createBattleShell(root');
  assert.ok(bindIndex >= 0);
  assert.ok(shellIndex >= 0);
  assert.ok(bindIndex < shellIndex);
});
