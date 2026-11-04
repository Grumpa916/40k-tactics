import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState,chooseWargear,checkWargearChoice} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessSavedUnitCost} from '../../src/rules/roster-rules-data-validation.js';
import {renderUnitDetails} from '../../src/ui/army-unit-details.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {getEligibleBodyguards,attachLeaderToBodyguard} from '../../src/state/leader-bodyguard-attachments.js';
import {WARDENS_OF_ULTRAMAR_MODELS} from '../../src/data/space-marines-named-ultramarines-datasheets.js';
import {importWarhammerAppRoster} from '../../src/state/warhammer-app-roster-import.js';

const make=(name,id='one',size)=>{
 const c=findArmyUnitCandidates({faction:'Space Marines'}).find(unit=>unit.name===name);
 assert.ok(c,'missing '+name);
 return {...c,id,datasheetId:c.id,modelCount:size??c.defaultModelCount};
};
const qty=(list,name)=>list.find(x=>x.name===name)?.quantity??0;

test('Calgar and Sicarius fixed weapons are loaded as equipped weapons, not extra attack weapons',()=>{
 const calgar=make('Marneus Calgar','calgar');
 const cato=make('Cato Sicarius','cato');
 for(const unit of [calgar,cato]){
  const rule=getTyranidWargearRuleSet(unit.datasheetId);
  assert.equal(rule.slots?.length??0,0);
  const selection=readWargearChoiceState(unit,createWargearChoiceState(unit));
  assert.equal(validateWargearLoadout({...unit,equippedWargear:selection}).status,'rules-reviewed-valid');
  const result=buildManualWargearLoadout(unit,selection);
  assert.equal(result.loadoutValidation.status,'rules-reviewed-valid');
  // Calgar's ranged and melee Gauntlets share a name: one saved profile
  // reference still exposes both range variants through the live datasheet.
  assert.ok(result.equippedWeapons.length>=2);
  assert.ok(result.equippedWargear.length<=2);
 }
 assert.equal(calgar.defaultPoints,180);
 assert.equal(qty(readWargearChoiceState(calgar,createWargearChoiceState(calgar)),'Gauntlets of Ultramar'),1);
 assert.equal(cato.defaultPoints,115);
 assert.equal(cato.datasheet.characteristics.Toughness,'5');
 assert.equal(cato.datasheet.characteristics['Invulnerable save'],'4+');
 assert.equal(cato.datasheet.weapons.find(w=>w.name.endsWith('Coup de Grace')).damage,'2');
 assert.equal(cato.datasheet.weapons.filter(w=>w.name.startsWith('Talassarian')).length,3);
 assert.match(renderWargearEditor(cato),/Support instead of Leader/);
});

test('Victrix role selection enforces one Ancient and Champion and prices banner without rewriting old rosters',()=>{
 const v3=make('Victrix Honour Guard','v3',3);
 assert.deepEqual(getBuilderModelCounts(v3),[3,6]);
 assert.equal(v3.datasheet.characteristics.Toughness,'5');
 assert.equal(v3.datasheet.characteristics['Objective Control'],'2');
 assert.deepEqual(getWargearSlots(v3).map(s=>s.slotId),['model-role','model-role','model-role']);
 let state=createWargearChoiceState(v3);
 const baseline=readWargearChoiceState(v3,state);
 assert.deepEqual(baseline,[{name:'Victrix Honour Guard',quantity:3}]);
 assert.equal(validateWargearLoadout({...v3,equippedWargear:baseline}).status,'rules-reviewed-valid');
 assert.equal(resolveBuilderUnitCost(v3,{units:[v3]},baseline).points,120);
 state=chooseWargear(v3,state,'model-role:0','Chapter Ancient');
 state=chooseWargear(v3,state,'model-role:1','Chapter Champion');
 const selected=readWargearChoiceState(v3,state);
 assert.equal(qty(selected,'Chapter Ancient'),1);
 assert.equal(qty(selected,'Chapter Champion'),1);
 assert.equal(qty(selected,'Victrix Honour Guard'),1);
 assert.equal(validateWargearLoadout({...v3,equippedWargear:selected}).status,'rules-reviewed-valid');
 const saved=buildManualWargearLoadout(v3,selected);
 assert.equal(saved.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(qty(saved.equippedWeapons,'Master-crafted Bolt Carbine'),2);
 assert.equal(qty(saved.equippedWeapons,'Blades of Honour'),1);
 assert.equal(resolveBuilderUnitCost(v3,{units:[v3]},selected).points,135);
 const catalog=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.id===v3.datasheetId);
 assert.equal(assessSavedUnitCost(catalog,{...v3,points:135,equippedWargear:selected},{units:[v3]}).status,'matched');
 assert.equal(assessSavedUnitCost(catalog,{...v3,points:120,equippedWargear:selected},{units:[v3]}).status,'mismatch');
 assert.ok(checkWargearChoice(v3,state,'model-role:2','Chapter Ancient'),'Ancient quantity must be capped');
 const v6=make('Victrix Honour Guard','v6',6);
 assert.equal(resolveBuilderUnitCost(v6,{units:[v6]},[]).points,250);
 const v6r={units:[v3,v6,make('Victrix Honour Guard','v6third',6)]};
 assert.equal(resolveBuilderUnitCost(v6r.units[2],v6r,[]).points,280);
 assert.equal(v6.defaultPoints,120,'default roster points represent base 3-model group');
 assert.match(renderWargearEditor(v3),/Chapter Champion/);
});

