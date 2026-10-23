import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { unitStats, renderUnitDetails } from '../../src/ui/army-unit-details.js';

test('Space Marines catalog units expose datasheet characteristics in Army Builder', () => {
  const captain = findArmyUnitCandidates({ faction: 'Space Marines' }).find((unit) => unit.name === 'Captain in Gravis Armour');
  assert.ok(captain);
  assert.equal(captain.datasheet.characteristics.Move, '5"');
  assert.equal(captain.datasheet.characteristics.Toughness, '6');
  assert.equal(captain.datasheet.characteristics.Save, '3+');
  assert.equal(captain.datasheet.characteristics['Invulnerable save'], '4+');
  const stats = unitStats(captain);
  assert.match(stats, /5&quot;/);
  assert.match(stats, /Inv 4\+/);
  assert.match(renderUnitDetails(captain), /<small>T<\/small><strong>6<\/strong>/);
});
