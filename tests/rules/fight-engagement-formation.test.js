import test from 'node:test';
import assert from 'node:assert/strict';
import { areUnitsEngaged } from '../../src/rules/fight-engagement-state.js';
import { getFightAttackOptions } from '../../src/application/fight-workflow.js';

function state() {
  return {
    phase: 'fight',
    turn: 1,
    activePlayer: 'p1',
    battle: { status: 'active', round: 1, activePlayerId: 'p1' },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    armyRosters: {
      p1: {
        units: [
          { id: 'wardens-roster', name: 'Custodian Wardens', attachedLeaderIds: ['trajann-roster'] },
          { id: 'trajann-roster', name: 'Trajann Valoris', attachedToBodyguardId: 'wardens-roster' }
        ]
      },
      p2: { units: [{ id: 'enemy-roster', name: 'Enemy' }] }
    },
    units: [
      { id: 'wardens', name: 'Custodian Wardens', ownerId: 'p1', status: 'deployed', metadata: { rosterUnitId: 'wardens-roster' } },
      { id: 'trajann', name: 'Trajann Valoris', ownerId: 'p1', status: 'deployed', metadata: { rosterUnitId: 'trajann-roster' } },
      { id: 'enemy', name: 'Enemy', ownerId: 'p2', status: 'deployed', metadata: { rosterUnitId: 'enemy-roster' } }
    ],
    history: [{
      type: 'charge.outcome_recorded',
      payload: { unitId: 'trajann', targetIds: ['enemy'], outcome: 'successful', round: 1, turn: 1 }
    }]
  };
}

test('a successful charge recorded on an attached Leader carries into the Bodyguard-root Fight activation', () => {
  const current = state();

  assert.equal(areUnitsEngaged(current, 'trajann', 'enemy'), true);
  assert.equal(areUnitsEngaged(current, 'wardens', 'enemy'), true);

  const options = getFightAttackOptions(current, {
    attackerId: 'wardens',
    perspectivePlayerId: 'p1',
    includeCandidates: true
  });

  assert.ok(options.attackers.some(unit => unit.unitId === 'wardens'));
  assert.ok(options.targets.some(unit => unit.unitId === 'enemy'));
});
