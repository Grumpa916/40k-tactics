import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getAdaptiveExecutionAdvice } from '../../src/rules/adaptive-execution-advisor.js';
import { renderAdaptiveExecutionPanel } from '../../src/ui/adaptive-execution-panel.js';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';

function fixture(phase='shooting') {
  const sheet={
    characteristics:{Toughness:'5',Save:'3+',Wounds:'10',Move:'6',OC:'2'},
    weapons:[
      {name:'Boltstorm',range:'24"',attacks:4,skill:'3+',strength:5,ap:-1,damage:2},
      {name:'Blade',range:'Melee',attacks:4,skill:'3+',strength:6,ap:-2,damage:2}
    ]
  };
  return {
    phase,turn:1,activePlayer:'p1',
    battle:{id:'battle-1',round:1,status:'active',activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    history:[],objectives:[],
    units:[
      {id:'a',ownerId:'p1',name:'Allarus Custodians',status:'deployed',
        wounds:10,modelCount:1,position:{x:12,y:22},
        characteristics:{toughness:5,save:3,ballisticSkill:3,weaponSkill:3,objectiveControl:2},
        metadata:{rosterUnitId:'a'}},
      {id:'b',ownerId:'p2',name:'Enemy holder',status:'deployed',
        wounds:10,modelCount:1,position:{x:19,y:22},
        characteristics:{toughness:5,save:3,ballisticSkill:3,weaponSkill:3,objectiveControl:2},
        metadata:{rosterUnitId:'b'}}
    ],
    armyRosters:{
      p1:{faction:'Test',units:[{id:'a',modelCount:1,datasheet:structuredClone(sheet),
        equippedWeapons:[{name:'Boltstorm',quantity:1},{name:'Blade',quantity:1}]}]},
      p2:{faction:'Test',units:[{id:'b',modelCount:1,datasheet:structuredClone(sheet),
        equippedWeapons:[{name:'Boltstorm',quantity:1},{name:'Blade',quantity:1}]}]}
    }
  };
}
const shot=(damage,target='b',attacker='a')=>({type:'combat.attack_resolved',payload:{
  phase:'shooting',round:1,turn:1,attackerId:attacker,targetId:target,actualDamage:damage,
  stateDelta:{target:{unitId:target,woundsAfter:Math.max(0,10-damage)}}}});
const charge=(outcome,targets=['b'],measurements={b:7})=>({type:'charge.outcome_recorded',payload:{
  round:1,turn:1,unitId:'a',outcome,targetIds:targets,measuredDistances:measurements
}});
const fight=(damage)=>({type:'combat.attack_resolved',payload:{
  phase:'fight',round:1,turn:1,attackerId:'a',targetId:'b',actualDamage:damage,
  stateDelta:{target:{unitId:'b',woundsAfter:Math.max(0,10-damage)}}}});
const advice=(s,overrides={})=>getAdaptiveExecutionAdvice(s,{unitId:'a',playerId:'p1',...overrides});

test('read-only Shooting continuation shows current surviving target and conditional remaining fight, never a second shot',()=>{
  const s=fixture(),before=structuredClone(s);
  const a=advice(s,{targetId:'b'});
  assert.equal(a.available,true,a.reason);
  assert.equal(a.source,'selected-target');
  assert.equal(a.targetWounds,10);
  assert.equal(a.shooting.attacks,0);
  assert.equal(a.shooting.actualDamage,0);
  assert.ok(a.remainingForecast?.conditionalFight,a.forecastReason);
  assert.equal(a.remainingForecast.chargeProbability!==null,true);
  assert.match(a.caveat,/never replays recorded shots/);
  assert.deepEqual(s,before,'advice cannot dispatch actions or change game state');
});

test('multiple recorded Shooting attacks count actuals once and recalculate using current enemy wounds',()=>{
  const s=fixture('charge');
  s.history.push(shot(3),shot(2));
  s.units[1].wounds=5;
  const result=advice(s);
  assert.equal(result.available,true);
  assert.equal(result.source,'attack-history');
  assert.equal(result.targetId,'b');
  assert.equal(result.shooting.attacks,2);
  assert.equal(result.shooting.actualDamage,5);
  assert.equal(result.shooting.damageToTarget,5);
  assert.equal(result.targetWounds,5);
  assert.ok(result.remainingForecast?.conditionalFight);
  assert.equal(Object.hasOwn(result.remainingForecast,'expectedShootingDamage'),false);
  const html=renderAdaptiveExecutionPanel(s,{selectedUnitId:'a',playerId:'p1'});
  assert.match(html,/2 weapon attack\(s\)/);
  assert.match(html,/5\.0 actual damage/);
  assert.match(html,/Current wounds: 5/);
  assert.doesNotMatch(html,/Shooting → Charge → Fight combined damage/);
});

test('Charge phase uses provisional measured distance, then recorded Charge distance',()=>{
  const s=fixture('charge');
  const before=structuredClone(s);
  const pending=advice(s,{targetId:'b',measuredDistance:7});
  assert.equal(pending.available,true);
  assert.equal(pending.charge.outcome,null);
  assert.equal(pending.remainingForecast?.measuredDistance,7);
  assert.equal(pending.remainingForecast?.probabilityBasis,'measured');
  assert.ok(pending.remainingForecast.chargeProbability>0);
  assert.deepEqual(s,before,'entering a measurement is not an event');
  s.history.push(charge('successful'));
  s.phase='fight';
  const success=advice(s);
  assert.equal(success.charge.outcome,'successful');
  assert.equal(success.charge.measuredDistance,7);
  assert.equal(success.remainingForecast?.chargeProbability,1);
  assert.equal(success.remainingForecast?.probabilityBasis,'recorded-success');
  assert.match(renderAdaptiveExecutionPanel(s,{selectedUnitId:'a',playerId:'p1'}),/Successful \(recorded\)/);
});

test('failed and declined Charge suppress repeated Charge-to-Fight plan even upon entering Fight',()=>{
  for (const outcome of ['failed','declined']){
    const s=fixture('fight');s.history.push(charge(outcome,outcome==='declined'?[]:['b'],outcome==='declined'?{}:{b:7}));
    const result=advice(s,{targetId:'b'});
    assert.equal(result.available,true);
    assert.equal(result.remainingForecast,null);
    assert.match(result.forecastReason,/Recorded charge (failed|declined)/);
    const html=renderAdaptiveExecutionPanel(s,{selectedUnitId:'a',playerId:'p1',targetId:'b'});
    assert.match(html, new RegExp(outcome==='declined'?'Declined':'Failed'));
    assert.doesNotMatch(html,/Remaining Fight, if eligible:/);
  }
});

test('recorded Fight attacks and activation completion cannot be reforecast as another full activation',()=>{
  const s=fixture('fight');s.history.push(charge('successful'),fight(4));
  s.units[1].wounds=6;
  const first=advice(s);
  assert.equal(first.fight.attacks,1);
  assert.equal(first.fight.actualDamage,4);
  assert.equal(first.targetWounds,6);
  assert.equal(first.remainingForecast,null);
  assert.match(first.forecastReason,/Fight damage already recorded/);
  s.history.push({type:'combat.activation_finished',payload:{unitId:'a',phase:'fight',round:1,turn:1}});
  const after=advice(s);
  assert.equal(after.fight.finished,true);
  assert.equal(after.remainingForecast,null);
  assert.match(after.forecastReason,/activation finished/);
});

test('destroyed target stops forecasting and prompts objective review without inventing OC',()=>{
  const s=fixture('charge');
  s.history.push(shot(10));
  s.units[1]={...s.units[1],wounds:0,status:'destroyed'};
  const result=advice(s);
  assert.equal(result.remainingForecast,null);
  assert.match(result.forecastReason,/destroyed or no longer available/);
  const html=renderAdaptiveExecutionPanel(s,{selectedUnitId:'a',playerId:'p1'});
  assert.match(html,/Target destroyed \(recorded\)/);
  assert.match(html,/review actual objective control/);
  assert.doesNotMatch(html,/Remaining Fight, if eligible:/);
});

test('historical events and opponent turns cannot leak damage into current turn execution',()=>{
  const s=fixture();
  s.history.push(shot(8));
  s.turn=2;s.battle.round=2;
  const result=advice(s);
  assert.equal(result.shooting.attacks,0);
  assert.equal(result.targetId,null);
  assert.equal(result.shooting.actualDamage,0);
  assert.equal(advice({...s,activePlayer:'p2'}).available,false);
  assert.equal(advice({...s,phase:'command'}).available,false);
  assert.equal(advice(s,{unitId:'b'}).available,false);
});

test('attached Leader attacks count toward the bodyguard without confusing opponent attacks',()=>{
  const s=fixture('charge');
  s.units.push({id:'leader',ownerId:'p1',name:'Trajann',status:'deployed',
    wounds:7,modelCount:1,position:{x:12,y:22},metadata:{rosterUnitId:'leader'}});
  s.armyRosters.p1.units[0].attachedLeaderIds=['leader'];
  s.armyRosters.p1.units.push({id:'leader',attachedToBodyguardId:'a',modelCount:1,
    datasheet:{characteristics:{Wounds:'7',Toughness:'5',Save:'3+'},weapons:[
      {name:'Blade',range:'Melee',attacks:4,skill:'3+',strength:6,ap:-2,damage:2}]},
    equippedWeapons:[{name:'Blade',quantity:1}]});
  s.history.push(shot(3,'b','leader'),shot(1,'b','b'));
  s.units[1].wounds=7;
  const result=advice(s,{unitId:'leader'});
  assert.equal(result.unitId,'a');
  assert.equal(result.shooting.attacks,1);
  assert.equal(result.shooting.actualDamage,3);
});

test('shared Phase workspace renders adaptive panel only for active Charge/Fight phases',()=>{
  for (const phase of ['charge','fight']){
    const s=fixture(phase);
    const html=renderCombatWorkspace({state:s,phase,selectedUnitId:'a',perspectivePlayerId:'p1',
      controls:'Manual phase actions',adaptiveContext:{targetId:'b',measuredDistance:7},
      mapView:{render:()=>'<div class="map">map</div>'}});
    assert.match(html,/data-adaptive-execution/);
    assert.match(html,/Manual phase actions/);
    assert.match(html,/7″ measured|7″|Measured Charge/);
  }
  const s=fixture('movement');
  assert.doesNotMatch(renderCombatWorkspace({state:s,phase:'fight',selectedUnitId:'a',
    perspectivePlayerId:'p1',controls:'Historical Fight',mapView:{render:()=>'<div>map</div>'}}),
  /data-adaptive-execution/);
  const shooting=fs.readFileSync(new URL('../../src/ui/shooting-screen.js',import.meta.url),'utf8');
  assert.match(shooting,/renderAdaptiveExecutionPanel\(state, \{selectedUnitId:activeUnitId/);
  const core=fs.readFileSync(new URL('../../src/rules/adaptive-execution-advisor.js',import.meta.url),'utf8');
  assert.doesNotMatch(core,/getFullAttackAdvice|session\.dispatch|COMMAND_TYPES/);
  assert.match(core,/getChargeOpportunity\(state/);
});
