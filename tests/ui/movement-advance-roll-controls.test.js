import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../src/ui/movement-screen.js', import.meta.url), 'utf8');

test('Movement advance roll buttons expose the selected value on touch screens', () => {
  assert.match(source, /Advance roll: <strong data-advance-roll-value>\$\{advanceRoll\}<\/strong>/);
  assert.match(source, /aria-pressed="\$\{value === advanceRoll\}"/);
  assert.match(source, /value === advanceRoll \? "is-selected" : ""/);
});

test('Movement advance roll tap reads the button attribute and the Advance command uses that value', () => {
  assert.match(source, /button\.hasAttribute\("data-advance-roll"\)/);
  assert.match(source, /advanceRoll = Number\(button\.getAttribute\("data-advance-roll"\)\)/);
  assert.match(source, /COMMAND_TYPES\.RESOLVE_ADVANCE, payload: \{ unitId: unit\.id, moves, advanceRoll \}/);
});
