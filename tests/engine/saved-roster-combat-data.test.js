import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createArmyRoster } from '../../src/state/army-roster-library.js';
import { applyArmyRosterToBattle } from '../../src/engine/army-roster-transitions.js';
import { getDatasheetWeaponOptions, getProbabilisticUnitProfile } from '../../src/rules/saved-roster-combat-profile.js';
import { getLiveUnitVitals } from '../../src/rules/live-unit-vitals.js';
import { hasConfirmedNoRangedWeapons } from '../../src/rules/battle-unit-reference.js';
import { getAttackDamageForecast } from '../../src/rules/attack-damage-forecast.js';
import { getDamageOutcomeDistribution } from '../../src/rules/damage-outcome-distribution.js';
import { getExpectedDamage } from '../../src/rules/expected-damage.js';
import { resolveAttackRoll } from '../../src/rules/combat-resolution.js';

function legalHiveTyrant(id = 'hive-tyrant') {
 return {
  id,
  name:'Hive Tyrant',
  modelCount:1,
  datasheetId:'tyranids:hive-tyrant',
  equippedWargear:[
   {name:'Monstrous bonesword and lash whip',quantity:1},
   {name:'Monstrous scything talons',quantity:1}
  ],
  equippedWeapons:[
   {name:'Monstrous bonesword and lash whip',quantity:1},
   {name:'Monstrous scything talons',quantity:1}
  ],
  loadoutValidation:{status:'rules-reviewed-valid'}
 };
}

function fixture() {
 let state=createGameState({phase:'setup',battle:{id:'b',status:'setup',round:0},players:[{id:'p1'},{id:'p2'}]});
 state=applyArmyRosterToBattle(state,{playerId:'p1',roster:createArmyRoster({id:'p1',name:'p1',faction:'Tyranids',units:[{
  id:'neurotyrant',name:'Neurotyrant',modelCount:1,datasheetId:'tyranids:neurotyrant'
 }]})});
 state=applyArmyRosterToBattle(state,{playerId:'p2',roster:createArmyRoster({id:'p2',name:'p2',faction:'Tyranids',units:[legalHiveTyrant()]})});
 return state;
}
test('saved roster Neurotyrant has 9 wounds and one model, with a usable Torrent forecast',()=>{
 const state=fixture(),unit=state.units[0],target=state.units[1];
 assert.equal(unit.wounds,9);assert.equal(getLiveUnitVitals(state,unit).models,1);
 const weapon=getDatasheetWeaponOptions(state,unit,{type:'ranged'}).find(x=>x.name==='Psychic scream');
 assert.equal(weapon.characteristics.torrent,true);
 assert.equal(weapon.characteristics.skill,undefined);
 const forecast=getAttackDamageForecast(state,{attackerId:unit.id,targetId:target.id,weapon});
 assert.ok(forecast.expectedDamage>0);
 assert.ok(Math.abs(forecast.outcomes.reduce((n,x)=>n+x.probability,0)-1)<1e-10);
 const expected=getExpectedDamage({attacker:getProbabilisticUnitProfile(state,unit),target:getProbabilisticUnitProfile(state,target),weapon});
 assert.ok(Math.abs(expected.expectedDamage-forecast.expectedDamage)<1e-10);
});
test('legacy saves recover known wounds minus recorded damage, preserving explicit wounds and destroyed state',()=>{
 const state=fixture(),unit={...state.units[0],wounds:null,models:[]};
 state.history.push({type:'combat.attack_resolved',payload:{targetId:unit.id,actualDamage:3}});
 assert.equal(getLiveUnitVitals(state,unit).wounds,6);
 assert.equal(getLiveUnitVitals(state,{...unit,wounds:2}).wounds,2);
 assert.equal(getLiveUnitVitals(state,{...unit,status:'destroyed'}).models,0);
 assert.equal(getLiveUnitVitals(state,{id:'unknown',name:'Unknown',ownerId:'p1',models:[],metadata:{}}).wounds,null);
});
test('2D6 attack counts use independent dice; Torrent never generates critical-hit benefits',()=>{
 const attacker={characteristics:{}},target={characteristics:{toughness:1,save:7}};
 const weapon={type:'ranged',characteristics:{attacks:'2D6',torrent:true,strength:10,damage:1,ap:0}};
 const distribution=getDamageOutcomeDistribution({attacker,target,weapon});
 const max=distribution.outcomes.find(x=>x.damage===12).probability;
 assert.ok(Math.abs(max-(1/36)*Math.pow(5/6,12))<1e-12);
 assert.ok(Math.abs(distribution.expectedDamage-7*5/6)<1e-10);
 assert.deepEqual(getDamageOutcomeDistribution({attacker,target,weapon:{...weapon,characteristics:{...weapon.characteristics,sustainedHits:2,lethalHits:true}}}),distribution);
 const hits=resolveAttackRoll({attacks:5,torrent:true,sustainedHits:2,lethalHits:true,random:()=>{throw Error('No hit roll needed');}});
 assert.equal(hits.hits,5);assert.equal(hits.criticalHits,0);assert.equal(hits.lethalHitWounds,0);
});

