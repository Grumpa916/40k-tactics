import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNormalMove } from '../../src/engine/movement-transitions.js';
import {
  getMovementRefinement,
  refineMovementAction,
  undoMovementRefinement
} from '../../src/engine/movement-refinement-transitions.js';

function state() {
  return {
    phase: 'movement',
    turn: 1,
    activePlayer: 'p1',
    battle: { id:'b', status:'active', round:2, activePlayerId:'p1' },
    units: [
      { id:'u1', ownerId:'p1', name:'Unit', status:'deployed', position:{ x:10, y:10 } }
    ],
    history: []
  };
}

function dragged() {
  return resolveNormalMove(state(), {
    unitId:'u1',
    moves:[{ modelId:'u1', position:{ x:16, y:12 } }]
  });
}

test('Advance refinement preserves the dragged position and base movement geometry', () => {
  const moved = dragged();
  const refined = refineMovementAction(moved, { unitId:'u1', movementType:'advance', advanceRoll:4 });
  assert.deepEqual(refined.units[0].position, { x:16, y:12 });
  assert.equal(refined.history.some(event => event.type === 'unit.normal_move_resolved'), true);
  assert.deepEqual(getMovementRefinement(refined, 'u1'), {
    movementType:'advance', advanceRoll:4, reason:'Advance +4"', eventType:'unit.movement_refined'
  });
});

test('Fall Back refinement records the authoritative Fall Back fact without moving again', () => {
  const moved = dragged();
  const refined = refineMovementAction(moved, { unitId:'u1', movementType:'fall_back' });
  assert.deepEqual(refined.units[0].position, { x:16, y:12 });
  const fallBack = refined.history.find(event => event.type === 'unit.fell_back');
  assert.equal(fallBack?.payload?.movementRefinement, true);
  assert.equal(fallBack?.payload?.unitId, 'u1');
  assert.equal(refined.history.some(event => event.type === 'unit.normal_move_resolved'), true);
});

test('Special movement refinement is optional metadata and can be undone without undoing movement', () => {
  const moved = dragged();
  const refined = refineMovementAction(moved, { unitId:'u1', movementType:'special' });
  assert.equal(getMovementRefinement(refined, 'u1')?.movementType, 'special');
  const undone = undoMovementRefinement(refined, { unitId:'u1' });
  assert.equal(getMovementRefinement(undone, 'u1'), null);
  assert.deepEqual(undone.units[0].position, { x:16, y:12 });
  assert.equal(undone.history.some(event => event.type === 'unit.normal_move_resolved'), true);
});

test('Normal refinement clears an existing exception and leaves the drag as the movement record', () => {
  let current = refineMovementAction(dragged(), { unitId:'u1', movementType:'advance', advanceRoll:2 });
  current = refineMovementAction(current, { unitId:'u1', movementType:'normal' });
  assert.equal(getMovementRefinement(current, 'u1'), null);
  assert.equal(current.history.filter(event => event.type === 'unit.normal_move_resolved').length, 1);
  assert.deepEqual(current.units[0].position, { x:16, y:12 });
});
