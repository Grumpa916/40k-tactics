import test from 'node:test';
import assert from 'node:assert/strict';
import { renderShootingTargetChoices } from '../../src/ui/shooting-target-picker.js';
import { readFileSync } from 'node:fs';

const screenSource = readFileSync(new URL('../../src/ui/shooting-screen.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../src/ui/styles/shooting-panel.css', import.meta.url), 'utf8');

const targets = [{unitId:'enemy-a', name:'First enemy'}, {unitId:'enemy-b', name:'Second enemy'}];

test('target tiles stay selectable across repeated changes with an explicit clear action', () => {
  const html=renderShootingTargetChoices(targets,'enemy-b',{hasWeapon:true});
  assert.match(html,/role="group" aria-label="Shooting target"/);
  assert.match(html,/data-shoot-target-choice="enemy-b" aria-pressed="true"/);
  assert.match(html,/data-shoot-target-choice="enemy-a" aria-pressed="false"/);
  assert.match(html,/data-shoot-target-clear/);
  assert.doesNotMatch(html,/<select/);
  const cleared=renderShootingTargetChoices(targets,null,{hasWeapon:true});
  assert.doesNotMatch(cleared,/data-shoot-target-clear/);
  assert.match(cleared,/data-shoot-target-choice="enemy-b" aria-pressed="false"/);
  assert.match(css,/\.shoot-target-picker__choices button\s*\{[\s\S]*?min-height:48px;/);
});

test('no eligible targets displays why a weapon cannot currently be used', () => {
  const html=renderShootingTargetChoices([],null,{hasWeapon:true});
  assert.match(html,/No eligible targets for this weapon under recorded engagement/);
  assert.match(html,/Try another weapon or review engagement/);
  assert.doesNotMatch(html,/data-shoot-target-choice=/);
});

test('target labels and identifiers are HTML-escaped', () => {
  const html=renderShootingTargetChoices([{unitId:'bad"x',name:'<enemy>'}],'bad"x');
  assert.match(html,/data-shoot-target-choice="bad&quot;x"/);
  assert.match(html,/&lt;enemy&gt;/);
  assert.doesNotMatch(html,/<enemy>/);
});

test('live Shooting uses tap choices; classic mode retains its native target select', () => {
  assert.match(screenSource,/renderShootingTargetChoices\(targets, selectedTargetId/);
  assert.match(screenSource,/querySelectorAll\("\[data-shoot-target-choice\]"\)/);
  assert.match(screenSource,/querySelector\("\[data-shoot-target-clear\]"\)/);
  assert.match(screenSource,/activeActivation \|\| weapons.length \|\| targets.length/);
  assert.match(screenSource,/<label>Target<select data-target/);
  assert.match(screenSource,/const targetId = container.querySelector\("\[data-target\]"\)\?\.value \|\| selectedTargetId/);
});
