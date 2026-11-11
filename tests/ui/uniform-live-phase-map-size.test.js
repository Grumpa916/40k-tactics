import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderCombatMapPanel } from '../../src/ui/combat-workspace.js';
import { createLiveMapView } from '../../src/ui/live-map-view.js';
import { renderMovementReserveDock, getMapReserveUnits } from '../../src/ui/map-reserve-tray.js';

const mapCSS = readFileSync(new URL('../../src/ui/styles/live-map.css', import.meta.url),'utf8');
const movementCSS = readFileSync(new URL('../../src/ui/styles/movement-dashboard.css', import.meta.url),'utf8');
const movementSource = readFileSync(new URL('../../src/ui/movement-screen.js', import.meta.url),'utf8');
const state = {
  battle:{status:'active',round:1,activePlayerId:'p1'},
  activePlayer:'p1', phase:'shooting', players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
  objectives:[], units:[
    {id:'friendly',name:'Galatus Dreadnought',ownerId:'p1',status:'deployed',position:{x:15,y:12}},
    {id:'reserve',name:'Telemon Dreadnought',ownerId:'p1',status:'reserves'},
    {id:'opponent-reserve',name:'Opponent Reinforcements',ownerId:'p2',status:'reserves'}
  ]
};

test('Command through Fight share the exact 60-by-44 live battlefield map structure',()=>{
  for(const phase of ['command','movement','shooting','charge','fight']) {
    const html=renderCombatMapPanel({state,phase,perspectivePlayerId:'p1',selectedUnitId:'friendly',mapView:createLiveMapView()});
    assert.match(html,new RegExp('data-tabletop-map-phase="'+phase+'"'));
    assert.match(html,/class="live-map is-top-down is-planner-view"/);
    assert.match(html,/data-live-map-viewport/);
    assert.match(html,/data-live-map-canvas/);
    assert.match(html,/data-battlefield-map-board/);
    assert.match(html,/battlefield-map__selected-name/);
  }
  assert.match(mapCSS,/width:min\(100cqw, 136\.363636cqh\) !important;/);
  assert.match(mapCSS,/aspect-ratio:60 \/ 44;/);
});

test('selected-unit caption remains accessible but occupies no map height in any live phase',()=>{
  const rule=mapCSS.slice(mapCSS.lastIndexOf('/* Live tabletop maps all use Charge'));
  assert.match(rule,/\.battlefield-map__selected-name\s*\{/);
  assert.match(rule,/position:absolute !important/);
  assert.match(rule,/width:1px !important/);
  assert.match(rule,/clip-path:inset\(50%\) !important/);
});

test('Movement reserves are a compact popover on the map and retain their transfer actions',()=>{
  const html=renderMovementReserveDock(state,{selectedUnitId:'friendly',playerId:'p1'});
  assert.equal(getMapReserveUnits(state,{playerId:'p1'}).length,1);
  assert.match(html,/<details class="movement-map-reserves" data-movement-map-reserves>/);
  assert.match(html,/<summary>Reserves · 1<\/summary>/);
  assert.match(html,/data-map-reserve-area/);
  assert.match(html,/data-map-send-reserve/);
  assert.match(html,/data-map-reserve-select="reserve"/);
  assert.doesNotMatch(html,/data-map-reserve-select="opponent-reserve"/);
  assert.match(movementSource,/const reserveTray=renderMovementReserveDock\(state,\{selectedUnitId,playerId\}\)/);
  assert.match(movementSource,/leftRail,mapExtra:reserveTray,controls,footer:''/);
  assert.match(movementCSS,/\.movement-map-reserves\s*\{\s*position:absolute;/);
  assert.match(movementCSS,/\.movement-map-reserves__popover\s*\{\s*position:absolute;/);
  assert.match(movementCSS,/min-height:44px/);
});
