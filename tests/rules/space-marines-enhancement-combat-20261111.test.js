import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { SPACE_MARINES_CURRENT_ENHANCEMENTS } from '../../src/data/space-marines-enhancements.js';
import { getProbabilisticUnitProfile } from '../../src/rules/saved-roster-combat-profile.js';
import { applyRecordedCombatEffects } from '../../src/rules/contextual-datasheet-effects.js';

const units=findArmyUnitCandidates({faction:'Space Marines'});
const enhancement=(name,detachment)=>SPACE_MARINES_CURRENT_ENHANCEMENTS.find(x=>x.name===name&&x.detachment===detachment);
function state(name,detachment,upgradeName=null){
 const source=units.find(x=>x.name===name&&!x.legends);
 assert.ok(source,'Missing catalog '+name);
 const def=upgradeName?enhancement(upgradeName,detachment):null;
 const saved={id:'saved',name,modelCount:source.defaultModelCount,datasheetId:source.id,
   datasheet:source.datasheet,unitUpgrades:def?[{id:def.id,name:def.name,detachment:def.detachment,points:def.points}]:[]};
 const live={id:'live',name,ownerId:'p1',status:'deployed',currentStrength:source.defaultModelCount,
  position:{x:1,y:1},metadata:{rosterUnitId:'saved',modelCount:source.defaultModelCount}};
 const game={phase:'shooting',turn:1,battle:{round:1,status:'active',activePlayerId:'p1'},
  units:[live],history:[],armyRosters:{p1:{faction:'Space Marines',detachments:[detachment],units:[saved]}}};
 return getProbabilisticUnitProfile(game,live);
}
const profile=(type='melee',extra={})=>({
 weaponType:type,attacks:3,strength:6,toughness:5,ap:-1,damage:2,
 hitReroll:'none',woundReroll:'none',hitModifier:0,woundModifier:0,...extra
});
const target=(keyword)=>({keywords:[keyword],combatRules:{effects:[]}});
const apply=(attacker,weapon,targetUnit=target('Infantry'))=>
  applyRecordedCombatEffects({attacker,target:targetUnit,profile:weapon});

test('Ironclad Champions grants Dreadnought Hit reroll ones without a Stratagem spend',()=>{
 const dread=state('Ballistus Dreadnought','Ironclad Champions');
 assert.ok(dread.combatRules.effects.includes('marine-ironclad-champions'));
 assert.equal(apply(dread,profile('ranged')).hitReroll,'ones');
 const ordinary=state('Intercessor Squad','Ironclad Champions');
 assert.ok(!ordinary.combatRules.effects.includes('marine-ironclad-champions'));
});

test('Artificer Sarcophagus reduces Dreadnought damage, not unrelated units',()=>{
 const dread=state('Ballistus Dreadnought','Ironclad Champions','Artificer Sarcophagus');
 const attacker={combatRules:{effects:[]}};
 const modified=applyRecordedCombatEffects({attacker,target:dread,profile:profile('ranged')});
 assert.equal(modified.damageReduction,1);
 assert.match(modified.appliedRules.join(' '),/Artificer Sarcophagus/);
 const regular=applyRecordedCombatEffects({attacker,target:state('Ballistus Dreadnought','Ironclad Champions'),
  profile:profile('ranged')});
 assert.equal(regular.damageReduction,0);
});

test('Champion of the First Company and Honour of Vigilance enable correct attack types',()=>{
 const terminator=state('Captain in Terminator Armour','Terminator Storm Force','Champion of the First Company');
 assert.equal(apply(terminator,profile('melee')).lethalHits,true);
 assert.equal(apply(terminator,profile('ranged')).lethalHits,undefined);
 const dev=state('Captain','Devastator Brethren','Honour of Vigilance');
 assert.equal(apply(dev,profile('ranged')).lethalHits,true);
 assert.equal(apply(dev,profile('melee')).lethalHits,undefined);
});

test('Furious Assault is conditional on target not being Monster/Vehicle',()=>{
 const marine=state('Intercessor Squad','Assault Brethren','Furious Assault');
 assert.equal(apply(marine,profile('melee'),target('Infantry')).sustainedHits,1);
 assert.equal(apply(marine,profile('melee'),target('Vehicle')).sustainedHits,undefined);
 assert.equal(apply(marine,profile('ranged'),target('Infantry')).sustainedHits,undefined);
});

test('Laurels of Triumph increases only equipped bearer melee attack Strength and AP',()=>{
 const captain=state('Captain','Gladius Task Force','Laurels of Triumph');
 const melee=apply(captain,profile('melee'));
 assert.equal(melee.strength,7);
 assert.equal(melee.ap,-2);
 const ranged=apply(captain,profile('ranged'));
 assert.equal(ranged.strength,6);
 assert.equal(ranged.ap,-1);
});

test('Master-forged Firearms upgrades non-Psychic bearer ranged weapons only',()=>{
 const captain=state('Captain','Devastator Brethren','Master-forged Firearms');
 const fire=apply(captain,profile('ranged',{attacks:3,strength:5,ap:-1,damage:1,psychic:false}));
 assert.deepEqual([fire.attacks,fire.strength,fire.ap,fire.damage],[4,6,-2,2]);
 const psychic=apply(captain,profile('ranged',{psychic:true}));
 assert.equal(psychic.strength,6);
 const melee=apply(captain,profile('melee'));
 assert.equal(melee.strength,6);
});

test('Redoubtable Machine Spirit grants its vehicle a 5+ invulnerable save',()=>{
 const upgraded=state('Gladiator Lancer','Ironstorm Spearhead','Redoubtable Machine Spirit');
 assert.equal(upgraded.characteristics.invulnerableSave,5);
 const base=state('Gladiator Lancer','Ironstorm Spearhead');
 assert.notEqual(base.characteristics.invulnerableSave,5);
});

test('model-only Artificer Armour is not falsely extended to an entire attached bodyguard',()=>{
 const model=state('Captain','Gladius Task Force','Artificer Armour');
 assert.ok(model.combatRules.effects.includes('marine-artificer-armour'));
 // Exact allocated-model saves require a casualty/model selector; no blanket buff.
 assert.notEqual(model.characteristics.damagePrevention,5);
});
