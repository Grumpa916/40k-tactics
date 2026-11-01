import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('tabletop toolbar keeps compact tools and shooting damage controls are large iPad-safe touch targets', () => {
  const workspace = readFileSync(new URL('../../src/ui/prototype-workspace.js', import.meta.url), 'utf8');
  const shooting = readFileSync(new URL('../../src/ui/styles/shooting-panel.css', import.meta.url), 'utf8');

  assert.doesNotMatch(workspace, /data-workspace-focus/);
  assert.match(workspace, /prototype-phase-menu/);
  assert.match(shooting, /\.shoot-tabletop__damage \.damage-control__buttons \{[^}]*grid-template-columns:56px minmax\(48px,1fr\) 56px/);
  assert.match(shooting, /\.shoot-tabletop__damage \.damage-control__buttons button \{[^}]*min-width:56px; min-height:56px/);
  assert.match(shooting, /\.shoot-tabletop__footer \{[^}]*touch-action:manipulation/);
  assert.match(shooting, /\.shoot-tabletop__footer \* \{[^}]*touch-action:manipulation/);
});
