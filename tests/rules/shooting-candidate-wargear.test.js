import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { getShootingCandidates } from '../../src/rules/shooting-candidates.js';
import { recordShootingActivation } from '../../src/engine/shooting-transitions.js';

function carnifexState({ validationStatus = 'source-invalid', equippedWeapons = [] } = {}) {
  return createGameState({
    phase: 'shooting',
    turn: 1,
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    battle: { id: 'battle', status: 'active', round: 1, activePlayerId: 'p1' },
    units: [
      {
        id: 'carnifexes-live', name: 'Carnifexes', ownerId: 'p1', status: 'deployed',
        metadata: { rosterUnitId: 'carnifexes-roster', datasheetId: 'tyranids:carnifexes' }
      },
      { id: 'enemy', name: 'Enemy', ownerId: 'p2', status: 'deployed' }
    ],
    armyRosters: {
      p1: {
        faction: 'Tyranids',
        units: [{
          id: 'carnifexes-roster',
          datasheetId: 'tyranids:carnifexes',
          loadoutValidation: validationStatus ? { status: validationStatus } : null,
          equippedWeapons,
          datasheet: {
            weapons: [
              { name: 'Carnifex scything talons', range: 'Melee', attacks: 6, skill: '3+', strength: 9, ap: -2, damage: 3 },
              { name: 'Heavy venom cannon', range: '36"', attacks: 'D3', skill: '4+', strength: 9, ap: -2, damage: 3 }
            ]
          }
        }]
      }
    }
  });
}

test('roster-backed unit with no usable ranged weapon options is action-only instead of a Shoot candidate', () => {
  const state = carnifexState({
    validationStatus: 'source-invalid',
    equippedWeapons: [{ name: 'Carnifex scything talons', quantity: 2 }]
  });
  const candidates = getShootingCandidates(state);
  assert.deepEqual(candidates.available, []);
  assert.deepEqual(candidates.actionOnly, ['carnifexes-live']);
  assert.throws(
    () => recordShootingActivation(state, { unitId: 'carnifexes-live', actionType: 'shoot' }),
    /available Shooting candidate/
  );
});

test('validated saved ranged loadout remains a Shoot candidate', () => {
  const state = carnifexState({
    validationStatus: null,
    equippedWeapons: [{ name: 'Heavy venom cannon', quantity: 1 }]
  });
  const candidates = getShootingCandidates(state);
  assert.deepEqual(candidates.available, ['carnifexes-live']);
  assert.deepEqual(candidates.actionOnly, []);
});
