import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet, getTyranidWargearSelections} from '../../src/data/tyranid-wargear-rules.js';
import {SPACE_MARINES_WARGEAR_RULES} from '../../src/data/space-marines-wargear-rules.js';
import {getWargearSlots, createWargearChoiceState, readWargearChoiceState, chooseWargearBaseline, changeWargearQuantity, resizeWargearChoices} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessSavedUnitCost} from '../../src/rules/roster-rules-data-validation.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {SPACE_MARINES_REVIEWED_PROFILE_PATCHES} from '../../src/data/space-marines-reviewed-combat-profiles.js';

const find=(name,id=name,modelCount)=>{
 const entry=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name);
 assert.ok(entry,'missing catalog '+name);
 return {...entry,id,datasheetId:entry.id,modelCount:modelCount??entry.defaultModelCount};
};

test('87 source-reviewed Space Marine rule sets match the 11e catalog source scope',()=>{
 assert.deepEqual(Object.keys(SPACE_MARINES_WARGEAR_RULES).sort(),[
 'space-marines:aggressor-squad','space-marines:eradicator-squad-with-heavy-bolters',
 'space-marines:terminator-assault-squad','space-marines:intercessor-squad',
 'space-marines:eradicator-squad-with-melta-rifles',
 'space-marines:terminator-squad','space-marines:bladeguard-veteran-squad','space-marines:hellblaster-squad',
 'space-marines:marneus-calgar','space-marines:cato-sicarius',
 'space-marines:victrix-honour-guard','space-marines:wardens-of-ultramar',
 'space-marines:sternguard-veteran-squad','space-marines:inceptor-squad',
 'space-marines:eliminator-squad',
 'space-marines:incursor-squad','space-marines:infiltrator-squad',
 'space-marines:reiver-squad','space-marines:scout-squad','space-marines:outrider-squad',
 'space-marines:assault-intercessors-with-jump-packs','space-marines:vanguard-veteran-squad-with-jump-packs',
 'space-marines:assault-intercessor-squad','space-marines:heavy-intercessor-squad',
 'space-marines:infernus-squad','space-marines:desolation-squad','space-marines:company-heroes',
 'space-marines:ballistus-dreadnought','space-marines:brutalis-dreadnought','space-marines:redemptor-dreadnought',
 'space-marines:invictor-tactical-warsuit','space-marines:firestrike-servo-turrets','space-marines:invader-atvs',
 'space-marines:gladiator-lancer','space-marines:gladiator-reaper','space-marines:gladiator-valiant',
 'space-marines:land-raider','space-marines:land-raider-crusader','space-marines:land-raider-redeemer',
 'space-marines:repulsor','space-marines:repulsor-executioner',
 'space-marines:drop-pod','space-marines:impulsor','space-marines:rhino',
 'space-marines:land-speeder','space-marines:storm-speeder-hailstrike','space-marines:storm-speeder-hammerstrike','space-marines:storm-speeder-thunderstrike',
 'space-marines:astraeus','space-marines:thunderhawk-gunship','space-marines:techmarine',
 'space-marines:captain','space-marines:captain-in-gravis-armour','space-marines:captain-in-phobos-armour','space-marines:captain-in-terminator-armour','space-marines:captain-on-bike','space-marines:captain-with-jump-pack','space-marines:chaplain','space-marines:chaplain-in-terminator-armour','space-marines:librarian','space-marines:librarian-in-phobos-armour',
 'space-marines:ancient','space-marines:ancient-in-terminator-armour','space-marines:apothecary','space-marines:apothecary-biologis','space-marines:bladeguard-ancient','space-marines:chaplain-on-bike','space-marines:chaplain-with-jump-pack','space-marines:judiciar','space-marines:librarian-in-terminator-armour','space-marines:lieutenant','space-marines:adrax-agatone','space-marines:vulkan-hestan','space-marines:lieutenant-in-phobos-armour','space-marines:lieutenant-with-combi-weapon','space-marines:aethon-shaan','space-marines:caanok-var','space-marines:captain-titus','space-marines:chief-librarian-tigurius','space-marines:darnath-lysander','space-marines:iron-father-feirros','space-marines:kaius-konorius','space-marines:kayvaan-shrike','space-marines:korsarro-khan','space-marines:roboute-guilliman','space-marines:suboden-khan','space-marines:tor-garadon'].sort());
 for(const id of Object.keys(SPACE_MARINES_WARGEAR_RULES)){
  const rules=getTyranidWargearRuleSet(id);
  assert.ok(rules.sourceUrl.startsWith('https://'));
  assert.equal(rules.reviewedAt,(id.startsWith('space-marines:gladiator-')||id.startsWith('space-marines:land-raider')||id.startsWith('space-marines:repulsor')||['drop-pod','impulsor','rhino','land-speeder','storm-speeder-hailstrike','storm-speeder-hammerstrike','storm-speeder-thunderstrike','astraeus','thunderhawk-gunship','techmarine','captain','captain-in-gravis-armour','captain-in-phobos-armour','captain-in-terminator-armour','captain-on-bike','captain-with-jump-pack','chaplain','chaplain-in-terminator-armour','librarian','librarian-in-phobos-armour', 'ancient','ancient-in-terminator-armour','apothecary','apothecary-biologis','bladeguard-ancient','chaplain-on-bike','chaplain-with-jump-pack','judiciar','librarian-in-terminator-armour','lieutenant', 'adrax-agatone','vulkan-hestan','lieutenant-in-phobos-armour','lieutenant-with-combi-weapon','aethon-shaan','caanok-var','captain-titus','chief-librarian-tigurius','darnath-lysander','iron-father-feirros','kaius-konorius','kayvaan-shrike','korsarro-khan','roboute-guilliman','suboden-khan','tor-garadon'].includes(id.slice('space-marines:'.length)))?'2026-11-04':'2026-11-03');
  assert.ok(getTyranidWargearSelections(id).length>0 || rules.noEquipment === true);
 }
 assert.equal(getTyranidWargearRuleSet('space-marines:tactical-squad'),null,
  'Legends and unreviewed-only entries must not masquerade as current-catalog certified units');
 assert.equal(Object.keys(SPACE_MARINES_REVIEWED_PROFILE_PATCHES).length,83);
});

