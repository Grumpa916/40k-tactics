import test from 'node:test';
import assert from 'node:assert/strict';
import { getDatasheetWeaponOptions, getProbabilisticUnitProfile } from '../../src/rules/saved-roster-combat-profile.js';
import { getExpectedDamage } from '../../src/rules/expected-damage.js';
import { getDamageOutcomeDistribution } from '../../src/rules/damage-outcome-distribution.js';

function profile({ id='u', x=0, y=0, models=1, keywords=[], toughness=5, save=7, ballisticSkill=3 }={}) {
  return {
    id,
    position:{x,y},
    modelCount:models,
    keywords,
    wounds:10,
    characteristics:{ toughness, save, ballisticSkill, weaponSkill:3 }
  };
}

function ranged(characteristics={}) {
  return { type:'ranged', characteristics:{ attacks:1, range:24, strength:5, ap:0, damage:1, skill:3, ...characteristics } };
}

test('saved datasheet weapons parse remaining core contextual ability inputs',()=>{
  const state={
    armyRosters:{p1:{units:[{id:'r1',datasheet:{weapons:[{
      name:'Context gun',range:'24"',attacks:'2',skill:'3+',strength:6,ap:-1,damage:'D6',
      abilities:'Blast 2, Rapid Fire 1, Melta 2, Anti-Infantry 4+, Precision, Extra Attacks'
    }]}}]}},
    units:[{id:'u1',ownerId:'p1',metadata:{rosterUnitId:'r1'}}]
  };
  const [weapon]=getDatasheetWeaponOptions(state,state.units[0],{type:'ranged'});
  assert.equal(weapon.characteristics.blast,2);
  assert.equal(weapon.characteristics.rapidFire,1);
  assert.equal(weapon.characteristics.melta,2);
  assert.deepEqual(weapon.characteristics.anti,[{keyword:'infantry',threshold:4}]);
  assert.equal(weapon.characteristics.precision,true);
  assert.equal(weapon.characteristics.extraAttacks,true);
});

test('Blast adds X attacks per five live target models',()=>{
  const attacker=profile({x:0,y:0});
  const target=profile({x:20,y:0,models:12});
  const result=getExpectedDamage({attacker,target,weapon:ranged({attacks:2,blast:2})});
  assert.equal(result.contextualAbilities.blastBonus,4);
  assert.equal(result.attacks,6);
});

test('Rapid Fire and Melta apply only when approximate half-range is clear of the uncertainty band',()=>{
  const attacker=profile({x:0,y:0});
  const close=profile({x:6,y:0});
  const borderline=profile({x:11,y:0});
  const weapon=ranged({attacks:1,damage:'D6',rapidFire:2,melta:2});
  const closeResult=getExpectedDamage({attacker,target:close,weapon});
  assert.equal(closeResult.contextualAbilities.halfRangeStatus,'within');
  assert.equal(closeResult.contextualAbilities.rapidFireBonus,2);
  assert.equal(closeResult.contextualAbilities.meltaBonus,2);
  assert.equal(closeResult.attacks,3);
  assert.equal(closeResult.damagePerUnsavedWound,5.5);
  const borderlineResult=getExpectedDamage({attacker,target:borderline,weapon});
  assert.equal(borderlineResult.contextualAbilities.halfRangeStatus,'borderline');
  assert.equal(borderlineResult.contextualAbilities.rapidFireBonus,0);
  assert.equal(borderlineResult.contextualAbilities.meltaBonus,0);
  assert.equal(borderlineResult.attacks,1);
  assert.equal(borderlineResult.damagePerUnsavedWound,3.5);
});

test('Anti-X lowers the critical wound threshold only against matching target keywords',()=>{
  const attacker=profile();
  const infantry=profile({keywords:['Infantry'],toughness:10});
  const monster=profile({keywords:['Monster'],toughness:10});
  const weapon=ranged({strength:5,anti:[{keyword:'infantry',threshold:4}],devastatingWounds:true});
  const anti=getExpectedDamage({attacker,target:infantry,weapon});
  const baseline=getExpectedDamage({attacker,target:monster,weapon});
  assert.equal(anti.contextualAbilities.antiMatched,true);
  assert.equal(anti.contextualAbilities.criticalWoundTarget,4);
  assert.equal(anti.criticalWoundProbability,0.5);
  assert.equal(baseline.contextualAbilities.antiMatched,false);
  assert.equal(baseline.contextualAbilities.criticalWoundTarget,6);
  assert.equal(baseline.criticalWoundProbability,1/6);
  assert.ok(anti.expectedDamage>baseline.expectedDamage);
});

test('Precision and Extra Attacks remain available as structured workflow flags',()=>{
  const attacker=profile();
  const target=profile();
  const result=getDamageOutcomeDistribution({attacker,target,weapon:ranged({precision:true,extraAttacks:true})});
  assert.equal(result.contextualAbilities.precision,true);
  assert.equal(result.contextualAbilities.extraAttacks,true);
  assert.ok(Math.abs(result.totalProbability-1)<1e-10);
});

test('probabilistic unit profiles expose live model count and datasheet keywords for contextual rules',()=>{
  const state={
    armyRosters:{p2:{units:[{id:'r2',modelCount:10,datasheet:{characteristics:{Toughness:4,Save:'3+',Wounds:1},keywords:['Infantry','Faction: Test'],weapons:[]}}]}},
    units:[{id:'target',ownerId:'p2',status:'deployed',metadata:{rosterUnitId:'r2',modelCount:10},position:{x:3,y:4}}],
    history:[]
  };
  const target=getProbabilisticUnitProfile(state,state.units[0]);
  assert.equal(target.modelCount,10);
  assert.ok(target.keywords.includes('Infantry'));
  assert.deepEqual(target.position,{x:3,y:4});
});
