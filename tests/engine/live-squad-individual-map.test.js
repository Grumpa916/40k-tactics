import test from 'node:test';
import assert from 'node:assert/strict';
import { expandLiveSquadModels, adjustLiveMapPosition } from '../../src/engine/battlefield-map-transitions.js';
import { getLiveUnitPosition } from '../../src/rules/spatial-context.js';
import { createLiveMapView } from '../../src/ui/live-map-view.js';
import { COMMAND_TYPES } from '../../src/commands/game-commands.js';
import { readFileSync } from 'node:fs';

function state(count=3){
  return {battle:{id:'b',status:'active',round:1},phase:'command',turn:1,activePlayer:'p1',
    players:[{id:'p1'},{id:'p2'}],history:[],commandPoints:{p1:2,p2:2},objectives:[],
    units:[{id:'p1:guard',ownerId:'p1',status:'deployed',name:'Custodian Guard Sodality',
      metadata:{modelCount:count,datasheetId:'adeptus-custodes:custodian-guard-sodality'},
      position:{x:18,y:17},currentStrength:count,wounds:15}]};
}

test('expansion creates stable, individual physical model positions without making extra combat units',()=>{
  const before=state();
  const unchanged=JSON.stringify(before);
  const next=expandLiveSquadModels(before,{unitId:'p1:guard',playerId:'p1'});
  assert.equal(JSON.stringify(before),unchanged);
  assert.equal(next.units.length,1);
  assert.equal(next.commandPoints.p1,2);
  assert.equal(next.units[0].currentStrength,3);
  assert.equal(next.units[0].wounds,15);
  assert.equal(next.units[0].models.length,3);
  assert.equal(new Set(next.units[0].models.map(model=>model.id)).size,3);
  assert.ok(next.units[0].models.every(model=>model.position.x>=0 && model.position.y>=0));
  assert.equal(next.history.at(-1).type,'battlefield_map.models_expanded');
  assert.equal(expandLiveSquadModels(next,{unitId:'p1:guard',playerId:'p1'}),next,'repeat expansion idempotent');
  const centroid=getLiveUnitPosition(next,next.units[0]);
  assert.ok(Number.isFinite(centroid.x)&&Number.isFinite(centroid.y));
  const originalPositions=next.units[0].models.map(model=>model.position);
  const moved=adjustLiveMapPosition(next,{unitId:'p1:guard',playerId:'p1',
    moves:next.units[0].models.map((model,index)=>({modelId:model.id,
      position:index===1?{x:33,y:29}:model.position}))});
  assert.equal(moved.units.length,1);
  assert.deepEqual(moved.units[0].models[1].position,{x:33,y:29});
  assert.deepEqual(moved.units[0].models[0].position,originalPositions[0]);
  assert.deepEqual(moved.units[0].models[2].position,originalPositions[2]);
  assert.deepEqual(moved.units[0].models.map(m=>m.id),next.units[0].models.map(m=>m.id));
  assert.ok(getLiveUnitPosition(moved,moved.units[0]).x>getLiveUnitPosition(next,next.units[0]).x);
});

test('never fabricate squads when current model count or battlefield position is uncertain',()=>{
  const bad=state();
  delete bad.units[0].currentStrength;
  delete bad.units[0].metadata.modelCount;
  assert.throws(()=>expandLiveSquadModels(bad,{unitId:'p1:guard',playerId:'p1'}),/surviving model count/);
  const absent=state();
  delete absent.units[0].position;
  assert.throws(()=>expandLiveSquadModels(absent,{unitId:'p1:guard',playerId:'p1'}),/Place the squad/);
  const partial=state();
  partial.units[0].models=[{id:'existing',position:{x:17,y:18}}];
  assert.throws(()=>expandLiveSquadModels(partial,{unitId:'p1:guard',playerId:'p1'}),/incomplete/);
  const reserved=state();
  reserved.units[0].status='reserves';
  assert.throws(()=>expandLiveSquadModels(reserved,{unitId:'p1:guard',playerId:'p1'}),/deployed/);
  assert.throws(()=>expandLiveSquadModels(state(),{unitId:'p1:guard',playerId:'p2'}),/owning player/);
});

test('at board edges squad model markers stay on battlefield and have unique IDs',()=>{
  for(const position of [{x:0,y:0},{x:60,y:44},{x:1,y:43}]){
    const start=state(9);
    start.units[0].position=position;
    start.units[0].metadata.modelCount=9;
    start.units[0].currentStrength=9;
    const expanded=expandLiveSquadModels(start,{unitId:'p1:guard',playerId:'p1:guard'.split(':')[0]});
    assert.equal(expanded.units[0].models.length,9);
    assert.ok(expanded.units[0].models.every(m=>m.position.x>=0 && m.position.x<=60&&m.position.y>=0 &&m.position.y<=44));
  }
});

test('Top-down live map exposes expansion control and a separate model-marker layer',()=>{
  const old=globalThis.localStorage;
  try{
    globalThis.localStorage={getItem:()=>null,setItem(){}};
    const view=createLiveMapView();
    const html=view.render(state(),{selectedUnitId:'p1:guard',perspectivePlayerId:'p1'});
    assert.match(html,/data-live-map-squad-toggle/);
    assert.match(html,/Expand squad · 3/);
    assert.match(html,/data-live-map-individual-models/);
    assert.match(html,/data-live-map-bases-layer/);
  }finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;}
});

test('the new map controls are wired into every live combat phase',()=>{
  const names=['command-screen','movement-screen','shooting-screen','charge-tabletop-screen','fight-tabletop-screen'];
  for(const name of names){
    const source=readFileSync(new URL('../../src/ui/'+name+'.js',import.meta.url),'utf8');
    assert.match(source,/mapView\.bind\(container, undefined, undefined, session\);/,name);
  }
  const css=readFileSync(new URL('../../src/ui/styles/live-map.css',import.meta.url),'utf8');
  assert.match(css,/\.live-map__individual-models \{/);
  assert.match(css,/\.live-map__individual-model::before \{[\s\S]*?44px/);
  assert.match(css,/\.battlefield-map__unit\.is-squad-expanded/);
  const ui=readFileSync(new URL('../../src/ui/live-map-view.js',import.meta.url),'utf8');
  assert.match(ui,/data-live-model-id/);
  assert.match(ui,/COMMAND_TYPES\.EXPAND_LIVE_SQUAD_MODELS/);
  assert.match(ui,/COMMAND_TYPES\.ADJUST_LIVE_MAP_POSITION/);
});
