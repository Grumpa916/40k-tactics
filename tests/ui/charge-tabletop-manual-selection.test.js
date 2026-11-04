import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { getChargeViewModel } from '../../src/application/charge-workflow.js';
import { createChargeScreen } from '../../src/ui/charge-screen.js';
import { getLiveUnitPosition, getSpatialContext } from '../../src/rules/spatial-context.js';
import { fakeDom } from '../helpers/combat-dom.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';

function state() {
  return createGameState({
    phase:'charge', turn:1, activePlayer:'p1',
    battle:{id:'b',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    units:[
      {id:'ac1',name:'Allarus Custodians 1',ownerId:'p1',status:'deployed',position:{x:42,y:6}},
      {id:'enemy',name:'Enemy',ownerId:'p2',status:'deployed',position:{x:42,y:36}}
    ]
  });
}

test('a far deployed unit remains selectable, with tabletop-confirmed targets outside map advice', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const game = createGameSession(state());
  const model = getChargeViewModel(game.getState(), {perspectivePlayerId:'p1'});
  const candidate = model.candidates.find(item => item.unit.unitId === 'ac1');
  assert.ok(candidate);
  assert.equal(candidate.targets[0].targetUnitId,'enemy');
  assert.equal(candidate.targets[0].rangeStatus,'outside-map-envelope');

  const root = fakeDom();
  const screen = createChargeScreen(root,{session:game,perspectivePlayerId:'p1'});
  try {
    root.click('[data-map-unit-id]','ac1');
    assert.match(root.innerHTML,/<h1>Allarus Custodians 1<\/h1>/);
    assert.match(root.innerHTML,/outside approximate range · confirm on tabletop/);
    root.click('[data-charge-target-toggle]','enemy');
    const preset = root.querySelectorAll('[data-charge-distance-value]')
      .find(node => node.getAttribute('data-charge-distance-value') === '6');
    assert.ok(preset);
    preset.events.click({target:preset});
    root.click('[data-charge-success]');
    const event = game.getState().history.find(item => item.type === 'charge.outcome_recorded');
    assert.equal(event.payload.unitId,'ac1');
    assert.deepEqual(event.payload.targetIds,['enemy']);
    assert.deepEqual(event.payload.measuredDistances,{enemy:6});
  } finally { screen.destroy(); }
});

test('an approximate map correction replaces stale deployment position in charge advice', () => {
  const initial = state();
  initial.battlefieldMap = {...initial.battlefieldMap, actualDeployment:{
    ac1:{position:{x:42,y:6}}, enemy:{position:{x:42,y:36}}
  }};
  assert.deepEqual(getLiveUnitPosition(initial,initial.units[0]),{x:42,y:6});
  const corrected = {
    ...initial,
    units:initial.units.map(unit => unit.id === 'ac1' ? {...unit,position:{x:42,y:27}} : unit),
    history:[...initial.history,{type:'battlefield_map.position_adjusted',payload:{
      unitId:'ac1',phase:'charge',round:1,turn:1,moves:[{modelId:'ac1',from:{x:42,y:6},to:{x:42,y:27}}]
    }}]
  };
  assert.deepEqual(getLiveUnitPosition(corrected,corrected.units[0]),{x:42,y:27});
  const rendered = renderBattlefieldMap(corrected,{mode:'live'});
  const marker = rendered.match(/data-map-unit-id="ac1"[^>]*style="left:([^;]+)%;top:([^%]+)%"/);
  assert.ok(marker, 'the corrected unit remains visible in the same position used by tactical advice');
  assert.equal(Number(marker[1]),70);
  assert.ok(Math.abs((44 - Number(marker[2]) * 44 / 100) - 27) < 0.01,
    'map marker Y coordinate must match corrected tactical Y coordinate');
  assert.equal(getSpatialContext(corrected,{playerId:'p1'}).unitProximity.find(item => item.unitId === 'ac1').distance,9);
  assert.equal(getChargeViewModel(corrected).candidates.find(item => item.unit.unitId === 'ac1')
    .targets[0].rangeStatus,'within');
});
