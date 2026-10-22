import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDatasheetWeaponOptions,
  getCombatFormationWeaponOptions
} from '../../src/rules/saved-roster-combat-profile.js';
import {
  getCombatFormationMembers,
  getCombatFormationRoot,
  hasConfirmedNoRangedWeaponsForFormation
} from '../../src/rules/battle-unit-reference.js';
import { getShootingCandidates } from '../../src/rules/shooting-candidates.js';
import { getFightCandidates } from '../../src/rules/fight-candidates.js';
import { getShootingWeaponOptions } from '../../src/application/shooting-workflow.js';
import { resolveUnitAttack } from '../../src/engine/combat-transitions.js';

function termagantState({ mixed = false, currentStrength = 6, explicit = true } = {}) {
  const equippedWeapons = explicit ? [
    { name: 'Chitinous claws and teeth', selectionName: 'Chitinous claws and teeth', quantity: 10 },
    { name: 'Fleshborer', selectionName: 'Fleshborer', quantity: mixed ? 9 : 10 },
    ...(mixed ? [{ name: 'Spike rifle', selectionName: 'Spike rifle', quantity: 1 }] : [])
  ] : undefined;
  const datasheet = {
    characteristics: { Wounds: 1, Toughness: 3, Save: '5+' },
    weapons: [
      { name: 'Fleshborer', range: '18"', attacks: 1, skill: '4+', strength: 5, ap: 0, damage: 1 },
      { name: 'Spike rifle', range: '24"', attacks: 1, skill: '4+', strength: 4, ap: 0, damage: 1 },
      { name: 'Chitinous claws and teeth', range: 'Melee', attacks: 1, skill: '4+', strength: 3, ap: 0, damage: 1 }
    ]
  };
  const rosterUnit = {
    id: 'gants', name: 'Termagants', datasheetId: 'tyranids:termagants', modelCount: 10, datasheet,
    ...(equippedWeapons ? { equippedWeapons } : {})
  };
  const battleUnit = {
    id: 'p1:gants', ownerId: 'p1', name: 'Termagants', status: 'deployed', currentStrength,
    metadata: { rosterUnitId: 'gants', modelCount: 10, datasheetId: 'tyranids:termagants' }
  };
  return {
    phase: 'shooting', turn: 1, activePlayer: 'p1', battle: { id: 'b', status: 'active', round: 1, activePlayerId: 'p1' },
    players: [{ id: 'p1' }, { id: 'p2' }], history: [],
    armyRosters: { p1: { faction: 'Tyranids', units: [rosterUnit] } },
    units: [battleUnit]
  };
}

test('homogeneous per-model loadouts scale attack count to surviving models', () => {
  const state = termagantState({ currentStrength: 6 });
  const unit = state.units[0];
  const fleshborer = getDatasheetWeaponOptions(state, unit, { type: 'ranged' }).find((weapon) => weapon.name === 'Fleshborer');
  const claws = getDatasheetWeaponOptions(state, unit, { type: 'melee' }).find((weapon) => weapon.name === 'Chitinous claws and teeth');
  assert.equal(fleshborer.equippedQuantity, 10);
  assert.equal(fleshborer.activeQuantity, 6);
  assert.equal(fleshborer.quantityBasis, 'homogeneous-slot');
  assert.equal(fleshborer.quantityUncertain, false);
  assert.equal(fleshborer.characteristics.attacks, 6);
  assert.equal(claws.equippedQuantity, 10);
  assert.equal(claws.activeQuantity, 6);
  assert.equal(claws.quantityBasis, 'fixed-per-model');
  assert.equal(claws.characteristics.attacks, 6);
});

test('mixed per-model weapon casualties fail closed instead of inventing surviving special weapons', () => {
  const state = termagantState({ mixed: true, currentStrength: 6 });
  const weapons = getDatasheetWeaponOptions(state, state.units[0], { type: 'ranged' });
  const fleshborer = weapons.find((weapon) => weapon.name === 'Fleshborer');
  const spike = weapons.find((weapon) => weapon.name === 'Spike rifle');
  assert.equal(fleshborer.quantityBasis, 'mixed-slot');
  assert.equal(fleshborer.quantityUncertain, true);
  assert.equal(fleshborer.characteristics.attacks, undefined);
  assert.equal(spike.quantityUncertain, true);
  assert.equal(spike.characteristics.attacks, undefined);
});

test('legacy reviewed fixed-per-model weapons infer quantity from model count without guessing optional weapons', () => {
  const state = termagantState({ currentStrength: 7, explicit: false });
  state.armyRosters.p1.units[0].datasheet.weapons = [
    { name: 'Chitinous claws and teeth', range: 'Melee', attacks: 1, skill: '4+', strength: 3, ap: 0, damage: 1 }
  ];
  const [claws] = getDatasheetWeaponOptions(state, state.units[0], { type: 'melee' });
  assert.equal(claws.equippedQuantity, 10);
  assert.equal(claws.activeQuantity, 7);
  assert.equal(claws.quantityBasis, 'fixed-per-model');
  assert.equal(claws.characteristics.attacks, 7);
});

