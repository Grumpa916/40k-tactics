import test from 'node:test';
import assert from 'node:assert/strict';
import { getExpectedDamage } from '../../src/rules/expected-damage.js';
import { getDamageOutcomeDistribution } from '../../src/rules/damage-outcome-distribution.js';
import { getProbabilisticUnitProfile } from '../../src/rules/saved-roster-combat-profile.js';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS as catalog } from '../../src/data/adeptus-custodes-datasheet-details.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const attacker={characteristics:{toughness:5,save:7}};
const target=(changes={})=>({characteristics:{toughness:5,save:7,...changes}});
const weapon=(damage=4)=>({type:'ranged',characteristics:{attacks:1,torrent:true,strength:10,ap:0,damage}});

test('Feel No Pain is rolled per wound in full probabilities as well as the mean',()=>{
  const args={attacker,target:target({damagePrevention:5}),weapon:weapon()};
  const result=getDamageOutcomeDistribution(args);
  close(result.totalProbability,1);
  close(result.expectedDamage,4*(5/6)*(2/3));
  close(result.outcomes.find(outcome=>outcome.damage===4).probability,(5/6)*(2/3)**4);
  close(result.expectedDamage,getExpectedDamage(args).expectedDamage);
});

test('damage reduction is per attack, respects minimum 1 and reduces dice before prevention',()=>{
  for(const [damage,expectedPerHit] of [[1,1],[4,3],['D3',4/3],['D6+2',4.5]]){
    const args={attacker,target:target({damageReduction:1,damagePrevention:5}),weapon:weapon(damage)};
    const mean=getExpectedDamage(args), distribution=getDamageOutcomeDistribution(args);
    close(mean.damagePerUnsavedWound,expectedPerHit);
    close(mean.expectedDamage,expectedPerHit*(5/6)*(2/3));
    close(distribution.expectedDamage,mean.expectedDamage);close(distribution.totalProbability,1);
  }
});

test('general Feel No Pain is read from the selected model; mortal-only protection is not applied to normal attacks',()=>{
  const unit={id:'c',ownerId:'p1',status:'deployed',metadata:{rosterUnitId:'r'}};
  const state={units:[unit],armyRosters:{p1:{units:[{id:'r',datasheet:catalog['adeptus-custodes:trajann-valoris']}]}}};
  assert.equal(getProbabilisticUnitProfile(state,unit).combatRules.feelNoPain,5);
  state.armyRosters.p1.units[0].datasheet=catalog['adeptus-custodes:shield-captain'];
  assert.equal(getProbabilisticUnitProfile(state,unit).combatRules.feelNoPain,0);
});

test('Aegis protects only the Devastating Wounds portion and uses the best applicable Feel No Pain',()=>{
  const unit={id:'c',ownerId:'p1',status:'deployed',metadata:{rosterUnitId:'r'}};
  const state={units:[unit],armyRosters:{p1:{units:[{id:'r',datasheet:catalog['adeptus-custodes:shield-captain']}]}}};
  const defender=getProbabilisticUnitProfile(state,unit);
  const w=weapon(3); w.characteristics.devastatingWounds=true;
  const args={attacker,target:defender,weapon:w};
  const mean=getExpectedDamage(args), distribution=getDamageOutcomeDistribution(args);
  assert.equal(mean.contextualAbilities.damagePrevention,0);
  assert.equal(mean.contextualAbilities.mortalDamagePrevention,5);
  close(mean.expectedDamage,(mean.normalWounds*mean.saveFailureProbability + mean.devastatingWounds*2/3)*3);
  close(mean.expectedDamage,distribution.expectedDamage); close(distribution.totalProbability,1);
  defender.characteristics.damagePrevention=4;
  const stronger=getExpectedDamage(args);
  assert.equal(stronger.contextualAbilities.mortalDamagePrevention,4);
  close(stronger.expectedDamage,getDamageOutcomeDistribution(args).expectedDamage);
  assert.ok(!stronger.contextualAbilities.appliedRules.some(rule=>rule.startsWith('Aegis')));
});
