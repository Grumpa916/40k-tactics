import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS as sheets } from '../../src/data/adeptus-custodes-datasheet-details.js';
import { getBattleRulesReminders } from '../../src/rules/battle-rules-reminders.js';
import { getUnitReminderPrompts } from '../../src/rules/unit-reminder-prompts.js';

function add(state, id, sheet, ownerId='p1') {
  state.armyRosters[ownerId].units.push({id:'r-'+id,name:id,modelCount:1,datasheet:structuredClone(sheets['adeptus-custodes:'+sheet])});
  state.units.push({id,name:id,ownerId,status:'deployed',position:{x:20,y:20},metadata:{rosterUnitId:'r-'+id}});
}
const prompts=(state,window,unitId=null,targetId=null)=>getUnitReminderPrompts(state,{playerId:'p1',window,unitId,targetId});
const has=(entries,id)=>entries.some(entry=>entry.ruleId===id);
function record(state,type,payload) {
  state.history.push({type,payload:{round:state.battle.round,turn:state.turn,phase:state.phase,...payload}});
}

test('Caladius conditional prompt only for known Monster or Vehicle targets during own shooting',()=>{
  const state=custodesReminderState({phase:'shooting',activePlayer:'p1'});
  add(state,'tank','caladius-annihilator-grav-tank');
  add(state,'enemy-tank','caladius-annihilator-grav-tank','p2');
  assert.ok(has(prompts(state,'before-attack','tank','enemy-tank'),'advanced-firepower'));
  assert.ok(!has(prompts(state,'before-attack','tank','marine'),'advanced-firepower'));
  assert.ok(!has(prompts(state,'before-attack','tank'),'advanced-firepower'));
  assert.ok(!has(prompts(state,'before-attack','telemon','enemy-tank'),'advanced-firepower'));
  state.activePlayer='p2';state.battle.activePlayerId='p2';
  assert.ok(!has(prompts(state,'before-attack','tank','enemy-tank'),'advanced-firepower'));
});

test('Sanctified Flames uses completed own shooting and a surviving recorded target, even with zero damage',()=>{
  const state=custodesReminderState({phase:'shooting',activePlayer:'p1'});
  add(state,'witch','witchseeker-squad');
  assert.ok(!has(getBattleRulesReminders(state,{playerId:'p1',unitId:'witch'}),'sanctified-flames'),
    'unconfirmed contextual abilities must not appear in generic Rules reminders');
  assert.ok(!has(prompts(state,'after-shooting','witch'),'sanctified-flames'));
  record(state,'shooting.unit_activated',{unitId:'witch',actionType:'shoot'});
  record(state,'combat.attack_resolved',{attackerId:'witch',targetId:'marine',actualDamage:0});
  assert.ok(!has(prompts(state,'after-shooting','witch'),'sanctified-flames'));
  record(state,'combat.activation_finished',{unitId:'witch'});
  const result=prompts(state,'after-shooting','witch').find(entry=>entry.ruleId==='sanctified-flames');
  assert.deepEqual(result.candidateTargetIds,['marine']);
  assert.equal(result.requiresTableConfirmation,true);
  assert.equal(result.promptKey,prompts(JSON.parse(JSON.stringify(state)),'after-shooting','witch').find(entry=>entry.ruleId==='sanctified-flames').promptKey);
  state.units.find(unit=>unit.id==='marine').status='destroyed';
  assert.ok(!has(prompts(state,'after-shooting','witch'),'sanctified-flames'));
});

test('bike Captain Sweeping Advance appears only at Fight end with recorded eligibility',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p2'});
  add(state,'bike','shield-captain-on-dawneagle-jetbike');
  assert.ok(!has(prompts(state,'phase-end'),'sweeping-advance'));
  record(state,'fight.unit_activated',{unitId:'bike',actionType:'fight'});
  assert.ok(has(prompts(state,'phase-end'),'sweeping-advance'));
  assert.ok(!has(prompts(state,'phase-start'),'sweeping-advance'));
  state.units.find(unit=>unit.id==='bike').status='destroyed';
  assert.ok(!has(prompts(state,'phase-end'),'sweeping-advance'));
});

test('Venatari phase-end prompt reuses existing eligibility and tracks reserve state',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p2'});
  assert.ok(has(prompts(state,'phase-end'),'take-wing'));
  assert.ok(!has(prompts(state,'phase-start'),'take-wing'));
  state.units.filter(unit=>unit.id.startsWith('venatari')).forEach(unit=>unit.status='reserves');
  state.phase='movement';state.battle.round=2;
  assert.ok(has(prompts(state,'phase-end'),'swift-ruin'));
});