function attachedState() {
  const bodyguard = {
    id: 'body', name: 'Bodyguard', modelCount: 5, attachedLeaderIds: ['leader'],
    datasheet: {
      characteristics: { Wounds: 1, Toughness: 4, Save: '4+' },
      weapons: [{ name: 'Bodyguard gun', range: '18"', attacks: 1, skill: '4+', strength: 4, ap: 0, damage: 1 }]
    },
    equippedWeapons: [{ name: 'Bodyguard gun', quantity: 5 }]
  };
  const leader = {
    id: 'leader', name: 'Leader', modelCount: 1, attachedToBodyguardId: 'body',
    datasheet: {
      characteristics: { Wounds: 4, Toughness: 4, Save: '3+' },
      weapons: [
        { name: 'Leader gun', range: '24"', attacks: 2, skill: '2+', strength: 5, ap: -1, damage: 1 },
        { name: 'Leader blade', range: 'Melee', attacks: 4, skill: '2+', strength: 6, ap: -2, damage: 2 }
      ]
    },
    equippedWeapons: [{ name: 'Leader gun', quantity: 1 }, { name: 'Leader blade', quantity: 1 }]
  };
  const enemy = {
    id: 'enemy', name: 'Enemy', modelCount: 1,
    datasheet: {
      characteristics: { Wounds: 10, Toughness: 4, Save: '4+' },
      weapons: [{ name: 'Enemy blade', range: 'Melee', attacks: 2, skill: '4+', strength: 4, ap: 0, damage: 1 }]
    },
    equippedWeapons: [{ name: 'Enemy blade', quantity: 1 }]
  };
  return {
    phase: 'shooting', turn: 1, activePlayer: 'p1', battle: { id: 'b', status: 'active', round: 1, activePlayerId: 'p1' },
    players: [{ id: 'p1' }, { id: 'p2' }], history: [],
    armyRosters: {
      p1: { faction: 'Tyranids', units: [bodyguard, leader] },
      p2: { faction: 'Other', units: [enemy] }
    },
    units: [
      { id: 'p1:body', ownerId: 'p1', name: 'Bodyguard', status: 'deployed', metadata: { rosterUnitId: 'body', modelCount: 5 } },
      { id: 'p1:leader', ownerId: 'p1', name: 'Leader', status: 'deployed', metadata: { rosterUnitId: 'leader', modelCount: 1 } },
      { id: 'p2:enemy', ownerId: 'p2', name: 'Enemy', status: 'deployed', wounds: 10, startingWounds: 10, metadata: { rosterUnitId: 'enemy', modelCount: 1 } }
    ]
  };
}

test('attached Leader and Bodyguard expose one activation with distinct weapon sources', () => {
  const state = attachedState();
  const body = state.units[0], leader = state.units[1];
  assert.equal(getCombatFormationRoot(state, leader).id, body.id);
  assert.deepEqual(getCombatFormationMembers(state, body).map((unit) => unit.id), [body.id, leader.id]);
  assert.equal(hasConfirmedNoRangedWeaponsForFormation(state, body), false);
  assert.deepEqual(getShootingCandidates(state).available, [body.id]);
  assert.ok(!getShootingCandidates(state).available.includes(leader.id));

  const ranged = getCombatFormationWeaponOptions(state, body, { type: 'ranged' });
  assert.deepEqual(ranged.map((weapon) => [weapon.name, weapon.sourceUnitId]), [
    ['Bodyguard gun', body.id], ['Leader gun', leader.id]
  ]);
  assert.match(ranged[0].displayName, /Bodyguard/);
  assert.match(ranged[1].displayName, /Leader/);

  state.history.push({ type: 'shooting.unit_activated', payload: { unitId: body.id, round: 1, turn: 1, actionType: 'shoot' } });
  const workflowWeapons = getShootingWeaponOptions(state, { attackerId: body.id });
  assert.equal(workflowWeapons.length, 2);
  assert.equal(workflowWeapons.find((weapon) => weapon.name === 'Leader gun').sourceUnitId, leader.id);
});

test('attached source weapon resolves under the Bodyguard activation and records the real attack source', () => {
  const state = attachedState();
  const body = state.units[0], leader = state.units[1], enemy = state.units[2];
  state.history.push({ type: 'shooting.unit_activated', payload: { unitId: body.id, round: 1, turn: 1, actionType: 'shoot' } });
  const leaderGun = getShootingWeaponOptions(state, { attackerId: body.id }).find((weapon) => weapon.sourceUnitId === leader.id);
  const next = resolveUnitAttack(state, { attackerId: body.id, targetId: enemy.id, weapon: leaderGun, actualDamage: 2 });
  assert.equal(next.units.find((unit) => unit.id === enemy.id).wounds, 8);
  assert.equal(next.history.at(-1).payload.attackerId, body.id);
  assert.equal(next.history.at(-1).payload.sourceAttackerId, leader.id);
  assert.equal(next.history.at(-1).payload.sourceAttackerName, 'Leader');
});

test('fight candidates collapse an attached formation, then release the Leader after Bodyguard destruction', () => {
  const state = attachedState();
  state.phase = 'fight';
  state.activePlayer = 'p1';
  const before = getFightCandidates(state);
  assert.ok(before.normal.includes('p1:body'));
  assert.ok(!before.normal.includes('p1:leader'));

  state.units[0] = { ...state.units[0], status: 'destroyed' };
  const after = getFightCandidates(state);
  assert.ok(after.normal.includes('p1:leader'));
  assert.equal(getCombatFormationRoot(state, state.units[1]).id, 'p1:leader');
});
