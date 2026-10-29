import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { recordVenatariAbilityUse } from '../../src/engine/venatari-ability-transitions.js';
import { recordRulesReminderUse } from '../../src/engine/rules-reminder-transitions.js';
import { transferMapReserve } from '../../src/engine/map-reserve-transitions.js';
import { changePhase } from '../../src/engine/state-transitions.js';
import { getBattleRulesReminders } from '../../src/rules/battle-rules-reminders.js';
import { getFightEngagementState } from '../../src/rules/fight-engagement-state.js';
import { getPendingVenatariIngress } from '../../src/rules/venatari-abilities.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS as sheets } from '../../src/data/adeptus-custodes-datasheet-details.js';

const unit = (state, id) => state.units.find(item => item.id === id);
const mine = {playerId:'p1',unitId:'venatari',ruleId:'cascade-mine',targetId:'marine',rangeConfirmed:true,actualWounds:3};
const wing = {playerId:'p1',unitId:'venatari',ruleId:'take-wing',phaseEndConfirmed:true,unengagedConfirmed:true};
const swift = {playerId:'p1',unitId:'venatari',ruleId:'swift-ruin',phaseEndConfirmed:true,ingressConfirmed:true,cpSpent:0};
function reserveState() {
  const state = custodesReminderState({phase:'movement'});
  state.battle.round = 2;
  for (const id of ['venatari','venatari2']) {unit(state,id).status='reserves';unit(state,id).position=null;}
  return state;
}
const reminders = (state,id='venatari') => getBattleRulesReminders(state,{playerId:'p1',unitId:id});

test('mine uses actual post-defense wounds in either player’s phase and spends only that unit’s mine', () => {
  for (const activePlayer of ['p1','p2']) for (const phase of ['command','movement','shooting','charge','fight']) {
    const before = custodesReminderState({phase,activePlayer});
    const after = recordVenatariAbilityUse(before,mine);
    assert.equal(unit(after,'marine').wounds,9);
    assert.equal(unit(before,'marine').wounds,12);
    assert.equal(reminders(after).find(entry=>entry.ruleId==='cascade-mine').used.actualWounds,3);
    assert.throws(()=>recordVenatariAbilityUse(after,mine),/already used/);
    const other = recordVenatariAbilityUse(after,{...mine,unitId:'venatari2',actualWounds:0});
    assert.equal(unit(other,'marine').wounds,9);
  }
});

test('a failed or fully prevented mine spends the once-per-battle use even after save/resume', () => {
  let state=recordVenatariAbilityUse(custodesReminderState(),{...mine,actualWounds:0});
  state=JSON.parse(JSON.stringify(state));
  unit(state,'venatari').status='reserves';state.battle.round=3;
  assert.ok(reminders(state).find(entry=>entry.ruleId==='cascade-mine').used);
  unit(state,'venatari').status='deployed';
  assert.throws(()=>recordVenatariAbilityUse(state,mine),/already used/);
  assert.equal(unit(state,'marine').wounds,12);
});

test('mine checks enemy formation, range confirmation, actual result limits and timing without mutating failures', () => {
  const state=custodesReminderState();
  unit(state,'marine').profile.keywords=['Infantry'];
  const before=JSON.stringify(state);
  for (const patch of [{rangeConfirmed:false},{rangeConfirmed:'true'},{targetId:'sentinel'},
    {targetId:'missing'},{actualWounds:-1},{actualWounds:1.5},{actualWounds:4},
    {playerId:'p2'},{unitId:'wardens'}]) {
    assert.throws(()=>recordVenatariAbilityUse(state,{...mine,...patch}));
    assert.equal(JSON.stringify(state),before);
  }
  state.history.push({type:'shooting.unit_activated',payload:{unitId:'marine',round:1,turn:1}});
  assert.throws(()=>recordVenatariAbilityUse(state,mine),/unavailable/);
  assert.throws(()=>recordRulesReminderUse(custodesReminderState(),{playerId:'p1',unitId:'venatari',ruleId:'cascade-mine'}),/Venatari ability controls/);
});

