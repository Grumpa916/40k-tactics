import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';

const exportText = `Adeptus Custodes\nGuardians of the Throne (3 Detachment Points)\nOnslaught (3,000 Points)\n\nCHARACTERS\n\nBlade Champion (175 Points)\n  • 1x Vaultswords\n\nBATTLELINE\n\nCustodian Guard Sodality (240 Points)\n  • 3x Custodian Guard\n     ◦ 3x Guardian Spear\n\nOTHER DATASHEETS\n\nTelemon Heavy Dreadnought (280 Points)\n  • 1x Dual Caestus Fists\n  • 1x Spiculus Bolt Launcher`;

test('Adeptus Custodes catalog supports the supplied export names and costs', () => {
  const candidates = findArmyUnitCandidates({ faction: 'Adeptus Custodes' });
  assert.equal(candidates.length, 29);
  assert.equal(candidates.find((unit) => unit.name === 'Blade Champion').defaultPoints, 175);
  const result = importWarhammerAppRoster({ text: exportText, faction: 'Adeptus Custodes', name: 'Custodes test', pointsLimit: 3000, id: 'custodes' });
  assert.equal(result.roster.units.length, 3);
  assert.equal(result.roster.units[1].modelCount, 3);
  assert.equal(result.roster.units[0].points, 175);
  assert.ok(result.roster.units[0].unmatchedWargear?.length);
  assert.match(result.roster.notes, /Dual Caestus Fists/);
});
