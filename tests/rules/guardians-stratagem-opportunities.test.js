import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { getGuardiansStratagemOpportunities as opportunities } from '../../src/rules/guardians-stratagem-opportunities.js';
import { recordGuardiansStratagemUse as use } from '../../src/engine/guardians-stratagem-transitions.js';
import { getActiveGuardiansEffects } from '../../src/rules/stratagem-use-state.js';
import { getTargetDefenseReminders } from '../../src/rules/battle-rules-reminders.js';
import { getCustodesKatahState } from '../../src/rules/custodes-tactical-advisor.js';
import { recordCustodesKatahUse } from '../../src/engine/custodes-katah-transitions.js';
import { getProbabilisticUnitProfile } from '../../src/rules/saved-roster-combat-profile.js';
import { getDamageOutcomeDistribution } from '../../src/rules/damage-outcome-distribution.js';
import { getContextualWeaponProfile } from '../../src/rules/contextual-weapon-abilities.js';
import { buildAttackProfile } from '../../src/rules/combat-profile.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { recordRulesReminderUse } from '../../src/engine/rules-reminder-transitions.js';

const payload={playerId:'p1',unitId:'sentinel',stratagemId:'in-auramite-clad',enemyUnitId:'marine',timingConfirmed:true,unitLimitConfirmed:true};
const list=(state,unitId='sentinel',stratagemId=null)=>opportunities(state,{playerId:'p1',unitId,stratagemId});
const available=(state,id,unitId='sentinel')=>list(state,unitId,id).find(item=>item.available);
const event=(state,type,extra={})=>({type,payload:{round:state.battle.round,turn:state.turn,phase:state.phase,...extra}});
const bolter={id:'bolt',name:'Bolter',type:'ranged',characteristics:{range:24,attacks:4,skill:3,strength:8,ap:-3,damage:3}};
function profiles(state,targetId='sentinel',weapon=bolter,attackerId='marine') {
  const attacker=getProbabilisticUnitProfile(state,state.units.find(unit=>unit.id===attackerId));
  const target=getProbabilisticUnitProfile(state,state.units.find(unit=>unit.id===targetId));
  return {attacker,target,weapon};
}
const contextual=args=>getContextualWeaponProfile({...args,profile:buildAttackProfile(args)});

test('Auramite offers non-Warden Custodes in opponent Shooting and both Fight turns, excluding Sisters and attached Wardens',()=>{
  for(const [phase,activePlayer,allowed] of [['shooting','p2',true],['shooting','p1',false],['fight','p2',true],['fight','p1',true],['movement','p2',false]]) {
    const state=custodesReminderState({phase,activePlayer});
    assert.equal(Boolean(available(state,'in-auramite-clad')),allowed);
    assert.equal(list(state,'wardens','in-auramite-clad').length,0);
    assert.equal(list(state,'trajann','in-auramite-clad').length,0);
    assert.equal(list(state,'prosecutors','in-auramite-clad').length,0);
  }
});

test('stratagems reject wrong owner/detachment, Battle-shock, zero CP, missing confirmations and late enemy attacks atomically',()=>{
  for(const mutate of [state=>state.armyRosters.p1.detachment='Other',state=>state.units.find(u=>u.id==='sentinel').battleShocked=true,
    state=>state.commandPoints.p1=0,state=>state.history.push(event(state,'combat.attack_resolved',{attackerId:'marine'}))]) {
    const state=custodesReminderState();mutate(state);const before=JSON.stringify(state);
    assert.throws(()=>use(state,payload));assert.equal(JSON.stringify(state),before);
  }
  for(const patch of [{playerId:'p2'},{unitId:'wardens'},{timingConfirmed:false},{unitLimitConfirmed:false},{enemyUnitId:'telemon'},{enemyUnitId:null}])
    assert.throws(()=>use(custodesReminderState(),{...payload,...patch}));
});

test('Auramite spends CP once, preserves split-weapon protection, scopes forecast to its attacker and expires at finish/phase change',()=>{
  const before=custodesReminderState();
  before.units.push({...before.units.find(u=>u.id==='marine'),id:'marine2',name:'Other enemy'});
  const baseline=contextual(profiles(before));
  let state=use(before,payload);
  assert.equal(state.commandPoints.p1,2);assert.equal(contextual(profiles(state)).ap,-2);
  assert.equal(contextual(profiles(state,'sentinel',bolter,'marine2')).ap,-3);
  const apTwo={...bolter,characteristics:{...bolter.characteristics,ap:-2}};
  assert.ok(getDamageOutcomeDistribution(profiles(state,'sentinel',apTwo)).expectedDamage<getDamageOutcomeDistribution(profiles(before,'sentinel',apTwo)).expectedDamage);
  assert.equal(getDamageOutcomeDistribution(profiles(state)).expectedDamage,getDamageOutcomeDistribution(profiles(before)).expectedDamage);
  assert.equal(baseline.ap,-3);
  state.history.push(event(state,'combat.attack_resolved',{attackerId:'marine',targetId:'sentinel'}));
  assert.equal(contextual(profiles(state)).ap,-2);
  assert.throws(()=>use(state,{...payload,unitId:'telemon'}),/Already used/);
  state=JSON.parse(JSON.stringify(state));assert.equal(contextual(profiles(state)).ap,-2);
  state.history.push(event(state,'combat.activation_finished',{unitId:'marine'}));
  assert.equal(contextual(profiles(state)).ap,-3);
  const next=use(before,payload);next.phase='fight';
  assert.equal(getActiveGuardiansEffects(next,'sentinel').length,0);
});

