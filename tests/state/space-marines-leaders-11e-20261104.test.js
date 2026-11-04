import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { getTyranidWargearRuleSet } from '../../src/data/tyranid-wargear-rules.js';
import { createWargearChoiceState,readWargearChoiceState,getWargearSlots,chooseWargear } from '../../src/rules/army-wargear-choices.js';
import { validateWargearLoadout,buildManualWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { assessUnitLoadoutReadiness } from '../../src/rules/roster-loadout-readiness.js';
import { resolveBuilderUnitCost,getBuilderModelCounts } from '../../src/rules/army-builder-cost.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { renderWargearEditor } from '../../src/ui/army-wargear-editor.js';

const reviewed=[
 ['Captain',90,'6"','5','5'],
 ['Captain in Gravis Armour',90,'5"','6','6'],
 ['Captain in Phobos Armour',75,'8"','4','5'],
 ['Captain in Terminator Armour',90,'5"','6','6'],
 ['Captain on Bike',110,'12"','6','6'],
 ['Captain with Jump Pack',90,'12"','5','5'],
 ['Chaplain',60,'6"','5','4'],
 ['Chaplain in Terminator Armour',75,'5"','6','5'],
 ['Librarian',75,'6"','5','4'],
 ['Librarian in Phobos Armour',75,'8"','4','4']
];
function make(name,id=name){
 const entry=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name);
 assert.ok(entry,'Catalog entry missing: '+name);
 return {...entry,id,datasheetId:entry.id,modelCount:1};
}
const count=(list,name)=>list.find(x=>x.name===name)?.quantity??0;
function check(unit,state){
 const choices=readWargearChoiceState(unit,state);
 const valid=validateWargearLoadout({...unit,equippedWargear:choices});
 assert.equal(valid.status,'rules-reviewed-valid',valid.errors?.join('; '));
 const built=buildManualWargearLoadout(unit,choices);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...unit,...built}).status,'complete');
 return {...built,choices};
}
test('Exactly ten 11e Commander/Psyker units have complete one-model costs, profiles and current source scope',()=>{
 assert.equal(reviewed.length,10);
 for(const [name,points,move,toughness,wounds] of reviewed){
  const u=make(name),rules=getTyranidWargearRuleSet(u.datasheetId);
  assert.ok(rules,name);
  assert.equal(rules.reviewedAt,'2026-11-04');
  assert.match(rules.sourceUrl,/wh40k11ed/);
  assert.ok(rules.manualWargearNotes.length);
  assert.deepEqual(getBuilderModelCounts(u),[1]);
  assert.equal(resolveBuilderUnitCost(u,{units:[u]}).points,points);
  assert.equal(u.datasheet.characteristics.Move,move);
  assert.equal(u.datasheet.characteristics.Toughness,toughness);
  assert.equal(u.datasheet.characteristics.Wounds,wounds);
  assert.equal(u.datasheet.characteristics['Objective Control'],name==='Captain on Bike'?'2':'1');
  check(u,createWargearChoiceState(u));
  assert.match(renderWargearEditor(u),/Reviewed 11th-edition loadout subset/);
 }
 assert.equal(getTyranidWargearRuleSet('space-marines:lieutenant-in-phobos-armour'),null,'Phobos Lieutenant remains in next audit group');
});
test('Standard Captain: all seven complete loadout packages are legal; shield with fist is never offered',()=>{
 const u=make('Captain'),rule=getTyranidWargearRuleSet(u.datasheetId),slots=getWargearSlots(u);
 assert.equal(slots.length,1);
 assert.equal(slots[0].choices.length,7);
 for(const choice of slots[0].choices) {
  const load=check(u,chooseWargear(u,createWargearChoiceState(u),'captain-complete-loadout:0',choice.name));
  if(choice.name.includes('Relic Shield')){
   assert.equal(choice.name.includes('Power Fist'),false);
   assert.equal(count(load.equippedWeapons,'Relic Shield'),0);
   assert.equal(count(load.equippedWeapons,'Master-crafted Bolter'),0);
   assert.equal(count(load.equippedWeapons,'Heavy Bolt Pistol'),1);
  }
 }
 assert.equal(slots[0].choices.some(x=>x.name.includes('Relic Shield')&&x.name.includes('Power Fist')),false);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[{name:'Relic Shield + Power Fist',quantity:1}]}).status,'rules-invalid');
 const plasma=slots[0].choices.find(x=>x.name==='Plasma Pistol + Power Fist');
 const equipped=check(u,chooseWargear(u,createWargearChoiceState(u),'captain-complete-loadout:0',plasma.name));
 assert.equal(count(equipped.equippedWeapons,'Plasma Pistol - Standard'),1);
 assert.equal(count(equipped.equippedWeapons,'Plasma Pistol - Supercharge'),1);
 assert.equal(count(equipped.equippedWeapons,'Master-crafted Bolter'),0);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Finest Hour').description,/Once per battle/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Strategic Acumen').description,/Command phase/);
});
test('Gravis Captain: two-weapon rifle set swaps for a ranged/melee Gauntlet and one Extra Attacks relic',()=>{
 const u=make('Captain in Gravis Armour'),slots=getWargearSlots(u);
 assert.equal(slots.length,1);assert.equal(slots[0].choices.length,4);
 const base=check(u,createWargearChoiceState(u));
 assert.equal(count(base.equippedWeapons,'Master-crafted Heavy Bolt Rifle'),1);
 assert.equal(count(base.equippedWeapons,'Master-crafted Power Weapon'),1);
 for(const extra of ['Relic Blade','Relic Chainsword','Relic Power Fist']){
  const st=chooseWargear(u,createWargearChoiceState(u),'gravis-captain-pair:0','Boltstorm Gauntlet + '+extra);
  const selected=check(u,st);
  assert.equal(count(selected.equippedWeapons,'Boltstorm Gauntlet - Ranged'),1);
  assert.equal(count(selected.equippedWeapons,'Boltstorm Gauntlet - Melee'),1);
  assert.equal(count(selected.equippedWeapons,extra),1);
  assert.equal(count(selected.equippedWeapons,'Master-crafted Heavy Bolt Rifle'),0);
  assert.equal(u.datasheet.weapons.find(w=>w.name===extra).abilities,'Extra Attacks');
 }
 assert.match(u.datasheet.abilities.find(x=>x.name==='Refuse to Yield').description,/-1 Damage/);
});
test('Phobos Captain has exactly three fixed weapons, Precision attacks and conditional move/retreat',()=>{
 const u=make('Captain in Phobos Armour'),rules=getTyranidWargearRuleSet(u.datasheetId);
 assert.equal(getWargearSlots(u).length,0);
 const chosen=check(u,createWargearChoiceState(u));
 assert.deepEqual(chosen.choices.map(x=>x.name),['Bolt Pistol','Combat Knife','Instigator Bolt Carbine']);
 assert.match(u.datasheet.weapons.find(w=>w.name==='Instigator Bolt Carbine').abilities,/Precision/);
 assert.match(u.datasheet.weapons.find(w=>w.name==='Combat Knife').abilities,/Sustained Hits 1/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Tactical Fluidity').description,/once per battle round/i);
 assert.equal(rules.optional?.length??0,0);
});
test('Terminator Captain swaps Storm Bolter for one Combi-weapon (three modes) and Relic Weapon for Fist',()=>{
 const u=make('Captain in Terminator Armour'),s=createWargearChoiceState(u);
 assert.equal(getWargearSlots(u).length,2);
 let st=chooseWargear(u,s,'terminator-captain-gun:0','Combi-weapon');
 st=chooseWargear(u,st,'terminator-captain-melee:0','Relic Fist');
 const selected=check(u,st);
 assert.equal(count(selected.equippedWeapons,'Storm Bolter'),0);
 assert.equal(count(selected.equippedWeapons,'Relic Fist'),1);
 assert.equal(count(selected.equippedWeapons,'Combi-weapon - Infernus'),1);
 assert.equal(count(selected.equippedWeapons,'Combi-weapon - Purgatus'),1);
 assert.equal(count(selected.equippedWeapons,'Combi-weapon - Damnatus'),1);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[...selected.choices,{name:'Storm Bolter',quantity:1}]}).status,'rules-invalid');
 assert.equal(u.datasheet.characteristics.Save,'2+');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Unstoppable Valour').description,/re-roll charge/);
});
test('Mounted Captain: Twin Bolt Rifle retained while gun and melee choices remain independent',()=>{
 const u=make('Captain on Bike'),s=createWargearChoiceState(u);
 assert.equal(getWargearSlots(u).length,2);
 let st=chooseWargear(u,s,'bike-captain-pistol:0','Plasma Pistol');
 st=chooseWargear(u,st,'bike-captain-melee:0','Thunder Hammer');
 const selected=check(u,st);
 assert.equal(count(selected.choices,'Twin Bolt Rifle'),1);
 assert.equal(count(selected.equippedWeapons,'Plasma Pistol - Standard'),1);
 assert.equal(count(selected.equippedWeapons,'Plasma Pistol - Supercharge'),1);
 assert.equal(count(selected.equippedWeapons,'Thunder Hammer'),1);
 assert.equal(count(selected.equippedWeapons,'Heavy Bolt Pistol'),0);
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Twin Bolt Rifle').skill,'2+');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Into the Fray').description,/Cleave 1/);
});
test('Jump Captain: eleven legal complete packages; shield package replaces pistol entirely',()=>{
 const u=make('Captain with Jump Pack'),s=createWargearChoiceState(u),slots=getWargearSlots(u);
 assert.equal(slots.length,1);assert.equal(slots[0].choices.length,11);
 for(const option of slots[0].choices)check(u,chooseWargear(u,s,'jump-captain-complete-loadout:0',option.name));
 const hammer=check(u,chooseWargear(u,s,'jump-captain-complete-loadout:0','Thunder Hammer + Relic Shield'));
 assert.deepEqual(hammer.equippedWeapons.map(x=>x.name),['Thunder Hammer']);
 assert.equal(hammer.choices[0].name,'Thunder Hammer + Relic Shield');
 const sword=check(u,chooseWargear(u,s,'jump-captain-complete-loadout:0','Chainsword + Relic Shield'));
 assert.equal(count(sword.equippedWeapons,'Chainsword'),1);
 assert.equal(count(sword.equippedWeapons,'Heavy Bolt Pistol'),0);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[...hammer.choices,{name:'Plasma Pistol',quantity:1}]}).status,'rules-invalid');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Angel\'s Wrath').description,/\+1 to charge rolls/);
});
test('Chaplain fixed loadout; Terminator Chaplain can swap Storm Bolter for non-weapon Relic Shield',()=>{
 const chap=make('Chaplain');
 const base=check(chap,createWargearChoiceState(chap));
 assert.deepEqual(base.choices.map(x=>x.name),['Absolvor Bolt Pistol','Crozius Arcanum']);
 assert.equal(getWargearSlots(chap).length,0);
 assert.match(chap.datasheet.abilities.find(x=>x.name==='Spiritual Leader').description,/battle-shocked/);
 const term=make('Chaplain in Terminator Armour'),state=createWargearChoiceState(term);
 assert.equal(getWargearSlots(term).length,1);
 const shield=check(term,chooseWargear(term,state,'terminator-chaplain-gun-or-shield:0','Relic Shield'));
 assert.equal(count(shield.choices,'Relic Shield'),1);
 assert.equal(count(shield.equippedWeapons,'Relic Shield'),0);
 assert.deepEqual(shield.equippedWeapons.map(x=>x.name),['Crozius Arcanum']);
 assert.equal(count(shield.equippedWeapons,'Storm Bolter'),0);
 assert.match(term.datasheet.abilities.find(x=>x.name==='Relic Shield').description,/\+1 W/);
 assert.match(term.datasheet.abilities.find(x=>x.name==='Zealous Fortitude').description,/mortal wounds only/);
});
test('Librarians keep one Smite with alternate firing modes, psychic phase timing and battleshock risk',()=>{
 for(const name of ['Librarian','Librarian in Phobos Armour']){
  const u=make(name),st=createWargearChoiceState(u),selected=check(u,st);
  assert.deepEqual(selected.choices.map(x=>x.name),['Bolt Pistol','Force Weapon','Smite']);
  assert.equal(count(selected.equippedWeapons,'Smite - Witchfire'),1);
  assert.equal(count(selected.equippedWeapons,'Smite - Focused Witchfire'),1);
  assert.equal(getWargearSlots(u).length,0);
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Smite - Focused Witchfire').damage,'2');
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Smite - Witchfire').attacks,'D6');
  assert.match(u.datasheet.abilities.find(x=>x.name==='Psychic Hood').description,/Psychic attacks only/);
  const power=name==='Librarian'?'Force Dome':'Shrouding';
  assert.match(u.datasheet.abilities.find(x=>x.name===power).description,/battle-shocked/);
 }
 const u=make('Librarian in Phobos Armour');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Soul Sight').description,/Ignores Cover/);
 const lib=make('Librarian');
 assert.match(lib.datasheet.abilities.find(x=>x.name==='Force Dome').description,/4\+ invulnerable/);
});
test('Fixed-only Warhammer App imports hydrate unambiguous Phobos Captain, Chaplain and Librarians',()=>{
 const cases=[
  ['Captain in Phobos Armour',75],['Chaplain',60],
  ['Librarian',75],['Librarian in Phobos Armour',75]
 ];
 const text='Space Marines\nCHARACTERS\n'+cases.map(x=>x[0]+' ('+x[1]+' pts)').join('\n');
 const parsed=importWarhammerAppRoster({text,faction:'Space Marines',name:'leaders import',id:'leaders-import',pointsLimit:2000});
 assert.equal(parsed.unrecognized.length,0);
 assert.equal(parsed.roster.units.length,cases.length);
 for(const u of parsed.roster.units) {
  assert.equal(u.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(u.loadoutValidation.source,'reviewed-fixed-equipment-import');
  assert.equal(assessUnitLoadoutReadiness(u).status,'complete');
 }
});
