import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import { getEventCompanionMapLayout } from '../../src/rules/event-companion-map-catalog.js';
import {
  getTerritoryRegionsFromGeometry,
  getBattlefieldTerritoryContext,
  getTerritoryStatusForPosition
} from '../../src/rules/battlefield-territory.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';

const diagonalPages=[16,21,32,36,46,48,52];
const byPage=page=> {
  const source=EVENT_COMPANION_MAP_CATALOG.layouts.find(layout=>layout.page===page);
  assert.ok(source);
  return getEventCompanionMapLayout(source.missionA,source.missionB,source.layout);
};
const state=(layout)=>({
  battlefieldMap:{missionSetup:{myDisposition:'Take and Hold',opponentDisposition:'Priority Assets',layout}},
  preGameSetup:{attackerPlayerId:'p1',defenderPlayerId:'p2'},
  units:[],objectives:[]
});
const midpoint=(html)=>{
  const lines=[...html.matchAll(/<line class="battlefield-map__territory-divider" data-territory-divider="([^"]+)" x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"><\/line>/g)];
  assert.equal(lines.length,1,'exactly one visible territory boundary should be drawn');
  assert.doesNotMatch(html,/data-halfway-axis=/,'obsolete perpendicular halfway crosshairs must be removed');
  return {orientation:lines[0][1],points:lines[0].slice(2).map(Number)};
};

test('the diagonal deployment maps all use an actual central diagonal instead of legacy rectangular territories',()=>{
  const pages=EVENT_COMPANION_MAP_CATALOG.layouts
    .filter(source=>getTerritoryRegionsFromGeometry(byPage(source.page))?.divider.orientation==='diagonal')
    .map(source=>source.page);
  assert.deepEqual(pages,diagonalPages);
  for(const page of pages){
    const {divider}=getTerritoryRegionsFromGeometry(byPage(page));
    assert.equal(divider.orientation,'diagonal');
    assert.ok(Math.abs((divider.start.x+divider.end.x)/2-30)<0.2,'center x p.'+page);
    assert.ok(Math.abs((divider.start.y+divider.end.y)/2-22)<0.2,'center y p.'+page);
    assert.ok(divider.start.x>=0&&divider.start.x<=60);
    assert.ok(divider.end.x>=0&&divider.end.x<=60);
  }
});

test('page 21 is divided by a gold diagonal through the midpoint of its two deployment-zone edges',()=>{
  const geometry=byPage(21);
  const divider=getTerritoryRegionsFromGeometry(geometry).divider;
  assert.deepEqual(divider,{
    orientation:'diagonal',
    start:{x:15,y:44},
    end:{x:45,y:0}
  });
  const s=state('A');
  const context=getBattlefieldTerritoryContext(s,{playerId:'p1'});
  assert.equal(context.divider.orientation,'diagonal');
  assert.equal(getTerritoryStatusForPosition(s,{playerId:'p1',position:{x:50,y:22}}).territory,'mine');
  assert.equal(getTerritoryStatusForPosition(s,{playerId:'p1',position:{x:10,y:22}}).territory,'opponent');
  assert.equal(getTerritoryStatusForPosition(s,{playerId:'p2',position:{x:10,y:22}}).territory,'mine');
  assert.equal(getTerritoryStatusForPosition(s,{playerId:'p1',position:{x:30,y:22}}).territory,'boundary');
  assert.equal(getTerritoryStatusForPosition(s,{playerId:'p1',position:{x:32,y:22}}).territory,'boundary',
    'retain the existing ±3" positional uncertainty perpendicular to the diagonal');
  const html=renderBattlefieldMap(s,{mode:'planning',showUnits:false});
  assert.deepEqual(midpoint(html),{orientation:'diagonal',points:[15,0,45,44]});
  assert.equal((html.match(/data-territory-divider=/g)||[]).length,1);
});

test('page 23 has only its central horizontal territory line, without a vertical divider',()=>{
  const s=state('C');
  const geometry=byPage(23);
  assert.deepEqual(getTerritoryRegionsFromGeometry(geometry).divider,{orientation:'horizontal',coordinate:22});
  const html=renderBattlefieldMap(s,{mode:'planning',showUnits:false});
  assert.deepEqual(midpoint(html),{orientation:'horizontal',points:[0,22,60,22]});
  assert.equal(getTerritoryStatusForPosition(s,{playerId:'p1',position:{x:30,y:36}}).territory,'mine');
  assert.equal(getTerritoryStatusForPosition(s,{playerId:'p1',position:{x:30,y:8}}).territory,'opponent');
  assert.equal(getTerritoryStatusForPosition(s,{playerId:'p1',position:{x:30,y:22}}).territory,'boundary');
});

test('page 22 retains only its existing central vertical territory boundary',()=>{
  const s=state('B');
  assert.deepEqual(getTerritoryRegionsFromGeometry(byPage(22)).divider,{orientation:'vertical',coordinate:30});
  assert.deepEqual(midpoint(renderBattlefieldMap(s,{mode:'planning',showUnits:false})),
    {orientation:'vertical',points:[30,0,30,44]});
});

test('all 45 layout maps share a single territory divider in planning, deployment and live modes',()=>{
  const catalog=EVENT_COMPANION_MAP_CATALOG;
  const combinations=[];
  for(const a of catalog.forceDispositions)for(const b of catalog.forceDispositions){
    combinations.push({a,b,missions:[
      catalog.forceDispositionMissionMatrix[a][b],
      catalog.forceDispositionMissionMatrix[b][a]
    ].sort().join('|')});
  }
  for(const source of catalog.layouts){
    const pair=combinations.find(x=>x.missions===[source.missionA,source.missionB].sort().join('|'));
    assert.ok(pair);
    const s={battlefieldMap:{missionSetup:{myDisposition:pair.a,opponentDisposition:pair.b,layout:source.layout}},
      units:[],objectives:[]};
    const expected=getTerritoryRegionsFromGeometry(byPage(source.page)).divider.orientation;
    for(const mode of ['planning','deployment','live']){
      const html=renderBattlefieldMap(s,{mode,showUnits:false});
      assert.equal(midpoint(html).orientation,expected,'page '+source.page+' '+mode);
      assert.equal((html.match(/data-zone=/g)||[]).length,2);
      assert.equal((html.match(/data-terrain="T\d+"/g)||[]).length,16);
    }
  }
});
