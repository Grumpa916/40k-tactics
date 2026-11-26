import test from 'node:test';
import assert from 'node:assert/strict';
import { ARMY_UNIT_CATALOG } from '../../src/data/army-unit-catalog.js';
import { DEATHWATCH_TERMINATOR_DATASHEET } from '../../src/data/deathwatch-terminator-squad.js';
import { getTyranidWargearRuleSet } from '../../src/data/tyranid-wargear-rules.js';
import { validateWargearLoadout, buildManualWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { resolveBuilderUnitCost } from '../../src/rules/army-builder-cost.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';

const deathwatchId = 'space-marines:deathwatch-terminator-squad';
const candidate = ARMY_UNIT_CATALOG.find(item => item.id === deathwatchId);
const unit = (selections, models = 5) => ({
  id: 'deathwatch-1', datasheetId: deathwatchId, modelCount: models,
  equippedWargear: selections.map(([name, quantity]) => ({ name, quantity }))
});

test('Deathwatch Terminators are distinct from ordinary Terminators and import by name', () => {
  assert.ok(candidate);
  assert.notEqual(candidate.id, 'space-marines:terminator-squad');
  assert.equal(candidate.defaultPoints, 190);
  assert.deepEqual(candidate.pointsOptions.map(option => [option.models, option.points]), [[5,190],[10,380]]);
  assert.equal(candidate.datasheet.characteristics['Invulnerable save'], '4+');
  assert.equal(candidate.datasheet.keywords.includes('Kill Team'), true);
  assert.ok(candidate.datasheet.abilities.some(ability => ability.name === 'Terminatus Assault'));
  const imported = importWarhammerAppRoster({
    text: 'Space Marines\nALLIED UNITS\nFaction: Deathwatch\nDeathwatch Terminator Squad (190 Points)',
    faction: 'Space Marines', name: 'Deathwatch', id: 'deathwatch'
  });
  assert.equal(imported.roster.units[0].datasheetId, deathwatchId);
  assert.equal(imported.roster.units[0].factionTag, 'Deathwatch');
  assert.equal(imported.roster.units[0].datasheet.weapons.some(weapon => weapon.name === 'Plasma Cannon - Supercharge'), true);
});

test('Deathwatch heavy weapon limit, firing modes, and upgrade pricing', () => {
  const rules = getTyranidWargearRuleSet(deathwatchId);
  assert.ok(rules);
  const standard = unit([['Storm Bolter',5],['Power Fist',5]]);
  assert.equal(validateWargearLoadout(standard).status, 'rules-reviewed-valid');
  assert.equal(resolveBuilderUnitCost(standard,{units:[standard]}).points,190);
  const cyclones = unit([['Storm Bolter',2],['Cyclone Missile Launcher and Storm Bolter',3],['Power Fist',5]]);
  assert.equal(validateWargearLoadout(cyclones).status, 'rules-reviewed-valid');
  assert.equal(resolveBuilderUnitCost(cyclones,{units:[cyclones]}).points,220);
  const invalid = unit([['Storm Bolter',1],['Cyclone Missile Launcher and Storm Bolter',4],['Power Fist',5]]);
  assert.equal(validateWargearLoadout(invalid).status,'rules-invalid');
  assert.equal(resolveBuilderUnitCost(invalid,{units:[invalid]}).points,null);
  const shields = unit([['Storm Bolter',3],['No ranged weapon',2],['Power Fist',3],['Thunder Hammer and Storm Shield',2]]);
  assert.equal(validateWargearLoadout(shields).status,'rules-reviewed-valid');
  assert.equal(resolveBuilderUnitCost(shields,{units:[shields]}).points,200);
  const built = buildManualWargearLoadout(standard,[{name:'Plasma Cannon',quantity:1}]);
  assert.deepEqual(built.equippedWeapons.map(weapon=>weapon.name),['Plasma Cannon - Standard','Plasma Cannon - Supercharge']);
  assert.ok(DEATHWATCH_TERMINATOR_DATASHEET.weapons.some(weapon=>weapon.name==='Thunder Hammer'));
});