test('Aggressors select a legal unit-wide flamestorm or bolter+grenade loadout',()=>{
 const aggressors=find('Aggressor Squad','agg',3);
 const profiles=aggressors.datasheet.weapons;
 assert.equal(profiles.find(x=>x.name==='Auto Boltstorm Gauntlets').strength,'5');
 assert.equal(profiles.find(x=>x.name==='Flamestorm Gauntlets - Ranged').abilities.includes('Blast 2'),true);
 assert.equal(profiles.find(x=>x.name==='Twin Power Fists').damage,'2');
 const rule=getTyranidWargearRuleSet(aggressors.datasheetId);
 assert.equal(rule.fixed[0].perModel,1);
 assert.equal(getWargearSlots(aggressors).length,3);
 const original=createWargearChoiceState(aggressors);
 const defaultSelections=readWargearChoiceState(aggressors,original);
 assert.deepEqual(defaultSelections.map(x=>[x.name,x.quantity]),[['Twin Power Fists',3],['Flamestorm Gauntlets',3]]);
 assert.equal(validateWargearLoadout({...aggressors,equippedWargear:defaultSelections}).status,'rules-reviewed-valid');
 const next=chooseWargearBaseline(aggressors,original,'unit-ranged-loadout',
 'Auto Boltstorm Gauntlets and Fragstorm Grenade Launcher');
 const selected=readWargearChoiceState(aggressors,next);
 assert.deepEqual(selected.map(x=>[x.name,x.quantity]),[
  ['Twin Power Fists',3],['Auto Boltstorm Gauntlets and Fragstorm Grenade Launcher',3]]);
 const saved=buildManualWargearLoadout(aggressors,selected);
 assert.equal(saved.loadoutValidation.status,'rules-reviewed-valid');
 assert.deepEqual(saved.equippedWeapons.map(x=>[x.name,x.quantity]),[
  ['Twin Power Fists',3],['Auto Boltstorm Gauntlets',3],['Fragstorm Grenade Launcher',3]
 ]);
 assert.ok(renderWargearEditor(aggressors).includes('data-wargear-baseline'));
 const mixed={...aggressors,equippedWargear:[
  {name:'Twin Power Fists',quantity:3},{name:'Flamestorm Gauntlets',quantity:2},
  {name:'Auto Boltstorm Gauntlets and Fragstorm Grenade Launcher',quantity:1}
 ]};
 assert.equal(validateWargearLoadout(mixed).status,'rules-invalid',
  'the current datasheet says all models switch together');
 const larger={...aggressors,modelCount:6};
 const resized=resizeWargearChoices(aggressors,larger,next);
 assert.equal(readWargearChoiceState(larger,resized).find(x=>x.name==='Auto Boltstorm Gauntlets and Fragstorm Grenade Launcher').quantity,6);
});

