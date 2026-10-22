import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { recordChargeDeclined } from '../../src/engine/charge-transitions.js';
import { getMissionVpOptions, renderCheckpointScore } from '../../src/ui/checkpoint-score-controls.js';

test('marked setup instructions and layout switch are removed', () => {
  const army = fs.readFileSync(new URL('../../src/ui/army-selection-panel.js', import.meta.url), 'utf8');
  const shell = fs.readFileSync(new URL('../../src/ui/battle-shell.js', import.meta.url), 'utf8');
  assert.doesNotMatch(army, /Select Armies for This Battle/);
  assert.doesNotMatch(army, /Army lists stay reusable/);
  assert.doesNotMatch(army, /published 11th-edition muster table/);
  assert.doesNotMatch(shell, /Current layout/);
  assert.match(shell, /handleMissionSummaryToggle/);
});

test('charge tabletop supports declining a charge and hides charge zoom controls', () => {
  const tabletop = fs.readFileSync(new URL('../../src/ui/charge-tabletop-screen.js', import.meta.url), 'utf8');
  const workspace = fs.readFileSync(new URL('../../src/ui/combat-workspace.js', import.meta.url), 'utf8');
  assert.match(tabletop, /data-charge-decline/);
  assert.match(tabletop, /Do not charge/);
  assert.match(workspace, /showZoomControls: false/);
});

test('declining a charge records a non-charge decision and resolves that unit for the phase', () => {
  const state = {
    phase: 'charge', turn: 1, activePlayer: 'p1', battle: { status: 'active', round: 1 },
    units: [{ id: 'u1', ownerId: 'p1', status: 'deployed' }], history: []
  };
  const next = recordChargeDeclined(state, { unitId: 'u1' });
  const event = next.history.at(-1);
  assert.equal(event.type, 'charge.outcome_recorded');
  assert.equal(event.payload.outcome, 'declined');
  assert.deepEqual(event.payload.targetIds, []);
  assert.throws(() => recordChargeDeclined(next, { unitId: 'u1' }), /one Charge decision per turn/);
});

test('VP choices come from mission scoring values instead of 1 through 15', () => {
  const secondary = { category:'secondary', instanceId:'card', result:{scoringWindows:[{tiers:[{vp:3},{vp:5}]}]} };
  assert.deepEqual(getMissionVpOptions(secondary), [3,5]);
  const primary = { category:'primary', scoringWindows:[{items:[{vp:2,summary:'Per enemy unit destroyed this turn.'}]}] };
  assert.deepEqual(getMissionVpOptions(primary), [2,4,6,8,10,12,14]);
  const state = { battle:{round:1}, turn:1, history:[], scoring:{secondaryMissions:[{instanceId:'card',playerId:'p1',status:'active'}]} };
  const html = renderCheckpointScore(state,{playerId:'p1',checkpoint:'end-of-turn'},
    { ...secondary, definitionId:'centre-ground', definitionName:'Centre Ground' });
  assert.match(html, /<option value="3">3 VP<\/option>/);
  assert.match(html, /<option value="5">5 VP<\/option>/);
  assert.doesNotMatch(html, /<option value="1">1 VP<\/option>/);
});
