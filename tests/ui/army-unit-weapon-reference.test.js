import test from 'node:test';
import assert from 'node:assert/strict';
import { renderArmyUnitDialog } from '../../src/ui/battle-context-panels.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';

function mixedLoadoutState() {
  const selections = [
    { name: 'Fleshborer', quantity: 9 },
    { name: 'Spike rifle', quantity: 1 },
    { name: 'Chitinous claws and teeth', quantity: 10 }
  ];
  return {
    phase: 'shooting', turn: 1, activePlayer: 'p1', history: [], battle: { round: 1 },
    players: [{ id: 'p1', name: 'You' }],
    armyRosters: { p1: { faction: 'Tyranids', units: [{
      id: 'gants', name: 'Termagants', datasheetId: 'tyranids:termagants', modelCount: 10,
      equippedWeapons: selections, equippedWargear: selections,
      datasheet: {
        characteristics: { Wounds: 1, Toughness: 3, Save: '5+' },
        weapons: [
          { name: 'Fleshborer', range: '18"', attacks: 1, skill: '4+', strength: 5, ap: 0, damage: 1 },
          { name: 'Spike rifle', range: '24"', attacks: 1, skill: '4+', strength: 4, ap: 0, damage: 1 },
          { name: 'Chitinous claws and teeth', range: 'Melee', attacks: 1, skill: '4+', strength: 3, ap: 0, damage: 1 },
          { name: 'Unequipped Spinefists', range: '12"', attacks: 2, skill: '4+', strength: 3, ap: 0, damage: 1 }
        ]
      }
    }] } },
    units: [{
      id: 'p1:gants', ownerId: 'p1', name: 'Termagants', status: 'deployed', currentStrength: 6,
      metadata: { rosterUnitId: 'gants', modelCount: 10, datasheetId: 'tyranids:termagants' }
    }]
  };
}

const weaponPanel = state => renderArmyUnitDialog(state, 'p1:gants', {}, 'weapons')
  .split('data-unit-detail-panel="weapons"')[1].split('<div id="army-unit-panel-abilities"')[0];

test('mixed casualties show uncertain active counts without inventing surviving weapons', () => {
  const state = mixedLoadoutState();
  const before = JSON.stringify(state);
  const html = weaponPanel(state);
  assert.equal((html.match(/Active count unknown/g) ?? []).length, 2);
  assert.match(html, /casualty review/i);
  assert.match(html, /9 equipped/);
  assert.match(html, /1 equipped/);
  assert.match(html, /6 active · 10 equipped/);
  assert.doesNotMatch(html, />9 active|>1 active|Active counts reflect recorded model losses/);
  assert.equal(JSON.stringify(state), before);
});

test('destroyed units retain only confirmed equipment with zero active counts', () => {
  const state = mixedLoadoutState();
  state.units[0].status = 'destroyed';
  const html = weaponPanel(state);
  for (const name of ['Fleshborer', 'Spike rifle', 'Chitinous claws and teeth']) assert.ok(html.includes(name));
  assert.equal((html.match(/0 active ·/g) ?? []).length, 3);
  assert.doesNotMatch(html, /Unequipped Spinefists|could not be matched|Reference profile|Active count unknown/);
  assert.deepEqual(getDatasheetWeaponOptions(state, state.units[0]), []);
});

test('a lost special weapon stays in the reference loadout but cannot be used in combat', () => {
  const state = mixedLoadoutState();
  state.units[0].currentStrength = 9;
  state.units[0].liveWargear = { activeSelections: {
    fleshborer: 9, 'spike rifle': 0, 'chitinous claws and teeth': 9
  } };
  const html = weaponPanel(state);
  const spike = html.split('<strong>Spike rifle</strong>')[1]?.split('</li>')[0];
  assert.ok(spike);
  assert.match(spike, /0 active · 1 equipped/);
  assert.doesNotMatch(html, /Active count unknown|casualty review/i);
  assert.deepEqual(getDatasheetWeaponOptions(state, state.units[0], { type: 'ranged' }).map(weapon => weapon.name), ['Fleshborer']);
});

test('confirmed reference equipment does not require a combat-eligible profile', () => {
  const state = mixedLoadoutState();
  state.units[0].currentStrength = 10;
  const roster = state.armyRosters.p1.units[0];
  roster.equippedWeapons = [{ name: 'Fleshborer', quantity: 10 }];
  delete roster.datasheet.weapons[0].range;
  const html = weaponPanel(state);
  assert.match(html, /Fleshborer/);
  assert.match(html, /10 active · 10 equipped/);
  assert.doesNotMatch(html, /Spike rifle|Unequipped Spinefists|could not be matched|Reference profile/);
  assert.deepEqual(getDatasheetWeaponOptions(state, state.units[0]), []);
});

test('invalid or unverified loadouts continue to show reference profiles without confirming equipment', () => {
  for (const status of ['rules-invalid', 'source-invalid', 'manual-selection-required', 'unverified']) {
    const state = mixedLoadoutState();
    state.armyRosters.p1.units[0].loadoutValidation = { status };
    const html = weaponPanel(state);
    assert.match(html, /saved loadout needs review/i);
    assert.match(html, /Reference profile/);
    assert.doesNotMatch(html, /\d active · \d equipped/);
  }
});
