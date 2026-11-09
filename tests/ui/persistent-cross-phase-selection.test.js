import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPhaseUnitSelection } from '../../src/ui/phase-unit-selection.js';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { renderPhaseArmyRoster } from '../../src/ui/phase-army-roster.js';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';

const fixture = () => {
  const state = custodesReminderState({phase:'movement',activePlayer:'p1'});
  state.turn=3;
  state.battle.round=2;
  state.battle.id='game-1';
  return state;
};

test('the same explicitly selected formation survives Movement, Shooting, Charge and Fight without dispatching an action', () => {
  const state=fixture();
  const selection=createPhaseUnitSelection();
  const before=JSON.stringify(state);
  assert.equal(selection.select(state,'trajann'),true,'selecting attached Leader chooses formation');
  assert.equal(selection.get(state),'wardens');
  for(const phase of ['command','movement','shooting','charge','fight']){
    const current={...state,phase};
    assert.equal(selection.get(current,{eligibleIds:['wardens','allarus']}),'wardens',phase);
  }
  assert.equal(JSON.stringify(state),before,'selection cannot change game state or recording history');
  const html=renderCombatWorkspace({state:{...state,phase:'fight'},phase:'fight',perspectivePlayerId:'p1',
    selectedUnitId:selection.get(state),selectableIds:['wardens','allarus'],mapView:{render:()=>'<div>map</div>'},
    controls:'Selected formation controls'});
  assert.match(html,/data-select-phase-unit="wardens"/);
  assert.match(html,/aria-pressed="true"/);
  assert.match(html,/Selected formation controls/);
});

test('only eligible, live selections carry; noneligible phases do not erase a still-live formation',()=>{
  const state=fixture(),selection=createPhaseUnitSelection();
  assert.equal(selection.select(state,'wardens'),true);
  assert.equal(selection.get({...state,phase:'charge'},{eligibleIds:['allarus']}),null);
  assert.equal(selection.get({...state,phase:'fight'},{eligibleIds:['wardens']}),'wardens');
  assert.equal(selection.select(state,'missing-unit'),false);
  assert.equal(selection.get(state),'wardens');
  assert.equal(selection.select(state,'wardens',{eligibleIds:['allarus']}),false);
  assert.equal(selection.get(state),'wardens');
  const dead={...state,units:state.units.map(unit=>unit.id==='wardens'?{...unit,status:'destroyed'}:unit)};
  assert.equal(selection.get(dead),null,'destroyed formation is no longer selected');
  assert.equal(selection.get(state),null,'destroyed selection is cleared rather than resurrected');
});

test('selection never leaks to another player turn, round or loaded battle',()=>{
  const state=fixture(), selection=createPhaseUnitSelection();
  assert.equal(selection.select(state,'allarus'),true);
  const enemyTurn={...state,turn:4,activePlayer:'p2',battle:{...state.battle,activePlayerId:'p2'}};
  assert.equal(selection.get(enemyTurn),null);
  assert.equal(selection.select(enemyTurn,'marine'),true,'opponent can select own unit in their turn');
  assert.equal(selection.get(enemyTurn),'marine');
  assert.equal(selection.get({...enemyTurn,turn:5,activePlayer:'p1',battle:{...enemyTurn.battle,activePlayerId:'p1',round:3}}),null);
  assert.equal(selection.select(state,'allarus'),true);
  assert.equal(selection.get({...state,battle:{...state.battle,id:'new-game'}}),null,'new battles reset selection');
  assert.equal(selection.select(state,'allarus'),true);
  selection.clear();
  assert.equal(selection.get(state),null);
});

test('selection is ephemeral and not recorded in any CP, VP, movement or combat history',()=>{
  const state=fixture();
  let dispatched=0;
  const session={getState:()=>state,dispatch:()=>{dispatched++}};
  const selection=createPhaseUnitSelection();
  assert.equal(selection.select(session.getState(),'allarus'),true);
  selection.get({...state,phase:'shooting'});
  selection.get({...state,phase:'charge'});
  selection.get({...state,phase:'fight'});
  assert.equal(dispatched,0);
  assert.deepEqual(state.history,[]);
  assert.equal(Object.hasOwn(state,'selectedUnitId'),false);
});

test('selection wiring uses one shell-scoped controller and restores previews without silently shooting',()=>{
  const read=file=>fs.readFileSync(new URL('../../src/ui/'+file,import.meta.url),'utf8');
  const shell=read('battle-shell.js');
  const command=read('command-screen.js');
  const movement=read('movement-screen.js');
  const shooting=read('shooting-screen.js');
  const charge=read('charge-tabletop-screen.js');
  const fight=read('fight-tabletop-screen.js');
  const chargeWrapper=read('charge-screen.js'),fightWrapper=read('fight-screen.js');
  assert.match(shell,/const unitSelection = createPhaseUnitSelection\(\)/);
  assert.match(shell,/layoutMode,\s*unitSelection\s*\}\)/);
  assert.match(command,/bindCombatMap\(container/);
  assert.match(command,/unitSelection\.select\(session\.getState\(\), id/);
  assert.match(movement,/unitSelection\?\.select\(session\.getState\(\), unitId\)/);
  assert.match(shooting,/const inheritedId = unitSelection\?\.get\(state/);
  assert.match(shooting,/else pendingUnitId = inheritedId/,'restoring a shooter is preview-only');
  assert.match(shooting,/unitSelection\?\.select\(state, unitId\)/);
  assert.match(charge,/let selectedUnitId = unitSelection\?\.get\(session\.getState\(\)\)/);
  assert.match(charge,/unitSelection\?\.select\(state, id\)/);
  assert.match(fight,/attackerId = unitSelection\?\.get\(session\.getState\(\)\)/);
  assert.match(fight,/unitSelection\?\.select\(state, id\)/);
  assert.match(chargeWrapper,/createChargeTabletopScreen\(container, \{ session, perspectivePlayerId, unitSelection \}\)/);
  assert.match(fightWrapper,/createFightTabletopScreen\(container, \{ session, perspectivePlayerId, gameData, unitSelection \}\)/);
});


test('selected-unit selection notifies the persistent context panel', () => {
  const state = fixture();
  const selection = createPhaseUnitSelection();
  const selected = [];
  const unsubscribe = selection.subscribe((id) => selected.push(id));
  assert.equal(selection.select(state, 'wardens'), true);
  selection.clear();
  unsubscribe();
  assert.deepEqual(selected, ['wardens', null]);
});
