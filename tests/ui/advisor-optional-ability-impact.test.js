import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { renderAdvisorOptionImpact } from '../../src/ui/advisor-option-impact.js';
import { getFightAbilityImpactPreviews, renderFightAbilityImpact } from '../../src/ui/fight-option-impact.js';
import { getFightOpportunityRecommendations } from '../../src/rules/tactical-fight-opportunities.js';
import { fightAdvisory } from '../../src/ui/fight-advisor.js';
import { getIncomingDamageComparison } from '../../src/rules/incoming-damage-comparison.js';
import { renderIncomingDamageForecast } from '../../src/ui/incoming-damage-forecast-view.js';

const melee={id:'blade',name:'Power blade',type:'melee',characteristics:{
  attacks:4,skill:3,strength:8,ap:-2,damage:3
}};
const enemyMelee={id:'enemy-blade',name:'Enemy blade',type:'melee',characteristics:{
  attacks:4,skill:3,strength:8,ap:-2,damage:3
}};
const opinion=state=>getFightOpportunityRecommendations(state,{playerId:'p1',options:[{
  unitId:'sentinel',targetUnitId:'marine',weapon:melee
}]})[0];

test('read-only numeric comparison shows baseline, projected result and delta without action controls',()=>{
  const html=renderAdvisorOptionImpact({
    baseline:3.2,options:[{id:'sample',label:'Dacatarai',expectedDamage:4.7,cost:'Spend readiness'}]
  });
  assert.match(html,/3\.2 → 4\.7/);
  assert.match(html,/\+1\.5 gain/);
  assert.match(html,/Spend readiness/);
  assert.doesNotMatch(html,/data-custodes-katah-use|data-record-guardians|<button/);
  assert.equal(renderAdvisorOptionImpact({baseline:3.2,options:[]}), '');
  assert.equal(renderAdvisorOptionImpact({baseline:null,options:[{label:'x',expectedDamage:5}]}),'');
  const unsafe=renderAdvisorOptionImpact({baseline:1,options:[{id:'<x>',label:'<script>',expectedDamage:2}]});
  assert.match(unsafe,/&lt;script&gt;/);
  assert.doesNotMatch(unsafe,/<script>/);
  const defensive=renderAdvisorOptionImpact({baseline:5,lowerIsBetter:true,options:[{id:'ward',label:'Defense',expectedDamage:3}]});
  assert.match(defensive,/5\.0 → 3\.0/);
  assert.match(defensive,/\+2\.0 prevented/);
});

test('Fight Advisor compares Martial Mastery and Dacatarai against one baseline only during allowed window',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p1'});
  state.battle.firstPlayerId='p1';
  const before=JSON.stringify(state);
  const recommendation=opinion(state);
  assert.ok(recommendation?.custodesFight?.available);
  const preview=getFightAbilityImpactPreviews(state,recommendation);
  assert.ok(preview.offensive);
  assert.ok(preview.offensive.options.some(item=>item.id==='dacatarai'));
  assert.ok(preview.offensive.options.some(item=>item.id==='guardians-sustained'));
  for(const item of preview.offensive.options){
    const original=recommendation.custodesFight.options.find(option=>option.id===item.id);
    assert.equal(item.expectedDamage,original.expectedDamage);
    assert.equal(preview.offensive.baseline,recommendation.custodesFight.baselineExpectedDamage);
  }
  const html=fightAdvisory('sentinel','blade','marine',state,[melee],'p1',{compact:true});
  assert.match(html,/Offensive options · what changes\?/);
  assert.match(html,/baseline/);
  assert.match(html,/Dacatarai/);
  assert.match(html,/Preview only/);
  assert.equal(JSON.stringify(state),before);

  state.history.push({type:'fight.unit_activated',payload:{unitId:'marine',round:1,turn:1,phase:'fight'}});
  const later=getFightAbilityImpactPreviews(state,opinion(state));
  assert.ok(later.offensive.options.some(item=>item.id==='guardians-lethal'));
  assert.ok(!later.offensive.options.some(item=>item.katahName==='Dacatarai'||item.id.includes('dacatarai')));
  assert.equal(later.defensive,null,'Kaptaris has a start-of-Fight declaration window');
});

test('Rendax is numerically modeled against a Vehicle and remains available for a legal late Fight',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p2'});
  state.battle.firstPlayerId='p1';
  const marine=state.units.find(unit=>unit.id==='marine');
  marine.profile={...marine.profile,keywords:['Vehicle']};
  marine.keywords=['Vehicle'];
  state.history.push({type:'fight.unit_activated',payload:{unitId:'marine',round:1,turn:1,phase:'fight'}});
  const rec=opinion(state);
  const preview=getFightAbilityImpactPreviews(state,rec);
  assert.ok(preview.offensive.options.some(item=>item.id==='rendax'));
  assert.ok(!preview.offensive.options.some(item=>item.id==='dacatarai'));
});

test('incoming forecast previews eligible Kaptaris and Auramite independently without spending resources',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p2'});
  state.battle.firstPlayerId='p1';
  const before=JSON.stringify(state);
  const calc=getIncomingDamageComparison(state,{attackerId:'marine',targetId:'sentinel',weapon:enemyMelee});
  assert.ok(calc);
  assert.ok(calc.previews?.some(item=>item.id==='kaptaris'));
  assert.ok(calc.previews?.some(item=>item.id==='in-auramite-clad'));
  assert.ok(calc.previews.every(item=>item.before===calc.forecast.expectedDamage));
  const html=renderIncomingDamageForecast(state,{attackerId:'marine',targetId:'sentinel',weapon:enemyMelee});
  assert.match(html,/Defensive options · what changes\?/);
  assert.match(html,/Kaptaris/);
  assert.match(html,/In Auramite Clad/);
  assert.match(html,/No CP or Ka’tah readiness has been spent/);
  assert.equal(JSON.stringify(state),before);

  state.commandPoints.p1=0;
  const noCp=getIncomingDamageComparison(state,{attackerId:'marine',targetId:'sentinel',weapon:enemyMelee});
  assert.ok(noCp.previews.some(item=>item.id==='kaptaris'));
  assert.ok(!noCp.previews.some(item=>item.id==='in-auramite-clad'));

  state.history.push({type:'fight.unit_activated',payload:{unitId:'marine',round:1,turn:1,phase:'fight'}});
  const late=getIncomingDamageComparison(state,{attackerId:'marine',targetId:'sentinel',weapon:enemyMelee});
  assert.ok(!late.previews.some(item=>item.id==='kaptaris'));
});

test('unreadied units on first enemy turn never receive a hypothetical Kaptaris benefit',()=>{
  const state=custodesReminderState({phase:'fight',activePlayer:'p2'});
  state.battle.firstPlayerId='p2';
  const comparison=getIncomingDamageComparison(state,{attackerId:'marine',targetId:'sentinel',weapon:enemyMelee});
  assert.ok(comparison);
  assert.ok(!comparison.previews?.some(item=>item.id==='kaptaris'));
});
