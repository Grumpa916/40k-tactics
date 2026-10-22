import test from 'node:test';
import assert from 'node:assert/strict';
import { ARMY_UNIT_CATALOG } from '../../src/data/army-unit-catalog.js';
import { buildManualWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';
import { renderWargearEditor, readWargearSelections } from '../../src/ui/army-wargear-editor.js';

function unit(datasheetId, modelCount = 1) {
  const candidate = ARMY_UNIT_CATALOG.find((item) => item.id === datasheetId);
  assert.ok(candidate, `Missing catalog candidate ${datasheetId}`);
  return {
    id: 'unit-1', name: candidate.name, datasheetId: candidate.id,
    datasheet: candidate.datasheet, modelCount
  };
}

test('manual Hive Tyrant loadout becomes reviewed-valid and only exposes selected profiles', () => {
  const tyrant = unit('tyranids:hive-tyrant');
  const loadout = buildManualWargearLoadout(tyrant, [
    { name: 'Monstrous bonesword and lash whip', quantity: 1 },
    { name: 'Monstrous scything talons', quantity: 1 }
  ]);
  assert.equal(loadout.loadoutValidation.status, 'rules-reviewed-valid');
  assert.equal(loadout.loadoutValidation.source, 'manual-army-builder');
  assert.deepEqual(loadout.equippedWeapons.map((item) => item.name), [
    'Monstrous bonesword and lash whip', 'Monstrous scything talons'
  ]);
  const rosterUnit = { ...tyrant, id: 'roster-1', ...loadout };
  const state = {
    armyRosters: { p1: { units: [rosterUnit] } },
    units: [{ id: 'battle-1', ownerId: 'p1', metadata: { rosterUnitId: 'roster-1' } }]
  };
  assert.deepEqual(getDatasheetWeaponOptions(state, state.units[0], { type: 'ranged' }), []);
  assert.deepEqual(getDatasheetWeaponOptions(state, state.units[0], { type: 'melee' }).map((item) => item.name), [
    'Monstrous bonesword and lash whip', 'Monstrous scything talons'
  ]);
});

test('manual Termagant quantities validate baseline and one-per-ten special weapons', () => {
  const termagants = unit('tyranids:termagants', 10);
  const loadout = buildManualWargearLoadout(termagants, [
    { name: 'Chitinous claws and teeth', quantity: 10 },
    { name: 'Fleshborer', quantity: 7 },
    { name: 'Shardlauncher', quantity: 1 },
    { name: 'Spike rifle', quantity: 1 },
    { name: 'Strangleweb', quantity: 1 }
  ]);
  assert.equal(loadout.loadoutValidation.status, 'rules-reviewed-valid');
  assert.equal(loadout.equippedWargear.reduce((sum, item) => sum + (item.name === 'Chitinous claws and teeth' ? 0 : item.quantity), 0), 10);
});

test('illegal manual replacement-slot combinations remain rules-invalid', () => {
  const carnifex = unit('tyranids:carnifexes');
  const loadout = buildManualWargearLoadout(carnifex, [
    { name: 'Chitinous claws and teeth', quantity: 1 },
    { name: 'Heavy venom cannon', quantity: 2 }
  ]);
  assert.equal(loadout.loadoutValidation.status, 'rules-invalid');
  assert.ok(loadout.loadoutValidation.errors.some((error) => /replacement slots|assign/i.test(error)));
});

test('reviewed Army Builder UI renders structured choices instead of a free-text loadout field', () => {
  const tyrannofex = {
    ...unit('tyranids:tyrannofex'),
    loadoutValidation: { status: 'manual-selection-required' }
  };
  const html = renderWargearEditor(tyrannofex);
  assert.match(html, /Selected wargear/);
  assert.match(html, /data-wargear-single="main-gun"/);
  assert.match(html, /Rupture cannon/);
  assert.match(html, /Acid spray/);
  assert.match(html, /selection required|Combat advice stays unresolved/i);
});

test('Army Builder control reader includes fixed equipment plus the selected single-slot weapon', () => {
  const tyrannofex = unit('tyranids:tyrannofex');
  const controls = {
    'data-wargear-single': [{ value: 'Rupture cannon', getAttribute: (name) => name === 'data-wargear-single' ? 'main-gun' : null }]
  };
  const container = {
    querySelectorAll(selector) {
      const match = selector.match(/^\[([^\]]+)\]$/);
      return match ? (controls[match[1]] ?? []) : [];
    }
  };
  assert.deepEqual(readWargearSelections(container, tyrannofex), [
    { name: 'Stinger salvoes', quantity: 1 },
    { name: 'Powerful limbs', quantity: 1 },
    { name: 'Rupture cannon', quantity: 1 }
  ]);
});

test('manual-selection-required and unverified loadouts cannot fall back to every datasheet weapon', () => {
  for (const status of ['manual-selection-required', 'unverified']) {
    const tyrant = unit('tyranids:hive-tyrant');
    const rosterUnit = { ...tyrant, id: `roster-${status}`, loadoutValidation: { status } };
    const state = {
      armyRosters: { p1: { units: [rosterUnit] } },
      units: [{ id: `battle-${status}`, ownerId: 'p1', metadata: { rosterUnitId: rosterUnit.id } }]
    };
    assert.deepEqual(getDatasheetWeaponOptions(state, state.units[0], { type: 'ranged' }), []);
    assert.deepEqual(getDatasheetWeaponOptions(state, state.units[0], { type: 'melee' }), []);
  }
});
