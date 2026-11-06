import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import {
  EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES,
  isEventCompanionLandscapeMirrored,
  mirrorEventCompanionPoint
} from '../../src/rules/event-companion-landscape-orientation.js';
import { getEventCompanionMapLayout } from '../../src/rules/event-companion-map-catalog.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
import {
  buildCompleteTerrainPlacementGuides,
  buildCompleteTerrainPlacementOverlay
} from '../../src/ui/terrain-placement-guide-model.js';
import { perspectiveObjectiveName } from '../../src/rules/objective-display-labels.js';

const resolved = source => getEventCompanionMapLayout(source.missionA,source.missionB,source.layout);
const near = (actual,expected,message='') => assert.ok(Math.abs(actual-expected)<1e-5,
  message + ': ' + actual + ' should be ' + expected);
const opposite=edge=>edge==='left'?'right':edge==='right'?'left':edge;

test('45 verified source pages are audited: 30 need clockwise landscape X correction, 15 must not be flipped',()=>{
  const pages=EVENT_COMPANION_MAP_CATALOG.layouts;
  assert.equal(pages.length,45);
  assert.equal(EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES.length,30);
  assert.ok([21,22].every(isEventCompanionLandscapeMirrored));
  const seen=new Set();
  for(const source of pages){
    assert.ok(!seen.has(source.page),'duplicate page '+source.page);
    seen.add(source.page);
    const defender=source.deploymentZones.defenderDeployment.points;
    const redCenterX=defender.reduce((total,point)=>total+point.x,0)/defender.length;
    assert.equal(isEventCompanionLandscapeMirrored(source.page),redCenterX<23,
      'page '+source.page+' must follow the independently audited PDF red deployment orientation');
  }
  assert.deepEqual([...seen].sort((a,b)=>a-b),Array.from({length:45},(_,i)=>i+9));
});

test('resolved map geometry mirrors complete 60 × 44 source landmarks without changing shape dimensions or IDs',()=>{
  for(const source of EVENT_COMPANION_MAP_CATALOG.layouts){
    const actual=resolved(source);
    const mirrored=isEventCompanionLandscapeMirrored(source.page);
    assert.equal(Boolean(actual.landscapeMirrorX),mirrored,'page '+source.page);
    assert.deepEqual(Object.keys(actual.objectivePositions),Object.keys(source.objectivePositions));
    assert.deepEqual(Object.keys(actual.terrainGeometry),Object.keys(source.terrainGeometry));
    for(const [name,point] of Object.entries(source.objectivePositions)){
      near(actual.objectivePositions[name].x,mirrored?60-point.x:point.x,name+' p.'+source.page);
      near(actual.objectivePositions[name].y,point.y);
    }
    for(const group of ['terrainGeometry','deploymentZones']){
      for(const [name,shape] of Object.entries(source[group])){
        const next=actual[group][name];
        if(shape.points){
          assert.equal(next.points.length,shape.points.length,name);
          shape.points.forEach((point,index)=>{
            near(next.points[index].x,mirrored?60-point.x:point.x);
            near(next.points[index].y,point.y);
          });
        }else{
          near(next.x,mirrored?60-shape.x-shape.width:shape.x);
          near(next.y,shape.y);
          near(next.width,shape.width);
          near(next.height,shape.height);
        }
      }
    }
    if(mirrored){
      assert.equal(actual.unmirroredSourceGeometry,source);
      assert.notEqual(actual,source);
    }else{
      assert.equal(actual,source,'unaffected pages must retain original verified catalog object');
    }
  }
});

