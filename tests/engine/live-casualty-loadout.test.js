import test from 'node:test';
import assert from 'node:assert/strict';
import { recordUnitCasualty, undoUnitCasualty } from '../../src/engine/unit-casualty-transitions.js';
import { getCasualtyLoadoutState } from '../../src/rules/live-casualty-loadout.js';
import { getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';

function termagantState({ mixed = false } = {}) {
  const equippedWargear = [
    { name: 'Chitinous claws and teeth', quantity: 10 },
    { name: 'Fleshborer', quantity: mixed ? 9 : 10 },
    ...(mixed ? [{ name: 'Spike rifle', quantity: 1 }] : [])
  ];
  const equippedWeapons = equippedWargear.map((item) => ({ ...item, selectionName: item.name }));
  return {
    phase: 'shooting', turn: 1,
    battle: { id: 'b', status: 'active', round: 1, activePlayerId: 'p1' },
    players: [{ id: 'p1' }, { id: 'p2' }],
    history: [],
    armyRosters: { p1: { units: [{
      id: 'gants', name: 'Termagants', datasheetId: 'tyranids:termagants', modelCount: 10,
      equippedWargear, equippedWeapons,
      datasheet: {
        characteristics: { Wounds: 1, Toughness: 3, Save: '5+' },
        weapons: [
          { name: 'Fleshborer', range: '18"', attacks: 1, skill: '4+', strength: 5, ap: 0, damage: 1 },
          { name: 'Spike rifle', range: '24"', attacks: 1, skill: '4+', strength: 4, ap: 0, damage: 1 },
          { name: 'Chitinous claws and teeth', range: 'Melee', attacks: 1, skill: '4+', strength: 3, ap: 0, damage: 1 }
        ]
      }
    }] } },
    units: [{
      id: 'p1:gants', ownerId: 'p1', name: 'Termagants', status: 'deployed',
      metadata: { rosterUnitId: 'gants', modelCount: 10, datasheetId: 'tyranids:termagants' }
    }]
  };
}

test('homogeneous multi-model casualty is one tap and immediately scales combat attacks', () => {
  const state = termagantState();
  const next = recordUnitCasualty(state, { unitId: 'p1:gants' });
  assert.equal(next.units[0].currentStrength, 9);
  assert.equal(next.history.at(-1).type, 'unit.casualty_recorded');
  const ranged = getDatasheetWeaponOptions(next, next.units[0], { type: 'ranged' });
  assert.equal(ranged.length, 1);
  assert.equal(ranged[0].name, 'Fleshborer');
  assert.equal(ranged[0].activeQuantity, 9);
  assert.equal(ranged[0].characteristics.attacks, 9);
  const melee = getDatasheetWeaponOptions(next, next.units[0], { type: 'melee' });
  assert.equal(melee[0].activeQuantity, 9);
});

test('mixed Termagants require only the removed weapon identity and stop showing a dead special weapon', () => {
  const state = termagantState({ mixed: true });
  const prompt = getCasualtyLoadoutState(state, state.units[0]);
  assert.equal(prompt.requiresIdentity, true);
  assert.equal(prompt.complexIdentity, false);
  assert.deepEqual(prompt.slotChoices[0].choices.map((choice) => choice.name), ['Fleshborer', 'Spike rifle']);
  assert.throws(() => recordUnitCasualty(state, { unitId: 'p1:gants' }), /Choose which ranged-weapon/);

  const next = recordUnitCasualty(state, {
    unitId: 'p1:gants',
    slotSelections: { 'ranged-weapon': 'Spike rifle' }
  });
  assert.equal(next.units[0].currentStrength, 9);
  assert.equal(next.units[0].liveWargear.activeSelections['spike rifle'], 0);
  assert.equal(next.units[0].liveWargear.activeSelections.fleshborer, 9);
  const ranged = getDatasheetWeaponOptions(next, next.units[0], { type: 'ranged' });
  assert.deepEqual(ranged.map((weapon) => weapon.name), ['Fleshborer']);
  assert.equal(ranged[0].characteristics.attacks, 9);
});

test('undo restores the previous model count and mixed loadout', () => {
  const state = termagantState({ mixed: true });
  const next = recordUnitCasualty(state, {
    unitId: 'p1:gants', slotSelections: { 'ranged-weapon': 'Spike rifle' }
  });
  const undone = undoUnitCasualty(next, { unitId: 'p1:gants' });
  assert.equal(Object.hasOwn(undone.units[0], 'currentStrength'), false);
  assert.equal(getCasualtyLoadoutState(undone, undone.units[0]).currentModels, 10);
  assert.deepEqual(getDatasheetWeaponOptions(undone, undone.units[0], { type: 'ranged' }).map((weapon) => weapon.name), [
    'Fleshborer', 'Spike rifle'
  ]);
  assert.equal(undone.history.at(-1).type, 'unit.casualty_undone');
});

function carnifexState() {
  const selected = [
    ['Chitinous claws and teeth', 2],
    ['Heavy venom cannon', 1],
    ['Carnifex extra scything talons', 1],
    ['Carnifex crushing claws', 1],
    ['Carnifex scything talons', 1],
    ['Bio-plasma', 1]
  ];
  return {
    phase: 'fight', turn: 2,
    battle: { id: 'b', status: 'active', round: 2, activePlayerId: 'p1' },
    history: [],
    armyRosters: { p1: { units: [{
      id: 'fex', name: 'Carnifexes', datasheetId: 'tyranids:carnifexes', modelCount: 2,
      equippedWargear: selected.map(([name, quantity]) => ({ name, quantity })),
      equippedWeapons: selected.map(([name, quantity]) => ({ name, selectionName: name, quantity })),
      datasheet: {
        characteristics: { Wounds: 8, Toughness: 9, Save: '2+' },
        weapons: selected.map(([name]) => ({
          name, range: name === 'Heavy venom cannon' || name === 'Bio-plasma' ? '24"' : 'Melee',
          attacks: 1, skill: '4+', strength: 6, ap: -1, damage: 2
        }))
      }
    }] } },
    units: [{
      id: 'p1:fex', ownerId: 'p1', name: 'Carnifexes', status: 'deployed',
      metadata: { rosterUnitId: 'fex', modelCount: 2, datasheetId: 'tyranids:carnifexes' }
    }]
  };
}

test('complex Carnifex casualty asks only for heterogeneous slots and optional equipment on the removed model', () => {
  const state = carnifexState();
  const prompt = getCasualtyLoadoutState(state, state.units[0]);
  assert.equal(prompt.complexIdentity, true);
  assert.equal(prompt.slotChoices.length, 2);
  assert.deepEqual(prompt.optionalChoices.map((item) => item.name), ['Bio-plasma']);

  assert.throws(() => recordUnitCasualty(state, {
    unitId: 'p1:fex',
    slotSelections: {
      'extra-talons-slot': 'Heavy venom cannon',
      'scything-talons-slot': 'Carnifex crushing claws'
    }
  }), /Confirm whether the removed model had Bio-plasma/);

  const next = recordUnitCasualty(state, {
    unitId: 'p1:fex',
    slotSelections: {
      'extra-talons-slot': 'Heavy venom cannon',
      'scything-talons-slot': 'Carnifex crushing claws'
    },
    optionalSelections: { 'Bio-plasma': true }
  });
  assert.equal(next.units[0].currentStrength, 1);
  const names = getDatasheetWeaponOptions(next, next.units[0]).map((weapon) => weapon.name);
  assert.ok(!names.includes('Heavy venom cannon'));
  assert.ok(!names.includes('Carnifex crushing claws'));
  assert.ok(!names.includes('Bio-plasma'));
  assert.ok(names.includes('Carnifex extra scything talons'));
  assert.ok(names.includes('Carnifex scything talons'));
});

test('the last casualty destroys an originally multi-model unit and undo can restore it', () => {
  let state = termagantState();
  for (let i = 0; i < 10; i += 1) state = recordUnitCasualty(state, { unitId: 'p1:gants' });
  assert.equal(state.units[0].currentStrength, 0);
  assert.equal(state.units[0].status, 'destroyed');
  assert.deepEqual(getDatasheetWeaponOptions(state, state.units[0]), []);
  const restored = undoUnitCasualty(state, { unitId: 'p1:gants' });
  assert.equal(restored.units[0].currentStrength, 1);
  assert.equal(restored.units[0].status, 'deployed');
});