test('a stratagem targets the attached formation once, never independently through a Leader',()=>{
  const state=custodesReminderState({phase:'fight'});
  const shield={playerId:'p1',unitId:'wardens',stratagemId:'shield-of-honour',timingConfirmed:true,unitLimitConfirmed:true};
  const after=use(state,shield);
  assert.throws(()=>use(after,{...shield,unitId:'trajann'}));
  assert.equal(getActiveGuardiansEffects(after,'trajann')[0].unitId,'wardens');
});

test('Shield of Honour is phase-start Infantry/Mounted only and never assumes all enemy models split attacks',()=>{
  let state=custodesReminderState({phase:'fight'});
  assert.equal(list(state,'telemon','shield-of-honour').length,0);
  state=use(state,{...payload,stratagemId:'shield-of-honour',enemyUnitId:null,unitId:'wardens'});
  const entries=getTargetDefenseReminders(state,{targetUnitId:'sentinel',attackerId:'marine',phase:'fight'});
  const shield=entries.find(item=>item.id==='shield-of-honour-wardens');
  assert.equal(shield.conditional,true);assert.match(shield.effect,/per model/);
  const melee={...bolter,type:'melee'};
  assert.equal(contextual(profiles(state,'sentinel',melee)).hitModifier,0);
  state.history.push(event(state,'fight.unit_activated',{unitId:'marine'}));
  assert.ok(!available(state,'shield-of-honour','allarus'));
  state.phase='shooting';assert.ok(!getTargetDefenseReminders(state,{targetUnitId:'sentinel'}).some(item=>item.id.startsWith('shield-of-honour')));
});

test('Prime Target follows own shooting selection and cannot be recorded after the first attack or unit finish',()=>{
  const state=custodesReminderState({activePlayer:'p1'});
  assert.ok(available(state,'prime-target'));
  const after=use(state,{...payload,stratagemId:'prime-target',enemyUnitId:null});
  assert.equal(after.commandPoints.p1,2);
  assert.throws(()=>use(after,{...payload,stratagemId:'prime-target',enemyUnitId:null,unitId:'telemon'}),/Already used/);
  state.history.push(event(state,'combat.attack_resolved',{attackerId:'sentinel',targetId:'marine'}));
  assert.ok(!available(state,'prime-target'));
  assert.equal(list(custodesReminderState(),null,'prime-target').length,0);
  const skipped=custodesReminderState({activePlayer:'p1'});skipped.history.push(event(skipped,'shooting.unit_activated',{unitId:'sentinel',actionType:'not_shoot'}));
  assert.ok(!available(skipped,'prime-target'));
});

test('enemy units recorded as not attacking do not create Auramite target windows',()=>{
  const state=custodesReminderState();state.history.push(event(state,'shooting.unit_activated',{unitId:'marine',actionType:'not_shoot'}));
  assert.ok(!available(state,'in-auramite-clad'));
});

test('Auramite recognizes an attached enemy weapon source as part of the recorded attacker',()=>{
  const state=custodesReminderState();
  const marine=state.units.find(u=>u.id==='marine');marine.metadata={rosterUnitId:'enemy-guard'};
  state.units.push({...marine,id:'enemy-leader',metadata:{rosterUnitId:'enemy-leader'}});
  state.armyRosters.p2.units=[{id:'enemy-guard'},{id:'enemy-leader',attachedToBodyguardId:'enemy-guard'}];
  const after=use(state,payload);
  assert.equal(contextual(profiles(after,'sentinel',bolter,'enemy-leader')).ap,-2);
});

test('Unlimited Endurance follows the current Advance trigger and its reminder lasts only through that turn',()=>{
  const state=custodesReminderState({phase:'movement',activePlayer:'p1'});
  assert.equal(list(state,null,'unlimited-endurance').length,0);
  state.history.push(event(state,'unit.advanced',{unitId:'sentinel'}));
  let after=use(state,{...payload,stratagemId:'unlimited-endurance',enemyUnitId:null});
  after.phase='charge';assert.ok(getActiveGuardiansEffects(after,'sentinel').some(e=>e.stratagemId==='unlimited-endurance'));
  after.turn=2;assert.equal(getActiveGuardiansEffects(after,'sentinel').length,0);
  state.history.push(event(state,'unit.normal_move_resolved',{unitId:'telemon'}));
  assert.ok(!available(state,'unlimited-endurance'));
});

