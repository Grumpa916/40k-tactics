import test from 'node:test';
import assert from 'node:assert/strict';
import { getSpatialContext } from '../../src/rules/spatial-context.js';
import { getTacticalCombatRecommendations } from '../../src/rules/tactical-combat-recommendations.js';

function baseState() {
  return {
    phase: 'charge',
    activePlayer: 'p2',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    battle: { status: 'active', round: 1, activePlayerId: 'p2' },
    turn: 1,
    history: [],
    objectives: [],
    units: [
      {
        id: 'eg1', name: 'EG1', ownerId: 'p2', status: 'deployed',
        models: [{ id: 'eg1-m1', position: { x: 55, y: 40 } }]
      },
      {
        id: 'is1', name: 'IS1', ownerId: 'p1', status: 'deployed',
        models: [{ id: 'is1-m1', position: { x: 5, y: 40 } }]
      }
    ],
    battlefieldMap: {
      actualDeployment: {
        eg1: { position: { x: 10, y: 10 } },
        is1: { position: { x: 14, y: 10 } }
      }
    }
  };
}

test('spatial context uses visible actual deployment positions before movement', () => {
  const state = baseState();
  const spatial = getSpatialContext(state, { playerId: 'p2' });
  const proximity = spatial.unitProximity.find(item => item.unitId === 'eg1' && item.otherUnitId === 'is1');
  assert.equal(proximity?.distance, 3);

  const charge = getTacticalCombatRecommendations(state, { playerId: 'p2' }).charge;
  assert.ok(charge.some(item => item.unitId === 'eg1' && item.targetUnitId === 'is1'));
});

test('recorded movement replaces deployment position for spatial advice', () => {
  const state = baseState();
  state.units[0].models[0].position = { x: 50, y: 40 };
  state.units[1].models[0].position = { x: 5, y: 40 };
  state.history.push({
    type: 'unit.normal_move_resolved',
    payload: { unitId: 'eg1', moves: [{ modelId: 'eg1-m1', position: { x: 50, y: 40 } }] }
  });

  const spatial = getSpatialContext(state, { playerId: 'p2' });
  const proximity = spatial.unitProximity.find(item => item.unitId === 'eg1' && item.otherUnitId === 'is1');
  assert.equal(proximity?.distance, 45);

  const charge = getTacticalCombatRecommendations(state, { playerId: 'p2' }).charge;
  assert.equal(charge.some(item => item.unitId === 'eg1'), false);
});
