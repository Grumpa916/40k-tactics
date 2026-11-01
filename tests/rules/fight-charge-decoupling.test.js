import test from 'node:test';
import assert from 'node:assert/strict';
import { getFightAttackOptions } from '../../src/application/fight-workflow.js';

function state({ originalTargetStatus = 'deployed' } = {}) {
  return {
    phase: 'fight',
    turn: 1,
    activePlayer: 'p1',
    battle: { status: 'active', round: 1, activePlayerId: 'p1' },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    armyRosters: {
      p1: { units: [{ id: 'charger-roster', name: 'Charger' }] },
      p2: { units: [
        { id: 'original-roster', name: 'Original Target' },
        { id: 'other-roster', name: 'Other Enemy' }
      ] }
    },
    units: [
      { id: 'charger', name: 'Charger', ownerId: 'p1', status: 'deployed', metadata: { rosterUnitId: 'charger-roster' } },
      { id: 'original', name: 'Original Target', ownerId: 'p2', status: originalTargetStatus, metadata: { rosterUnitId: 'original-roster' } },
      { id: 'other', name: 'Other Enemy', ownerId: 'p2', status: 'deployed', metadata: { rosterUnitId: 'other-roster' } }
    ],
    history: [{
      type: 'charge.outcome_recorded',
      payload: {
        unitId: 'charger',
        targetIds: ['original'],
        outcome: 'successful',
        measuredDistances: { original: 7 },
        round: 1,
        turn: 1
      }
    }]
  };
}

test('Fight target selection is not locked to the original Charge target', () => {
  const options = getFightAttackOptions(state(), {
    attackerId: 'charger',
    perspectivePlayerId: 'p1',
    includeCandidates: true
  });

  assert.equal(options.chargedThisTurn, true);
  assert.equal(options.recordedEngagement, true);
  assert.equal(options.overrunAvailable, false);
  assert.deepEqual(
    options.targets.map(unit => unit.unitId).sort(),
    ['original', 'other']
  );
  assert.equal(options.targetSelectionPolicy, 'tabletop-confirmed');
});

test('a charging unit whose original target is gone receives an Overrun Fight opportunity', () => {
  const options = getFightAttackOptions(state({ originalTargetStatus: 'destroyed' }), {
    attackerId: 'charger',
    perspectivePlayerId: 'p1',
    includeCandidates: true
  });

  assert.equal(options.chargedThisTurn, true);
  assert.equal(options.recordedEngagement, false);
  assert.equal(options.overrunAvailable, true);
  assert.deepEqual(options.targets.map(unit => unit.unitId), ['other']);
});
