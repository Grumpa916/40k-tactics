import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../src/ui/movement-screen.js', import.meta.url), 'utf8');

test('Movement advance roll starts unselected and requires an explicit touch choice', () => {
  assert.match(source, /let advanceRoll = null;/);
  assert.match(source, /Advance roll: <strong data-advance-roll-value>\$\{advanceReady \? advanceRoll : "—"\}<\/strong>/);
  assert.match(source, /aria-pressed="\$\{value === advanceRoll\}"/);
  assert.match(source, /data-move-advance\$\{advanceReady \? "" : " disabled"\}/);
  assert.match(source, /\$\{advanceReady \? `Advance \+\$\{advanceRoll\}\\"` : "Select roll first"\}/);
});

test('Movement advance roll tap validates the button value and the Advance command uses it', () => {
  assert.match(source, /button\.hasAttribute\("data-advance-roll"\)/);
  assert.match(source, /const nextRoll = Number\(button\.getAttribute\("data-advance-roll"\)\)/);
  assert.match(source, /nextRoll < 1 \|\| nextRoll > 6/);
  assert.match(source, /Select the Advance roll \(1–6\) first\./);
  assert.match(source, /COMMAND_TYPES\.RESOLVE_ADVANCE, payload: \{ unitId: unit\.id, moves, advanceRoll \}/);
});

test('Movement clears stale Advance rolls when changing units or completing movement', () => {
  assert.match(source, /if \(unitId !== selectedUnitId\) advanceRoll = null;/);
  assert.match(source, /session\.dispatch\(\{ type: COMMAND_TYPES\.RESOLVE_ADVANCE[\s\S]*advanceRoll = null;/);
});

test('Recorded Advance status includes the saved roll', () => {
  assert.match(source, /action\.type === "unit\.advanced"/);
  assert.match(source, /return `\$\{base\} · \+\$\{roll\}\\"`;/);
  assert.match(source, /movementActionLabel\(action\)/);
});
