import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { createArmyRoster } from '../../src/state/army-roster-library.js';
import { summarizeRosterPoints } from '../../src/state/army-roster-points-summary.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { createGameState } from '../../src/state/game-state.js';
import { applyArmyRosterToBattle } from '../../src/engine/army-roster-transitions.js';
import { hydrateReviewedFixedCustodesLoadout } from '../../src/rules/custodes-fixed-wargear.js';
import { buildManualWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import {
 MORITOI_UPGRADES, setMoritoiUpgrade, validateRosterUnitUpgrades,
 hydrateLegacyCustodesUpgrades,getUnitUpgradeNames,isEligibleMoritoiDreadnought
} from '../../src/rules/custodes-unit-upgrades.js';
import { validateArmyRoster } from '../../src/rules/army-roster-validation.js';
import { assessSavedUnitCost } from '../../src/rules/roster-rules-data-validation.js';
import { getDatasheetWeaponOptions, getProbabilisticUnitProfile, getEquippedWeaponReferences } from '../../src/rules/saved-roster-combat-profile.js';
import { getExpectedDamage } from '../../src/rules/expected-damage.js';
import { renderRosterRows } from '../../src/ui/army-roster-rows.js';
import { renderUnitUpgradeEditor } from '../../src/ui/army-unit-upgrade-editor.js';
import { createArmyUnitEditorController } from '../../src/ui/army-unit-editor-controller.js';

const candidate=id=>findArmyUnitCandidates({faction:'Adeptus Custodes'})
  .find(item=>item.id==='adeptus-custodes:'+id);
const make=(id,key=id,points=null)=>{
 const c=candidate(key);
 assert.ok(c,key);
 const raw={
   id,name:c.name,datasheetId:c.id,datasheet:structuredClone(c.datasheet),
   pointsOptions:c.pointsOptions,modelCount:1,points:points??c.defaultPoints
 };
 if(key==='telemon-heavy-dreadnought'){
   const selections=[
     {name:'Spiculus Bolt Launcher',quantity:1},
     {name:'Caestus Fist',quantity:1},
     {name:'Twin Neutronium Cascade Projectors',quantity:1},
     {name:'Adrathic Desolator',quantity:1}
   ];
   return {...raw,...buildManualWargearLoadout(raw,selections)};
 }
 return hydrateReviewedFixedCustodesLoadout(raw);
};
const roster=(units=[make('galatus','contemptor-galatus-dreadnought'),make('telemon','telemon-heavy-dreadnought')],detachments=['Might of the Moritoi'])=>
 createArmyRoster({id:'upgrades',name:'Upgrade roster',faction:'Adeptus Custodes',
 pointsLimit:2000,detachments,units});
const battle=(army)=>{
 const state=createGameState({phase:'setup',battle:{id:'b',status:'setup',round:0},players:[{id:'p1'},{id:'p2'}]});
 return applyArmyRosterToBattle(state,{roster:army,playerId:'p1',snapshotId:'upgrade-record'});
};
test('current Moritoi Upgrade definitions are 30 pts, one each per army',()=>{
 assert.deepEqual(MORITOI_UPGRADES.map(x=>x.name).sort(),['Augury Uplink','Memento Moritoi']);
 assert.ok(MORITOI_UPGRADES.every(x=>x.points===30&&x.maxPerArmy===1));
 assert.equal(isEligibleMoritoiDreadnought(make('galatus','contemptor-galatus-dreadnought')),true);
 assert.equal(isEligibleMoritoiDreadnought(make('telemon','telemon-heavy-dreadnought')),true);
 assert.equal(isEligibleMoritoiDreadnought(make('trajann','trajann-valoris')),false);
});
test('assigning Memento and Augury is per-unit, costs 30 each, and never changes weapon selection',()=>{
 const base=roster(),original=JSON.stringify(base);
 let next=setMoritoiUpgrade(base,'galatus','Memento Moritoi');
 assert.equal(JSON.stringify(base),original);
 assert.deepEqual(getUnitUpgradeNames(next.units[0]),['Memento Moritoi']);
 assert.equal(next.units[0].basePoints,220);
 assert.equal(next.units[0].points,250);
 assert.equal(summarizeRosterPoints(next).totalPoints,summarizeRosterPoints(base).totalPoints+30);
 const before=next.units[0].equippedWeapons;
 next=setMoritoiUpgrade(next,'telemon','Augury Uplink');
 assert.equal(next.units[1].basePoints,280);
 assert.equal(next.units[1].points,310);
 assert.deepEqual(next.units[0].equippedWeapons,before);
 assert.deepEqual(validateRosterUnitUpgrades(next),[]);
 assert.equal(summarizeRosterPoints(next).totalPoints,summarizeRosterPoints(base).totalPoints+60);
 const again=setMoritoiUpgrade(next,'telemon','Augury Uplink');
 assert.equal(again.units[1].points,310,'re-select never double-charges');
 next=setMoritoiUpgrade(next,'galatus','');
 assert.equal(next.units[0].points,220);
 assert.equal(next.units[1].points,310);
});
test('one named Upgrade per army, one enhancement per unit and detachment+Dreadnought restrictions',()=>{
 let base=roster([make('a','contemptor-galatus-dreadnought'),
 make('b','contemptor-galatus-dreadnought')]);
 const assigned=setMoritoiUpgrade(base,'a','Augury Uplink');
 assert.throws(()=>setMoritoiUpgrade(assigned,'b','Augury Uplink'),/once per army/);
 assert.throws(()=>setMoritoiUpgrade(roster(), 'galatus','unknown'),/Unknown/);
 const missingDetachment=roster([make('a','contemptor-galatus-dreadnought')],['Emperor’s Chosen']);
 assert.throws(()=>setMoritoiUpgrade(missingDetachment,'a','Memento Moritoi'),/requires the Might of the Moritoi/);
 const infantry=roster([make('t','trajann-valoris')]);
 assert.throws(()=>setMoritoiUpgrade(infantry,'t','Memento Moritoi'),/requires an Adeptus Custodes Dreadnought/);
 const doubled=roster([{...assigned.units[0],unitUpgrades:[
  {name:'Augury Uplink',id:'augury-uplink',points:30},
  {name:'Memento Moritoi',id:'memento-moritoi',points:30}
 ]}]);
 assert.ok(validateRosterUnitUpgrades(doubled).some(x=>/only one enhancement/.test(x)));
});
test('a pre-priced 250 point Galatus recognizes a unique 220+30 review and does not become 280',()=>{
 const g=make('g','contemptor-galatus-dreadnought',250);
 const next=setMoritoiUpgrade(roster([g]),'g','Memento Moritoi');
 assert.equal(next.units[0].basePoints,220);
 assert.equal(next.units[0].points,250);
 assert.equal(assessSavedUnitCost(candidate('contemptor-galatus-dreadnought'),
   next.units[0],next).status,'matched');
});
test('Army Builder presents only eligible, detachment-legal Upgrades in a thumb-sized selector',()=>{
 const g=make('g','contemptor-galatus-dreadnought');
 const r=roster([g]);
 const html=renderUnitUpgradeEditor(g,r);
 assert.match(html,/data-unit-upgrade="g"/);
 assert.match(html,/Memento Moritoi/);
 assert.match(html,/Augury Uplink/);
 assert.match(html,/min-height:44px/);
 assert.doesNotMatch(renderUnitUpgradeEditor(make('t','trajann-valoris'),r),/data-unit-upgrade/);
 const taken=setMoritoiUpgrade(roster([g,make('h','contemptor-galatus-dreadnought')]),'g','Augury Uplink');
 assert.match(renderUnitUpgradeEditor(taken.units[1],taken),/Augury Uplink · \+30 pts · assigned elsewhere/);
 assert.match(renderUnitUpgradeEditor(g,roster([g],['Lions of the Emperor'])),/Select Might of the Moritoi/);
 assert.match(renderRosterRows(taken.units,'','Adeptus Custodes'),/Augury Uplink/);
});
test('battle snapshots retain exact Upgrades and Memento modifies only melee A/S/D',()=>{
 const base=roster();
 let enhanced=setMoritoiUpgrade(base,'galatus','Memento Moritoi');
 enhanced=setMoritoiUpgrade(enhanced,'telemon','Augury Uplink');
 const state=battle(enhanced);
 const old=battle(base);
 assert.deepEqual(getUnitUpgradeNames(state.armyRosters.p1.units[0]),['Memento Moritoi']);
 assert.deepEqual(getUnitUpgradeNames(state.armyRosters.p1.units[1]),['Augury Uplink']);
 const unit=state.units.find(x=>x.metadata?.rosterUnitId==='galatus');
 const baselineUnit=old.units.find(x=>x.metadata?.rosterUnitId==='galatus');
 const melee=getDatasheetWeaponOptions(state,unit,{type:'melee'})[0];
 const plain=getDatasheetWeaponOptions(old,baselineUnit,{type:'melee'})[0];
 assert.equal(melee.characteristics.attacks,plain.characteristics.attacks+1);
 assert.equal(Number(melee.characteristics.strength),Number(plain.characteristics.strength)+1);
 assert.equal(Number(melee.characteristics.damage),Number(plain.characteristics.damage)+1);
 const referenced=getEquippedWeaponReferences(state,unit).find(item=>item.weapon.name==='Warblade');
 assert.ok(referenced);
 assert.equal(referenced.weapon.attacks,Number(plain.characteristics.attacks)+1);
 assert.equal(Number(referenced.weapon.strength),Number(plain.characteristics.strength)+1);
 assert.equal(Number(referenced.weapon.damage),Number(plain.characteristics.damage)+1);
 const ranged=getDatasheetWeaponOptions(state,unit,{type:'ranged'})[0];
 const plainRanged=getDatasheetWeaponOptions(old,baselineUnit,{type:'ranged'})[0];
 assert.deepEqual(ranged.characteristics,plainRanged.characteristics);
 const custodianProfile=getProbabilisticUnitProfile(state,unit);
 const tyrant={characteristics:{toughness:11,save:3},keywords:['Vehicle']};
 assert.ok(getExpectedDamage({attacker:custodianProfile,target:tyrant,weapon:melee}).expectedDamage >
   getExpectedDamage({attacker:getProbabilisticUnitProfile(old,baselineUnit),target:tyrant,weapon:plain}).expectedDamage);
 const upgradedTelemon=state.units.find(x=>x.metadata?.rosterUnitId==='telemon');
 const baselineTelemon=old.units.find(x=>x.metadata?.rosterUnitId==='telemon');
 assert.equal(getProbabilisticUnitProfile(state,upgradedTelemon).characteristics.damagePrevention,5);
 assert.notEqual(getProbabilisticUnitProfile(old,baselineTelemon).characteristics.damagePrevention,5);
});
test('Warhammer App explicitly listed Upgrades are saved as structured records, never unmatched weapons',()=>{
 const text='Adeptus Custodes\nMight of the Moritoi (1 Detachment Points)\n' +
  'OTHER DATASHEETS\nContemptor-Galatus Dreadnought (250 Points)\n' +
  '  • 1x Warblade\n  • 1x Memento Moritoi';
 const imported=importWarhammerAppRoster({text,faction:'Adeptus Custodes',id:'imp',name:'Import'});
 const unit=imported.roster.units[0];
 assert.deepEqual(getUnitUpgradeNames(unit),['Memento Moritoi']);
 assert.equal(unit.basePoints,220);
 assert.equal(unit.points,250);
 assert.deepEqual(unit.unmatchedWargear??[],[]);
 assert.equal(validateRosterUnitUpgrades(imported.roster).length,0);
});
test('legacy saved export converts clearly named, priced Upgrade and retains history',()=>{
 const old=roster([{
   ...make('g','contemptor-galatus-dreadnought',250),
   notes:'Contemptor-Galatus Dreadnought (250 Points)\n  • 1x Memento Moritoi',
   unmatchedWargear:[{sourceName:'Memento Moritoi',quantity:1}],
   loadoutValidation:{status:'unverified',errors:['Unknown Memento']}
 }]);
 const before=JSON.stringify(old);
 const updated=hydrateLegacyCustodesUpgrades(old);
 assert.equal(JSON.stringify(old),before);
 assert.deepEqual(getUnitUpgradeNames(updated.units[0]),['Memento Moritoi']);
 assert.equal(updated.units[0].basePoints,220);
 assert.equal(updated.units[0].unmatchedWargear,undefined);
 const b=battle(old);
 assert.deepEqual(getUnitUpgradeNames(b.armyRosters.p1.units[0]),['Memento Moritoi']);
});

test('Augury changes actual expected incoming damage and probability-based wound loss, not only its displayed characteristic',()=>{
 const baseline=roster();
 const enhanced=setMoritoiUpgrade(baseline,'telemon','Augury Uplink');
 const oldState=battle(baseline), enhancedState=battle(enhanced);
 const lookup=(state)=>state.units.find(unit=>unit.metadata?.rosterUnitId==='telemon');
 const oldTarget=getProbabilisticUnitProfile(oldState,lookup(oldState));
 const upgradedTarget=getProbabilisticUnitProfile(enhancedState,lookup(enhancedState));
 const attacker={characteristics:{ballisticSkill:3}};
 const weapon={name:'Regression test weapon',type:'ranged',characteristics:{
  attacks:4,skill:3,strength:12,ap:-2,damage:3
 }};
 const normal=getExpectedDamage({attacker,target:oldTarget,weapon});
 const protectedResult=getExpectedDamage({attacker,target:upgradedTarget,weapon});
 assert.ok(normal.expectedDamage>0);
 assert.ok(protectedResult.expectedDamage>0);
 assert.ok(protectedResult.expectedDamage<normal.expectedDamage);
 assert.ok(Math.abs(protectedResult.expectedDamage/normal.expectedDamage-2/3)<1e-10,
  '5+ Feel No Pain should prevent one third of otherwise suffered damage');
 assert.equal(protectedResult.contextualAbilities.damagePrevention,5);
 const switched=setMoritoiUpgrade(enhanced,'telemon','Memento Moritoi');
 assert.equal(switched.units[1].points,310,'swapping 30-point upgrades must not double charge');
 assert.equal(switched.units[1].basePoints,280);
 assert.deepEqual(getUnitUpgradeNames(switched.units[1]),['Memento Moritoi']);
 const removed=setMoritoiUpgrade(switched,'telemon','');
 assert.equal(removed.units[1].points,280);
 assert.deepEqual(getUnitUpgradeNames(removed.units[1]),[]);
});
