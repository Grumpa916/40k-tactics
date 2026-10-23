import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRosterRows } from '../../src/ui/army-roster-rows.js';
import { renderUnitDetails } from '../../src/ui/army-unit-details.js';

test('existing Space Marines roster snapshots backfill catalog stats without rewriting the saved roster', () => {
  const legacyUnit = {
    id: 'legacy-captain',
    name: 'Captain in Gravis Armour',
    datasheetId: 'space-marines:captain-in-gravis-armour',
    modelCount: 1,
    points: 90,
    datasheet: null
  };
  assert.match(renderRosterRows([legacyUnit], '', 'Space Marines'), /<small>T<\/small><strong>6<\/strong>/);
  assert.match(renderUnitDetails(legacyUnit, { current: { faction: 'Space Marines' } }), /<small>Sv<\/small><strong>3\+<\/strong>/);
});