test('mine permits up to six wounds against a known Monster/Vehicle, clamping remaining wounds and clearing a destroyed engagement', () => {
  const state=custodesReminderState({phase:'fight'});
  unit(state,'marine').profile.keywords=['Vehicle'];unit(state,'marine').wounds=4;
  state.history.push({type:'charge.outcome_recorded',payload:{unitId:'marine',targetIds:['venatari'],outcome:'successful'}});
  state.history.push({type:'turn.phase_changed',payload:{phase:'fight',round:1,turn:1}});
  const after=recordVenatariAbilityUse(state,{...mine,actualWounds:6});
  assert.equal(unit(after,'marine').wounds,0);assert.equal(unit(after,'marine').status,'destroyed');
  assert.deepEqual(getFightEngagementState(after).engagedUnitIds,[]);
  assert.ok(reminders(after).some(entry=>entry.ruleId==='take-wing'));
});

test('an untracked target cannot silently accept positive mine damage', () => {
  const state=custodesReminderState();delete unit(state,'marine').wounds;
  assert.throws(()=>recordVenatariAbilityUse(state,mine),/tracked wound count/);
  assert.equal(recordVenatariAbilityUse(state,{...mine,actualWounds:0}).history.at(-1).payload.actualWounds,0);
});

test('Take Wing clears the live map and places the unit in reserves with wound/use state preserved', () => {
  let state=recordVenatariAbilityUse(custodesReminderState({phase:'fight'}),{...mine,actualWounds:0});
  state.battlefieldMap={actualDeployment:{venatari:{x:20,y:20}}};
  const after=recordVenatariAbilityUse(state,wing);
  assert.equal(unit(after,'venatari').status,'reserves');assert.equal(unit(after,'venatari').position,null);
  assert.equal(unit(after,'venatari').wounds,12);
  assert.equal(after.battlefieldMap.actualDeployment.venatari,undefined);
  assert.equal(after.battlefieldMap.declaredReserves.venatari,true);
  const restored=JSON.parse(JSON.stringify(after));
  assert.ok(reminders(restored).find(entry=>entry.ruleId==='cascade-mine').used);
  assert.throws(()=>recordVenatariAbilityUse(after,wing));
});

test('Take Wing rejects own turn, wrong phase, known engagement and missing table confirmations', () => {
  for (const state of [custodesReminderState({phase:'fight',activePlayer:'p1'}),custodesReminderState(),reserveState()])
    assert.throws(()=>recordVenatariAbilityUse(state,wing));
  for (const key of ['phaseEndConfirmed','unengagedConfirmed'])
    assert.throws(()=>recordVenatariAbilityUse(custodesReminderState({phase:'fight'}),{...wing,[key]:false}));
  const state=custodesReminderState({phase:'fight'});
  state.history.push({type:'charge.outcome_recorded',payload:{unitId:'marine',targetIds:['venatari'],outcome:'successful'}});
  assert.throws(()=>recordVenatariAbilityUse(state,wing));
  assert.equal(unit(state,'venatari').status,'deployed');
});

test('Swift Ruin requires opponent Movement, reserves, round two or later, legal confirmations and a non-Battle-shocked target', () => {
  for (const patch of [{phaseEndConfirmed:false},{ingressConfirmed:false},{cpSpent:-1},{cpSpent:4},{cpSpent:0.5},{playerId:'p2'}])
    assert.throws(()=>recordVenatariAbilityUse(reserveState(),{...swift,...patch}));
  for (const mutate of [state=>state.battle.round=1,state=>state.phase='shooting',state=>state.activePlayer='p1',
    state=>unit(state,'venatari').status='deployed',state=>unit(state,'venatari').battleShocked=true]) {
    const state=reserveState();mutate(state);assert.throws(()=>recordVenatariAbilityUse(state,swift));
  }
  const kinetic=reserveState();
  kinetic.armyRosters.p1.units.find(item=>item.id==='r-venatari').datasheet=structuredClone(sheets['adeptus-custodes:venatari-with-kinetic-destroyers']);
  assert.throws(()=>recordVenatariAbilityUse(kinetic,swift));
});

test('Swift Ruin records zero CP without refunding CP, enforces its army limit and permits a different unit next phase', () => {
  const state=reserveState(),after=recordVenatariAbilityUse(state,swift);
  assert.equal(after.commandPoints.p1,3);
  assert.equal(after.history.filter(event=>event.type==='command_points.changed').length,0);
  assert.throws(()=>recordVenatariAbilityUse(after,{...swift,unitId:'venatari2'}));
  const later=JSON.parse(JSON.stringify(after));later.turn=3;later.battle.round=3;
  assert.doesNotThrow(()=>recordVenatariAbilityUse(later,{...swift,unitId:'venatari2'}));
});

