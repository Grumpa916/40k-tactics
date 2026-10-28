import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../src/ui/movement-screen.js', import.meta.url), 'utf8');

test('Movement Advance refinement starts unselected and requires an explicit touch choice', () => {
  assert.match(source, /let advanceRoll = null;/);
  assert.match(source, /const canRefine = action && action\.type !== 'unit\.stationary_recorded';/);
  assert.match(source, /Advance roll: <strong data-advance-roll-value>\$\{advanceReady \? advanceRoll : "—"\}<\/strong>/);
  assert.match(source, /aria-pressed="\$\{value === advanceRoll\}"/);
  assert.match(source, /data-refine-advance\$\{advanceReady \? "" : " disabled"\}/);
  assert.match(source, /\$\{advanceReady \? `Mark Advance \+\$\{advanceRoll\}\\"` : "Select Advance roll"\}/);
});

test('Movement Advance roll tap validates the button value and refinement uses it', () => {
  assert.match(source, /button\.hasAttribute\("data-advance-roll"\)/);
  assert.match(source, /const nextRoll = Number\(button\.getAttribute\("data-advance-roll"\)\)/);
  assert.match(source, /nextRoll < 1 \|\| nextRoll > 6/);
  assert.match(source, /button\.hasAttribute\("data-refine-advance"\)/);
  assert.match(source, /Select the Advance roll \(1–6\) first\./);
  assert.match(source, /COMMAND_TYPES\.REFINE_MOVEMENT_ACTION, payload: \{ unitId: unit\.id, movementType: 'advance', advanceRoll \}/);
});

test('Movement clears stale Advance rolls when changing units or completing refinement', () => {
  assert.match(source, /if \(unitId !== selectedUnitId\) advanceRoll = null;/);
  assert.match(source, /COMMAND_TYPES\.REFINE_MOVEMENT_ACTION[\s\S]*movementType: 'advance', advanceRoll[\s\S]*advanceRoll = null;/);
});

test('Recorded Advance refinement status includes the saved roll', () => {
  assert.match(source, /function movementActionLabel\(action, refinement = null\)/);
  assert.match(source, /refinement\?\.movementType === 'advance'/);
  assert.match(source, /return Number\.isInteger\(roll\) \? `Advance recorded · \+\$\{roll\}\\"` : "Advance recorded";/);
  assert.match(source, /movementActionLabel\(action, refinement\)/);
});