test('heavy-bolter Eradicators have fixed published equipment; 3- and 6-model units scale',()=>{
 for(const n of [3,6]){
  const erad=find('Eradicator Squad with Heavy Bolters','hb-'+n,n);
  const rules=getTyranidWargearRuleSet(erad.datasheetId);
  assert.equal(rules.verificationLevel,'official-june-faction-pack-and-11e-cross-check');
  assert.equal(rules.slots?.length??0,0);
  const selections=readWargearChoiceState(erad,createWargearChoiceState(erad));
  assert.deepEqual(selections.map(x=>[x.name,x.quantity]),[
   ['Bolt pistol',n],['Heavy Bolter',n],['Close combat weapon',n]]);
  const saved=buildManualWargearLoadout(erad,selections);
  assert.equal(saved.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(saved.equippedWeapons.find(x=>x.name==='Heavy Bolter').quantity,n);
  const wrong={...erad,equippedWargear:selections.filter(x=>x.name!=='Heavy Bolter')};
  assert.equal(validateWargearLoadout(wrong).status,'rules-invalid');
 }
});

test('Assault Terminators handle individual shield choices without inventing mixed-model wound totals',()=>{
 const squad=find('Terminator Assault Squad','assault',5);
 assert.equal(squad.datasheet.characteristics.Toughness,'6');
 assert.equal(squad.datasheet.characteristics['Invulnerable save'],'4+');
 assert.equal(squad.datasheet.weapons.find(x=>x.name==='Thunder Hammer').damage,'3');
 assert.equal(squad.datasheet.weapons.find(x=>x.name==='Twin Lightning Claws').attacks,'6');
 const original=createWargearChoiceState(squad);
 assert.deepEqual(readWargearChoiceState(squad,original),[{name:'Twin Lightning Claws',quantity:5}]);
 const mixed=changeWargearQuantity(squad,original,'model-melee-loadout','Thunder Hammer and Storm Shield',1);
 const equip=readWargearChoiceState(squad,mixed);
 assert.deepEqual(Object.fromEntries(equip.map(item=>[item.name,item.quantity])),{
  'Twin Lightning Claws':4,'Thunder Hammer and Storm Shield':1
 });
 const built=buildManualWargearLoadout(squad,equip);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(built.equippedWeapons.find(x=>x.name==='Thunder Hammer').quantity,1);
 assert.equal(built.equippedWeapons.find(x=>x.name==='Twin Lightning Claws').quantity,4);
 assert.equal(assessUnitLoadoutReadiness({...squad,...built}).status,'complete');
 assert.equal(resolveBuilderUnitCost(squad,{units:[squad]},equip).points,175);
 const catalogEntry=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name==='Terminator Assault Squad');
 assert.equal(assessSavedUnitCost(catalogEntry,{...squad,points:175,equippedWargear:equip},{units:[squad]}).status,'matched');
 assert.equal(assessSavedUnitCost(catalogEntry,{...squad,points:170,equippedWargear:equip},{units:[squad]}).status,'mismatch');
 const editor=renderWargearEditor(squad);
 assert.match(editor,/The app does not automatically adjust mixed-model wounds/);
 assert.match(editor,/Storm Shield/);
 const tooMany={...squad,equippedWargear:[{name:'Twin Lightning Claws',quantity:5},{name:'Thunder Hammer and Storm Shield',quantity:1}]};
 assert.equal(validateWargearLoadout(tooMany).status,'rules-invalid');
});

test('Assault Terminator base price and 5-point per-shield upgrade work with 3rd+ copy and 10 models',()=>{
 const squad=(_id,n=5)=>find('Terminator Assault Squad',_id,n);
 const first=squad('one'),second=squad('two'),third=squad('three'),large=squad('large',10);
 const roster={units:[first,second,third]};
 assert.deepEqual(getBuilderModelCounts(first),[5,10]);
 assert.deepEqual([first,second,third].map(u=>resolveBuilderUnitCost(u,roster,[]).points),[170,170,210]);
 assert.equal(resolveBuilderUnitCost(third,roster,[{name:'Thunder Hammer and Storm Shield',quantity:5}]).points,235);
 assert.equal(resolveBuilderUnitCost(large,{units:[large]},[{name:'Thunder Hammer and Storm Shield',quantity:10}]).points,390);
 assert.equal(resolveBuilderUnitCost(large,{units:[large]},[{name:'Thunder Hammer and Storm Shield',quantity:11}]).points,null);
});

test('Legends-only Space Marine units retain explicit pending wargear review warnings',()=>{
 for(const name of ['Tactical Squad','Vindicator','Whirlwind']){
  const unit=find(name);
  assert.equal(getTyranidWargearRuleSet(unit.datasheetId),null,name+' should remain awaiting wargear audit');
  assert.match(renderWargearEditor(unit),/wargear review pending/);
 }
});
