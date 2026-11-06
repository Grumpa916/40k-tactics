import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import { getEventCompanionMapLayout } from '../../src/rules/event-companion-map-catalog.js';
import { getTerritoryRegionsFromGeometry } from '../../src/rules/battlefield-territory.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
import { buildCompleteTerrainPlacementOverlay } from '../../src/ui/terrain-placement-guide-model.js';

function pageCase(page) {
  const source=EVENT_COMPANION_MAP_CATALOG.layouts.find(layout=>layout.page===page);
  assert.ok(source);
  const resolved=getEventCompanionMapLayout(source.missionA,source.missionB,source.layout);
  const state={battlefieldMap:{missionSetup:{
    myDisposition:'Take and Hold',opponentDisposition:'Priority Assets',layout:source.layout
  }},preGameSetup:{},players:[{id:'p1',name:'Player'}],units:[],objectives:[]};
  return {source,resolved,state,html:renderBattlefieldMap(state,{mode:'planning',showUnits:false,perspectivePlayerId:'p1'})};
}

function markerPercent(html,name){
  const match=html.match(new RegExp('data-layout-objective="'+name+'"[^>]*style="left:([0-9.]+)%;top:([0-9.]+)%"'));
  assert.ok(match,'HTML marker missing: '+name);
  return {left:Number(match[1]),top:Number(match[2])};
}
function checkAxes(html) {
  assert.match(html,/data-halfway-axis="x-30" x1="30" y1="0" x2="30" y2="44"/);
  assert.match(html,/data-halfway-axis="y-22" x1="0" y1="22" x2="60" y2="22"/);
  assert.equal((html.match(/data-halfway-axis=/g)||[]).length,2);
}

test('page 21 and 22 rendered markers actually flip horizontally to match official source',()=>{
  for(const page of [21,22]){
    const {source,resolved,html}=pageCase(page);
    assert.equal(resolved.landscapeMirrorX,true);
    assert.match(html,/data-map-orientation="mirror-x"/);
    const defender=markerPercent(html,'Defender Home');
    const attacker=markerPercent(html,'Attacker Home');
    assert.ok(defender.left>50,'defender must be on right of page '+page);
    assert.ok(attacker.left<50,'attacker must be on left of page '+page);
    assert.ok(Math.abs(defender.left-(100-source.objectivePositions['Defender Home'].x/60*100))<.01);
    assert.ok(Math.abs(attacker.left-(100-source.objectivePositions['Attacker Home'].x/60*100))<.01);
    assert.equal((html.match(/data-terrain="T\d+"/g)||[]).length,16);
    assert.equal((html.match(/data-layout-objective="/g)||[]).length,6);
    assert.equal(getTerritoryRegionsFromGeometry(resolved).divider.orientation,'vertical');
    checkAxes(html);
  }
});

test('page 23 rendered markers flip vertically but preserve horizontal positions',()=>{
  const {source,resolved,html}=pageCase(23);
  assert.equal(resolved.landscapeMirrorX,false);
  assert.equal(resolved.landscapeMirrorY,true);
  assert.match(html,/data-map-orientation="mirror-y"/);
  assert.ok(markerPercent(html,'Defender Home').top>50);
  assert.ok(markerPercent(html,'Attacker Home').top<50);
  for(const name of ['Defender Home','Attacker Home']){
    const visible=markerPercent(html,name);
    const original=source.objectivePositions[name];
    assert.ok(Math.abs(visible.left-original.x/60*100)<.01);
    assert.ok(Math.abs(visible.top-original.y/44*100)<.01);
  }
  assert.equal(getTerritoryRegionsFromGeometry(resolved).divider.orientation,'horizontal');
  assert.equal((html.match(/data-terrain="T\d+"/g)||[]).length,16);
  checkAxes(html);
});

test('page 23 placement measurements follow vertical flip with unchanged printed values and terrain IDs',()=>{
  const {source,resolved}=pageCase(23);
  const before=buildCompleteTerrainPlacementOverlay(source);
  const after=buildCompleteTerrainPlacementOverlay(resolved);
  assert.ok(before.guides.length>0);
  assert.equal(after.guides.length,before.guides.length);
  const opposite=edge=>edge==='top'?'bottom':edge==='bottom'?'top':edge;
  after.guides.forEach((guide,index)=>{
    const old=before.guides[index];
    assert.equal(guide.terrain,old.terrain);
    assert.equal(guide.value,old.value);
    assert.ok(Math.abs(guide.anchor[0]-old.anchor[0])<1e-5);
    assert.ok(Math.abs(guide.anchor[1]-(44-old.anchor[1]))<1e-5);
    assert.equal(guide.edge,opposite(old.edge));
  });
  after.lines.forEach((line,index)=>{
    const old=before.lines[index];
    assert.ok(Math.abs(line[0]-old[0])<1e-5);
    assert.ok(Math.abs(line[1]-(44-old[1]))<1e-5);
    assert.ok(Math.abs(line[2]-old[2])<1e-5);
    assert.ok(Math.abs(line[3]-(44-old[3]))<1e-5);
  });
});

test('all 45 layouts show both halfway reference lines in planning, deployment and live maps',()=>{
  const catalog=EVENT_COMPANION_MAP_CATALOG;
  const matches=[];
  for(const a of catalog.forceDispositions)for(const b of catalog.forceDispositions){
    matches.push({a,b,missions:[catalog.forceDispositionMissionMatrix[a][b],catalog.forceDispositionMissionMatrix[b][a]].sort().join('|')});
  }
  for(const source of catalog.layouts){
    const pair=matches.find(item=>item.missions===[source.missionA,source.missionB].sort().join('|'));
    assert.ok(pair,'resolve page '+source.page);
    const state={battlefieldMap:{missionSetup:{myDisposition:pair.a,opponentDisposition:pair.b,layout:source.layout}},units:[],objectives:[]};
    for(const mode of ['planning','deployment','live']){
      const html=renderBattlefieldMap(state,{mode,showUnits:false});
      checkAxes(html);
      assert.equal((html.match(/data-terrain="T\d+"/g)||[]).length,16);
      assert.match(html,/data-zone="attackerDeployment"/);
      assert.match(html,/data-zone="defenderDeployment"/);
    }
  }
});
