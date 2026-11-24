import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { getMapFormationOcPresentation } from '../../src/ui/map-formation-oc.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
import { createLiveMapView } from '../../src/ui/live-map-view.js';

test('map OC reflects current models and battle-shock for either army', () => {
  const state = custodesReminderState({phase:'shooting',activePlayer:'p1'});
  const unit = state.units.find(unit => unit.id === 'allarus');
  unit.currentStrength = 3;
  assert.equal(getMapFormationOcPresentation(state, unit).label, 'OC 6');
  unit.currentStrength = 1;
  assert.equal(getMapFormationOcPresentation(state, unit).label, 'OC 2');
  const enemy = state.units.find(unit => unit.id === 'marine');
  enemy.characteristics = {...enemy.characteristics, objectiveControl:2};
  enemy.currentStrength = 5;
  assert.equal(getMapFormationOcPresentation(state, enemy).label, 'OC 10');
  enemy.currentStrength = 2;
  assert.equal(getMapFormationOcPresentation(state, enemy).label, 'OC 4');
  enemy.battleShocked = true;
  assert.equal(getMapFormationOcPresentation(state, enemy).label, 'OC 0');
  assert.match(renderBattlefieldMap(state,{showFormationOc:true}), /data-map-unit-oc/);
  assert.doesNotMatch(renderBattlefieldMap(state), /data-map-unit-oc/);
});

test('map displays a single formation total for an attached leader', () => {
  const state = custodesReminderState();
  const root = state.units.find(unit => unit.id === 'wardens');
  const leader = state.units.find(unit => unit.id === 'trajann');
  root.currentStrength=3;
  leader.currentStrength=1;
  assert.equal(getMapFormationOcPresentation(state, root).label,'OC 8');
  assert.equal(getMapFormationOcPresentation(state, leader).label,'OC 8');
});

test('missing enemy OC is not displayed as zero and toggle is available across phases', () => {
  const state = custodesReminderState();
  const enemy = state.units.find(unit => unit.id === 'marine');
  assert.equal(getMapFormationOcPresentation(state, enemy).label,'OC ?');
  const view = createLiveMapView();
  for (const phase of ['command','movement','shooting','charge','fight']) {
    state.phase=phase;
    const html=view.render(state,{perspectivePlayerId:'p1'});
    assert.match(html,/data-live-map-oc-toggle/);
    assert.match(html,/data-map-unit-oc/, 'symbol replacement preserves OC labels');
    assert.match(html,/data-show-formation-oc="(?:true|false)"/);
  }
});
