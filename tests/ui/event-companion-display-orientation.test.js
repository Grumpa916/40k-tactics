import test from 'node:test';
import assert from 'node:assert/strict';
import {
  orientEventCompanionPoint,
  orientEventCompanionLine,
  orientEventCompanionEdge,
  eventCompanionDisplayPercent
} from '../../src/ui/event-companion-display-orientation.js';
import { battlefieldPositionToPercent } from '../../src/ui/battlefield-map.js';

const assertPercentNear = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual.left - expected.left) <= epsilon, `left ${actual.left} should match ${expected.left}`);
  assert.ok(Math.abs(actual.top - expected.top) <= epsilon, `top ${actual.top} should match ${expected.top}`);
};

test('setup map uses the same 60x44 visual orientation as deployment and live maps', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 60, y: 44 },
    { x: 30, y: 22 },
    { x: 8, y: 36 },
    { x: 52, y: 8 }
  ];

  for (const point of points) {
    assertPercentNear(eventCompanionDisplayPercent(point), battlefieldPositionToPercent(point));
  }
});

test('setup map orientation preserves table edges instead of rotating short and long edges', () => {
  assert.equal(orientEventCompanionEdge('left'), 'left');
  assert.equal(orientEventCompanionEdge('right'), 'right');
  assert.equal(orientEventCompanionEdge('top'), 'top');
  assert.equal(orientEventCompanionEdge('bottom'), 'bottom');

  const leftBottom = orientEventCompanionPoint({ x: 0, y: 0 });
  const rightTop = orientEventCompanionPoint({ x: 60, y: 44 });
  assert.deepEqual(leftBottom, { x: 0, y: 0 });
  assert.deepEqual(rightTop, { x: 44, y: 60 });

  assert.deepEqual(orientEventCompanionLine([0, 22, 60, 22]), [0, 30, 44, 30]);
});
