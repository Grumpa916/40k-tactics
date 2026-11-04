import test from 'node:test';
import assert from 'node:assert/strict';

import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getOptionalWargearLimit} from '../../src/rules/wargear-quantity-limits.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState,chooseWargear,changeWargearQuantity,resizeWargearChoices} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';

const make=(name,id='test',models=null)=>{
 const candidate=findArmyUnitCandidates({faction:'Space Marines'}).find(u=>u.name===name);
 assert.ok(candidate,name+' exists in catalog');
 return {...candidate,id,datasheetId:candidate.id,modelCount:models??candidate.defaultModelCount};
};
const count=(list,name)=>list.find(x=>x.name===name)?.quantity??0;

test('current 11e Intercessor Sergeant options and two bolt rifle modes have complete source-scoped selections',()=>{
 const unit=make('Intercessor Squad');
 const rules=getTyranidWargearRuleSet(unit.datasheetId);
 assert.equal(rules.verificationLevel,'official-codex-preview-and-current-11e-reference');
 assert.deepEqual(getWargearSlots(unit).map(s=>s.slotId),['sergeant-melee','sergeant-rifle']);
 assert.equal(getWargearSlots(unit).every(s=>s.model===null),true);
 const state=createWargearChoiceState(unit);
 const selected=readWargearChoiceState(unit,state);
 assert.equal(count(selected,'Bolt Pistol'),5);
 assert.equal(count(selected,'Bolt Rifle'),5);
 assert.equal(count(selected,'Knives and Fists'),5);
 assert.equal(validateWargearLoadout({...unit,equippedWargear:selected}).status,'rules-reviewed-valid',
  'overlapping Sergeant slot defaults must not count as extra fixed weapons');
 const profiles=unit.datasheet.weapons;
 const focus=profiles.find(x=>x.name==='Bolt Rifle - Focused Fire');
 const saturation=profiles.find(x=>x.name==='Bolt Rifle - Saturation');
 assert.deepEqual([focus.range,focus.attacks,focus.strength,focus.damage],['24"','1','6','2']);
 assert.deepEqual([saturation.attacks,saturation.strength,saturation.damage],['2','5','1']);
 assert.match(focus.abilities,/Rapid Fire 1/);
 assert.match(saturation.abilities,/Assault/);
 const saved=buildManualWargearLoadout(unit,selected);
 assert.equal(saved.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(count(saved.equippedWargear,'Bolt Rifle'),5,
  'two attack modes must be one equipment selection');
 assert.equal(count(saved.equippedWeapons,'Bolt Rifle - Focused Fire'),5);
 assert.equal(count(saved.equippedWeapons,'Bolt Rifle - Saturation'),5);
 assert.equal(assessUnitLoadoutReadiness({...unit,...saved}).status,'complete');
});

test('Intercessor Sergeant replaces their own melee and rifle without removing trooper guns',()=>{
 const unit=make('Intercessor Squad');
 let state=createWargearChoiceState(unit);
 state=chooseWargear(unit,state,'sergeant-melee:0','Thunder Hammer');
 state=chooseWargear(unit,state,'sergeant-rifle:0','Plasma Pistol');
 const selections=readWargearChoiceState(unit,state);
 assert.equal(count(selections,'Knives and Fists'),4);
 assert.equal(count(selections,'Bolt Rifle'),4);
 assert.equal(count(selections,'Thunder Hammer'),1);
 assert.equal(count(selections,'Plasma Pistol'),1);
 assert.equal(count(selections,'Bolt Pistol'),5);
 assert.equal(validateWargearLoadout({...unit,equippedWargear:selections}).status,'rules-reviewed-valid');
 const built=buildManualWargearLoadout(unit,selections);
 assert.equal(count(built.equippedWeapons,'Bolt Rifle - Focused Fire'),4);
 assert.equal(count(built.equippedWeapons,'Plasma Pistol - Standard'),1);
 assert.equal(count(built.equippedWeapons,'Plasma Pistol - Supercharge'),1);
 assert.equal(count(built.equippedWeapons,'Thunder Hammer'),1);
 assert.equal(assessUnitLoadoutReadiness({...unit,...built}).status,'complete');
 const tooMany={...unit,equippedWargear:[...selections,{name:'Power Fist',quantity:1}]};
 assert.equal(validateWargearLoadout(tooMany).status,'rules-invalid');
 const html=renderWargearEditor(unit);
 assert.match(html,/sergeant melee/);
 assert.match(html,/sergeant rifle/);
 assert.match(html,/Grenade Launcher/);
 assert.match(html,/Sergeant replacements affect the Sergeant only/);
});

test('Intercessor optional grenade launchers use one-per-five cap in editor and validator',()=>{
 const small=make('Intercessor Squad','i5',5),large=make('Intercessor Squad','i10',10);
 const option=getTyranidWargearRuleSet(small.datasheetId).optional[0];
 assert.equal(getOptionalWargearLimit(5,option),1);
 assert.equal(getOptionalWargearLimit(10,option),2);
 assert.equal(getOptionalWargearLimit(1,option),0);
 for(const [unit,cap] of [[small,1],[large,2]]){
  const state=createWargearChoiceState(unit);
  state.optional['Grenade Launcher']=cap;
  const good=readWargearChoiceState(unit,state);
  assert.equal(validateWargearLoadout({...unit,equippedWargear:good}).status,'rules-reviewed-valid');
  assert.equal(count(good,'Grenade Launcher'),cap);
  const built=buildManualWargearLoadout(unit,good);
  assert.equal(count(built.equippedWeapons,'Grenade Launcher - Frag'),cap);
  assert.equal(count(built.equippedWeapons,'Grenade Launcher - Krak'),cap);
  state.optional['Grenade Launcher']=cap+1;
  assert.equal(validateWargearLoadout({...unit,equippedWargear:readWargearChoiceState(unit,state)}).status,'rules-invalid');
  assert.match(renderWargearEditor(unit),new RegExp('Up to '+cap+'; one per 5 models'));
 }
 const original=createWargearChoiceState(large);
 original.optional['Grenade Launcher']=2;
 const resized=resizeWargearChoices(large,small,original);
 assert.equal(resized.optional['Grenade Launcher'],1,'downsizing to five models removes invalid extra launchers');
});

test('Melta Eradicators select one Multi-melta per three models while preserving Hunter fire modes',()=>{
 const profile=make('Eradicator Squad with Melta Rifles','e3',3);
 const weapons=profile.datasheet.weapons;
 const rifle=weapons.find(x=>x.name==='Melta Rifle');
 const hunter=weapons.find(x=>x.name==='Melta Rifle - Hunter');
 const multi=weapons.find(x=>x.name==='Multi-melta');
 assert.deepEqual([rifle.strength,rifle.ap,rifle.damage],['10','-3','D3+2']);
 assert.deepEqual([hunter.skill,hunter.strength],['2+','12']);
 assert.match(hunter.abilities,/Monster\/Vehicle only/);
 assert.equal(multi.attacks,'2');
 assert.match(multi.abilities,/Melta 3/);
 for(const [size,maximum] of [[3,1],[6,2]]){
  const unit=make('Eradicator Squad with Melta Rifles','er'+size,size);
  let state=createWargearChoiceState(unit);
  const rules=getTyranidWargearRuleSet(unit.datasheetId);
  assert.ok(rules.constraints.some(x=>x.type==='max-per-models'&&x.models===3));
  const before=readWargearChoiceState(unit,state);
  assert.equal(count(before,'Melta Rifle'),size);
  assert.equal(count(before,'Bolt Pistol'),size);
  assert.equal(count(before,'Ceramite Fists'),size);
  for(let i=0;i<maximum;i++) state=changeWargearQuantity(unit,state,'rifle','Multi-melta',1);
  const selected=readWargearChoiceState(unit,state);
  assert.equal(count(selected,'Multi-melta'),maximum);
  assert.equal(count(selected,'Melta Rifle'),size-maximum);
  assert.equal(validateWargearLoadout({...unit,equippedWargear:selected}).status,'rules-reviewed-valid');
  const more=changeWargearQuantity(unit,state,'rifle','Multi-melta',1);
  assert.deepEqual(more,state,'one-per-three max prevents adding another Multi-melta');
  const built=buildManualWargearLoadout(unit,selected);
  assert.equal(count(built.equippedWeapons,'Multi-melta'),maximum);
  assert.equal(count(built.equippedWeapons,'Multi-melta - Hunter'),maximum);
  assert.equal(count(built.equippedWeapons,'Melta Rifle'),size-maximum);
  assert.equal(count(built.equippedWeapons,'Melta Rifle - Hunter'),size-maximum);
  assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(assessUnitLoadoutReadiness({...unit,...built}).status,'complete');
  assert.match(renderWargearEditor(unit),/Hunter profiles target Monster or Vehicle/);
  const pts=resolveBuilderUnitCost(unit,{units:[unit]},selected);
  assert.equal(pts.points,size===3?100:200);
 }
});

test('Existing Tyranid and Custodes optional caps and unreviewed Marine warnings remain unchanged',()=>{
 assert.equal(getOptionalWargearLimit(3,{perModel:2}),6);
 assert.equal(getOptionalWargearLimit(3,{perModel:1}),3);
 const unreviewed=make('Invader ATVs');
 assert.equal(getTyranidWargearRuleSet(unreviewed.datasheetId),null);
 assert.match(renderWargearEditor(unreviewed),/wargear review pending/);
});
