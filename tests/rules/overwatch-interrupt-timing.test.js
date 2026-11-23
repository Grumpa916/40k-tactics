import test from 'node:test';
import assert from 'node:assert/strict';
import { createEvent } from '../../src/events/event.js';
import { appendHistoryEntry } from '../../src/state/history.js';
import { declineOverwatch, getOverwatchOffer, recordOverwatchUse } from '../../src/rules/overwatch-interrupt.js';
import { getPhaseProgressionAction } from '../../src/ui/phase-progression-panel.js';
import { renderOverwatchInterrupt } from '../../src/ui/overwatch-interrupt-controls.js';

const battle = () => ({
  battle: { status: 'active', round: 2 },
  activePlayer: 'p2',
  turn: 2,
  phase: 'movement',
  players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
  commandPoints: { p1: 3, p2: 2 },
  units: [
    { id: 'guard', name: 'Custodian Guard', ownerId: 'p1', status: 'deployed' },
    { id: 'enemy', name: 'Intercessors', ownerId: 'p2', status: 'deployed' }
  ],
  history: []
});

const withEvent = (state, type, payload) => appendHistoryEntry(state, createEvent(type, {
  unitId: 'enemy', playerId: 'p2', round: 2, turn: 2, phase: state.phase, ...payload
}));

test('Overwatch is offered when an enemy is set up or starts or ends a move, not at the end of the phase', () => {
  const idle = battle();
  assert.equal(getOverwatchOffer(idle), null);
  assert.doesNotMatch(getPhaseProgressionAction(idle).label, /Overwatch/);
  assert.equal(renderOverwatchInterrupt(idle), '');

  const starting = battle();
  const start = getOverwatchOffer(starting, { selectedUnitId: 'enemy' });
  assert.equal(start.moment, 'starts-move');
  assert.match(renderOverwatchInterrupt(starting, { selectedUnitId: 'enemy' }), /data-overwatch-moment="starts-move"/);
  const declinedStart = declineOverwatch(starting, { triggerKey: start.triggerKey, selectedUnitId: 'enemy' });
  assert.equal(getOverwatchOffer(declinedStart, { selectedUnitId: 'enemy' }), null);

  for (const type of ['unit.normal_move_resolved', 'unit.advanced', 'unit.fell_back']) {
    const offer = getOverwatchOffer(withEvent(battle(), type));
    assert.equal(offer.moment, 'ends-move', type);
  }
  const stationary = withEvent(battle(), 'unit.stationary_recorded');
  assert.equal(getOverwatchOffer(stationary, { selectedUnitId: 'enemy' }), null);

  const setup = withEvent(battle(), 'unit.arrived_from_reserves');
  assert.equal(getOverwatchOffer(setup).moment, 'set-up');

  const charge = { ...battle(), phase: 'charge' };
  assert.equal(getOverwatchOffer(withEvent(charge, 'charge.outcome_recorded', { outcome: 'successful' })).moment, 'ends-move');
  assert.equal(getOverwatchOffer(withEvent(charge, 'charge.outcome_recorded', { outcome: 'failed' })), null);
  assert.equal(getOverwatchOffer(withEvent(charge, 'charge.outcome_recorded', { outcome: 'declined' })), null);
  assert.equal(getOverwatchOffer({ ...battle(), phase: 'shooting' }, { selectedUnitId: 'enemy' }), null);
});

test('recording Overwatch does not change command points and blocks a second use that phase', () => {
  const state = withEvent(battle(), 'unit.normal_move_resolved');
  const offer = getOverwatchOffer(state);
  assert.throws(() => recordOverwatchUse(state, { triggerKey: offer.triggerKey, firingUnitId: 'guard', inRangeConfirmed: false }), /within range/);
  const used = recordOverwatchUse(state, { triggerKey: offer.triggerKey, firingUnitId: 'guard', inRangeConfirmed: true });
  assert.deepEqual(used.commandPoints, state.commandPoints);
  assert.equal(used.history.at(-1).payload.recordedCpChange, 0);
  assert.equal(used.history.at(-1).payload.moment, 'ends-move');
  assert.equal(getOverwatchOffer(used, { selectedUnitId: 'enemy' }), null);
  const later = withEvent(used, 'unit.advanced', { unitId: 'enemy' });
  assert.equal(getOverwatchOffer(later), null);
});
