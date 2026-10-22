import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLiveCasualtyStatus } from '../../src/ui/live-casualty-panel.js';
import { summarizeGameEvent } from '../../src/ui/battle-context-panels.js';

function mixedTermagants() {
  const rosterUnit = {
    id: 'gants', name: 'Termagants', datasheetId: 'tyranids:termagants', modelCount: 10,
    equippedWargear: [
      { name: 'Chitinous claws and teeth', quantity: 10 },
      { name: 'Fleshborer', quantity: 9 },
      { name: 'Spike rifle', quantity: 1 }
    ]
  };
  const unit = {
    id: 'p1:gants', ownerId: 'p1', name: 'Termagants', status: 'deployed',
    metadata: { rosterUnitId: 'gants', modelCount: 10, datasheetId: 'tyranids:termagants' }
  };
  return {
    state: {
      battle: { status: 'active', round: 1 }, turn: 1, phase: 'shooting',
      players: [{ id: 'p1', name: 'You' }], history: [],
      armyRosters: { p1: { units: [rosterUnit] } }, units: [unit]
    },
    unit
  };
}

test('mixed Termagants keep casualty entry collapsed and use weapon-labelled tap targets', () => {
  const { state, unit } = mixedTermagants();
  const view = renderLiveCasualtyStatus(state, unit);
  assert.match(view.meta, /10 \/ 10 models/);
  assert.match(view.controls, /<summary>Record casualty<\/summary>/);
  assert.match(view.controls, /Which model was removed\?/);
  assert.match(view.controls, /− Fleshborer/);
  assert.match(view.controls, /− Spike rifle/);
  assert.doesNotMatch(view.controls, /type="number"/);
});

test('homogeneous Termagants need only a single minus-one-model action', () => {
  const { state, unit } = mixedTermagants();
  state.armyRosters.p1.units[0].equippedWargear = [
    { name: 'Chitinous claws and teeth', quantity: 10 },
    { name: 'Fleshborer', quantity: 10 }
  ];
  const view = renderLiveCasualtyStatus(state, unit);
  assert.match(view.controls, />−1 model<\/button>/);
  assert.doesNotMatch(view.controls, /Which model was removed/);
});

test('complex Carnifex casualty uses compact selectors and a checkbox rather than typed per-model data', () => {
  const selected = [
    ['Chitinous claws and teeth', 2],
    ['Heavy venom cannon', 1],
    ['Carnifex extra scything talons', 1],
    ['Carnifex crushing claws', 1],
    ['Carnifex scything talons', 1],
    ['Bio-plasma', 1]
  ];
  const rosterUnit = {
    id: 'fex', name: 'Carnifexes', datasheetId: 'tyranids:carnifexes', modelCount: 2,
    equippedWargear: selected.map(([name, quantity]) => ({ name, quantity }))
  };
  const unit = {
    id: 'p1:fex', ownerId: 'p1', name: 'Carnifexes', status: 'deployed',
    metadata: { rosterUnitId: 'fex', modelCount: 2, datasheetId: 'tyranids:carnifexes' }
  };
  const state = {
    battle: { status: 'active', round: 1 }, turn: 1, phase: 'fight', history: [],
    armyRosters: { p1: { units: [rosterUnit] } }, units: [unit]
  };
  const view = renderLiveCasualtyStatus(state, unit);
  assert.match(view.controls, /data-casualty-slot="extra-talons-slot"/);
  assert.match(view.controls, /data-casualty-slot="scything-talons-slot"/);
  assert.match(view.controls, /data-casualty-optional="Bio-plasma"/);
  assert.match(view.controls, />Remove model<\/button>/);
  assert.doesNotMatch(view.controls, /type="number"/);
});

test('casualty event summary records model count and removed weapon identity', () => {
  const { state } = mixedTermagants();
  const summary = summarizeGameEvent({
    type: 'unit.casualty_recorded',
    payload: {
      unitId: 'p1:gants', modelsBefore: 10, modelsAfter: 9,
      removedSelections: ['Chitinous claws and teeth', 'Spike rifle'], round: 1, turn: 1
    }
  }, state);
  assert.equal(summary.title, 'Casualty recorded');
  assert.match(summary.detail, /10 → 9 models/);
  assert.match(summary.detail, /Spike rifle/);
});
