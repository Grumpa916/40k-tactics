import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import { getEventCompanionMapLayout } from '../../src/rules/event-companion-map-catalog.js';
import { getTerritoryRegionsFromGeometry } from '../../src/rules/battlefield-territory.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
import { buildCompleteTerrainPlacementOverlay } from '../../src/ui/terrain-placement-guide-model.js';

function example(page) {
  const source=EVENT_COMPANION_MAP_CATALOG.layouts.find(layout=>layout.page===page);
  assert.ok(source,'missing page '+page);
  const geometry=getEventCompanionMapLayout(source.missionA,source.missionB,source.layout);
  const state={battlefieldMap:{missionSetup:{
    myDisposition:'Take and Hold',opponentDisposition:'Priority Assets',layout:source.layout
  }},preGameSetup:{},players:[{id:'p1',name:'Player'}],units:[],objectives:[]};
  return {source,geometry,state,html:renderBattlefieldMap(state,{mode:'planning',showUnits:false,perspectivePlayerId:'p1'})};
}

function marker(html,name) {
  const match=html.match(new RegExp('data-layout-objective="'+name+'"[^>]*style="left:([0-9.]+)%;top:([0-9.]+)%"'));
  assert.ok(match,'rendered objective missing: '+name);
  return {left:Number(match[1]),top:Number(match[2])};
}

function halfwayAxes(html) {
  assert.match(html,/data-halfway-axis="x-30" x1="30" y1="0" x2="30" y2="44"/);
  assert.match(html,/data-halfway-axis="y-22" x1="0" y1="22" x2="60" y2="22"/);
  assert.equal((html.match(/data-halfway-axis=/g)||[]).length,2);
}

test('actual HTML on pages 21–23 matches official CCW landscape orientation, not previous X flips',()=>{
  const expected={
    21:{red:[8.1,11.1],blue:[51.6,33],territory:'vertical'},
    22:{red:[10.5,12.7],blue:[49.3,32.1],territory:'vertical'},
    23:{red:[22.2,6.3],blue:[37.9,37.9],territory:'horizontal'}
  };
  for(const [page,result] of Object.entries(expected)){
    const {source,geometry,html}=example(Number(page));
    assert.equal(geometry.landscapeMirrorY,true);
    assert.equal(geometry.landscapeMirrorX,false);
    assert.match(html,/data-map-orientation="mirror-y"/);
    for(const [name,position] of [['Defender Home',result.red],['Attacker Home',result.blue]]){
      const actual=marker(html,name);
      assert.ok(Math.abs(actual.left-position[0]/60*100)<0.02,name+' x on page '+page);
      assert.ok(Math.abs(actual.top-(44-position[1])/44*100)<0.02,name+' y on page '+page);
    }
    const red=marker(html,'Defender Home'),blue=marker(html,'Attacker Home');
    if(page==='23') {
      assert.ok(red.top>50 && blue.top<50,'page 23 defender below attacker');
    } else {
      assert.ok(red.left<50 && blue.left>50,'pages 21–22 defender left of attacker');
      assert.ok(red.top>50 && blue.top<50,'pages 21–22 red home lower, blue home upper');
    }
    assert.equal(getTerritoryRegionsFromGeometry(geometry).divider.orientation,result.territory);
    assert.equal((html.match(/data-terrain="T\d+"/g)||[]).length,16);
    assert.equal((html.match(/data-layout-objective="/g)||[]).length,6);
    assert.equal(Object.keys(geometry.terrainGeometry).length,Object.keys(source.terrainGeometry).length);
    halfwayAxes(html);
  }
});

test('every PDF page retains source terrain guide values after the correct vertical reflection',()=>{
  for(const page of [21,22,23]){
    const {source,geometry}=example(page);
    const original=buildCompleteTerrainPlacementOverlay(source);
    const rendered=buildCompleteTerrainPlacementOverlay(geometry);
    assert.equal(rendered.guides.length,original.guides.length);
    rendered.guides.forEach((guide,index)=>{
      const old=original.guides[index];
      assert.equal(guide.value,old.value);
      assert.equal(guide.terrain,old.terrain);
      assert.ok(Math.abs(guide.anchor[0]-old.anchor[0])<1e-5);
      assert.ok(Math.abs(guide.anchor[1]-(44-old.anchor[1]))<1e-5);
      assert.equal(guide.edge,old.edge==='top'?'bottom':old.edge==='bottom'?'top':old.edge);
    });
  }
});

test('all 45 layouts expose both halfway reference axes in planning, deployment and live HTML',()=>{
  const catalog=EVENT_COMPANION_MAP_CATALOG;
  const matches=[];
  for(const a of catalog.forceDispositions)for(const b of catalog.forceDispositions){
    matches.push({a,b,missions:[catalog.forceDispositionMissionMatrix[a][b],catalog.forceDispositionMissionMatrix[b][a]].sort().join('|')});
  }
  for(const source of catalog.layouts){
    const pair=matches.find(item=>item.missions===[source.missionA,source.missionB].sort().join('|'));
    assert.ok(pair,'missing force disposition combination for page '+source.page);
    const state={battlefieldMap:{missionSetup:{myDisposition:pair.a,opponentDisposition:pair.b,layout:source.layout}},units:[],objectives:[]};
    for(const mode of ['planning','deployment','live']){
      const html=renderBattlefieldMap(state,{mode,showUnits:false});
      halfwayAxes(html);
      assert.match(html,/data-map-orientation="mirror-y"/);
      assert.equal((html.match(/data-terrain="T\d+"/g)||[]).length,16);
      assert.match(html,/data-zone="attackerDeployment"/);
      assert.match(html,/data-zone="defenderDeployment"/);
    }
  }
});
