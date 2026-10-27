import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSelectedUnitActiveStatuses,
  renderSelectedUnitActiveStatus
} from '../../src/ui/combat-workspace.js';

function unit(id, overrides = {}) {
  return {
    id,
    ownerId: overrides.ownerId ?? 'p1',
    name: overrides.name ?? id,
    status: overrides.status ?? 'deployed',
    models: overrides.models ?? [{ id: `${id}-1`, position: { x: 10, y: 10 } }],
    ...overrides
  };
}

function state(overrides = {}) {
  return {
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    activePlayer: 'p1',
    phase: 'fight',
    turn: 2,
    battle: { round: 2, activePlayerId: 'p1', status: 'active' },
    units: [unit('a'), unit('b', { ownerId: 'p2' })],
    history: [],
    ...overrides
  };
}

test('selected unit decoder explains active battlefield statuses in plain English', () => {
  const current = state({
    units: [unit('a', { name: 'Custodian Guard', battleShocked: true }), unit('b', { ownerId: 'p2' })],
    history: [{
      type: 'charge.outcome_recorded',
      payload: { unitId: 'a', targetIds: ['b'], outcome: 'successful', round: 2, turn: 2 }
    }]
  });

  const labels = getSelectedUnitActiveStatuses(current, 'a').map(item => item.label);
  assert.deepEqual(labels, ['Battle-shocked', 'Engaged', 'Charged this turn', 'Fights First']);

  const html = renderSelectedUnitActiveStatus(current, 'a');
  assert.match(html, /Active Status/);
  assert.match(html, /Battle-shocked/);
  assert.match(html, /Engaged/);
  assert.match(html, /Charged this turn/);
  assert.match(html, /Fights First/);
});

test('mission action stays visible while unresolved and activation meaning is shown', () => {
  const current = state({
    phase: 'shooting',
    history: [{
      type: 'shooting.unit_activated',
      payload: {
        unitId: 'a', playerId: 'p1', actionType: 'action', missionInstanceId: 'secondary:cleanse',
        round: 2, turn: 2
      }
    }]
  });

  const labels = getSelectedUnitActiveStatuses(current, 'a').map(item => item.label);
  assert.ok(labels.includes('Action / Mission Action'));
  assert.ok(labels.includes('Activated / Resolved'));
});

test('active status section is omitted when the selected unit has no active status', () => {
  const current = state({ phase: 'movement' });
  assert.deepEqual(getSelectedUnitActiveStatuses(current, 'a'), []);
  assert.equal(renderSelectedUnitActiveStatus(current, 'a'), '');
  assert.equal(renderSelectedUnitActiveStatus(current, 'missing'), '');
});