test('modified Rapid Ingress costs are charged once and insufficient CP leaves no declaration', () => {
  const state=reserveState();state.commandPoints.p1=1;
  assert.throws(()=>recordVenatariAbilityUse(state,{...swift,cpSpent:2}),/negative/);
  assert.equal(state.history.length,0);assert.equal(state.commandPoints.p1,1);
  const after=recordVenatariAbilityUse(state,{...swift,cpSpent:1});
  assert.equal(after.commandPoints.p1,0);assert.equal(after.history.at(-1).payload.cpSpent,1);
  assert.throws(()=>recordVenatariAbilityUse(after,{...swift,cpSpent:1}));
});

test('only the confirmed Swift Ruin unit may arrive on the opponent’s turn, and authorization expires with that phase', () => {
  const declared=JSON.parse(JSON.stringify(recordVenatariAbilityUse(reserveState(),swift)));
  assert.deepEqual(getPendingVenatariIngress(declared).map(item=>item.id),['venatari']);
  assert.throws(()=>changePhase(declared,{phase:'shooting'}),/Swift Ruin arrival/);
  assert.throws(()=>transferMapReserve(declared,{unitId:'venatari2',destination:'battlefield',position:{x:10,y:10}}));
  assert.throws(()=>transferMapReserve(declared,{unitId:'venatari',destination:'battlefield',position:{x:61,y:10}}));
  const arrived=transferMapReserve(declared,{unitId:'venatari',destination:'battlefield',position:{x:10,y:10}});
  assert.equal(unit(arrived,'venatari').status,'deployed');assert.deepEqual(unit(arrived,'venatari').position,{x:10,y:10});
  assert.deepEqual(getPendingVenatariIngress(arrived),[]);
  assert.equal(arrived.history.at(-1).payload.reason,'Swift Ruin');
  assert.equal(changePhase(arrived,{phase:'shooting'}).phase,'shooting');
  assert.throws(()=>transferMapReserve(arrived,{unitId:'venatari',destination:'battlefield',position:{x:11,y:10}}));
  declared.phase='shooting';assert.deepEqual(getPendingVenatariIngress(declared),[]);
  assert.throws(()=>transferMapReserve(declared,{unitId:'venatari',destination:'battlefield',position:{x:10,y:10}}));
});

test('legacy reminder-only Swift Ruin records never authorize a reserve transfer', () => {
  const state=reserveState();
  state.history.push({type:'rules.reminder_used',payload:{ruleId:'swift-ruin',unitId:'venatari',playerId:'p1',contextKey:'2:1:p2:movement'}});
  assert.deepEqual(getPendingVenatariIngress(state),[]);
  assert.throws(()=>transferMapReserve(state,{unitId:'venatari',destination:'battlefield',position:{x:10,y:10}}));
});

test('Venatari commands undo wounds, reserve state or CP and use history as one transaction', () => {
  clearCommandHandlers();registerCoreCommandHandlers();
  for (const [state,payload] of [[custodesReminderState(),mine],[custodesReminderState({phase:'fight'}),wing],[reserveState(),{...swift,cpSpent:1}]]) {
    const session=createGameSession(state),before=JSON.stringify(state);
    session.dispatch({type:'custodes.record_venatari_ability_use',payload});
    assert.equal(session.getLastCorrection().label,'rule reminder use');
    assert.equal(session.undoLastAction(),true);assert.equal(JSON.stringify(session.getState()),before);
  }
});

test('Kinetic Destroyer ingress re-roll reminder needs a recorded ingress this turn and never appears for lances', () => {
  const state=custodesReminderState({activePlayer:'p1'});
  assert.ok(!reminders(state).some(entry=>entry.ruleId==='strike-from-skies'));
  state.armyRosters.p1.units.find(item=>item.id==='r-venatari').datasheet=structuredClone(sheets['adeptus-custodes:venatari-with-kinetic-destroyers']);
  assert.ok(!reminders(state).some(entry=>entry.ruleId==='strike-from-skies'));
  state.history.push({type:'unit.arrived_from_reserves',payload:{unitId:'venatari',round:1,turn:1,phase:'movement'}});
  assert.ok(reminders(state).some(entry=>entry.ruleId==='strike-from-skies'));
  state.turn=2;assert.ok(!reminders(state).some(entry=>entry.ruleId==='strike-from-skies'));
});
