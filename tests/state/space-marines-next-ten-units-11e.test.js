import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState,chooseWargear,chooseWargearBaseline} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
const names=['Drop Pod','Impulsor','Rhino','Land Speeder','Storm Speeder Hailstrike','Storm Speeder Hammerstrike','Storm Speeder Thunderstrike','Astraeus','Thunderhawk Gunship','Techmarine'];
const get=(name,id=name)=>{const x=findArmyUnitCandidates({faction:'Space Marines'}).find(c=>c.name===name);assert.ok(x,'missing catalog: '+name);return {...x,id,datasheetId:x.id,modelCount:1};};
const qty=(xs,name)=>xs.find(x=>x.name===name)?.quantity??0;
function complete(u,state){
 const selections=readWargearChoiceState(u,state);
 const valid=validateWargearLoadout({...u,equippedWargear:selections});
 assert.equal(valid.status,'rules-reviewed-valid',valid.errors?.join('; '));
 const built=buildManualWargearLoadout(u,selections);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...u,...built}).status,'complete');
 return {...built,selections};
}
test('Ten reviewed current 11e unit entries exist, retain source-scoped verification and exactly one model each',()=>{
 assert.equal(names.length,10);
 for(const name of names){const u=get(name),r=getTyranidWargearRuleSet(u.datasheetId);
  assert.ok(r,'unreviewed '+name);assert.equal(r.reviewedAt,'2026-11-04');
  assert.equal(r.sourceUrl.startsWith('https://'),true);assert.deepEqual(getBuilderModelCounts(u),[1]);
  assert.equal(r.sourceName.includes('direct official'),false);
  assert.match(renderWargearEditor(u),/Reviewed 11th-edition loadout subset/);
 }
});
test('11e Drop Pod is truly weaponless and can enter play without a fictitious weapon selection',()=>{
 const u=get('Drop Pod'),rules=getTyranidWargearRuleSet(u.datasheetId);
 assert.equal(rules.noEquipment,true);
 assert.deepEqual(readWargearChoiceState(u,createWargearChoiceState(u)),[]);
 assert.deepEqual(u.datasheet.weapons,[]);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[]}).status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...u,equippedWargear:[]}).status,'complete');
 assert.equal(assessUnitLoadoutReadiness({...u,equippedWargear:[],loadoutValidation:{status:'source-invalid'}}).status,'invalid');
 assert.equal(u.datasheet.characteristics.Move,'-');
 assert.equal(u.datasheet.characteristics['Objective Control'],'-');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Drop Pod Assault').description,/8 inches/);
 assert.match(u.datasheet.abilities.find(a=>a.name==='Transport Capacity').description,/12 ADEPTUS/);
});
test('Impulsor option roof is at most one of four including non-weapon Comms/Shield; side guns and stubber separate',()=>{
 const u=get('Impulsor'),r=getTyranidWargearRuleSet(u.datasheetId),s=createWargearChoiceState(u);
 assert.equal(getWargearSlots(u).length,1);assert.equal(r.optional.length,5);
 const base=complete(u,s);
 assert.equal(qty(base.selections,'Armoured Hull'),1);assert.equal(qty(base.selections,'Storm Bolters'),1);
 const side=chooseWargear(u,s,'impulsor-side-guns:0','Fragstorm Grenade Launchers');
 const withSide=complete(u,side);assert.equal(qty(withSide.selections,'Fragstorm Grenade Launchers'),1);
 const single={...side,optional:{...side.optional,'Orbital Comms Array':1,'Ironhail Heavy Stubber':1}};
 const picked=complete(u,single);
 assert.equal(qty(picked.equippedWeapons,'Orbital Comms Array'),0,'Scouts upgrade not a shooting weapon');
 assert.equal(qty(picked.equippedWeapons,'Ironhail Heavy Stubber'),1);
 assert.equal(resolveBuilderUnitCost(u,{units:[u]},picked.selections).points,80);
 const illegal={...picked,selections:[...picked.selections,{name:'Shield Dome',quantity:1}]};
 assert.equal(validateWargearLoadout({...u,equippedWargear:illegal.selections}).status,'rules-invalid');
 assert.match(renderWargearEditor(u),/Shield Dome/);
 assert.equal(u.datasheet.characteristics.Wounds,'11');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Transport Capacity').description,/7 ADEPTUS/);
});
test('Rhino has fixed Storm Bolter and optional one-shot missile; 4th copy costs 80',()=>{
 const u=get('Rhino'),s=createWargearChoiceState(u);
 const base=complete(u,s);assert.equal(qty(base.selections,'Storm Bolter'),1);
 const missile={...s,optional:{...s.optional,'Hunter-killer Missile':1}};
 const upgraded=complete(u,missile);
 assert.equal(qty(upgraded.equippedWeapons,'Hunter-killer Missile'),1);
 assert.equal(upgraded.equippedWeapons.find(w=>w.name==='Hunter-killer Missile').quantity,1);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[...upgraded.selections,{name:'Hunter-killer Missile',quantity:1}]}).status,'rules-invalid');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Hunter-killer Missile').abilities,'One Shot');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Veiling Smoke').description,/-1 CP/);
});
test('Land Speeder swaps one main gun; three Storm Speeder variants have distinct fixed profiles',()=>{
 const land=get('Land Speeder'),st=createWargearChoiceState(land);
 assert.equal(getWargearSlots(land).length,1);
 const base=complete(land,st);
 assert.equal(qty(base.selections,'Multi-melta'),1);assert.equal(qty(base.selections,'Onslaught Gatling Cannon'),1);
 const swapped=complete(land,chooseWargear(land,st,'land-speeder-main:0','Pyrecannon'));
 assert.equal(qty(swapped.selections,'Pyrecannon'),1);
 assert.equal(qty(swapped.selections,'Onslaught Gatling Cannon'),0);
 assert.match(land.datasheet.abilities.find(a=>a.name==='Purgation Run').description,/D6 inches/);
 const variants=[
  ['Storm Speeder Hailstrike','Fragstorm Grenade Launchers','Hailstrike',110,120],
  ['Storm Speeder Hammerstrike','Melta Destroyer','Hammerstrike',140,150],
  ['Storm Speeder Thunderstrike','Thunderstrike Las-talon','Shattered Defences',140,150]
 ];
 for(const [name,weapon,ability,first,third] of variants){
  const u=get(name),rule=getTyranidWargearRuleSet(u.datasheetId),loadout=complete(u,createWargearChoiceState(u));
  assert.equal(getWargearSlots(u).length,0);assert.equal(rule.optional?.length??0,0);
  assert.equal(qty(loadout.selections,weapon),1);
  assert.equal(u.datasheet.characteristics.Move,'14"');
  assert.ok(u.datasheet.abilities.find(a=>a.name===ability));
  const peers=[get(name,'s1'),get(name,'s2'),get(name,'s3')];
  assert.deepEqual(peers.map(x=>resolveBuilderUnitCost(x,{units:peers}).points),[first,first,third]);
 }
 assert.equal(get('Storm Speeder Hammerstrike').datasheet.weapons.find(x=>x.name==='Melta Destroyer').attacks,'3');
 assert.match(get('Storm Speeder Thunderstrike').datasheet.abilities.find(x=>x.name==='Shattered Defences').description,/MONSTER\/VEHICLE/);
});
test('Astraeus replaces two Las-rippers with a paired plasma choice, not one mixed weapon',()=>{
 const u=get('Astraeus'),s=createWargearChoiceState(u);
 assert.equal(getWargearSlots(u).length,3);
 const base=complete(u,s);
 assert.equal(qty(base.selections,'Astareus Las-ripper'),2);
 assert.equal(qty(base.selections,'Twin Heavy Bolter'),1);
 const plasma=chooseWargearBaseline(u,s,'astraeus-paired-main','Plasma Eradicator');
 const switched=complete(u,plasma);
 assert.equal(qty(switched.selections,'Plasma Eradicator'),2);
 assert.equal(qty(switched.equippedWeapons,'Plasma Eradicator - Standard'),2);
 assert.equal(qty(switched.equippedWeapons,'Plasma Eradicator - Supercharge'),2);
 assert.equal(qty(switched.selections,'Astareus Las-ripper'),0);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[...switched.selections.filter(x=>x.name!=='Plasma Eradicator'),{name:'Plasma Eradicator',quantity:1},{name:'Astareus Las-ripper',quantity:1}]}).status,'rules-invalid');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Ranged-only 5+ invulnerable').description,/ranged attacks/);
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Twin Macro-accelerator Cannon').attacks,'12');
 const extra={...s,optional:{...s.optional,'Additional Ironhail Heavy Stubber':1}};
 assert.equal(qty(complete(u,extra).equippedWeapons,'Ironhail Heavy Stubber'),2);
});
test('Thunderhawk gunship has 4 twin bolters, two lascannons, one chosen main cannon and manual cluster-bomb replacement',()=>{
 const u=get('Thunderhawk Gunship'),s=createWargearChoiceState(u);
 assert.equal(getWargearSlots(u).length,1);
 const base=complete(u,s);
 assert.equal(qty(base.selections,'Twin Heavy Bolter'),4);
 assert.equal(qty(base.selections,'Lascannon'),2);
 assert.equal(qty(base.selections,'Hellstrike Missile Battery'),1);
 const laser=complete(u,chooseWargear(u,s,'thunderhawk-main:0','Turbo-laser Destructor'));
 assert.equal(qty(laser.selections,'Turbo-laser Destructor'),1);
 assert.equal(qty(laser.selections,'Thunderhawk Heavy Cannon'),0);
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Turbo-laser Destructor').strength,'20');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Aerial Assault').description,/EVERY/);
 assert.match(u.datasheet.abilities.find(a=>a.name==='Transport Capacity').description,/30 ADEPTUS/);
 assert.match(renderWargearEditor(u),/direct GW Forge World confirmation/);
});
test('Techmarine fixed 11e weapons, vehicle healing and conditional lone operative',()=>{
 const u=get('Techmarine'),s=createWargearChoiceState(u);
 const chosen=complete(u,s);
 assert.deepEqual(chosen.selections.map(x=>[x.name,x.quantity]),[['Forge Bolter',1],['Grav-pistol',1],['Omnissian Power Axe and Servo-arm',1]]);
 assert.equal(getWargearSlots(u).length,0);
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Grav-pistol').abilities.includes('Anti-Vehicle 2+'),true);
 assert.match(u.datasheet.abilities.find(a=>a.name==='Blessings of the Omnissiah').description,/D3/);
 assert.match(u.datasheet.abilities.find(a=>a.name==='Techmarine').description,/3 inches/);
});
test('All current 11e copy tiers: first 3/4th transport; 2+ superheavies; optional Impulsor Comms',()=>{
 for(const name of ['Drop Pod','Impulsor','Rhino']){
  const peers=['a','b','c','d'].map(id=>get(name,id));
  const base=name==='Drop Pod'?60:70,high=base+10;
  assert.deepEqual(peers.map(x=>resolveBuilderUnitCost(x,{units:peers}).points),[base,base,base,high]);
 }
 for(const [name,first,second] of [['Astraeus',550,650],['Thunderhawk Gunship',850,950]]){
  const peers=[get(name,'a'),get(name,'b')];
  assert.deepEqual(peers.map(x=>resolveBuilderUnitCost(x,{units:peers}).points),[first,second]);
 }
 assert.equal(resolveBuilderUnitCost(get('Land Speeder'),{units:[get('Land Speeder')]}).points,105);
 assert.equal(resolveBuilderUnitCost(get('Techmarine'),{units:[get('Techmarine')]}).points,55);
});
