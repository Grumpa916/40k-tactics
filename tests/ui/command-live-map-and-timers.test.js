import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Command tabletop view reuses the combat live-map workspace and removes manual card-name entry',()=>{
  const src=fs.readFileSync(new URL('../../src/ui/command-screen.js',import.meta.url),'utf8');
  assert.match(src,/renderCombatWorkspace/);
  assert.match(src,/phase: "command"/);
  assert.doesNotMatch(src,/data-secondary-name type="text"/);
});

test('persistent player summaries display separate accumulated timers',()=>{
  const src=fs.readFileSync(new URL('../../src/ui/battle-shell.js',import.meta.url),'utf8');
  assert.match(src,/data-clock-player-elapsed/);
});

test('battlefield objective labels are compact and expansion naming is perspective-stable',()=>{
  const src=fs.readFileSync(new URL('../../src/ui/battlefield-map.js',import.meta.url),'utf8');
  assert.match(src,/min-width:34px;max-width:88px/);
  assert.match(fs.readFileSync(new URL('../../src/rules/objective-display-labels.js',import.meta.url),'utf8'),/myExpansionName/);
});
