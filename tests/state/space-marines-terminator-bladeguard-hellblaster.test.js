import test from 'node:test';
import assert from 'node:assert/strict';

import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState,chooseWargear,checkWargearChoice} from '../../src/rules/army-wargear-choices.js';
import {buildManualWargearLoadout,validateWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessSavedUnitCost} from '../../src/rules/roster-rules-data-validation.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';

const make=(name,id='unit',modelCount)=>{
 const candidate=findArmyUnitCandidates({faction:'Space Marines'}).find(u=>u.name===name);
 assert.ok(candidate, 'catalog contains '+name);
 return {...candidate,id,datasheetId:candidate.id,modelCount:modelCount??candidate.defaultModelCount};
};
const amount=(list,name)=>list.find(x=>x.name===name)?.quantity??0;
const selection=(unit,state)=>readWargearChoiceState(unit,state);
const verified=(unit,state)=>{
 const selected=selection(unit,state);
 const validation=validateWargearLoadout({...unit,equippedWargear:selected});
 assert.equal(validation.status,'rules-reviewed-valid',validation.errors?.join(', '));
 const result=buildManualWargearLoadout(unit,selected);
 assert.equal(result.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...unit,...result}).status,'complete');
 return result;
};

test('Bladeguard Sgt pistol choices preserve normal members and current 11e profiles',()=>{
 for(const n of [3,6]){
  const unit=make('Bladeguard Veteran Squad','bg-'+n,n);
  const rules=getTyranidWargearRuleSet(unit.datasheetId);
  assert.equal(rules.slots.length,1);
  assert.deepEqual(getBuilderModelCounts(unit),[3,6]);
  assert.equal(unit.datasheet.characteristics.Toughness,'5');
  assert.equal(unit.datasheet.characteristics['Invulnerable save'],'4+');
  const weapons=unit.datasheet.weapons;
  assert.deepEqual(weapons.find(x=>x.name==='Neo-volkite Pistol').damage,'2');
  assert.match(weapons.find(x=>x.name==='Neo-volkite Pistol').abilities,/Devastating Wounds/);
  assert.equal(weapons.find(x=>x.name==='Master-crafted Power Sword').damage,'2');
  let state=createWargearChoiceState(unit);
  assert.equal(amount(selection(unit,state),'Heavy Bolt Pistol'),n);
  assert.equal(amount(selection(unit,state),'Master-crafted Power Sword'),n);
  verified(unit,state);
  state=chooseWargear(unit,state,'bladeguard-sergeant-pistol:0','Plasma Pistol');
  const equipped=verified(unit,state);
  assert.equal(amount(equipped.equippedWargear,'Heavy Bolt Pistol'),n-1);
  assert.equal(amount(equipped.equippedWargear,'Plasma Pistol'),1);
  assert.equal(amount(equipped.equippedWeapons,'Plasma Pistol - Supercharge'),1);
  assert.equal(amount(equipped.equippedWeapons,'Master-crafted Power Sword'),n);
  assert.match(renderWargearEditor(unit),/bladeguard sergeant pistol/);
  const other=chooseWargear(unit,state,'bladeguard-sergeant-pistol:0','Neo-volkite Pistol');
  assert.equal(amount(verified(unit,other).equippedWeapons,'Neo-volkite Pistol'),1);
 }
});

test('Hellblasters assign only a Sergeant plasma pistol and include the two incinerator modes',()=>{
 for(const n of [5,10]){
  const unit=make('Hellblaster Squad','hb-'+n,n);
  const rules=getTyranidWargearRuleSet(unit.datasheetId);
  assert.equal(rules.slots.length,1);
  const profiles=unit.datasheet.weapons;
  const standard=profiles.find(x=>x.name==='Plasma Incinerator - Standard');
  const supercharge=profiles.find(x=>x.name==='Plasma Incinerator - Supercharge');
  assert.deepEqual([standard.attacks,standard.strength,standard.damage],['2','7','2']);
  assert.match(standard.abilities,/Rapid Fire 1/);
  assert.match(supercharge.abilities,/Hazardous/);
  assert.equal(supercharge.damage,'2');
  assert.match(unit.datasheet.abilities[0].description,/Hazardous rolls/);
  let state=createWargearChoiceState(unit);
  assert.equal(amount(selection(unit,state),'Bolt Pistol'),n);
  assert.equal(amount(selection(unit,state),'Plasma Incinerator'),n);
  verified(unit,state);
  state=chooseWargear(unit,state,'hellblaster-sergeant-pistol:0','Plasma Pistol');
  const saved=verified(unit,state);
  assert.equal(amount(saved.equippedWargear,'Bolt Pistol'),n-1);
  assert.equal(amount(saved.equippedWeapons,'Plasma Pistol - Supercharge'),1);
  assert.equal(amount(saved.equippedWeapons,'Plasma Incinerator - Supercharge'),n);
  assert.equal(amount(saved.equippedWeapons,'Plasma Incinerator - Standard'),n);
  assert.equal(amount(saved.equippedWargear,'Plasma Incinerator'),n,
    'dual firing modes must remain a single equipped weapon');
  assert.match(renderWargearEditor(unit),/hellblaster sergeant pistol/);
 }
 const first=make('Hellblaster Squad','h1'),second=make('Hellblaster Squad','h2'),third=make('Hellblaster Squad','h3');
 const roster={units:[first,second,third]};
 assert.deepEqual([first,second,third].map(u=>resolveBuilderUnitCost(u,roster).points),[115,115,130]);
 const big=make('Hellblaster Squad','h10',10);
 assert.equal(resolveBuilderUnitCost(big,{units:[big]}).points,230);
});

