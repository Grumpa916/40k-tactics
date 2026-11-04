import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {createWargearChoiceState,getWargearSlots,readWargearChoiceState} from '../../src/rules/army-wargear-choices.js';
import {buildManualWargearLoadout,validateWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {importWarhammerAppRoster} from '../../src/state/warhammer-app-roster-import.js';

const cases=[
  {name:'Gladiator Lancer',id:'space-marines:gladiator-lancer',points:[160,180],
    weapons:[['Defensive Array',1],['Laser Destroyer',1],['Armoured Hull',1]]},
  {name:'Gladiator Reaper',id:'space-marines:gladiator-reaper',points:[165,185],
    weapons:[['Defensive Array',1],['Twin Heavy Onslaught Gatling Cannon',1],['Armoured Hull',1]]},
  {name:'Gladiator Valiant',id:'space-marines:gladiator-valiant',points:[165,185],
    weapons:[['Defensive Array',1],['Multi-melta',2],['Twin Las-talon',1],['Armoured Hull',1]]}
];
const get=(name,id=name)=>{
 const u=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name);
 assert.ok(u,'Missing '+name);
 return {...u,id,datasheetId:u.id,modelCount:1};
};
const qty=(xs,name)=>xs.find(x=>x.name===name)?.quantity??0;

test('All 11e Gladiators have exactly the new fixed equipment, no selectable slots or obsolete optionals',()=>{
 for(const {name,id,weapons} of cases){
  const u=get(name);
  const rules=getTyranidWargearRuleSet(id);
  assert.ok(rules,name);
  assert.equal(rules.reviewedAt,'2026-11-04');
  assert.deepEqual(getBuilderModelCounts(u),[1]);
  assert.equal(getWargearSlots(u).length,0);
  assert.equal(rules.slots?.length??0,0);
  assert.equal(rules.optional?.length??0,0);
  const equippedWargear=readWargearChoiceState(u,createWargearChoiceState(u));
  assert.deepEqual(equippedWargear.map(x=>[x.name,x.quantity]),weapons);
  assert.equal(validateWargearLoadout({...u,equippedWargear}).status,'rules-reviewed-valid');
  const built=buildManualWargearLoadout(u,equippedWargear);
  assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(assessUnitLoadoutReadiness({...u,...built}).status,'complete');
  assert.equal(u.datasheet.characteristics.Move,'10"');
  assert.equal(u.datasheet.characteristics.Toughness,'10');
  assert.equal(u.datasheet.characteristics.Save,'3+');
  assert.equal(u.datasheet.characteristics.Wounds,'12');
  assert.equal(u.datasheet.characteristics['Objective Control'],'3');
  assert.match(renderWargearEditor(u),/Reviewed 11th-edition loadout subset/);
  assert.match(renderWargearEditor(u),/Damaged 4 and Deadly Demise D3 remain manual|Damaged 4 and Deadly Demise D3 manually/);
  for(const option of ['Icarus Rocket Pod','Ironhail Heavy Stubber','Storm Bolter','Fragstorm Grenade Launcher']){
   const check=validateWargearLoadout({...u,equippedWargear:[...equippedWargear,{name:option,quantity:1}]});
   assert.equal(check.status,'rules-invalid',name+' must reject stale '+option);
  }
 }
});

test('Lancer anti-armour re-rolls are conditional; Reaper and Valiant weapons retain 11e profiles',()=>{
 const lancer=get('Gladiator Lancer'),reaper=get('Gladiator Reaper'),valiant=get('Gladiator Valiant');
 const l=lancer.datasheet.weapons;
 assert.deepEqual(l.map(w=>w.name),['Defensive Array','Laser Destroyer','Armoured Hull']);
 assert.equal(l.find(w=>w.name==='Laser Destroyer').damage,'D6+3');
 assert.equal(l.find(w=>w.name==='Laser Destroyer').ap,'-3');
 assert.equal(l.find(w=>w.name==='Laser Destroyer').range,'72"');
 assert.match(lancer.datasheet.abilities.find(a=>a.name==='Aquilon Optics').description,/MONSTER or VEHICLE/);
 assert.match(lancer.datasheet.abilities.find(a=>a.name==='Aquilon Optics').description,/one hit roll, one wound roll and one damage roll/);
 const r=reaper.datasheet.weapons;
 assert.equal(r.find(w=>w.name==='Defensive Array').attacks,'12');
 assert.equal(r.find(w=>w.name==='Defensive Array').abilities,'Rapid Fire 12');
 const gatling=r.find(w=>w.name==='Twin Heavy Onslaught Gatling Cannon');
 assert.equal(gatling.attacks,'12');
 assert.match(gatling.abilities,/Sustained Hits 2: non-MONSTER\/VEHICLE/);
 assert.match(gatling.abilities,/Devastating Wounds: non-MONSTER\/VEHICLE/);
 assert.match(reaper.datasheet.abilities.find(a=>a.name==='Reaping Tally').description,/\+1 AP/);
 const v=valiant.datasheet.weapons;
 assert.equal(v.find(w=>w.name==='Multi-melta').damage,'D3+2');
 assert.equal(v.find(w=>w.name==='Multi-melta').abilities,'Melta 3');
 assert.equal(v.find(w=>w.name==='Twin Las-talon').damage,'D3+3');
 assert.equal(v.find(w=>w.name==='Twin Las-talon').abilities,'Twin-linked');
 assert.match(valiant.datasheet.abilities.find(a=>a.name==='Priority Target Acquisition').description,/within 12 inches.*\+1 Strength/);
 assert.equal(qty(readWargearChoiceState(valiant,createWargearChoiceState(valiant)),'Multi-melta'),2);
});

test('Gladiator first/second/third 11e prices are copied exactly without optional weapon surcharge',()=>{
 for(const {name,points} of cases){
  const units=['g1','g2','g3'].map(id=>get(name,id)),roster={units};
  assert.deepEqual(units.map(unit=>resolveBuilderUnitCost(unit,roster).points),[points[0],points[0],points[1]]);
 }
});

test('Warhammer App text import can auto-fill only the source-reviewed fixed Gladiator wargear',()=>{
 const text='Space Marines\nOTHER DATASHEETS\nGladiator Lancer (160 pts)\nGladiator Reaper (165 pts)\nGladiator Valiant (165 pts)';
 const parsed=importWarhammerAppRoster({text,faction:'Space Marines',name:'Gladiator audit',id:'gladiator-audit',pointsLimit:2000});
 assert.equal(parsed.unrecognized.length,0);
 assert.equal(parsed.roster.units.length,3);
 for(const entry of parsed.roster.units){
  const testCase=cases.find(x=>x.id===entry.datasheetId);
  assert.ok(testCase);
  assert.equal(entry.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(entry.loadoutValidation.source,'reviewed-fixed-equipment-import');
  assert.deepEqual(entry.equippedWargear.map(x=>[x.name,x.quantity]),testCase.weapons);
  assert.equal(assessUnitLoadoutReadiness(entry).status,'complete');
 }
});
