import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getEventCompanionMapForForceDispositions } from '../../src/rules/event-companion-map-catalog.js';
import { pointInTerrainPolygon } from '../../src/rules/death-trap-state.js';
import { getLocateAndDenyTerrainOptions } from '../../src/rules/locate-and-deny-state.js';
import { createMissionActionPicker } from '../../src/ui/mission-action-picker.js';
import { getTerrainLabelAnchor, renderMissionTerrainMapLabels } from '../../src/ui/mission-terrain-map-labels.js';

function missionState(layout='A') {
  const geometry = getEventCompanionMapForForceDispositions('Disruption','Priority Assets',layout);
  const objectives = Object.entries(geometry.objectivePositions).map(([name,position])=>({
    id:'event-companion:'+name,name,layoutObjective:name,position
  }));
  return {
    phase:'shooting',turn:1,activePlayer:'p1',
    battle:{id:'b',status:'active',round:1,activePlayerId:'p1',firstPlayerId:'p1'},
    preGameSetup:{attackerPlayerId:'p1',defenderPlayerId:'p2'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battlefieldMap:{missionSetup:{myDisposition:'Disruption',opponentDisposition:'Priority Assets',layout}},
    objectives,units:[{id:'runner',ownerId:'p1',name:'Scout',status:'deployed',position:{x:15,y:18}}],
    history:[],scoring:{turnSnapshots:[],secondaryMissions:[],secondaryMissionModeByPlayer:{p1:'tactical',p2:'tactical'}}
  };
}

test('every displayed T-label uses its real, interior Event Companion terrain footprint',()=>{
  for(const layout of ['A','B','C']) {
    const state=missionState(layout);
    const entries=getLocateAndDenyTerrainOptions(state,{playerId:'p1'});
    assert.ok(entries.length>=5);
    const markup=renderMissionTerrainMapLabels(entries);
    for(const entry of entries){
      const center=getTerrainLabelAnchor(entry.points);
      assert.ok(center,layout+' '+entry.terrainAreaId+' has an anchor');
      assert.ok(pointInTerrainPolygon(center,entry.points),layout+' '+entry.terrainAreaId+' label is inside its terrain');
      assert.match(markup,new RegExp('data-locate-map-terrain="'+entry.terrainAreaId+'"'));
      const anchor=markup.match(new RegExp('data-locate-map-terrain="'+entry.terrainAreaId+'"[^>]*style="left:([\\d.]+)%;top:([\\d.]+)%"'));
      assert.ok(anchor,'CSS coordinates present for '+entry.terrainAreaId);
      assert.ok(Math.abs(Number(anchor[1])-100*center.x/60)<0.0001);
      assert.ok(Math.abs(Number(anchor[2])-100*(44-center.y)/44)<0.0001);
    }
    for(const entry of entries.filter(item=>!item.eligible)) {
      const label=markup.match(new RegExp('<button[^>]*data-locate-map-terrain="'+entry.terrainAreaId+'"[^>]*>'));
      assert.match(label?.[0]??'',/disabled/);
    }
  }
});

test('top-down and standard battle maps use the same source T IDs as the setup buttons',()=>{
  const s=missionState();
  const choices=getLocateAndDenyTerrainOptions(s,{playerId:'p1'});
  const panel=createMissionActionPicker().render(s,'runner');
  const map=renderMissionTerrainMapLabels(choices);
  for(const item of choices.filter(item=>item.eligible)){
    assert.ok(panel.includes('data-locate-setup-terrain="'+item.terrainAreaId+'"'));
    assert.ok(map.includes('data-locate-map-terrain="'+item.terrainAreaId+'"'));
  }
  assert.doesNotMatch(map,/data-map-objective-id=/);
  assert.doesNotMatch(panel,/data-locate-setup-terrain="__unknown__"/);
});

test('map marker tap and right-panel selection share the same eligible setup state',()=>{
  const s=missionState(), entries=getLocateAndDenyTerrainOptions(s,{playerId:'p1'});
  const eligible=entries.find(item=>item.eligible);
  const excluded=entries.find(item=>!item.eligible);
  assert.ok(eligible);
  const picker=createMissionActionPicker();
  let panel=picker.render(s,'runner'),mapHtml='',renders=0;
  const handlers=new Map();
  const board={classList:{add(){}},insertAdjacentHTML(_where,html){mapHtml=html;}};
  const root={
    querySelector(selector){return selector==='[data-battlefield-map-board]'?board:null;},
    querySelectorAll(selector){
      if(selector!=='[data-locate-map-terrain]')return [];
      return entries.map(item=>({
        getAttribute:key=>key==='data-locate-map-terrain'?item.terrainAreaId:null,
        addEventListener:(name,fn)=>handlers.set(item.terrainAreaId,fn)
      }));
    }
  };
  const rerender=()=>{renders++;panel=picker.render(s,'runner');};
  picker.bind(root,()=>{},rerender);
  assert.match(mapHtml,new RegExp('data-locate-map-terrain="'+eligible.terrainAreaId+'"'));
  handlers.get(eligible.terrainAreaId)();
  assert.equal(renders,1);
  assert.match(panel,new RegExp('data-locate-setup-terrain="'+eligible.terrainAreaId+'" aria-pressed="true"'));
  if(excluded){
    handlers.get(excluded.terrainAreaId)();
    assert.equal(renders,1,'ineligible terrain cannot change the setup');
  }
  const updatedMap=renderMissionTerrainMapLabels(entries,[eligible.terrainAreaId]);
  assert.match(updatedMap,new RegExp('data-locate-map-terrain="'+eligible.terrainAreaId+'"[^>]*aria-pressed="true"'));
  handlers.get(eligible.terrainAreaId)();
  assert.equal(renders,2);
  assert.match(panel,new RegExp('data-locate-setup-terrain="'+eligible.terrainAreaId+'" aria-pressed="false"'));
});

test('terrain badges and selection outlines are scoped to the active mission only',()=>{
  const css=readFileSync(new URL('../../src/ui/styles/mission-action-picker.css',import.meta.url),'utf8');
  const picker=readFileSync(new URL('../../src/ui/mission-action-picker.js',import.meta.url),'utf8');
  assert.match(picker,/if\(mapSetupTerrainOptions\.length && mapBoard\?\.insertAdjacentHTML\)/);
  assert.match(picker,/mapBoard\.insertAdjacentHTML\('beforeend',renderMissionTerrainMapLabels\(mapSetupTerrainOptions,locateSetupTerrain\)\)/);
  assert.match(css,/\.battlefield-map__board\.is-mission-terrain-selecting/);
  assert.match(css,/\.mission-terrain-map-label\.is-selected/);
  assert.match(css,/\.battlefield-map__terrain\.is-mission-terrain-selected/);
  assert.match(picker,/terrain-footprint-labels-1/);
});