test('selected Twin-linked wargear improves the wound forecast',()=>{
 const attacker={characteristics:{weaponSkill:3,toughness:5,save:3}};
 const target={characteristics:{toughness:8,save:3}};
 const weapon={type:'melee',characteristics:{attacks:6,skill:3,strength:8,ap:-2,damage:2,twinLinked:true}};
 const baseline=getExpectedDamage({attacker,target,weapon:{...weapon,characteristics:{...weapon.characteristics,twinLinked:false}}});
 const twinLinked=getExpectedDamage({attacker,target,weapon});
 assert.ok(twinLinked.expectedDamage>baseline.expectedDamage);
});

test('manual shooting records expected and actual damage and updates legacy target wounds once', async()=>{
 const { resolveUnitAttack }=await import('../../src/engine/combat-transitions.js');
 let state=fixture();state={...state,phase:'shooting',turn:1,battle:{...state.battle,status:'active',round:1},units:state.units.map(u=>({...u,status:'deployed',wounds:null}))};
 const [attacker,target]=state.units;
 state.history.push({type:'shooting.unit_activated',payload:{unitId:attacker.id,round:1,turn:1,actionType:'shoot'}});
 const weapon=getDatasheetWeaponOptions(state,attacker,{type:'ranged'})[0];
 const before=getLiveUnitVitals(state,target).wounds;
 const next=resolveUnitAttack(state,{attackerId:attacker.id,targetId:target.id,weapon,actualDamage:2});
 assert.equal(next.units[1].wounds,before-2);
 assert.equal(getLiveUnitVitals(next,next.units[1]).wounds,before-2);
 assert.ok(next.history.at(-1).payload.expectedDamage>0);
 assert.equal(next.history.at(-1).payload.actualDamage,2);
 const snapshot=next.history.at(-1).payload.reviewSnapshot;
 assert.equal(snapshot.version,1);assert.equal(snapshot.targetWounds,before);
 assert.equal(snapshot.expectedDamage,next.history.at(-1).payload.expectedDamage);
 assert.ok(snapshot.destructionProbability>=0 && snapshot.destructionProbability<=1);
 assert.ok(Array.isArray(snapshot.context.appliedRules));
});

test('explicit imported loadout hides unselected optional weapons and can confirm no ranged weapon',()=>{
 let state=createGameState({phase:'setup',battle:{id:'loadout',status:'setup',round:0},players:[{id:'p1'},{id:'p2'}]});
 const roster=createArmyRoster({id:'r',name:'Melee Tyrant',faction:'Tyranids',units:[{
  id:'ht',name:'Hive Tyrant',modelCount:1,datasheetId:'tyranids:hive-tyrant',
  equippedWargear:[
   {name:'Monstrous bonesword and lash whip',quantity:1},
   {name:'Monstrous scything talons',quantity:1}
  ],
  equippedWeapons:[
   {name:'Monstrous bonesword and lash whip',quantity:1},
   {name:'Monstrous scything talons',quantity:1}
  ],
  loadoutValidation:{status:'rules-reviewed-valid'}
 }]});
 state=applyArmyRosterToBattle(state,{playerId:'p1',roster});
 const unit=state.units.find(item=>item.ownerId==='p1');
 assert.deepEqual(getDatasheetWeaponOptions(state,unit,{type:'ranged'}),[]);
 assert.deepEqual(getDatasheetWeaponOptions(state,unit,{type:'melee'}).map(item=>item.name),[
  'Monstrous bonesword and lash whip','Monstrous scything talons'
 ]);
 assert.equal(hasConfirmedNoRangedWeapons(state,unit),true);
});

