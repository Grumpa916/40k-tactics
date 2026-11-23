import test from 'node:test';
import assert from 'node:assert/strict';
import { getOverwatchOffer, declineOverwatch, recordOverwatchUse } from '../../src/rules/overwatch-interrupt.js';
import { renderOverwatchInterrupt } from '../../src/ui/overwatch-interrupt-controls.js';

const battle = () => ({
  battle: { status: 'active', round: 2 }, activePlayer: 'p2', turn: 2, phase: 'movement',
  players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
  commandPoints: { p1: 3, p2: 2 },
  units: [
    { id: 'guard', name: 'Custodian Guard', ownerId: 'p1', status: 'deployed' },
    { id: 'enemy', name: 'Intercessors', ownerId: 'p2', status: 'deployed' }
  ], history: []
});

test('11th edition Overwatch is offered to the reacting player at the end of Movement', () => {
  const state = battle(), offer = getOverwatchOffer(state);
  assert.equal(offer.playerId, 'p1');
  assert.equal(offer.phase, 'movement');
  assert.match(renderOverwatchInterrupt(state), /Fire Overwatch/);
  assert.equal(getOverwatchOffer({ ...state, phase: 'charge' }), null);
  assert.equal(getOverwatchOffer({ ...state, phase: 'shooting' }), null);
  assert.equal(getOverwatchOffer(declineOverwatch(state, { triggerKey: offer.triggerKey })), null);
});

test('Overwatch records 1 CP and cannot be used twice in the same phase', () => {
  const state = battle(), offer = getOverwatchOffer(state);
  assert.throws(() => recordOverwatchUse(state, { triggerKey: offer.triggerKey, firingUnitId: 'guard', targetUnitId: 'enemy' }), /confirm|Confirm/i);
  const used = recordOverwatchUse(state, {
    triggerKey: offer.triggerKey, firingUnitId: 'guard', targetUnitId: 'enemy',
    timingConfirmed: true, eligibilityConfirmed: true
  });
  assert.equal(used.commandPoints.p1, 2);
  assert.equal(getOverwatchOffer(used), null);
});