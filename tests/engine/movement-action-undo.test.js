import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNormalMove, resolveAdvance, recordStationary, undoMovementAction } from '../../src/engine/movement-transitions.js';

function state() {
  return {
    battle: { status: 'active', round: 1 }, phase: 'movement', turn: 1, activePlayer: 'p1',
    players: [{id:'p1'},{id:'p2'}], history: [],
    units: [{ id:'u1', ownerId:'p1', status:'deployed', position:{x:10,y:10}, movement:6 }]
  };
}

test('undo Normal Move restores the pre-move position and permits Did Not Move', () => {
  const moved = resolveNormalMove(state(), { unitId:'u1', moves:[{modelId:'u1',position:{x:14,y:10}}] });
  assert.deepEqual(moved.units[0].position,{x:14,y:10});
  assert.equal(moved.history.at(-1).type,'unit.normal_move_resolved');
  const undone = undoMovementAction(moved,{unitId:'u1'});
  assert.deepEqual(undone.units[0].position,{x:10,y:10});
  assert.equal(undone.history.some(event=>event.type==='unit.normal_move_resolved'),false);
  const stationary = recordStationary(undone,{unitId:'u1'});
  assert.equal(stationary.history.at(-1).type,'unit.stationary_recorded');
});

test('undo Advance restores the pre-advance position', () => {
  const advanced = resolveAdvance(state(), { unitId:'u1', advanceRoll:4, moves:[{modelId:'u1',position:{x:16,y:10}}] });
  const undone = undoMovementAction(advanced,{unitId:'u1'});
  assert.deepEqual(undone.units[0].position,{x:10,y:10});
  assert.equal(undone.history.some(event=>event.type==='unit.advanced'),false);
});