test('Wardens have a complete six-individual model reference and fixed weapons without invented aggregate wounds',()=>{
 const wardens=make('Wardens of Ultramar','wardens');
 assert.equal(wardens.modelCount,6);
 assert.equal(wardens.defaultPoints,115);
 assert.equal(WARDENS_OF_ULTRAMAR_MODELS.length,6);
 assert.equal(new Set(WARDENS_OF_ULTRAMAR_MODELS.map(m=>m.name)).size,6);
 assert.equal(wardens.datasheet.modelSpecificStatline,true);
 assert.equal(wardens.datasheet.characteristics.Wounds,undefined);
 assert.equal(wardens.datasheet.characteristics.Toughness,undefined);
 const selection=readWargearChoiceState(wardens,createWargearChoiceState(wardens));
 assert.equal(qty(selection,'Archeotech Laspistol'),3);
 assert.equal(qty(selection,'Power Weapon'),2);
 assert.equal(qty(selection,'Force Stave'),1);
 assert.equal(qty(selection,'Bolt Rifle'),1);
 assert.equal(validateWargearLoadout({...wardens,equippedWargear:selection}).status,'rules-reviewed-valid');
 const saved=buildManualWargearLoadout(wardens,selection);
 assert.equal(saved.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(qty(saved.equippedWeapons,'Bolt Rifle - Focused Fire'),1);
 assert.equal(qty(saved.equippedWeapons,'Bolt Rifle - Saturation'),1);
 const html=renderUnitDetails(wardens,{current:{faction:'Space Marines',units:[]}});
 assert.match(html,/Individual named models/);
 assert.match(html,/Ancient Gadriel/);
 assert.match(html,/Gaius Silva/);
 assert.match(html,/Dainal Kornelius/);
 assert.match(html,/no whole-unit value is inferred/);
 assert.match(html,/Storm Shield/);
});

test('reviewed Calgar/Cato/Victrix and Wardens attachment paths require legal roles',()=>{
 const calgar=make('Marneus Calgar','mc');
 const cato=make('Cato Sicarius','cs');
 const victrix=make('Victrix Honour Guard','vh');
 const wardens=make('Wardens of Ultramar','wo');
 const bladeguard=make('Bladeguard Veteran Squad','bg');
 const terminators=make('Terminator Squad','ts');
 const roster={faction:'Space Marines',units:[calgar,cato,victrix,wardens,bladeguard,terminators]};
 assert.deepEqual(getEligibleBodyguards(roster,'cs').map(x=>x.id),['vh']);
 assert.ok(getEligibleBodyguards(roster,'mc').some(x=>x.id==='vh'));
 assert.ok(getEligibleBodyguards(roster,'mc').some(x=>x.id==='ts'));
 assert.ok(getEligibleBodyguards(roster,'wo').some(x=>x.id==='bg'));
 assert.equal(getEligibleBodyguards(roster,'wo').some(x=>x.id==='ts'),false);
 const once=attachLeaderToBodyguard(roster,'mc','vh');
 const twice=attachLeaderToBodyguard(once,'cs','vh');
 assert.deepEqual(twice.units.find(x=>x.id==='vh').attachedLeaderIds,['mc','cs']);
 assert.equal(getEligibleBodyguards(once,'wo').some(x=>x.id==='vh'),false);
 assert.equal(getEligibleBodyguards(twice,'wo').some(x=>x.id==='vh'),false);
 const firstWarden=attachLeaderToBodyguard(roster,'wo','bg');
 const secondCalgar=attachLeaderToBodyguard(firstWarden,'mc','bg');
 assert.deepEqual(secondCalgar.units.find(x=>x.id==='bg').attachedLeaderIds,['wo','mc']);
 const calgarOnTerm=attachLeaderToBodyguard(roster,'mc','ts');
 assert.equal(getEligibleBodyguards(calgarOnTerm,'cs').some(x=>x.id==='ts'),false);
});

test('pasted fixed-only named Ultramarines units enter battle without redundant equipment prompts',()=>{
 const imported=importWarhammerAppRoster({
  text:'Space Marines\\nCHARACTERS\\nMarneus Calgar (180 pts)\\nCato Sicarius (115 pts)\\nOTHER DATASHEETS\\nWardens of Ultramar (115 pts)',
  faction:'Space Marines',name:'Ultramarines named units',id:'ultramarines-fixed',pointsLimit:2000
 });
 assert.equal(imported.unrecognized.length,0);
 assert.equal(imported.roster.units.length,3);
 for(const unit of imported.roster.units){
  assert.equal(unit.loadoutValidation?.status,'rules-reviewed-valid',unit.name);
  assert.equal(unit.loadoutValidation?.source,'reviewed-fixed-equipment-import');
  assert.ok(unit.equippedWeapons?.length>0,unit.name);
  assert.ok(unit.equippedWargear?.length>0,unit.name);
 }
 const calgar=imported.roster.units[0];
 assert.equal(calgar.equippedWeapons.some(x=>x.name==='Gauntlets of Ultramar'),true);
 assert.equal(calgar.equippedWeapons.some(x=>x.name==='Gauntlets of Ultramar - Overhead Smash'),true);
 const wardens=imported.roster.units[2];
 assert.equal(qty(wardens.equippedWeapons,'Archeotech Laspistol'),3);
});

test('named-unit source labels do not overstate direct October Codex verification',()=>{
 for(const name of ['Marneus Calgar','Cato Sicarius','Victrix Honour Guard','Wardens of Ultramar']){
  const c=make(name);
  assert.equal(c.officialRulesCrossCheck,'pending');
  assert.ok(c.datasheet?.weapons?.length>=2);
  assert.ok(getTyranidWargearRuleSet(c.datasheetId));
 }
 const cato=make('Cato Sicarius');
 assert.equal(cato.datasheet.officialOctoberCodexFullTextVerified,false);
});
