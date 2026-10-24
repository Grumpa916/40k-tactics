import test from 'node:test';
import assert from 'node:assert/strict';
import { getProbabilisticFightRetaliation } from '../../src/rules/probabilistic-fight-retaliation.js';
import { getBestFightRetaliation } from '../../src/rules/tactical-fight-retaliation.js';
import { fightAdvisory } from '../../src/ui/fight-advisor.js';

const blade = {id:'blade',name:'Blade',type:'melee',characteristics:{attacks:4,strength:8,ap:-2,damage:2}};
function seed() {
  const unit=(id,ownerId,wounds)=>({id,name:id,ownerId,wounds,status:'deployed',
    profile:{characteristics:{weaponSkill:3,toughness:4,save:3}},meleeWeapons:[blade]});
  return {phase:'fight',turn:1,battle:{round:1},players:[{id:'p1'},{id:'p2'}],
    units:[unit('fighter','p1',12),unit('target','p2',3),unit('other','p2',12)],
    history:[{type:'charge.outcome_recorded',payload:{unitId:'fighter',outcome:'successful',targetIds:['target','other'],turn:1,round:1}}]};
}
test('killing the selected target does not remove another engaged enemy retaliation estimate',()=>{
  const state=seed();
  const result=getProbabilisticFightRetaliation(state,{playerId:'p1',attackerId:'fighter',targetId:'target',weapon:blade,
    distribution:{outcomes:[{damage:4,probability:1}]}});
  assert.equal(result.destructionProbability,1);
  assert.ok(result.expectedRetaliationDamage>0);
  assert.equal(result.outcomes[0].retaliation.unitId,'other');
});
test('completed or declined enemy activations do not contribute current-phase retaliation',()=>{
  for(const event of [
    {type:'combat.activation_finished',payload:{unitId:'other',phase:'fight',turn:1,round:1}},
    {type:'fight.unit_activated',payload:{unitId:'other',actionType:'not_fight',turn:1,round:1}}
  ]) {
    const state=seed();state.history.push(event);
    assert.equal(getBestFightRetaliation(state,{playerId:'p1',attackerId:'fighter',destroyedUnitIds:['target']}),null);
  }
});
test('an earlier-turn completion does not suppress a current retaliation candidate',()=>{
  const state=seed();
  state.history.push({type:'combat.activation_finished',payload:{unitId:'other',phase:'fight',turn:0,round:1}});
  assert.equal(getBestFightRetaliation(state,{playerId:'p1',attackerId:'fighter',destroyedUnitIds:['target']}).unitId,'other');
});
test('unknown retaliation is shown as a dash rather than zero damage', () => {
  const state = seed();
  state.history = [];
  const html = fightAdvisory('fighter', 'blade', 'target', state, [blade], 'p1');
  assert.match(html, /<strong>—<\/strong><span>expected retaliation/);
  assert.match(html, /retaliation data is not available/);
});
