import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { createBattleShell } from '../../src/ui/battle-shell.js';
import { createLiveMapView } from '../../src/ui/live-map-view.js';
import {
  MAP_OBJECTIVE_CONTROL_CHOICES,
  mapObjectiveControlCommand,
  nextMapObjectiveControl,
  renderMapObjectiveControlPicker,
  selectedMapObjectiveControl
} from '../../src/ui/map-objective-control-picker.js';

const css = readFileSync(new URL('../../src/ui/styles/live-map.css', import.meta.url), 'utf8');

function state() {
  return createGameState({
    phase:'shooting', turn:1, activePlayer:'p1',
    battle:{id:'objective-map-test', status:'active',round:1,activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    commandPoints:{p1:1,p2:1},
    victoryPoints:{p1:2,p2:0},
    units:[],
    objectives:[{id:'center-1',name:'Center 1',position:{x:30,y:22},
      control:{id:'center-1',controlState:'uncontrolled',controllerId:null,contestingPlayerIds:[]}}]
  });
}

test('top-down map scales visible objective labels to 70% while preserving 44px tap area', () => {
  assert.match(css, /width:clamp\(49px,4\.9vw,70px\) !important/);
  assert.match(css, /min-height:29\.4px !important/);
  assert.match(css, /font-size:8\.4px !important/);
  assert.match(css, /\.battlefield-map__objective::after\s*\{[^}]*height:44px/s);
  assert.match(css, /\.live-map\.is-standard \[data-map-objective-picker\] \{ display:none !important; \}/);
  const html = createLiveMapView().render(state(),{perspectivePlayerId:'p1'});
  assert.match(html, /data-map-objective-picker hidden/);
  assert.match(html, /data-map-objective-id="center-1"/);
});

test('control picker exposes four explicitly named and touch-sized options and highlights current status', () => {
  const game = state();
  assert.deepEqual(MAP_OBJECTIVE_CONTROL_CHOICES.map(item=>item.id),
    ['mine','opponent','contested','uncontrolled']);
  const html = renderMapObjectiveControlPicker(game, {
    objectiveId:'center-1',label:'Center 1',perspectivePlayerId:'p1'
  });
  assert.match(html, /data-map-objective-control-close/);
  assert.match(html, /data-map-objective-control-choice="mine"/);
  assert.match(html, /data-map-objective-control-choice="opponent"/);
  assert.match(html, /data-map-objective-control-choice="contested"/);
  assert.match(html, /data-map-objective-control-choice="uncontrolled" aria-pressed="true"/);
  assert.match(html, /does not award VP/);
  assert.match(css, /\.live-map__objective-choice \{[^}]*min-height:44px/s);
});

test('objective picker commands preserve controller, contested IDs and event source', () => {
  const game = state();
  assert.equal(selectedMapObjectiveControl(game,'center-1','p1'),'uncontrolled');
  assert.equal(nextMapObjectiveControl(game,'center-1','p1'),'mine');
  for(const [choice, expected] of [
    ['mine',{controlState:'controlled',controllerId:'p1',contestingPlayerIds:[]}],
    ['opponent',{controlState:'controlled',controllerId:'p2',contestingPlayerIds:[]}],
    ['contested',{controlState:'contested',controllerId:null,contestingPlayerIds:['p1','p2']}],
    ['uncontrolled',{controlState:'uncontrolled',controllerId:null,contestingPlayerIds:[]}]
  ]) {
    const command=mapObjectiveControlCommand(game,{objectiveId:'center-1',choice,perspectivePlayerId:'p1'});
    assert.equal(command.type,'objective.record_control');
    assert.deepEqual(command.payload,{objectiveId:'center-1',...expected});
    assert.equal(Object.hasOwn(command.payload,'vp'),false);
  }
  assert.throws(()=>mapObjectiveControlCommand(game,{objectiveId:'absent',choice:'mine'}),/not in this battle/);
});

test('tap top-down objective opens picker without changing control; choosing records history and VP stays unchanged', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const session = createGameSession(state());
  const listeners = new Set();
  const picker = {
    hidden:true,innerHTML:'',attributes:{},
    setAttribute(key,value){this.attributes[key]=String(value);},
    getAttribute(key){return this.attributes[key]??null;},
    querySelector(){return {textContent:''};}
  };
  const map = {querySelector(selector){return selector==='[data-map-objective-picker]'?picker:null;}};
  const screen={innerHTML:'',replaceChildren(){}};
  const container={
    innerHTML:'',replaceChildren(){},contains(){return true;},
    querySelector(selector){
      if(selector==='[data-battle-screen]')return screen;
      if(selector==='[data-map-objective-picker]')return picker;
      return null;
    },
    addEventListener(type,fn){if(type==='click')listeners.add(fn);},
    removeEventListener(type,fn){if(type==='click')listeners.delete(fn);}
  };
  const shell = createBattleShell(container,{session,screenFactories:{},perspectivePlayerId:'p1'});
  const click=target=>{for(const fn of listeners)fn({target,preventDefault(){},stopPropagation(){}});};
  const marker={
    textContent:'Center 1',
    getAttribute(name){return name==='data-map-objective-id'?'center-1':null;},
    closest(selector){
      if(selector==='[data-map-objective-id]')return this;
      if(selector==='.live-map.is-top-down')return map;
      return null;
    }
  };
  const choice={
    getAttribute(name){return name==='data-map-objective-control-choice'?'opponent':null;},
    closest(selector){
      if(selector==='[data-map-objective-control-choice]')return this;
      if(selector==='[data-map-objective-picker]')return picker;
      return null;
    }
  };
  try {
    click(marker);
    assert.equal(picker.hidden,false);
    assert.match(picker.innerHTML,/Center 1/);
    assert.equal(session.getState().objectives[0].control.controlState,'uncontrolled');
    click(choice);
    assert.equal(picker.hidden,true);
    assert.equal(session.getState().objectives[0].control.controllerId,'p2');
    assert.equal(session.getState().objectives[0].control.controlState,'controlled');
    assert.ok(session.getState().history.some(event=>event.type==='objective.control_recorded'));
    assert.deepEqual(session.getState().victoryPoints,{p1:2,p2:0});
  } finally {shell.destroy();}
});
