import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getOptionalWargearLimit} from '../../src/rules/wargear-quantity-limits.js';
import {createWargearChoiceState,readWargearChoiceState,resizeWargearChoices} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {importWarhammerAppRoster} from '../../src/state/warhammer-app-roster-import.js';

function make(name,id=name,modelCount) {
 const item=findArmyUnitCandidates({faction:'Space Marines'}).find(u=>u.name===name);
 assert.ok(item,'catalog '+name);
 return {...item,id,datasheetId:item.id,modelCount:modelCount??item.defaultModelCount};
}
const qty=(items,name)=>items?.find(x=>x.name===name)?.quantity??0;
function checkEquipped(unit,state) {
 const items=readWargearChoiceState(unit,state);
 const check=validateWargearLoadout({...unit,equippedWargear:items});
 assert.equal(check.status,'rules-reviewed-valid',check.errors?.join('; '));
 const built=buildManualWargearLoadout(unit,items);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...unit,...built}).status,'complete');
 return built;
}

test('Incursor Squad 5/10 models have fixed 11e Phobos weapons and built-in Haywire Mine ability',()=>{
 for(const size of [5,10]) {
  const u=make('Incursor Squad','inc'+size,size);
  const r=getTyranidWargearRuleSet(u.datasheetId);
  assert.equal(r.slots?.length??0,0);
  assert.equal(r.optional?.length??0,0,'mine is not an equipment picker');
  assert.deepEqual(getBuilderModelCounts(u),[5,10]);
  assert.equal(u.datasheet.characteristics.Move,'8"');
  assert.equal(u.datasheet.characteristics.Toughness,'4');
  assert.equal(u.datasheet.characteristics.Wounds,'2');
  const selected=readWargearChoiceState(u,createWargearChoiceState(u));
  assert.deepEqual(selected.map(x=>[x.name,x.quantity]),[
    ['Bolt Pistol',size],['Occulus Bolt Carbine',size],['Paired Combat Blades',size]
  ]);
  const ready=checkEquipped(u,createWargearChoiceState(u));
  assert.equal(qty(ready.equippedWeapons,'Occulus Bolt Carbine'),size);
  assert.equal(qty(ready.equippedWeapons,'Paired Combat Blades'),size);
  const weapons=u.datasheet.weapons;
  assert.equal(weapons.find(x=>x.name==='Occulus Bolt Carbine').strength,'5');
  assert.match(weapons.find(x=>x.name==='Occulus Bolt Carbine').abilities,/Ignores Cover/);
  assert.equal(weapons.find(x=>x.name==='Paired Combat Blades').strength,'5');
  assert.ok(u.datasheet.abilities.some(x=>x.name==='Divinator-class Auspexes'));
  assert.ok(u.datasheet.abilities.some(x=>x.name==='Haywire Mine'));
  assert.match(renderWargearEditor(u),/Haywire Mine is a once-per-battle unit ability/);
 }
});

test('Infiltrator Squad allows at most one Helix Gauntlet, removes obsolete Comms Array',()=>{
 for(const size of [5,10]) {
  const u=make('Infiltrator Squad','inf'+size,size);
  const r=getTyranidWargearRuleSet(u.datasheetId);
  assert.equal(r.optional?.length,1);
  assert.equal(r.optional[0].name,'Helix Gauntlet');
  assert.equal(getOptionalWargearLimit(size,r.optional[0]),1);
  assert.deepEqual(getBuilderModelCounts(u),[5,10]);
  const state=createWargearChoiceState(u);
  assert.equal(qty(readWargearChoiceState(u,state),'Helix Gauntlet'),0);
  checkEquipped(u,state);
  state.optional['Helix Gauntlet']=1;
  const ready=checkEquipped(u,state);
  assert.equal(qty(ready.equippedWargear,'Helix Gauntlet'),1);
  assert.equal(qty(ready.equippedWeapons,'Marksman Bolt Carbine'),size);
  assert.equal(qty(ready.equippedWeapons,'Ceramite Fists'),size);
  state.optional['Helix Gauntlet']=2;
  assert.equal(validateWargearLoadout({...u,equippedWargear:readWargearChoiceState(u,state)}).status,'rules-invalid');
  const obsolete={...u,equippedWargear:[
    ...readWargearChoiceState(u,createWargearChoiceState(u)),
    {name:'Infiltrator Comms Array',quantity:1}
  ]};
  assert.equal(validateWargearLoadout(obsolete).status,'rules-invalid');
  const rifle=u.datasheet.weapons.find(x=>x.name==='Marksman Bolt Carbine');
  assert.deepEqual([rifle.range,rifle.attacks,rifle.strength,rifle.ap],['24"','2','5','-1']);
  assert.match(rifle.abilities,/Precision/);
  assert.ok(u.datasheet.abilities.some(x=>x.name==='Omni-scramblers'&&/detected/.test(x.description)));
  assert.match(renderWargearEditor(u),/Up to 1 per unit/);
  assert.match(renderWargearEditor(u),/older Infiltrator Comms Array/);
 }
 const a=make('Infiltrator Squad','ten',10),b=make('Infiltrator Squad','five',5);
 const state=createWargearChoiceState(a);
 state.optional['Helix Gauntlet']=1;
 assert.equal(resizeWargearChoices(a,b,state).optional['Helix Gauntlet'],1);
});

