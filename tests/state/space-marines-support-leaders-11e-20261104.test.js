import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { getTyranidWargearRuleSet } from '../../src/data/tyranid-wargear-rules.js';
import { getWargearSlots,createWargearChoiceState,readWargearChoiceState,chooseWargear } from '../../src/rules/army-wargear-choices.js';
import { validateWargearLoadout,buildManualWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { assessUnitLoadoutReadiness } from '../../src/rules/roster-loadout-readiness.js';
import { resolveBuilderUnitCost,getBuilderModelCounts } from '../../src/rules/army-builder-cost.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { renderWargearEditor } from '../../src/ui/army-wargear-editor.js';
import { assessSavedUnitCost } from '../../src/rules/roster-rules-data-validation.js';
const units=[
 ['Ancient',40,'6"','5','3+','4','2'],
 ['Ancient in Terminator Armour',75,'5"','6','2+','5','2'],
 ['Apothecary',45,'6"','5','3+','4','1'],
 ['Apothecary Biologis',60,'5"','6','3+','5','1'],
 ['Bladeguard Ancient',70,'6"','5','3+','4','3'],
 ['Chaplain on Bike',75,'12"','6','3+','5','2'],
 ['Chaplain with Jump Pack',75,'12"','5','3+','4','1'],
 ['Judiciar',50,'6"','5','3+','4','1'],
 ['Librarian in Terminator Armour',80,'5"','6','2+','5','1'],
 ['Lieutenant',50,'6"','5','3+','4','1']
];
const unit=(name,id=name)=>{
 const entry=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name);
 assert.ok(entry,'Missing catalog '+name);
 return {...entry,id,datasheetId:entry.id,modelCount:1};
};
const qty=(xs,name)=>xs.find(x=>x.name===name)?.quantity??0;
function complete(u,st){
 const chosen=readWargearChoiceState(u,st);
 const validation=validateWargearLoadout({...u,equippedWargear:chosen});
 assert.equal(validation.status,'rules-reviewed-valid',(validation.errors??[]).join('; '));
 const built=buildManualWargearLoadout(u,chosen);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...u,...built}).status,'complete');
 return {chosen, ...built};
}
test('exactly ten source-scoped 11e support leaders receive correct named points and full profiles',()=>{
 assert.equal(units.length,10);
 for(const [name,points,move,toughness,save,wounds,oc] of units){
  const u=unit(name),rule=getTyranidWargearRuleSet(u.datasheetId);
  assert.ok(rule,'reviewed set '+name);assert.equal(rule.reviewedAt,'2026-11-04');
  assert.match(rule.sourceUrl,/wh40k11ed/);
  assert.deepEqual(getBuilderModelCounts(u),[1]);
  assert.equal(resolveBuilderUnitCost(u,{units:[u]}).points,points,name);
  const s=u.datasheet.characteristics;
  assert.equal(s.Move,move,name);assert.equal(s.Toughness,toughness,name);
  assert.equal(s.Save,save,name);assert.equal(s.Wounds,wounds,name);
  assert.equal(s['Objective Control'],oc,name);
  assert.ok(u.datasheet.weapons.length>0,name);
  complete(u,createWargearChoiceState(u));
  assert.match(renderWargearEditor(u),/Reviewed 11th-edition loadout subset/);
 }
 assert.equal(getTyranidWargearRuleSet('space-marines:tactical-squad'),null);
});
test('Ancient Bolt Rifle has two alternate modes, or exactly one Power Weapon; banner not auto-scored',()=>{
 const u=unit('Ancient'),state=createWargearChoiceState(u);
 assert.equal(getWargearSlots(u).length,1);
 const original=complete(u,state);
 assert.equal(qty(original.chosen,'Bolt Pistol'),1);
 assert.equal(qty(original.chosen,'Ceramite Fists'),1);
 assert.equal(qty(original.chosen,'Bolt Rifle'),1);
 assert.equal(qty(original.equippedWeapons,'Bolt Rifle - Focused Fire'),1);
 assert.equal(qty(original.equippedWeapons,'Bolt Rifle - Saturation'),1);
 const swapped=complete(u,chooseWargear(u,state,'ancient-primary:0','Power Weapon'));
 assert.equal(qty(swapped.chosen,'Power Weapon'),1);
 assert.equal(qty(swapped.equippedWeapons,'Bolt Rifle - Focused Fire'),0);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[...swapped.chosen,{name:'Bolt Rifle',quantity:1}]}).status,'rules-invalid');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Raise the Banner').description,/END of own Movement/);
 assert.match(u.datasheet.abilities.find(a=>a.name==='Honour of the Company').description,/\+1 OC/);
});
test('Terminator Ancient is fixed Storm Bolter and Power Weapon, with objective proximity defense only',()=>{
 const u=unit('Ancient in Terminator Armour'),load=complete(u,createWargearChoiceState(u));
 assert.deepEqual(load.chosen.map(x=>x.name),['Storm Bolter','Master-crafted Power Weapon']);
 assert.equal(getWargearSlots(u).length,0);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Never Shall the Standard Fall').description,/Strength > its Toughness/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Never Shall the Standard Fall').description,/within range of an objective/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Deep Strike and Invulnerable Save').description,/4\+/);
});
test('Apothecary Reductor is melee Extra Attacks and heals wounds only in own Command phase',()=>{
 const u=unit('Apothecary'),a=complete(u,createWargearChoiceState(u));
 assert.deepEqual(a.chosen.map(x=>x.name),['Absolvor Bolt Pistol','Reductor Pistol','Servo-armature']);
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Reductor Pistol').range,'Melee');
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Reductor Pistol').abilities,'Extra Attacks');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Narthecium').description,/Command phase/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Narthecium').description,/D3\+1/);
 const biologis=unit('Apothecary Biologis'),b=complete(biologis,createWargearChoiceState(biologis));
 assert.deepEqual(b.chosen.map(x=>x.name),['Absolvor Bolt Pistol','Servo-armature']);
 assert.equal(biologis.datasheet.abilities.some(x=>x.name==='Narthecium'),false);
 assert.match(biologis.datasheet.abilities.find(x=>x.name==='Vivispectral Analysis Targeting').description,/non-VEHICLE/);
});
test('Bladeguard Ancient boosts attacks only near objectives, Chaplain variants keep distinct modifiers',()=>{
 const ancient=unit('Bladeguard Ancient'),a=complete(ancient,createWargearChoiceState(ancient));
 assert.deepEqual(a.chosen.map(x=>x.name),['Heavy Bolt Pistol','Relics of Battle']);
 assert.match(ancient.datasheet.abilities.find(x=>x.name==='Deeds of Legend').description,/within range of an objective/);
 const bike=unit('Chaplain on Bike'),jump=unit('Chaplain with Jump Pack');
 assert.deepEqual(complete(bike,createWargearChoiceState(bike)).chosen.map(x=>x.name),['Absolvor Bolt Pistol','Crozius Arcanum','Twin Bolt Rifle']);
 assert.deepEqual(complete(jump,createWargearChoiceState(jump)).chosen.map(x=>x.name),['Absolvor Bolt Pistol','Crozius Arcanum']);
 assert.match(bike.datasheet.abilities.find(x=>x.name==='Catechism of Fire').description,/selected to shoot/);
 assert.match(bike.datasheet.abilities.find(x=>x.name==='Catechism of Fire').description,/one visible enemy/);
 assert.match(jump.datasheet.abilities.find(x=>x.name==='Exhortation of Rage').description,/AT OR BELOW HALF-STRENGTH/);
 assert.equal(jump.datasheet.weapons.find(x=>x.name==='Crozius Arcanum').abilities,'Cleave 1');
});
test('Judiciar has Fights First and a melee-only 4+ invulnerable, not ranged save',()=>{
 const u=unit('Judiciar'),selected=complete(u,createWargearChoiceState(u));
 assert.deepEqual(selected.chosen.map(x=>x.name),['Absolvor Bolt Pistol','Executioner Relic Blade']);
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Executioner Relic Blade').abilities,'Precision, Devastating Wounds');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Tempormortis').description,/Fights First/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Invulnerable Save').description,/MELEE attacks ONLY/);
});
test('Terminator Librarian 11e retains fixed Storm Bolter with one Smite and psychic roll windows',()=>{
 const u=unit('Librarian in Terminator Armour'),r=getTyranidWargearRuleSet(u.datasheetId);
 assert.equal(r.slots?.length??0,0,'old 10e Combi-weapon swap removed');
 const load=complete(u,createWargearChoiceState(u));
 assert.deepEqual(load.chosen.map(x=>x.name),['Force Weapon','Smite','Storm Bolter']);
 assert.equal(qty(load.equippedWeapons,'Smite - Witchfire'),1);
 assert.equal(qty(load.equippedWeapons,'Smite - Focused Witchfire'),1);
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Smite - Focused Witchfire').attacks,'D3+3');
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Smite - Focused Witchfire').damage,'2');
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Storm Bolter').strength,'5');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Might of Heroes').description,/Fight phase/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Thunderous Force').description,/Shooting phase/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Psychic Hood').description,/PSYCHIC attacks only/);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[...load.chosen,{name:'Combi-weapon',quantity:1}]}).status,'rules-invalid');
});
test('Lieutenant accepts exactly 26 complete linked packages including paired Neo-volkite Shield restriction',()=>{
 const u=unit('Lieutenant'),slot=getWargearSlots(u);
 assert.equal(slot.length,1);
 assert.equal(slot[0].choices.length,26);
 const s=createWargearChoiceState(u);
 for(const c of slot[0].choices)complete(u,chooseWargear(u,s,'lieutenant-complete-loadout:0',c.name));
 const shield=slot[0].choices.filter(c=>c.name.includes('Storm Shield'));
 assert.equal(shield.length,1);
 assert.match(shield[0].name,/Neo-volkite/);
 const sh=complete(u,chooseWargear(u,s,'lieutenant-complete-loadout:0',shield[0].name));
 assert.equal(qty(sh.equippedWeapons,'Neo-volkite Pistol'),1);
 assert.equal(qty(sh.equippedWeapons,'Storm Shield'),0);
 assert.equal(qty(sh.equippedWeapons,'Master-crafted Power Weapon'),1);
 assert.equal(u.datasheet.abilities.find(x=>x.name==='Storm Shield').description.includes('4+ invulnerable'),true);
 const twice=complete(u,chooseWargear(u,s,'lieutenant-complete-loadout:0','Bolt Pistol / Master-crafted Power Weapon / Master-crafted Power Weapon'));
 assert.equal(qty(twice.equippedWeapons,'Master-crafted Power Weapon'),2);
 const plasma=complete(u,chooseWargear(u,s,'lieutenant-complete-loadout:0','Bolt Pistol / Plasma Pistol / Power Fist'));
 assert.equal(qty(plasma.equippedWeapons,'Plasma Pistol - Standard'),1);
 assert.equal(qty(plasma.equippedWeapons,'Plasma Pistol - Supercharge'),1);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[...shield.map(x=>({name:x.name,quantity:1})),{name:'Bolt Pistol',quantity:1}]}).status,'rules-invalid');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Tactical Precision').description,/NOT MONSTER or VEHICLE/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Demi-company Commander').description,/Once per turn/);
});
test('Eight unambiguous fixed-only characters can hydrate an empty Warhammer App import safely',()=>{
 const list=['Ancient in Terminator Armour','Apothecary','Apothecary Biologis','Bladeguard Ancient',
 'Chaplain on Bike','Chaplain with Jump Pack','Judiciar','Librarian in Terminator Armour'];
 const costs=new Map(units.map(([name,points])=>[name,points]));
 const text='Space Marines\nCHARACTERS\n'+list.map(n=>n+' ('+costs.get(n)+' pts)').join('\n');
 const parsed=importWarhammerAppRoster({text,faction:'Space Marines',name:'support units',id:'support-units',pointsLimit:2000});
 assert.equal(parsed.unrecognized.length,0);
 assert.equal(parsed.roster.units.length,8);
 for(const entry of parsed.roster.units){
  assert.equal(entry.loadoutValidation.status,'rules-reviewed-valid',entry.name);
  assert.equal(entry.loadoutValidation.source,'reviewed-fixed-equipment-import');
  assert.equal(assessUnitLoadoutReadiness(entry).status,'complete');
 }
});

test('Stale 90-point Jump Chaplain saved roster is flagged, not silently repriced',()=>{
 const candidate=unit('Chaplain with Jump Pack');
 const saved={...candidate,points:90};
 const assessment=assessSavedUnitCost(candidate,saved,{units:[saved]});
 assert.equal(assessment.status,'mismatch');
 assert.equal(saved.points,90,'Original saved points stay unchanged until user reviews and saves');
 assert.equal(resolveBuilderUnitCost(candidate,{units:[candidate]}).points,75);
});