test('Terminator Sergeant choices, trooper weapons, and Cyclone launcher retain the correct storm bolter',()=>{
 for(const n of [5,10]){
  const unit=make('Terminator Squad','term-'+n,n);
  const rules=getTyranidWargearRuleSet(unit.datasheetId);
  const slots=getWargearSlots(unit);
  assert.equal(slots.length,1+2*(n-1));
  assert.equal(slots.filter(s=>s.model==null).length,1,'Sergeant-only melee slot');
  assert.equal(slots.filter(s=>s.slotId==='terminator-trooper-ranged').length,n-1);
  assert.equal(unit.datasheet.characteristics.Toughness,'6');
  assert.equal(unit.datasheet.characteristics['Invulnerable save'],'4+');
  assert.equal(unit.datasheet.weapons.find(x=>x.name==='Storm Bolter').strength,'5');
  assert.equal(unit.datasheet.weapons.find(x=>x.name==='Cyclone Missile Launcher - Krak').damage,'D3+3');
  assert.equal(unit.datasheet.weapons.find(x=>x.name==='Chainfist - Hunter').strength,'12');
  let state=createWargearChoiceState(unit);
  assert.equal(amount(selection(unit,state),'Power Fist'),n);
  assert.equal(amount(selection(unit,state),'Storm Bolter'),n);
  verified(unit,state);
  state=chooseWargear(unit,state,'terminator-sergeant-melee:0','Power Weapon');
  state=chooseWargear(unit,state,'terminator-trooper-melee:0','Chainfist');
  state=chooseWargear(unit,state,'terminator-trooper-ranged:0','Cyclone Missile Launcher and Storm Bolter');
  const equipped=verified(unit,state);
  assert.equal(amount(equipped.equippedWargear,'Power Weapon'),1);
  assert.equal(amount(equipped.equippedWargear,'Chainfist'),1);
  assert.equal(amount(equipped.equippedWargear,'Cyclone Missile Launcher and Storm Bolter'),1);
  assert.equal(amount(equipped.equippedWeapons,'Storm Bolter'),n,'Cyclone bearer retains a storm bolter');
  assert.equal(amount(equipped.equippedWeapons,'Cyclone Missile Launcher - Frag'),1);
  assert.equal(amount(equipped.equippedWeapons,'Cyclone Missile Launcher - Krak'),1);
  assert.equal(amount(equipped.equippedWeapons,'Chainfist - Hunter'),1);
  assert.match(renderWargearEditor(unit),/Sergeant/);
  assert.match(renderWargearEditor(unit),/Terminator Squad 1/);
  assert.match(renderWargearEditor(unit),/Cyclone Missile Launcher/);
  const base=resolveBuilderUnitCost(unit,{units:[unit]},equipped.equippedWargear);
  assert.equal(base.points,n===5?200:390);
  const max=Math.floor(n/5);
  for(let i=1;i<max;i++)state=chooseWargear(unit,state,'terminator-trooper-ranged:'+i,'Assault Cannon');
  assert.ok(checkWargearChoice(unit,state,'terminator-trooper-ranged:'+max,'Heavy Flamer'),
    'combining all special weapon categories must respect one per five models');
 }
});

test('Terminator copy-order and Cyclone army points are checked using the equipped selection',()=>{
 const first=make('Terminator Squad','t1'),second=make('Terminator Squad','t2'),third=make('Terminator Squad','t3');
 const roster={units:[first,second,third]};
 assert.deepEqual([first,second,third].map(u=>resolveBuilderUnitCost(u,roster).points),[190,190,230]);
 const selected=[{name:'Cyclone Missile Launcher and Storm Bolter',quantity:1}];
 assert.equal(resolveBuilderUnitCost(third,roster,selected).points,240);
 const catalog=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name==='Terminator Squad');
 assert.equal(assessSavedUnitCost(catalog,{...third,points:240,equippedWargear:selected},roster).status,'matched');
 assert.equal(assessSavedUnitCost(catalog,{...third,points:230,equippedWargear:selected},roster).status,'mismatch');
 assert.equal(resolveBuilderUnitCost(third,roster,[{name:'Cyclone Missile Launcher and Storm Bolter',quantity:2}]).points,null);
 const big=make('Terminator Squad','big',10);
 assert.equal(resolveBuilderUnitCost(big,{units:[big]},[{name:'Cyclone Missile Launcher and Storm Bolter',quantity:2}]).points,400);
 assert.equal(getBuilderModelCounts(big).join(','),'5,10');
});

test('Unreviewed Space Marine datasheets still display an explicit wargear warning',()=>{
 const unit=make('Tactical Squad','unreviewed');
 assert.equal(getTyranidWargearRuleSet(unit.datasheetId),null);
 assert.match(renderWargearEditor(unit),/wargear review pending/);
});