test('Reivers keep all three 11e weapons and allow one of each unit-level Grapnel/Grav option',()=>{
 for(const size of [5,10]) {
  const u=make('Reiver Squad','reiver'+size,size);
  const r=getTyranidWargearRuleSet(u.datasheetId);
  assert.equal(r.slots?.length??0,0,'obsolete 10e knife/carbine replacements cannot be offered');
  assert.deepEqual(r.optional.map(x=>x.name),['Grav-chutes','Grapnel Launchers']);
  assert.ok(r.optional.every(x=>getOptionalWargearLimit(size,x)===1));
  const state=createWargearChoiceState(u);
  const before=checkEquipped(u,state);
  assert.equal(qty(before.equippedWeapons,'Bolt Carbine'),size);
  assert.equal(qty(before.equippedWeapons,'Special-issue Bolt Pistol'),size);
  assert.equal(qty(before.equippedWeapons,'Monomolecular Combat Knife'),size);
  state.optional['Grav-chutes']=1;
  state.optional['Grapnel Launchers']=1;
  const ready=checkEquipped(u,state);
  assert.equal(qty(ready.equippedWargear,'Grav-chutes'),1);
  assert.equal(qty(ready.equippedWargear,'Grapnel Launchers'),1);
  state.optional['Grav-chutes']=2;
  assert.equal(validateWargearLoadout({...u,equippedWargear:readWargearChoiceState(u,state)}).status,'rules-invalid');
  const knife=u.datasheet.weapons.find(x=>x.name==='Monomolecular Combat Knife');
  assert.deepEqual([knife.attacks,knife.strength,knife.ap],['4','5','-1']);
  assert.match(knife.abilities,/Precision/);
  assert.ok(u.datasheet.abilities.some(x=>x.name==='Terror Troops (Aura)'));
  assert.ok(u.datasheet.abilities.some(x=>x.name==='Fearsome Assault'));
  const html=renderWargearEditor(u);
  assert.match(html,/Grav-chutes/);
  assert.match(html,/Grapnel Launchers/);
  assert.match(html,/Up to 1 per unit/);
 }
});

test('Phobos squad sizes and Incursor additional-copy pricing preserve 11e reviewed bands',()=>{
 const a=make('Incursor Squad','a',5),b=make('Incursor Squad','b',10),c=make('Incursor Squad','c',5);
 const roster={units:[a,b,c]};
 assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,roster).points),[90,170,100]);
 const d=make('Incursor Squad','d',10);
 assert.equal(resolveBuilderUnitCost(d,{units:[a,b,d]}).points,180);
 const inf=make('Infiltrator Squad','inf');
 assert.deepEqual(getBuilderModelCounts(inf),[5,10]);
 assert.equal(resolveBuilderUnitCost(inf,{units:[inf]}).points,85);
 assert.equal(resolveBuilderUnitCost({...inf,modelCount:10},{units:[{...inf,modelCount:10}]}).points,150);
 const reiv=make('Reiver Squad','reiv');
 assert.deepEqual(getBuilderModelCounts(reiv),[5,10]);
 assert.equal(resolveBuilderUnitCost(reiv,{units:[reiv]}).points,85);
 assert.equal(resolveBuilderUnitCost({...reiv,modelCount:10},{units:[{...reiv,modelCount:10}]}).points,165);
});

test('Incursors with unequivocal fixed equipment import ready without typing; optional-unit choices are not silently asserted',()=>{
 const result=importWarhammerAppRoster({text:
  'Space Marines\nOTHER DATASHEETS\nIncursor Squad (90 pts)\nInfiltrator Squad (85 pts)\nReiver Squad (85 pts)',
  faction:'Space Marines',name:'Phobos review',id:'phobos-test',pointsLimit:2000
 });
 assert.equal(result.unrecognized.length,0);
 assert.equal(result.roster.units.length,3);
 const [incursor,infiltrator,reiver]=result.roster.units;
 assert.equal(incursor.loadoutValidation?.status,'rules-reviewed-valid');
 assert.equal(incursor.loadoutValidation?.source,'reviewed-fixed-equipment-import');
 assert.equal(qty(incursor.equippedWeapons,'Occulus Bolt Carbine'),5);
 assert.notEqual(infiltrator.loadoutValidation?.source,'reviewed-fixed-equipment-import');
 assert.notEqual(reiver.loadoutValidation?.source,'reviewed-fixed-equipment-import');
});

test('Phobos equipment slot limits do not alter unrelated factions or unreviewed Marine warnings',()=>{
 assert.equal(getOptionalWargearLimit(3,{perModel:2}),6);
 assert.equal(getOptionalWargearLimit(10,{perModels:5,maxEach:1}),2);
 assert.equal(getOptionalWargearLimit(10,{maxTotal:1}),1);
 const unreviewed=make('Desolation Squad');
 assert.equal(getTyranidWargearRuleSet(unreviewed.datasheetId),null);
 assert.match(renderWargearEditor(unreviewed),/Space Marines wargear review pending/);
});
