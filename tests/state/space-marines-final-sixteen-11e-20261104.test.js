import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { SPACE_MARINES_WARGEAR_RULES } from '../../src/data/space-marines-wargear-rules.js';
import { SPACE_MARINES_REVIEWED_PROFILE_PATCHES } from '../../src/data/space-marines-reviewed-combat-profiles.js';
import { auditArmyCatalogCompleteness } from '../../src/rules/army-catalog-completeness-audit.js';
import { getTyranidWargearRuleSet } from '../../src/data/tyranid-wargear-rules.js';
import { getWargearSlots,createWargearChoiceState,chooseWargear,readWargearChoiceState } from '../../src/rules/army-wargear-choices.js';
import { validateWargearLoadout,buildManualWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { assessUnitLoadoutReadiness } from '../../src/rules/roster-loadout-readiness.js';
import { resolveBuilderUnitCost,getBuilderModelCounts } from '../../src/rules/army-builder-cost.js';
import { renderWargearEditor } from '../../src/ui/army-wargear-editor.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';

const finalSixteen=[
 ['Adrax Agatone',90,'6"','5','2+','5','1'],
 ['Vulkan He’stan',105,'6"','5','2+','5','1'],
 ['Lieutenant in Phobos Armour',40,'8"','4','3+','4','1'],
 ['Lieutenant with Combi-Weapon',85,'8"','4','3+','4','1'],
 ['Aethon Shaan',105,'14"','5','3+','5','1'],
 ['Caanok Var',100,'5"','6','2+','6','1'],
 ['Captain Titus',115,'6"','5','3+','6','1'],
 ['Chief Librarian Tigurius',115,'6"','5','3+','5','1'],
 ['Darnath Lysander',160,'5"','6','2+','7','1'],
 ['Iron Father Feirros',85,'5"','6','2+','6','1'],
 ['Kaius Konorius',100,'6"','5','2+','5','1'],
 ['Kayvaan Shrike',95,'12"','4','3+','5','1'],
 ["Kor'sarro Khan",80,'6"','5','3+','5','1'],
 ['Roboute Guilliman',415,'8"','10','2+','16','4'],
 ['Suboden Khan',105,'12"','6','3+','8','2'],
 ['Tor Garadon',90,'5"','6','3+','6','1']
];
function make(name,id=name){
 const e=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name&&!x.legends);
 assert.ok(e,'missing current catalog '+name);
 return {...e,id,datasheetId:e.id,modelCount:e.defaultModelCount};
}
const qty=(xs,name)=>xs.find(x=>x.name===name)?.quantity??0;
function equip(u,st=createWargearChoiceState(u)){
 const chosen=readWargearChoiceState(u,st);
 const res=validateWargearLoadout({...u,equippedWargear:chosen});
 assert.equal(res.status,'rules-reviewed-valid',u.name+': '+res.errors.join('; '));
 const built=buildManualWargearLoadout(u,chosen);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid',u.name);
 assert.equal(assessUnitLoadoutReadiness({...u,...built}).status,'complete',u.name);
 return {...built,chosen};
}
test('all 87 current 11e Space Marines, including final 16 named entries, have source-scoped reviewed wargear',()=>{
 const candidates=findArmyUnitCandidates({faction:'Space Marines'}).filter(x=>!x.legends);
 assert.equal(candidates.length,87);
 assert.equal(Object.keys(SPACE_MARINES_WARGEAR_RULES).length,87);
 assert.equal(Object.keys(SPACE_MARINES_REVIEWED_PROFILE_PATCHES).length,83);
 const ids=new Set(candidates.map(x=>x.id));
 assert.equal(ids.size,87,'current unit IDs must be unique');
 assert.deepEqual(Object.keys(SPACE_MARINES_WARGEAR_RULES).filter(id=>!ids.has(id)),[]);
 for(const u of candidates)assert.ok(getTyranidWargearRuleSet(u.id),u.name);
 const audit=auditArmyCatalogCompleteness('Space Marines');
 assert.equal(audit.counts.withReviewedSelectableWargear,87);
 assert.equal(audit.counts.withOfficialCrossCheckPending,audit.counts.units);
 assert.equal(audit.officialRulesCertification,'pending-per-unit-review','reviewed unofficial datasheets are not official GW certification');
 assert.equal(getTyranidWargearRuleSet('space-marines:tactical-squad'),null,'Legends Tactical Squad remains unreviewed and flagged');
});
test('final 16 named heroes and Phobos lieutenants have current source, complete combat profiles and correct per-model price',()=>{
 assert.equal(finalSixteen.length,16);
 for(const [name,points,move,toughness,save,wounds,oc] of finalSixteen){
  const u=make(name),rule=getTyranidWargearRuleSet(u.datasheetId);
  assert.ok(rule,name);assert.equal(rule.reviewedAt,'2026-11-04');
  assert.match(rule.sourceUrl,/wh40k11ed\/factions\/space-marines\//);
  assert.equal(rule.verificationLevel,'current-11e-datasheet-cross-check');
  assert.ok(rule.manualWargearNotes.length>0);
  assert.deepEqual(getBuilderModelCounts(u),[1]);
  assert.equal(resolveBuilderUnitCost(u,{units:[u]}).points,points,name+' current independent one-model price');
  assert.ok(u.datasheet,name+' has no datasheet');
  const s=u.datasheet.characteristics;
  assert.equal(s.Move,move,name);assert.equal(s.Toughness,toughness,name);
  assert.equal(s.Save,save,name);assert.equal(s.Wounds,wounds,name);
  assert.equal(s['Objective Control'],oc,name);
  assert.ok(u.datasheet.weapons.length>0,name+' weapons missing');
  assert.ok(u.datasheet.abilities.length>0,name+' abilities missing');
  assert.equal(u.datasheet.officialOctoberCodexFullTextVerified,false);
  equip(u);
  assert.match(renderWargearEditor(u),/Reviewed 11th-edition loadout subset/);
 }
});
test('12 previously name-only current Epic Heroes now receive full source-reviewed combat datasheets, not fabricated Legends/proxies',()=>{
 const names=['Aethon Shaan','Caanok Var','Captain Titus','Chief Librarian Tigurius','Darnath Lysander',
 'Iron Father Feirros','Kaius Konorius','Kayvaan Shrike',"Kor'sarro Khan",'Roboute Guilliman','Suboden Khan','Tor Garadon'];
 for(const name of names){
  const c=make(name);
  assert.ok(c.datasheet,name);
  assert.equal(c.combatDataCoverage,'current-11e-profile-cross-checked',name);
  assert.equal(c.verificationStatus,'current-11e-profile-cross-checked',name);
  assert.equal(c.officialRulesCrossCheck,'pending',name);
  assert.match(c.sourceUrl,/wh40k11ed/);
 }
 const legacy=make('Marneus Calgar');
 assert.ok(legacy.datasheet,'previous Ultramarines source data preserved');
 const proxy=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name==='Tactical Squad'&&x.legends);
 assert.ok(proxy);
 assert.equal(proxy.datasheet,undefined,'Legends remain name-only if unverified');
});
test('Phobos Lieutenant has exactly one mutually exclusive pistol-to-carbine swap and correct support conditions',()=>{
 const u=make('Lieutenant in Phobos Armour'),slots=getWargearSlots(u);
 assert.equal(slots.length,1);
 assert.deepEqual(slots[0].choices.map(x=>x.name),['Special-issue Bolt Pistol','Master-crafted Bolt Carbine']);
 const base=equip(u);
 assert.equal(qty(base.equippedWeapons,'Special-issue Bolt Pistol'),1);
 assert.equal(qty(base.equippedWeapons,'Master-crafted Bolt Carbine'),0);
 assert.equal(qty(base.equippedWeapons,'Monomolecular Combat Blades'),1);
 const alt=equip(u,chooseWargear(u,createWargearChoiceState(u),'phobos-lieutenant-pistol-or-carbine:0','Master-crafted Bolt Carbine'));
 assert.equal(qty(alt.equippedWeapons,'Master-crafted Bolt Carbine'),1);
 assert.equal(qty(alt.equippedWeapons,'Special-issue Bolt Pistol'),0);
 const invalid=validateWargearLoadout({...u,equippedWargear:[...alt.chosen,{name:'Special-issue Bolt Pistol',quantity:1}]});
 assert.equal(invalid.status,'rules-invalid','cannot equip both ranged choices');
 assert.match(u.datasheet.abilities.find(a=>a.name==='Tactical Precision').description,/not Monster\/Vehicle/);
});
test('Combi-weapon Lieutenant and Guilliman maintain correct weapon-mode and physical-gun multiplicity',()=>{
 const lt=make('Lieutenant with Combi-Weapon'),l=equip(lt);
 assert.equal(qty(l.chosen,'Combi-weapon'),1);
 assert.equal(qty(l.equippedWeapons,'Combi-weapon - Bolter'),1);
 assert.equal(qty(l.equippedWeapons,'Combi-weapon - Flamer'),1);
 assert.equal(qty(l.equippedWeapons,'Paired Combat Blades'),1);
 assert.match(lt.datasheet.abilities.find(a=>a.name==='Evade and Survive').description,/opponent Movement/);
 assert.match(lt.datasheet.abilities.find(a=>a.name==='Priority Target Identified').description,/once per battle/i);
 const g=make('Roboute Guilliman'),w=equip(g);
 assert.deepEqual(w.chosen.map(x=>x.name),['Emperor’s Sword','Hand of Dominion']);
 assert.equal(qty(w.equippedWeapons,'Hand of Dominion - Ranged'),1);
 assert.equal(qty(w.equippedWeapons,'Hand of Dominion - Melee'),1);
 assert.equal(qty(w.equippedWeapons,'Emperor’s Sword'),1);
 assert.equal(g.datasheet.characteristics.Toughness,'10');
 assert.equal(g.datasheet.characteristics.Wounds,'16');
 assert.equal(g.datasheet.characteristics['Objective Control'],'4');
 assert.match(g.datasheet.abilities.find(a=>a.name==='Supreme Commander').description,/MUST be Warlord/);
});
test('Epic Hero swords with alternative modes, extra attacks and conditional abilities stay correctly represented',()=>{
 const k=make('Kaius Konorius'),l=equip(k);
 assert.equal(qty(l.chosen,'Severance and Rebuke'),1);
 assert.equal(qty(l.equippedWeapons,'Severance and Rebuke - Strike'),1);
 assert.equal(qty(l.equippedWeapons,'Severance and Rebuke - Sweep'),1);
 assert.match(k.datasheet.abilities.find(a=>a.name==='Veteran Bodyguard').description,/OTHER Character/);
 const s=make('Suboden Khan'),sl=equip(s);
 assert.equal(qty(sl.equippedWeapons,'Stormtooth'),1);
 assert.equal(qty(sl.equippedWeapons,'Power Sword'),1);
 assert.match(s.datasheet.weapons.find(w=>w.name==='Power Sword').abilities,/Extra Attacks/);
 assert.match(s.datasheet.abilities.find(a=>a.name==='Spear of Chogoris').description,/charge in a turn it Advanced/);
 const ls=make('Darnath Lysander'),w=equip(ls);
 assert.deepEqual(w.equippedWeapons.map(x=>x.name),['Fist of Dorn']);
 assert.equal(ls.datasheet.weapons.some(x=>x.range!=='Melee'),false,'Lysander is melee only');
 assert.match(ls.datasheet.abilities.find(a=>a.name==='Rampart').description,/2\+ invulnerable/);
});
test('key once-per-battle, psychic, target and objective restrictions are kept as reminders rather than automatic state writes',()=>{
 const ability=(name,key)=>make(name).datasheet.abilities.find(x=>x.name===key)?.description??'';
 assert.match(ability('Adrax Agatone','Unto the Anvil'),/Assault doctrine/);
 assert.match(ability('Vulkan He’stan','Seeker of the Unfound'),/OC10/);
 assert.match(ability('Vulkan He’stan','Forgefather'),/24 inches/);
 assert.match(ability('Aethon Shaan','Blackwing Mantle'),/-1 CP/);
 assert.match(ability('Caanok Var','Cold and Calculating'),/Monster\/Vehicle/);
 assert.match(ability('Captain Titus','Honour of Ultramar'),/2\+/);
 assert.match(ability('Chief Librarian Tigurius','Prescience'),/level 2/);
 assert.match(ability('Chief Librarian Tigurius','Telepathic Assault'),/2D3 mortal wounds/);
 assert.match(ability('Chief Librarian Tigurius','Hood of Hellfire'),/AND mortal wounds/);
 assert.match(ability('Iron Father Feirros','Master of the Forge'),/heal 3 wounds/);
 assert.match(ability('Kayvaan Shrike','Echo of the Ravenspire'),/end of opponent/);
 assert.match(ability("Kor'sarro Khan",'For the Khan!'),/Lance/);
 assert.match(ability('Tor Garadon','Siege Captain'),/\+2 Strength, AP and Damage/);
});
test('fixed-only named Space Marine imports hydrate safely without overwriting explicit invalid gear',()=>{
 const names=['Adrax Agatone','Aethon Shaan','Caanok Var','Captain Titus','Darnath Lysander',
 'Iron Father Feirros','Kaius Konorius','Kayvaan Shrike','Roboute Guilliman','Suboden Khan','Tor Garadon'];
 const points=new Map(finalSixteen.map(([n,p])=>[n,p]));
 const text='Space Marines\nCHARACTERS\n'+names.map(n=>n+' ('+points.get(n)+' pts)').join('\n');
 const parsed=importWarhammerAppRoster({text,faction:'Space Marines',name:'Final 16 audit',id:'final-16',pointsLimit:3000});
 assert.equal(parsed.unrecognized.length,0);
 assert.equal(parsed.roster.units.length,names.length);
 for(const u of parsed.roster.units){
  assert.equal(u.loadoutValidation?.status,'rules-reviewed-valid',u.name);
  assert.equal(u.loadoutValidation?.source,'reviewed-fixed-equipment-import',u.name);
  assert.equal(assessUnitLoadoutReadiness(u).status,'complete',u.name);
 }
});
