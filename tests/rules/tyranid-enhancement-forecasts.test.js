import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { getProbabilisticUnitProfile, getDatasheetWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';
import { buildAttackProfile } from '../../src/rules/combat-profile.js';
import { getContextualWeaponProfile } from '../../src/rules/contextual-weapon-abilities.js';
import { applyRecordedCombatEffects } from '../../src/rules/contextual-datasheet-effects.js';
import { weaponAbilityCharacteristics } from '../../src/rules/weapon-ability-characteristics.js';

const catalog=findArmyUnitCandidates({faction:'Tyranids'});
function battle(id,upgrade){
 const candidate=catalog.find(x=>x.id==='tyranids:'+id);
 assert.ok(candidate,id);
 const saved={
   id:'roster-unit',datasheetId:candidate.id,name:candidate.name,
   datasheet:candidate.datasheet,modelCount:candidate.defaultModelCount,
   unitUpgrades:[{name:upgrade}],loadoutValidation:{status:'rules-reviewed-valid'}
 };
 const live={id:'live-unit',ownerId:'p1',name:candidate.name,status:'deployed',
   currentStrength:candidate.defaultModelCount,position:{x:1,y:1},
   metadata:{rosterUnitId:saved.id,modelCount:candidate.defaultModelCount}};
 const state={phase:'shooting',turn:1,battle:{status:'active',round:1,activePlayerId:'p1'},
   history:[],units:[live],armyRosters:{p1:{faction:'Tyranids',units:[saved]}}};
 return {state,live,saved};
}
const target=(keywords)=>({id:'target',keywords,modelCount:1,position:{x:7,y:1},
  characteristics:{toughness:8,save:3,invulnerableSave:4}});
const profile=(extras={})=>({weaponType:'melee',strength:10,toughness:8,
  hitModifier:0,woundModifier:0,ap:-2,damage:2,woundReroll:'none',
  ...extras});

test('Norn Assimilator Synaptoprescience gives 4+ invulnerable save to the forecast',()=>{
 const {state,live}=battle('norn-assimilator','Synaptoprescience');
 const calculated=getProbabilisticUnitProfile(state,live);
 assert.equal(calculated.characteristics.invulnerableSave,4);
 assert.ok(calculated.combatRules.effects.includes('tyranid-synaptoprescience'));
});

test('Norn Emissary ranged Psychic Tendrils gain Anti-Character 2+ on targets',()=>{
 const {state,live}=battle('norn-emissary','Destabilising Predation');
 const attacker=getProbabilisticUnitProfile(state,live);
 const options=getDatasheetWeaponOptions(state,live,{type:'ranged'});
 const ranged=options.find(x=>x.name==='Psychic Tendril (neurolance)');
 assert.ok(ranged);
 const enemy=target(['Character','Infantry']);
 const attack=buildAttackProfile({attacker,target:enemy,weapon:ranged});
 const evaluated=getContextualWeaponProfile({attacker,target:enemy,profile:attack});
 assert.equal(evaluated.criticalWoundTarget,2);
 assert.match(evaluated.appliedRules.join(','),/Destabilising Predation/);
 const nonCharacter=target(['Infantry']);
 const other=getContextualWeaponProfile({attacker,target:nonCharacter,profile:attack});
 assert.equal(other.criticalWoundTarget,6);
});

test('Adaptive Biology base 5+ Feel No Pain is automatic, 4+ remains conditional',()=>{
 const {state,live}=battle('neurotyrant','Adaptive Biology');
 const unit=getProbabilisticUnitProfile(state,live);
 assert.equal(unit.characteristics.damagePrevention,5);
});

test('Trygon Prime improves WS and S of melee weapons and adds Synapse keyword',()=>{
 const {state,live}=battle('trygon','Trygon Prime');
 const unit=getProbabilisticUnitProfile(state,live);
 assert.ok(unit.keywords.includes('Synapse'));
 const weapon=getDatasheetWeaponOptions(state,live,{type:'melee'}).find(x=>x.name==='Trygon scything talons');
 assert.ok(weapon);
 assert.equal(weapon.characteristics.strength,10);
 assert.equal(weapon.characteristics.skill,2);
});

test('Unconditional Tyranid enhancement effects alter probabilistic attack profile only in applicable context',()=>{
 const enemy=target(['Vehicle']);
 const melee=profile();
 const attacker={id:'a',combatRules:{effects:['tyranid-monstrous-nemesis','tyranid-elevated-might','tyranid-ocular-adaptation']}};
 const updated=applyRecordedCombatEffects({attacker,target:enemy,profile:melee});
 assert.equal(updated.woundModifier,-1);
 assert.equal(updated.woundReroll,'failed');
 assert.equal(updated.ap,-3);
 assert.equal(updated.hitModifier,-1);
 const other=applyRecordedCombatEffects({attacker,target:target(['Infantry']),profile:melee});
 assert.equal(other.woundModifier,0);
 const ranged=applyRecordedCombatEffects({attacker,target:enemy,profile:profile({weaponType:'ranged'})});
 assert.equal(ranged.ap,-2);
 assert.equal(ranged.hitModifier,0);
});

test('Synaptic Control reduces allocated damage by one and Psychic upgrade applies only to psychic attacks',()=>{
 const enemy={combatRules:{effects:['tyranid-synaptic-control']}};
 const attacker={combatRules:{effects:['tyranid-power-of-the-hive-mind']}};
 const psychic={...profile({weaponType:'ranged',psychic:true})};
 const out=applyRecordedCombatEffects({attacker,target:enemy,profile:psychic});
 assert.equal(out.damageReduction,1);
 assert.equal(out.strength,11);
 assert.equal(out.ap,-3);
 assert.equal(weaponAbilityCharacteristics('Psychic, Blast').psychic,true);
 const normal=applyRecordedCombatEffects({attacker,target:enemy,profile:profile({weaponType:'ranged',psychic:false})});
 assert.equal(normal.strength,10);
 assert.equal(normal.ap,-2);
});

test('Warrior Bioform Onslaught grants 5+ invulnerable to Warriors and Prime, not unrelated units',()=>{
 for(const name of ['tyranid-warriors-with-ranged-bio-weapons','tyranid-warriors-with-melee-bio-weapons','winged-tyranid-prime']){
  const {state,live}=battle(name,'');
  state.armyRosters.p1.detachments=['Warrior Bioform Onslaught'];
  const prof=getProbabilisticUnitProfile(state,live);
  assert.equal(prof.characteristics.invulnerableSave,5,name);
 }
 const {state,live}=battle('trygon','');
 state.armyRosters.p1.detachments=['Warrior Bioform Onslaught'];
 assert.notEqual(getProbabilisticUnitProfile(state,live).characteristics.invulnerableSave,5);
});

test('Subterranean Assault rerolls Hit rolls of one and explicitly designated Trygon is a Character',()=>{
 const {state,live,saved}=battle('trygon','');
 state.armyRosters.p1.detachments=['Subterranean Assault'];
 saved.subterraneanCharacter=true;
 const prof=getProbabilisticUnitProfile(state,live);
 assert.ok(prof.keywords.includes('Character'));
 assert.ok(prof.combatRules.effects.includes('tyranid-surprise-assault'));
 const applied=applyRecordedCombatEffects({attacker:prof,target:target(['Infantry']),profile:profile()});
 assert.equal(applied.hitReroll,'ones');
});

test('Ambush Predators gives Lictors Deep Strike and Hit re-rolls of one versus Characters only',()=>{
 const {state,live}=battle('lictor','');
 state.armyRosters.p1.detachments=['Ambush Predators'];
 const prof=getProbabilisticUnitProfile(state,live);
 assert.ok(prof.keywords.includes('Deep Strike'));
 assert.ok(prof.combatRules.effects.includes('tyranid-mindhunger'));
 assert.equal(applyRecordedCombatEffects({
  attacker:prof,target:target(['Character','Infantry']),profile:profile()
 }).hitReroll,'ones');
 assert.equal(applyRecordedCombatEffects({
  attacker:prof,target:target(['Infantry']),profile:profile()
 }).hitReroll,undefined);
});
