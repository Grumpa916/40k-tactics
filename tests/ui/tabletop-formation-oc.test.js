import test from 'node:test';
import assert from 'node:assert/strict';
import { getLiveUnitVitals } from '../../src/rules/live-unit-vitals.js';
import { getMapFormationOcPresentation } from '../../src/ui/map-formation-oc.js';
import { renderArmyUnitDialog } from '../../src/ui/army-unit-reference-tabs.js';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';

function oldDemoState() {
  return {
    phase: 'command', turn: 1, activePlayer: 'p1', history: [], objectives: [],
    battle: { id: 'integrated-demo', round: 1 },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    units: [
      { id: 'intercessors', ownerId: 'p1', name: 'Intercessor Squad', status: 'deployed',
        wounds: 10, profile: { characteristics: { movement: 6, toughness: 4, save: 3 } } },
      { id: 'captain', ownerId: 'p1', name: 'Captain', status: 'deployed',
        wounds: 5, profile: { characteristics: { ballisticSkill: 2, toughness: 4, save: 3 } } },
      { id: 'enemy', ownerId: 'p2', name: 'Enemy Guard', status: 'deployed',
        wounds: 10, profile: { characteristics: { movement: 6, toughness: 4, save: 3 } } }
    ]
  };
}

test('old demo save recovers known model counts without changing the saved battle', () => {
  const state = oldDemoState();
  const before = JSON.stringify(state);
  assert.equal(getLiveUnitVitals(state, state.units[0]).models, 5);
  assert.equal(getMapFormationOcPresentation(state, state.units[0]).label, 'OC 10');
  assert.equal(getMapFormationOcPresentation(state, state.units[1]).label, 'OC 1');
  assert.equal(getMapFormationOcPresentation(state, state.units[2]).label, 'OC ?');
  assert.equal(JSON.stringify(state), before);

  const unrelated = { ...state, battle: { id: 'another-battle', round: 1 } };
  assert.equal(getMapFormationOcPresentation(unrelated, unrelated.units[0]).label, 'OC ?');
});

test('visible Profile + Weapons displays model OC and formation OC for both players', () => {
  const state = oldDemoState();
  const intercessors = renderArmyUnitDialog(state, 'intercessors');
  const captain = renderArmyUnitDialog(state, 'captain');
  const opponent = renderArmyUnitDialog(state, 'enemy');
  assert.match(intercessors, /Formation OC 10/);
  assert.match(intercessors, /Objective Control<\/dt><dd>2<\/dd>/);
  assert.match(captain, /Formation OC 1/);
  assert.match(captain, /Objective Control<\/dt><dd>1<\/dd>/);
  assert.match(opponent, /Formation OC \?/);
  assert.match(opponent, /Objective Control<\/dt><dd>—<\/dd>/);

  state.units.push({ id: 'opponent-marines', ownerId: 'p2', name: 'Intercessor Squad',
    status: 'deployed', metadata: { modelCount: 5 },
    profile: { characteristics: { movement: 6, toughness: 4 } } });
  const knownOpponent = renderArmyUnitDialog(state, 'opponent-marines');
  assert.match(knownOpponent, /Formation OC 10/);
  assert.match(knownOpponent, /Objective Control<\/dt><dd>2<\/dd>/);
});

test('selected formation OC is visible across tabletop phases, including Command', () => {
  const state = oldDemoState();
  for (const phase of ['command', 'movement', 'shooting', 'charge', 'fight']) {
    state.phase = phase;
    const html = renderCombatWorkspace({
      state, phase, perspectivePlayerId: 'p1', selectedUnitId: 'intercessors',
      controls: '<button>Phase action</button>', leftRail: '<div>units</div>',
      mapView: { render: () => '<div>map</div>' }
    });
    assert.match(html, /data-selected-formation-oc/);
    assert.match(html, /Formation OC 10/);
  }
  state.phase = 'command';
  const opponent = renderCombatWorkspace({
    state, phase: 'command', perspectivePlayerId: 'p1', selectedUnitId: 'enemy',
    controls: '', leftRail: '<div>units</div>', mapView: { render: () => '<div>map</div>' }
  });
  assert.match(opponent, /Formation OC \?/);
});
