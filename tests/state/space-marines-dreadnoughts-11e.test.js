import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState,chooseWargear} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {importWarhammerAppRoster} from '../../src/state/warhammer-app-roster-import.js';

const find=(name,id=name)=>{
 const u=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name);
 assert.ok(u,'Missing catalog '+name);
 return {...u,id,datasheetId:u.id,modelCount:1};
};
const qty=(xs,name)=>xs.find(x=>x.name===name)?.quantity??0;
function complete(u,st){
 const equippedWargear=readWargearChoiceState(u,st);
 const valid=validateWargearLoadout({...u,equippedWargear});
 assert.equal(valid.status,'rules-reviewed-valid',valid.errors.join('; '));
 const loadout=buildManualWargearLoadout(u,equippedWargear);
 assert.equal(loadout.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...u,...loadout}).status,'complete');
 return {...loadout,equippedWargear};
}
test('Ballistus: precisely four fixed weapons, launcher frag/krak as alternatives, and safe fixed-only import',()=>{
 const u=find('Ballistus Dreadnought');
 assert.deepEqual(getBuilderModelCounts(u),[1]);
 assert.equal(getWargearSlots(u).length,0);
 const selected=complete(u,createWargearChoiceState(u));
 assert.deepEqual(selected.equippedWargear.map(x=>[x.name,x.quantity]),[
  ['Ballistus Lascannon',1],['Ballistus Missile Launcher',1],['Storm Bolters',1],['Armoured Feet',1]
 ]);
 assert.equal(qty(selected.equippedWeapons,'Ballistus Missile Launcher - Frag'),1);
 assert.equal(qty(selected.equippedWeapons,'Ballistus Missile Launcher - Krak'),1);
 assert.equal(u.datasheet.characteristics.Wounds,'12');
 assert.equal(u.datasheet.characteristics['Objective Control'],'4');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Ballistus Lascannon').damage,'D3+3');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Ballistus Missile Launcher - Frag').attacks,'D6+6');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Ballistus Strike').description,/within 24/);
 assert.match(renderWargearEditor(u),/Frag and Krak are alternative profiles/);
 const imported=importWarhammerAppRoster({
  text:'Space Marines\nOTHER DATASHEETS\nBallistus Dreadnought (150 pts)',
  faction:'Space Marines',name:'ballistus roster',id:'ballistus-roster',pointsLimit:2000
 });
 assert.equal(imported.unrecognized.length,0);
 assert.equal(imported.roster.units.length,1);
 assert.equal(imported.roster.units[0].loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(imported.roster.units[0].loadoutValidation.source,'reviewed-fixed-equipment-import');
 assert.equal(qty(imported.roster.units[0].equippedWargear,'Ballistus Lascannon'),1);
});
test('Brutalis: Talons replace both Fists and Bolt Rifles; heavy bolter/multi-melta is a separate swap',()=>{
 const u=find('Brutalis Dreadnought'),st=createWargearChoiceState(u);
 assert.deepEqual(getBuilderModelCounts(u),[1]);
 assert.equal(getWargearSlots(u).length,2);
 const base=complete(u,st);
 assert.equal(qty(base.equippedWargear,'Bolt Rifles and Brutalis Fists'),1);
 assert.equal(qty(base.equippedWeapons,'Bolt Rifles'),1);
 assert.equal(qty(base.equippedWeapons,'Brutalis Fists'),1);
 assert.equal(qty(base.equippedWeapons,'Brutalis Talons'),0);
 assert.equal(qty(base.equippedWargear,'Twin Icarus Ironhail Heavy Stubber'),1);
 const talons=chooseWargear(u,st,'brutalis-primary-loadout:0','Brutalis Talons');
 const melta=chooseWargear(u,talons,'brutalis-ranged:0','Twin Multi-melta');
 const updated=complete(u,melta);
 assert.equal(qty(updated.equippedWeapons,'Brutalis Talons'),1);
 assert.equal(qty(updated.equippedWeapons,'Brutalis Fists'),0);
 assert.equal(qty(updated.equippedWeapons,'Bolt Rifles'),0);
 assert.equal(qty(updated.equippedWeapons,'Twin Multi-melta'),1);
 assert.equal(qty(updated.equippedWeapons,'Twin Heavy Bolter'),0);
 assert.equal(u.datasheet.characteristics.Move,'10"');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Brutalis Talons').attacks,'8');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Brutalis Fists').damage,'D3+3');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Twin Multi-melta').damage,'D3+2');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Brutalis Charge').description,/Crushing Impact/);
 assert.doesNotMatch(u.datasheet.abilities.find(a=>a.name==='Brutalis Charge').description,/mortal wounds/);
 const invalid=validateWargearLoadout({...u,equippedWargear:[
  ...updated.equippedWargear,{name:'Bolt Rifles and Brutalis Fists',quantity:1}
 ]});
 assert.equal(invalid.status,'rules-invalid','cannot retain fists and bolt rifles after Talons upgrade');
 assert.match(renderWargearEditor(u),/replaces BOTH/);
});
test('Redemptor: 3 independent weapon swaps, Icarus is additive, plasma is one gun with two modes',()=>{
 const u=find('Redemptor Dreadnought'),st=createWargearChoiceState(u);
 assert.deepEqual(getBuilderModelCounts(u),[1]);
 assert.equal(getWargearSlots(u).length,3);
 const base=complete(u,st);
 assert.equal(qty(base.equippedWargear,'Redemptor Fist'),1);
 assert.equal(qty(base.equippedWargear,'Fragstorm Grenade Launchers'),1);
 assert.equal(qty(base.equippedWargear,'Heavy Flamer'),1);
 assert.equal(qty(base.equippedWargear,'Heavy Onslaught Gatling Cannon'),1);
 assert.equal(qty(base.equippedWargear,'Icarus Rocket Pod'),0);
 let next=chooseWargear(u,st,'redemptor-launchers:0','Storm Bolters');
 next=chooseWargear(u,next,'redemptor-secondary-gun:0','Onslaught Gatling Cannon');
 next=chooseWargear(u,next,'redemptor-main-gun:0','Macro Plasma Incinerator');
 next={...next,optional:{...next.optional,'Icarus Rocket Pod':1}};
 const upgraded=complete(u,next);
 assert.equal(qty(upgraded.equippedWargear,'Storm Bolters'),1);
 assert.equal(qty(upgraded.equippedWargear,'Onslaught Gatling Cannon'),1);
 assert.equal(qty(upgraded.equippedWargear,'Macro Plasma Incinerator'),1);
 assert.equal(qty(upgraded.equippedWargear,'Icarus Rocket Pod'),1);
 assert.equal(qty(upgraded.equippedWeapons,'Macro Plasma Incinerator - Standard'),1);
 assert.equal(qty(upgraded.equippedWeapons,'Macro Plasma Incinerator - Supercharge'),1);
 assert.equal(qty(upgraded.equippedWeapons,'Heavy Onslaught Gatling Cannon'),0);
 const invalid=validateWargearLoadout({...u,equippedWargear:[
  ...upgraded.equippedWargear,{name:'Icarus Rocket Pod',quantity:1}
 ]});
 assert.equal(invalid.status,'rules-invalid','only one Icarus Rocket Pod can be added');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Redemptor Fist').damage,'D3+3');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Macro Plasma Incinerator - Supercharge').strength,'10');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Duty Eternal').description,/GREATER than/);
 assert.match(u.datasheet.abilities.find(a=>a.name==='Duty Eternal').description,/not universal -1 Damage/);
 assert.match(renderWargearEditor(u),/adds 10 points/);
});
test('First-two/third Dreadnought pricing remains copy-sensitive and Redemptor plasma upgrades cost 10 points',()=>{
 for(const [name,base,third] of [
  ['Ballistus Dreadnought',150,170],
  ['Brutalis Dreadnought',160,180],
  ['Redemptor Dreadnought',170,190]
 ]){
  const a=find(name,'a'),b=find(name,'b'),c=find(name,'c'),roster={units:[a,b,c]};
  assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,roster).points),[base,base,third]);
  if(name==='Redemptor Dreadnought'){
   const plasma=[{name:'Macro Plasma Incinerator',quantity:1}];
   assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,roster,plasma).points),[180,180,200]);
   assert.equal(resolveBuilderUnitCost(c,roster,[{name:'Macro Plasma Incinerator',quantity:2}]).points,null);
  }
 }
 assert.equal(getTyranidWargearRuleSet('space-marines:lieutenant-in-phobos-armour'),null,
  'Unreviewed walkers must remain separate pending another scoped audit');
});
