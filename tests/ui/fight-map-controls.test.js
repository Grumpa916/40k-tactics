import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCombatMapPanel } from '../../src/ui/combat-workspace.js';

test('fight phase hides map zoom controls while shooting keeps them', () => {
  const calls = [];
  const mapView = {
    render(_state, options) {
      calls.push(options);
      return '<div data-map></div>';
    }
  };
  const state = {};

  renderCombatMapPanel({ state, phase: 'fight', perspectivePlayerId: 'p1', selectedUnitId: null, mapView });
  renderCombatMapPanel({ state, phase: 'shooting', perspectivePlayerId: 'p1', selectedUnitId: null, mapView });

  assert.equal(calls[0].showZoomControls, false);
  assert.equal(calls[1].showZoomControls, true);
});