test('Swift as the Eagle follows an enemy move, requires Trusted Sentinel, range/unengaged confirmation and respects per-unit phase use',()=>{
  const state=custodesReminderState({phase:'movement'});
  assert.ok(!available(state,'swift-as-the-eagle'));
  state.history.push(event(state,'unit.normal_move_resolved',{unitId:'marine'}));
  const eagle={...payload,stratagemId:'swift-as-the-eagle',rangeConfirmed:true};
  assert.equal(list(state,'venatari','swift-as-the-eagle').length,0);
  assert.throws(()=>use(state,{...eagle,rangeConfirmed:false}),/8″/);
  const after=use(state,eagle);assert.equal(after.commandPoints.p1,2);
  assert.deepEqual(after.units,state.units);
  const engaged=structuredClone(state);engaged.history.push(event(state,'charge.outcome_recorded',{unitId:'marine',targetIds:['sentinel'],outcome:'successful'}));
  assert.ok(!available(engaged,'swift-as-the-eagle'));
});

test('Superhuman Focus confirms phase end, re-readies once per phase and per unit round, and does not reopen the Fight window',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p1'});state.battle.firstPlayerId='p1';
  state.history.push(event(state,'custodes.katah_expended',{playerId:'p1',unitId:'sentinel',katahName:'Rendax',cycleRound:1}));
  const focus={...payload,stratagemId:'superhuman-focus',enemyUnitId:null};
  assert.equal(available(state,'superhuman-focus').timing,'End of any phase');
  const after=use(state,focus);
  assert.equal(getCustodesKatahState(after,{playerId:'p1',unitId:'sentinel'}).readied,true);
  assert.throws(()=>recordCustodesKatahUse(after,{playerId:'p1',unitId:'sentinel',katahName:'Kaptaris'}),/end has been confirmed/);
  assert.throws(()=>recordRulesReminderUse(state,{playerId:'p1',unitId:'sentinel',ruleId:'superhuman-focus'}),/Guardians/);
  after.phase='command';after.history.push(event(after,'custodes.katah_expended',{playerId:'p1',unitId:'sentinel',cycleRound:1}));
  assert.ok(!available(after,'superhuman-focus'));
});

test('Superhuman Focus can explicitly ready a unit before its first Command phase',()=>{
  let state=custodesReminderState({phase:'movement'});
  assert.equal(getCustodesKatahState(state,{playerId:'p1',unitId:'sentinel'}).readied,false);
  state=use(state,{...payload,stratagemId:'superhuman-focus',enemyUnitId:null});
  assert.equal(getCustodesKatahState(state,{playerId:'p1',unitId:'sentinel'}).readied,true);
  state.phase='fight';state.history.push(event(state,'turn.phase_changed',{phase:'fight'}));
  state=recordCustodesKatahUse(state,{playerId:'p1',unitId:'sentinel',katahName:'Kaptaris'});
  assert.equal(contextual(profiles(state,'sentinel',{...bolter,type:'melee'})).hitModifier,1);
});

test('phase stratagem limits include earlier readiness/Swift Ruin records and attached units',()=>{
  const state=custodesReminderState();
  state.history.push({type:'rules.reminder_used',payload:{playerId:'p1',unitId:'sentinel',ruleId:'swift-ruin',round:1,turn:1,phase:'shooting',contextKey:'1:1:p2:shooting'}});
  assert.match(list(state,'sentinel','in-auramite-clad')[0].blockedReason,/already received/);
  assert.throws(()=>use(state,payload));
});

test('passive and activated defenses combine in forecasts with phase and allocated-model limits',()=>{
  let state=custodesReminderState({phase:'fight',activePlayer:'p1'});state.battle.firstPlayerId='p1';
  state=recordCustodesKatahUse(state,{playerId:'p1',unitId:'sentinel',katahName:'Kaptaris'});
  let profile=contextual(profiles(state,'sentinel',{...bolter,type:'melee'}));
  assert.equal(profile.hitModifier,1);assert.equal(profile.woundModifier,1);
  state.phase='shooting';assert.equal(contextual(profiles(state)).hitModifier,0);
  assert.equal(contextual(profiles(state,'telemon')).damageReduction,1);
  state=recordRulesReminderUse(custodesReminderState(),{playerId:'p1',unitId:'trajann',ruleId:'moment-shackle',choice:'save'});
  assert.equal(contextual(profiles(state,'trajann')).invulnerableSave,3);
  assert.equal(contextual(profiles(state,'wardens')).invulnerableSave,4);
  state.phase='fight';assert.equal(contextual(profiles(state,'trajann',{...bolter,type:'melee'})).invulnerableSave,4);
});

test('Guardians CP and effects undo together and save/resume keeps usage constraints',()=>{
  clearCommandHandlers();registerCoreCommandHandlers();
  const state=custodesReminderState(),session=createGameSession(state),before=JSON.stringify(state);
  session.dispatch({type:'custodes.record_guardians_stratagem_use',payload});
  assert.equal(session.getState().commandPoints.p1,2);
  const saved=JSON.parse(JSON.stringify(session.getState()));assert.throws(()=>use(saved,payload));
  assert.equal(session.undoLastAction(),true);assert.equal(JSON.stringify(session.getState()),before);
});