test('page 21 and 22 defender and attacker bases, objectives and 16 terrain shapes face the reference after horizontal mirror',()=>{
  for(const page of [21,22]){
    const source=EVENT_COMPANION_MAP_CATALOG.layouts.find(item=>item.page===page);
    const map=resolved(source);
    assert.equal(Object.keys(map.terrainGeometry).length,16);
    assert.equal(Object.keys(map.objectivePositions).length,6);
    assert.ok(map.objectivePositions['Defender Home'].x>30, 'page '+page+' red defender home belongs on right');
    assert.ok(map.objectivePositions['Attacker Home'].x<30, 'page '+page+' blue attacker home belongs on left');
    const territory=map.deploymentZones.defenderTerritory;
    assert.ok(territory.x>=30,'page '+page+' defender territory mirrors to the right');
    const state={
      battlefieldMap:{missionSetup:{
        myDisposition:page===21?'Take and Hold':'Take and Hold',
        opponentDisposition:'Priority Assets',
        layout:page===21?'A':'B'
      }},
      preGameSetup:{},players:[{id:'p1',name:'Friendly'}],units:[],objectives:[]
    };
    const html=renderBattlefieldMap(state,{mode:'planning',perspectivePlayerId:'p1',showUnits:false});
    assert.equal((html.match(/data-terrain="T\d+"/g)||[]).length,16);
    assert.equal((html.match(/data-layout-objective="/g)||[]).length,6);
    assert.match(html,/data-zone="attackerDeployment"/);
    assert.match(html,/data-zone="defenderDeployment"/);
    assert.equal(new Set([...html.matchAll(/data-layout-objective="[^"]+"[^>]*>([^<]+)<\/button>/g)].map(match=>match[1])).size,6,
      'all objective display names remain unique on page '+page);
  }
});

test('mirrored terrain guides, lines, callouts and printed inch values are reflected without recalculation',()=>{
  for(const page of [21,22,9,30,53]){
    const original=EVENT_COMPANION_MAP_CATALOG.layouts.find(item=>item.page===page);
    const map=resolved(original);
    const oldOverlay=buildCompleteTerrainPlacementOverlay(original);
    const newOverlay=buildCompleteTerrainPlacementOverlay(map);
    assert.ok(oldOverlay.guides.length>0,'page '+page+' reference guides exist');
    for(const key of ['guides','lines','measurements','anchors','callouts']){
      assert.equal(newOverlay[key].length,oldOverlay[key].length,key+' count on page '+page);
    }
    newOverlay.guides.forEach((guide,index)=>{
      const old=oldOverlay.guides[index];
      assert.equal(guide.terrain,old.terrain);
      assert.equal(guide.value,old.value,'source printed dimension is unchanged');
      near(guide.anchor[0],60-old.anchor[0]);
      near(guide.anchor[1],old.anchor[1]);
      assert.equal(guide.edge,opposite(old.edge));
    });
    newOverlay.lines.forEach((line,index)=>{
      const old=oldOverlay.lines[index];
      near(line[0],60-old[0]);near(line[1],old[1]);near(line[2],60-old[2]);near(line[3],old[3]);
    });
    newOverlay.callouts.forEach((callout,index)=>{
      const old=oldOverlay.callouts[index];
      near(callout.x,60-old.x);near(callout.anchorX,60-old.anchorX);
      assert.deepEqual(callout.values,old.values);
      assert.deepEqual(callout.edges,old.edges.map(opposite));
    });
    const oldPoints=buildCompleteTerrainPlacementGuides(original);
    const newPoints=buildCompleteTerrainPlacementGuides(map);
    assert.equal(newPoints.length,oldPoints.length);
    newPoints.forEach((p,i)=>{
      near(p.anchor[0],60-oldPoints[i].anchor[0]);near(p.anchor[1],oldPoints[i].anchor[1]);
      assert.deepEqual(p.values,oldPoints[i].values);
      assert.deepEqual(p.edges,oldPoints[i].edges.map(opposite));
    });
  }
});

test('original source map data stays unchanged after resolution and the page 22 objective label repair survives mirroring',()=>{
  const source=EVENT_COMPANION_MAP_CATALOG.layouts.find(item=>item.page===22);
  const copy=JSON.stringify(source);
  const map=resolved(source);
  assert.deepEqual(mirrorEventCompanionPoint({x:10.5,y:31.3}),{x:49.5,y:31.3});
  assert.equal(map.objectivePositions['Defender Home'].x,49.5);
  assert.equal(source.objectivePositions['Defender Home'].x,10.5);
  assert.equal(JSON.stringify(source),copy);
  const state={
    battlefieldMap:{missionSetup:{myDisposition:'Take and Hold',opponentDisposition:'Priority Assets',layout:'B'}},
    preGameSetup:{}
  };
  const labels=Object.keys(map.objectivePositions).map(name=>perspectiveObjectiveName(name,state,'p1'));
  assert.equal(labels.filter(label=>label==='Center 1').length,1);
  assert.equal(labels.filter(label=>label==='Center 2').length,1);
  assert.equal(labels.filter(label=>label==='Expansion 1').length,1);
  assert.equal(labels.filter(label=>label==='Expansion 2').length,1);
});
