import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { bindLiveMapPositionCorrection } from '../../src/ui/live-map-position-correction.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
import { getLiveUnitPosition } from '../../src/rules/spatial-context.js';

function setup(phase, { actualDeployment = false } = {}) {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const initial = createGameState({
    phase, turn:1, activePlayer:'p1',
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battle:{id:'b',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},
    units:[
      {id:'ours',name:'Ours',ownerId:'p1',status:'deployed',position:{x:10,y:10}},
      {id:'theirs',name:'Theirs',ownerId:'p2',status:'deployed',position:{x:30,y:20}}
    ]
  });
  if (actualDeployment) initial.battlefieldMap = {...initial.battlefieldMap, actualDeployment:{
    ours:{position:{x:10,y:10}}, theirs:{position:{x:30,y:20}}
  }};
  const game = createGameSession(initial);
  const handlers = {};
  const container = {
    addEventListener(type, fn) { handlers[type] = fn; },
    removeEventListener(type, fn) { if (handlers[type] === fn) delete handlers[type]; }
  };
  const unbind = bindLiveMapPositionCorrection(container, game, {phase});
  function drag(unitId, destination, { tap = false } = {}) {
    const unit = game.getState().units.find(item => item.id === unitId);
    const board = { getBoundingClientRect:() => ({left:0,top:0,width:600,height:440}) };
    const marker = {
      style:{left:unit.position.x / 60 * 100 + '%',top:(44 - unit.position.y) / 44 * 100 + '%'},
      classList:{add() {},remove() {}}, setPointerCapture() {},
      getAttribute:name => name === 'data-map-unit-id' ? unitId : null,
      closest:selector => selector === '[data-battlefield-map-board]' ? board : selector === '[data-map-mode="live"]' ? {} : null
    };
    const target = {closest:selector => selector === '[data-map-unit-id]' ? marker : null};
    handlers.pointerdown({target,pointerId:1,clientX:unit.position.x * 10,clientY:(44 - unit.position.y) * 10});
    if (!tap) handlers.pointermove({pointerId:1,clientX:destination.x * 10,clientY:(44 - destination.y) * 10,preventDefault() {}});
    handlers.pointerup({pointerId:1,clientX:destination.x * 10,clientY:(44 - destination.y) * 10});
  }
  return {game,handlers,drag,unbind};
}

for (const phase of ['command','shooting','fight']) {
  test(`${phase} map allows approximate corrections for both armies without recording movement actions`, () => {
    const {game,drag,unbind,handlers} = setup(phase);
    try {
      drag('ours',{x:15,y:12});
      drag('theirs',{x:35,y:22});
      assert.deepEqual(game.getState().units.map(unit => unit.position),[{x:15,y:12},{x:35,y:22}]);
      assert.deepEqual(game.getState().history.filter(e => e.type === 'battlefield_map.position_adjusted')
        .map(e => e.payload.phase),[phase,phase]);
      assert.equal(game.getState().history.some(e => e.type === 'unit.normal_move_resolved' || e.type === 'unit.advanced'),false);
      const count = game.getState().history.length;
      drag('ours',{x:15,y:12},{tap:true});
      assert.equal(game.getState().history.length,count);
    } finally {
      unbind();
      assert.equal(handlers.pointerdown,undefined);
    }
  });
}

test('Command, Shooting, and Fight phase screens bind the correction handler', () => {
  for (const screen of ['command-screen.js','shooting-screen.js','fight-tabletop-screen.js']) {
    const source = fs.readFileSync(new URL('../../src/ui/' + screen, import.meta.url),'utf8');
    assert.match(source,/bindLiveMapPositionCorrection\(container, session/);
    assert.match(source,/unbindMapCorrection\(\)/);
  }
});

function renderedPosition(state, id) {
  const markup = renderBattlefieldMap(state, {mode:'live'});
  const marker = markup.match(new RegExp('data-map-unit-id="' + id + '"[^>]*style="left:([^;]+)%;top:([^%]+)%"'));
  assert.ok(marker, 'marker must render for ' + id);
  return {
    x:Math.round(Number(marker[1]) / 100 * 60 * 10) / 10,
    y:Math.round((44 - Number(marker[2]) / 100 * 44) * 10) / 10
  };
}

test('live marker and tactical coordinates both honor successive corrections before first Normal Move', () => {
  const {game,drag,unbind} = setup('command', {actualDeployment:true});
  try {
    assert.deepEqual(renderedPosition(game.getState(),'ours'),{x:10,y:10});
    drag('ours',{x:15,y:12});
    assert.deepEqual(renderedPosition(game.getState(),'ours'),{x:15,y:12},
      'first correction must be visible rather than snap back to initial deployment');
    drag('ours',{x:20,y:14});
    assert.deepEqual(renderedPosition(game.getState(),'ours'),{x:20,y:14},
      'next drag must start at the corrected marker, not accumulate offsets');
    const state = game.getState();
    assert.deepEqual(getLiveUnitPosition(state,state.units[0]),{x:20,y:14});
    assert.equal(state.history.filter(event => event.type === 'battlefield_map.position_adjusted').length,2);
    assert.equal(state.history.some(event => ['unit.normal_move_resolved','unit.advanced'].includes(event.type)),false);
  } finally { unbind(); }
});
