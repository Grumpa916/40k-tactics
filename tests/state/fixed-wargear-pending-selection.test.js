import test from 'node:test';
import assert from 'node:assert/strict';
import { ARMY_UNIT_CATALOG } from '../../src/data/army-unit-catalog.js';
import { getFightWeaponOptions } from '../../src/application/fight-workflow.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';

function stateFor(datasheetId, modelCount = 1, status = 'manual-selection-required') {
  const candidate = ARMY_UNIT_CATALOG.find(item => item.id === datasheetId);
  assert.ok(candidate, `Missing catalog candidate ${datasheetId}`);
  const rosterUnit = {
    id:'roster-1',
    name:candidate.name,
    datasheetId:candidate.id,
    datasheet:candidate.datasheet,
    modelCount,
    loadoutValidation:{status}
  };
  const battleUnit = {
    id:'battle-1', ownerId:'p1', name:candidate.name, status:'deployed', modelCount,
    metadata:{rosterUnitId:rosterUnit.id}
  };
  return {
    state:{armyRosters:{p1:{units:[rosterUnit]}},units:[battleUnit],history:[]},
    unit:battleUnit
  };
}

test('Aquilon Talons remain available in Fight while the ranged slot still needs review', () => {
  const {state,unit}=stateFor('adeptus-custodes:aquilon-terminators-with-solarite-power-talons',3);
  const melee=getDatasheetWeaponOptions(state,unit,{type:'melee'});
  const ranged=getDatasheetWeaponOptions(state,unit,{type:'ranged'});
  assert.deepEqual(melee.map(item=>item.name),['Solarite Power Talon']);
  assert.equal(melee[0].equippedQuantity,3);
  assert.deepEqual(ranged,[]);
  assert.deepEqual(getFightWeaponOptions(state,{attackerId:unit.id}).map(item=>item.name),['Solarite Power Talon']);
});

test('reviewed fixed Allarus grenade launchers remain known while spear or axe choice is unresolved', () => {
  const {state,unit}=stateFor('adeptus-custodes:allarus-custodians',2);
  assert.deepEqual(getDatasheetWeaponOptions(state,unit,{type:'ranged'}).map(item=>item.name),['Balistus Grenade Launcher']);
  assert.deepEqual(getDatasheetWeaponOptions(state,unit,{type:'melee'}),[]);
});

test('pending choice never falls back to every datasheet weapon when no fixed weapon exists', () => {
  const {state,unit}=stateFor('tyranids:hive-tyrant',1);
  assert.deepEqual(getDatasheetWeaponOptions(state,unit,{type:'ranged'}),[]);
  assert.deepEqual(getDatasheetWeaponOptions(state,unit,{type:'melee'}),[]);
});

test('hard-invalid and unverified loadouts still block all combat weapon options', () => {
  for (const status of ['source-invalid','rules-invalid','unverified']) {
    const {state,unit}=stateFor('adeptus-custodes:aquilon-terminators-with-solarite-power-talons',3,status);
    assert.deepEqual(getDatasheetWeaponOptions(state,unit,{type:'melee'}),[]);
    assert.deepEqual(getDatasheetWeaponOptions(state,unit,{type:'ranged'}),[]);
  }
});
