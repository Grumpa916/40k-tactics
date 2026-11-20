import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { recordSpaceMarineDoctrineUse } from '../../src/rules/space-marine-doctrines.js';
import { isFallBackActionRestricted } from '../../src/rules/fall-back-permissions.js';
import { recordShootingActivation } from '../../src/engine/shooting-transitions.js';
import { resolveUnitAttack } from '../../src/engine/combat-transitions.js';
import { recordChargeOutcome, recordChargeDeclined } from '../../src/engine/charge-transitions.js';
import { getChargeViewModel } from '../../src/application/charge-workflow.js';

const weapon = {
  id: 'test-bolter', name: 'Test bolter', sourceUnitId: 'marine', type: 'ranged',
  characteristics: { range: 24, attacks: 1, skill: 3, strength: 4, ap: 0, damage: 1 }
};

function battle({ faction = 'Space Marines', doctrine = null, scope = 'army' } = {}) {
  let state = createGameState({
    phase: 'command', turn: 1, activePlayer: 'p1',
    battle: { id: 'battle', status: 'active', round: 1, activePlayerId: 'p1' },
    players: [{ id: 'p1', name: 'Marines' }, { id: 'p2', name: 'Opponent' }],
    units: [
      { id: 'marine', name: 'Marines', ownerId: 'p1', status: 'deployed',
        metadata: { rosterUnitId: 'roster-marine' }, position: { x: 10, y: 10 } },
      { id: 'enemy', name: 'Enemy', ownerId: 'p2', status: 'deployed',
        position: { x: 18, y: 10 }, wounds: 5 }
    ],
    armyRosters: {
      p1: { faction, detachments: ['Assault Brethren'], units: [
        { id: 'roster-marine', name: 'Marines', datasheet: { weapons: [
          { name: 'Test bolter', range: '24"', attacks: 1, skill: '3+', strength: 4, ap: 0, damage: 1 }
        ] } }
      ] },
      p2: { faction: 'Adeptus Custodes', units: [] }
    },
    history: []
  });
  if (doctrine) state = recordSpaceMarineDoctrineUse(state, {
    playerId: 'p1', doctrine, scope, unitId: scope === 'unit' ? 'marine' : null,
    source: scope === 'unit' ? 'stratagem' : 'army'
  });
  return {
    ...state, phase: 'shooting',
    history: [...state.history, { type: 'unit.fell_back',
      payload: { unitId: 'marine', round: 1, turn: 1 } }]
  };
}

test('recorded Tactical Doctrine permits Fall Back, Shoot, and Charge in the same turn', () => {
  const initial = battle({ doctrine: 'tactical' });
  assert.equal(isFallBackActionRestricted(initial, 'marine'), false);
  const shooting = recordShootingActivation(initial, { unitId: 'marine', actionType: 'shoot' });
  const attacked = resolveUnitAttack(shooting, {
    attackerId: 'marine', targetId: 'enemy', weapon, actualDamage: 0
  });
  assert.equal(attacked.history.at(-1).type, 'combat.attack_resolved');

  const charge = { ...attacked, phase: 'charge' };
  assert.ok(getChargeViewModel(charge).candidates.some(item => item.unit.unitId === 'marine'));
  const resolved = recordChargeOutcome(charge, {
    unitId: 'marine', succeeded: true, targetIds: ['enemy'], measuredDistances: { enemy: 7 }
  });
  assert.equal(resolved.history.at(-1).type, 'charge.outcome_recorded');
});

test('unit-specific Tactical Doctrine also permits the move while Assault Doctrine does not', () => {
  const tactical = battle({ doctrine: 'tactical', scope: 'unit' });
  assert.equal(isFallBackActionRestricted(tactical, 'marine'), false);
  assert.equal(recordShootingActivation(tactical, { unitId: 'marine' }).history.at(-1).type, 'shooting.unit_activated');

  for (const initial of [battle(), battle({ doctrine: 'assault' }), battle({ doctrine: 'devastator' })]) {
    assert.equal(isFallBackActionRestricted(initial, 'marine'), true);
    assert.throws(() => recordShootingActivation(initial, { unitId: 'marine' }), /Fell Back cannot shoot/);
    assert.throws(() => resolveUnitAttack({
      ...initial, history: [...initial.history, { type: 'shooting.unit_activated',
        payload: { unitId: 'marine', round: 1, turn: 1, actionType: 'shoot' } }]
    }, { attackerId: 'marine', targetId: 'enemy', weapon, actualDamage: 0 }), /Fell Back cannot shoot/);
    const charge = { ...initial, phase: 'charge' };
    assert.equal(getChargeViewModel(charge).candidates.some(item => item.unit.unitId === 'marine'), false);
    assert.throws(() => recordChargeOutcome(charge, {
      unitId: 'marine', succeeded: true, targetIds: ['enemy'], measuredDistances: { enemy: 7 }
    }), /Fell Back cannot declare a charge/);
    assert.throws(() => recordChargeDeclined(charge, { unitId: 'marine' }), /Fell Back cannot declare a charge/);
  }
});

test('an expired Doctrine and a Doctrine recorded for a different faction grant no Fall Back permission', () => {
  const tactical = battle({ doctrine: 'tactical' });
  const expired = { ...tactical, turn: 3, battle: { ...tactical.battle, round: 2 },
    history: [...tactical.history, { type: 'unit.fell_back',
      payload: { unitId: 'marine', round: 2, turn: 3 } }] };
  assert.equal(isFallBackActionRestricted(expired, 'marine'), true);
  const nonMarine = battle({ faction: 'Tyranids' });
  nonMarine.history.unshift({ type: 'space_marines.doctrine_selected', payload: {
    playerId: 'p1', doctrine: 'tactical', scope: 'army', round: 1, turn: 1
  } });
  assert.equal(isFallBackActionRestricted(nonMarine, 'marine'), true);

  const noCurrentFallback = { ...tactical, history: tactical.history.filter(item => item.type !== 'unit.fell_back') };
  assert.equal(isFallBackActionRestricted(noCurrentFallback, 'marine'), false);
});
