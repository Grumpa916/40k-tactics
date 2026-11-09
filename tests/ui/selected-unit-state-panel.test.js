import test from 'node:test';
import assert from 'node:assert/strict';
import { recordUnitCasualty } from '../../src/engine/unit-casualty-transitions.js';
import { renderSelectedUnitStatePanel } from '../../src/ui/selected-unit-state-panel.js';

function battleState() {
  return {
    phase: 'fight', turn: 1,
    battle: { id: 'b', status: 'active', round: 1, activePlayerId: 'p1' },
    history: [],
    armyRosters: { p1: { units: [{
      id: 'bikes', name: 'Vertus Praetors', datasheetId: 'custodes:vertus-praetors', modelCount: 2,
      equippedWeapons: [
        { name: 'Salvo Launcher', quantity: 2 },
        { name: 'Interceptor Lance', quantity: 2 }
      ],
      datasheet: {
        characteristics: { Wounds: 3, OC: 2 },
        weapons: [
          { name: 'Salvo Launcher', range: '24"', attacks: 1, skill: '2+', strength: 9, ap: -3, damage: 4 },
          { name: 'Interceptor Lance', range: 'Melee', attacks: 4, skill: '2+', strength: 7, ap: -2, damage: 2 }
        ]
      }
    }] } },
    units: [{
      id: 'p1:bikes', ownerId: 'p1', name: 'Vertus Praetors', status: 'deployed',
      metadata: { rosterUnitId: 'bikes', modelCount: 2, datasheetId: 'custodes:vertus-praetors' }
    }]
  };
}

test('selected-unit panel exposes one-tap controls and live formation summary', () => {
  const state = battleState();
  const html = renderSelectedUnitStatePanel(state, 'p1:bikes', { perspectivePlayerId: 'p1' });
  assert.match(html, /data-adjust-unit-wounds="1"/);
  assert.match(html, /data-adjust-unit-wounds="-1"/);
  assert.match(html, /data-toggle-live-battle-shock/);
  assert.match(html, /data-record-casualty/);
  assert.match(html, /Formation OC: 4/);
  assert.match(html, /Salvo Launcher: <strong>2<\/strong>/);
});

test('casualty updates the per-model wound cap, weapon count and OC; Battle-shock removes OC', () => {
  let state = battleState();
  state = recordUnitCasualty(state, { unitId: 'p1:bikes' });
  let html = renderSelectedUnitStatePanel(state, 'p1:bikes', { perspectivePlayerId: 'p1' });
  assert.match(html, /Formation OC: 2/);
  assert.match(html, /Salvo Launcher: <strong>1<\/strong>/);
  assert.match(html, /3 \/ 3 W/);

  state = {
    ...state,
    units: state.units.map(unit => unit.id === 'p1:bikes' ? { ...unit, battleShocked: true } : unit)
  };
  html = renderSelectedUnitStatePanel(state, 'p1:bikes', { perspectivePlayerId: 'p1' });
  assert.match(html, /Formation OC: 0/);
  assert.match(html, /OC 0 \(Battle-shocked\)/);
});
