import test from 'node:test';
import assert from 'node:assert/strict';
import { getFullAttackAdvice } from '../../src/rules/full-attack-advisor.js';
import { renderFullAttackAdvisor } from '../../src/ui/full-attack-advisor.js';
function setup() {
  const sheet = { characteristics: { Toughness: '5', Save: '3+', Wounds: '10' }, weapons: [
    {name:'Blade',range:'Melee',attacks:4,skill:'3+',strength:6,ap:-2,damage:2},
    {name:'Alternate blade',range:'Melee',attacks:2,skill:'3+',strength:6,ap:-2,damage:1}
  ] };
  const state = { phase:'shooting',turn:1,activePlayer:'p1',battle:{round:1,status:'active'},history:[],
    units:['a','b'].map((id,i)=>({id,ownerId:`p${i+1}`,name:id,status:'deployed',wounds:10,modelCount:1,
      characteristics:{toughness:5,save:3,weaponSkill:3},metadata:{rosterUnitId:id}})),
    armyRosters:Object.fromEntries(['a','b'].map((id,i)=>[`p${i+1}`,{faction:'Test',units:[{id,modelCount:1,datasheet:structuredClone(sheet),
      equippedWeapons:[{name:'Blade',quantity:1},{name:'Alternate blade',quantity:1}]}]}])) };
  const options = {attackerId:'a',targetId:'b',mapDistance:7,weapon:{id:'gun',name:'Gun'},shooting:{
    damageDistribution:{outcomes:[{damage:2,probability:1}]},strategicContext:{primary:{reason:'Hold center'},secondary:{reason:'Remove target'},
    primaryStrategy:{nextKillVpLeverage:3},objectiveSwing:{potentialFlip:true,objectiveId:'center'}}}};
  return {state,options};
}
test('saved-profile sequence offers distance scenarios, mission context and no state mutation',()=>{
  const {state,options}=setup(), before=structuredClone(state);
  const result=getFullAttackAdvice(state,options);
  assert.equal(result.available,true, result.reason);
  assert.equal(result.scenarios.length,3);
  assert.deepEqual(result.meleeWeapons,['Blade']);
  assert.ok(result.scenarios[0].expectedDamage>result.scenarios[2].expectedDamage);
  assert.ok(result.scenarios.every(x=>Number.isFinite(x.retaliationExpectedDamage)));
  assert.equal(result.mission.killVp,3);
  assert.deepEqual(state,before);
  const html=renderFullAttackAdvisor(state,options);
  assert.match(html,/data-full-attack/); assert.match(html,/Hold center/); assert.match(html,/VP remains manual/);
});
test('Advance, Fall Back, prior attacks and enemy Fights First withhold misleading forecasts',()=>{
  for (const type of ['unit.advanced','unit.fell_back','combat.attack_resolved']) {
    const {state,options}=setup();
    state.history.push({type,payload:{unitId:'a',attackerId:'a',round:1,turn:1}});
    assert.equal(getFullAttackAdvice(state,options).available,false,type);
  }
  const {state,options}=setup();
  state.armyRosters.p2.units[0].datasheet.abilities=[{name:'Fights First'}];
  assert.match(getFullAttackAdvice(state,options).reason,/Fights First/);
});
test('unknown distance or probability never becomes a zero-risk forecast',()=>{
  const {state,options}=setup();
  assert.equal(getFullAttackAdvice(state,{...options,mapDistance:null}).available,false);
  assert.equal(getFullAttackAdvice(state,{...options,shooting:{}}).available,false);
  state.units[1].modelCount=2; state.armyRosters.p2.units[0].modelCount=2;
  const result=getFullAttackAdvice(state,options);
  assert.equal(result.available,true,result.reason);
  assert.ok(result.scenarios.every(x=>x.retaliationExpectedDamage===null));
});
test('measured range above twelve yields shooting only and escaped weapon labels',()=>{
  const {state,options}=setup(); options.measuredDistance=13; options.weapon.name='<script>';
  const result=getFullAttackAdvice(state,options);
  assert.equal(result.scenarios.length,1); assert.equal(result.scenarios[0].expectedDamage,2);
  assert.equal(result.scenarios[0].chargeProbability,0);
  assert.match(renderFullAttackAdvisor(state,options),/&lt;script&gt;/);
});