test('explicit equipped quantity scales unit-level attacks for Tactical Advisor forecasts',()=>{
 const state={
  armyRosters:{p1:{units:[{id:'r1',equippedWeapons:[{name:'Volley gun',quantity:3}],datasheet:{weapons:[{
   name:'Volley gun',range:'18"',attacks:'D6+1',skill:'3+',strength:6,ap:-1,damage:1
  }]}}]}},
  units:[{id:'u1',ownerId:'p1',metadata:{rosterUnitId:'r1'}}]
 };
 const [weapon]=getDatasheetWeaponOptions(state,state.units[0],{type:'ranged'});
 assert.equal(weapon.equippedQuantity,3);
 assert.equal(weapon.characteristics.attacks,'3D6+3');
});

test('reviewed manual roster without explicit loadout is rejected before battle assignment',()=>{
 const state=createGameState({phase:'setup',battle:{id:'legacy-loadout',status:'setup',round:0},players:[{id:'p1'},{id:'p2'}]});
 const roster=createArmyRoster({id:'legacy',name:'Legacy Tyrant',faction:'Tyranids',units:[{
  id:'hive-tyrant',name:'Hive Tyrant',modelCount:1,datasheetId:'tyranids:hive-tyrant'
 }]});
 assert.throws(
  ()=>applyArmyRosterToBattle(state,{playerId:'p1',roster}),
  /Resolve required combat loadouts.*Hive Tyrant/i
 );
});

test('source-invalid imported wargear is rejected before battle assignment',()=>{
 const state=createGameState({phase:'setup',battle:{id:'b2',status:'setup',round:0},players:[{id:'p1'}]});
 const roster=createArmyRoster({id:'invalid',name:'Invalid import',faction:'Tyranids',units:[{
  id:'termagants',name:'Termagants',modelCount:10,datasheetId:'tyranids:termagants',
  equippedWargear:[{name:'Chitinous claws and teeth',quantity:10},{name:'Fleshborer',quantity:7},{name:'Spike rifle',quantity:1}],
  equippedWeapons:[{name:'Fleshborer',quantity:7},{name:'Spike rifle',quantity:1}],
  loadoutValidation:{status:'source-invalid',source:'warhammer-app-export',errors:['Invalid wargear configuration for Termagants']}
 }]});
 assert.throws(
  ()=>applyArmyRosterToBattle(state,{playerId:'p1',roster}),
  /Invalid wargear configuration for Termagants/i
 );
});

test('rules-invalid reviewed wargear is rejected before battle assignment',()=>{
 const state=createGameState({phase:'setup',battle:{id:'b3',status:'setup',round:0},players:[{id:'p1'}]});
 const roster=createArmyRoster({id:'rules-invalid',name:'Invalid reviewed loadout',faction:'Tyranids',units:[{
  id:'ht',name:'Hive Tyrant',modelCount:1,datasheetId:'tyranids:hive-tyrant',
  equippedWargear:[{name:'Heavy venom cannon',quantity:1},{name:'Stranglethorn cannon',quantity:1}],
  equippedWeapons:[{name:'Heavy venom cannon',quantity:1},{name:'Stranglethorn cannon',quantity:1}],
  loadoutValidation:{status:'rules-invalid',reviewedRules:true,errors:['Heavy venom cannon and Stranglethorn cannon cannot be equipped together.']}
 }]});
 assert.throws(
  ()=>applyArmyRosterToBattle(state,{playerId:'p1',roster}),
  /Heavy venom cannon and Stranglethorn cannon cannot be equipped together/i
 );
});


test('battle snapshots preserve roster unit enhancements and notes',()=>{
 const state=applyArmyRosterToBattle(createGameState({phase:'setup',battle:{id:'notes-battle',status:'setup',round:0},players:[{id:'p1'}]}),{
  playerId:'p1',
  roster:createArmyRoster({id:'notes-roster',name:'Notes roster',faction:'Tyranids',units:[{
   id:'unit-1',name:'Annotated unit',modelCount:1,datasheetId:'tyranids:neurotyrant',
   notes:'Enhancement: Synaptic control. Keep near the objective.'
  }]})
 });
 assert.equal(state.units[0].metadata.notes,'Enhancement: Synaptic control. Keep near the objective.');
 assert.equal(state.armyRosters.p1.units[0].notes,'Enhancement: Synaptic control. Keep near the objective.');
});
