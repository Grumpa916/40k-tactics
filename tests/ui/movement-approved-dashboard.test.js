import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';
import { renderMovementRosterRail, renderMovementSelectedUnitCard } from '../../src/ui/movement-dashboard-view.js';

const state = {
  battle:{status:'active',round:1,activePlayerId:'p1'},
  activePlayer:'p1', turn:1, phase:'movement', history:[], objectives:[],
  players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
  units:[
    {id:'u1',ownerId:'p1',name:'Shield Captain',status:'deployed',profile:{characteristics:{movement:'6"',toughness:6,save:'2+',wounds:6,objectiveControl:1}}},
    {id:'u2',ownerId:'p1',name:'Custodian Guard',status:'reserves'},
    {id:'e1',ownerId:'p2',name:'Enemy Unit',status:'deployed'}
  ]
};

test('combat workspace supports the approved left roster rail without changing other phases', () => {
  const html = renderCombatWorkspace({state,phase:'movement',perspectivePlayerId:'p1',selectedUnitId:'u1',leftRail:'<div data-test-rail>rail</div>',controls:'controls'});
  assert.match(html, /combat-workspace has-left-rail/);
  assert.match(html, /combat-workspace__rail/);
  assert.ok(html.indexOf('combat-workspace__rail') < html.indexOf('combat-workspace__map'));
  assert.ok(html.indexOf('combat-workspace__map') < html.indexOf('combat-workspace__panel'));
});

test('Movement roster rail provides My Army and Opponent views with compact unit tokens', () => {
  const html = renderMovementRosterRail(state,{playerId:'p1',perspectivePlayerId:'p1',selectedUnitId:'u1'});
  assert.match(html, /data-movement-roster-view="mine"/);
  assert.match(html, /data-movement-roster-view="opponent"/);
  assert.match(html, /data-move-roster-unit="u1"/);
  assert.match(html, /Custodian Guard/);
  assert.match(html, /RESERVES/);
  assert.match(html, /movement-roster__token/);
});

test('selected-unit Movement card colors its token by army perspective and shows the approved M T SV W OC strip', () => {
  const html = renderMovementSelectedUnitCard(state,state.units[0],{perspectivePlayerId:'p1'});
  const enemyHtml = renderMovementSelectedUnitCard(state,state.units[2],{perspectivePlayerId:'p1'});
  assert.match(html,/movement-selected-unit__token is-friendly/);
  assert.match(enemyHtml,/movement-selected-unit__token is-opponent/);
  for (const key of ['M','T','SV','W','OC']) assert.match(html,new RegExp(`<small>${key}<\\/small>`));
  assert.match(html,/Shield Captain/);
  assert.match(html,/Movement/);
  assert.match(html,/Weapons/);
  assert.match(html,/Abilities/);
  assert.match(html,/Profile/);
});

test('Movement screen makes selected-unit controls primary and advisor expandable', () => {
  const source = fs.readFileSync(new URL('../../src/ui/movement-screen.js', import.meta.url),'utf8');
  assert.match(source,/renderMovementRosterRail/);
  assert.match(source,/renderMovementSelectedUnitCard/);
  assert.match(source,/leftRail,mapExtra:reserveTray,controls/);
  assert.match(source,/class="movement-advisor-drawer"><summary>Tactical Advisor<\/summary>/);
  assert.doesNotMatch(source,/controls:`[^`]*\$\{advisor\}\$\{editor\}<details><summary>Units/);
});

test('Movement dashboard CSS keeps reserves compact and uses three columns on landscape', () => {
  const css = fs.readFileSync(new URL('../../src/ui/styles/movement-dashboard.css', import.meta.url),'utf8');
  assert.match(css,/grid-template-columns:180px minmax\(0,1fr\) 310px/);
  assert.match(css,/map-reserve-tray small\{display:none\}/);
  assert.match(css,/movement-selected-unit__stats/);
  assert.match(css,/movement-selected-unit__token\.is-opponent\{background:#602e34;border-color:#ff8585\}/);
});
