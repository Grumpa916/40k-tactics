import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { recordBattleShockTest } from '../../src/engine/battle-shock-transitions.js';
import { isUnitBattleShocked } from '../../src/rules/unit-status-summary.js';
import { createLiveMapView } from '../../src/ui/live-map-view.js';
import { renderArmyRosterOverlay, renderArmyUnitDialog } from '../../src/ui/battle-context-panels.js';
import { createPrototypeWorkspace } from '../../src/ui/prototype-workspace.js';

function state() {
  return createGameState({phase:'shooting', turn:1, activePlayer:'p1', players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}], battle:{id:'b',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},units:[
    {id:'shooter',name:'Hive Tyrant',ownerId:'p1',status:'deployed',wounds:10,startingStrength:1,startingWounds:10,position:{x:20,y:20},profile:null},
    {id:'enemy',name:'Enemy',ownerId:'p2',status:'deployed',wounds:5,position:{x:25,y:20},profile:null}
  ]});
}
const event = (type,payload={}) => ({type,payload:{unitId:'shooter',round:1,turn:1,...payload}});
test('activation checkmarks survive saved-state reload and do not leak into Charge or next turn', () => {
  const initial=state();
  initial.history=[event('shooting.unit_activated',{actionType:'shoot'})];
  assert.match(createLiveMapView().render(initial,{}), /Activation in progress/);
  initial.history.push(event('combat.activation_finished',{phase:'shooting'}));
  const reloaded=JSON.parse(JSON.stringify(initial));
  assert.match(createLiveMapView().render(reloaded,{}), /Activation complete/);
  assert.doesNotMatch(createLiveMapView().render({...reloaded,phase:'charge'},{}), /Activation complete/);
  assert.doesNotMatch(createLiveMapView().render({...reloaded,turn:2},{}), /Activation complete/);
  assert.equal(reloaded.units[0].position.x,20);
});
test('mission Action and Skip display resolved badges without requiring a shooting attack',()=>{
  for(const actionType of ['mission_action','not_shoot']) {
    const initial=state();initial.history=[event('shooting.unit_activated',{actionType})];
    assert.match(createLiveMapView().render(initial,{}),/Activation complete/);
  }
});
test('army rows expose real catalog stats and separate full unit detail, with unknown counts honest',()=>{
  const initial=state();
  const rows=renderArmyRosterOverlay(initial,'p1');
  assert.match(rows,/data-open-unit-details="shooter"/);
  for(const stat of ['M','T','S','SV','LD','OC','MODELS','WOUNDS']) assert.ok(rows.includes(`<small>${stat}</small>`));
  assert.match(rows,/<small>T<\/small><b>10<\/b>/);
  assert.match(rows,/<small>MODELS<\/small><b>1\/1<\/b>/);
  const detail=renderArmyUnitDialog(initial,'shooter');
  assert.match(detail,/Monstrous bonesword/);
  assert.match(detail,/Shadow in the Warp/);
  assert.doesNotMatch(detail,/data-manual-battle-shock="shooter"/);
  assert.match(renderArmyRosterOverlay(initial,'p1'),/data-manual-battle-shock="shooter"/);
  assert.doesNotMatch(renderArmyRosterOverlay(initial,'p2'),/undefined\/undefined/);
});

test('unit detail stats include an invulnerable save only when the datasheet provides one', async()=>{
  const {unitStats}=await import('../../src/ui/army-unit-details.js');
  const withSave=unitStats({datasheet:{characteristics:{Move:'8"',Toughness:10,Save:'2+',Wounds:10,Leadership:'7+', 'Objective Control':3, 'Invulnerable save':'4+'}}});
  const withoutSave=unitStats({datasheet:{characteristics:{Move:'8"',Toughness:9,Save:'2+',Wounds:8,Leadership:'8+', 'Objective Control':3}}});
  assert.match(withSave,/<small>Sv<\/small><strong>2\+<\/strong><em>Inv 4\+<\/em>/);
  assert.doesNotMatch(withoutSave,/>Inv<\/small>/);
});
function workspaceFixture(session) {
  const handlers={};
  const node=()=>({attrs:{},hidden:false,setAttribute(key,val){this.attrs[key]=val;},focus(){},append(child){child.parentElement=this;}});
  const shell=node(), tools=node(), progression=node(), overlay=node();progression.parentElement=shell;
  shell.insertBefore=child=>{child.parentElement=shell;};
  const nodes={'.battle-shell':shell,'.shoot-screen--tabletop, .combat-workspace':node(),'[data-prototype-tools]':tools,'[data-phase-progression-host]':progression,'[data-army-roster-overlay]':overlay,'[data-workspace-phase]':node(),'[data-workspace-focus]':node(),'[data-workspace-panel]':node()};
  const root={querySelector:selector=>nodes[selector]??null,querySelectorAll:()=>[],addEventListener:(type,fn)=>handlers[type]=fn,removeEventListener:type=>delete handlers[type]};
  const controller=createPrototypeWorkspace(root,{session});
  const click=(attr,value='')=>{const target={getAttribute:()=>value,closest:selector=>selector===`[${attr}]`?target:null};handlers.click({target});};
  return {shell,tools,progression,overlay,controller,click,handlers};
}
test('Battle view and side-panel preferences survive refresh; phase progression remains available',()=>{
  const initial=state(), x=workspaceFixture({getState:()=>initial});
  x.controller.refresh();
  assert.equal(x.shell.attrs['data-battle-focus'],'true');
  assert.equal(x.progression.parentElement,x.tools);
  x.click('data-workspace-panel');
  x.controller.refresh();
  assert.equal(x.shell.attrs['data-controls-collapsed'],'true');
  x.click('data-workspace-focus');
  assert.equal(x.shell.attrs['data-battle-focus'],'false');
  assert.equal(x.progression.parentElement,x.shell);
  x.click('data-workspace-focus');x.click('data-workspace-panel');
  assert.equal(x.shell.attrs['data-controls-collapsed'],'false');
  x.controller.destroy();assert.equal(x.handlers.click,undefined);
});
test('unit detail manually changes either army Battle-shock in Shooting through the persistent command engine',()=>{
  clearCommandHandlers();registerCoreCommandHandlers();
  const session=createGameSession(state()), x=workspaceFixture(session);
  x.click('data-open-unit-details','enemy');
  assert.match(x.overlay.innerHTML,/Enemy/);
  x.click('data-manual-battle-shock','enemy');
  assert.equal(isUnitBattleShocked(session.getState().units[1]),true);
  assert.equal(session.getState().history.at(-1).type,'battle_shock.status_changed');
  x.click('data-manual-battle-shock','enemy');
  assert.equal(isUnitBattleShocked(session.getState().units[1]),false);
  assert.equal(session.getState().history.filter(item=>item.type==='battle_shock.test_recorded').length,0);
  x.controller.destroy();
});
test('a passed Command test clears all Battle-shock representations after manual marking',()=>{
  const initial=state();initial.phase='command';initial.units[0]={...initial.units[0],battleShocked:true,battleShock:{active:true,status:'battle-shocked'}};
  const next=recordBattleShockTest(initial,{unitId:'shooter',result:'passed'});
  assert.equal(isUnitBattleShocked(next.units[0]),false);
});
