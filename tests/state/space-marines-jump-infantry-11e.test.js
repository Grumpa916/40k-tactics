import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
const get=(name,size,id=name)=>{
 const u=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name);
 assert.ok(u,'Space Marine '+name);
 return {...u,id,datasheetId:u.id,modelCount:size};
};
const quantity=(items,name)=>items.find(x=>x.name===name)?.quantity??0;
const set=(state,slotId,index,name)=>{const k=slotId+':'+index;assert.ok(k in state.assignments,k);state.assignments[k]=name;};
const inspect=(u,state)=>{
 const selections=readWargearChoiceState(u,state);
 const check=validateWargearLoadout({...u,equippedWargear:selections});
 assert.equal(check.status,'rules-reviewed-valid',check.errors.join('; '));
 const loadout=buildManualWargearLoadout(u,selections);
 assert.equal(loadout.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...u,...loadout}).status,'complete');
 return {selections,loadout};
};
test('Assault Jump Pack unit: 5/10 models have Sergeant-only options and max one ordinary plasma per five',()=>{
 for(const count of [5,10]){
  const u=get('Assault Intercessors with Jump Packs',count),st=createWargearChoiceState(u);
  assert.deepEqual(getBuilderModelCounts(u),[5,10]);
  assert.equal(getWargearSlots(u).length,count+1);
  const base=inspect(u,st);
  assert.equal(quantity(base.selections,'Heavy Bolt Pistol'),count);
  assert.equal(quantity(base.selections,'Chainsword'),count);
  set(st,'jump-assault-sergeant-pistol',0,'Sergeant Plasma Pistol');
  set(st,'jump-assault-sergeant-melee',0,'Power Fist');
  for(let i=0;i<count/5;i++)set(st,'jump-assault-trooper-pistol',i,'Plasma Pistol');
  const reviewed=inspect(u,st);
  assert.equal(quantity(reviewed.selections,'Chainsword'),count-1);
  assert.equal(quantity(reviewed.selections,'Power Fist'),1);
  assert.equal(quantity(reviewed.selections,'Sergeant Plasma Pistol'),1);
  assert.equal(quantity(reviewed.selections,'Plasma Pistol'),count/5);
  assert.equal(quantity(reviewed.loadout.equippedWeapons,'Plasma Pistol - Standard'),1+count/5);
  assert.equal(quantity(reviewed.loadout.equippedWeapons,'Plasma Pistol - Supercharge'),1+count/5);
  const wrong={...st,assignments:{...st.assignments}};
  set(wrong,'jump-assault-trooper-pistol',count/5,'Plasma Pistol');
  assert.match(validateWargearLoadout({...u,equippedWargear:readWargearChoiceState(u,wrong)}).errors.join(';'),/Plasma Pistol/);
  assert.equal(u.datasheet.characteristics.Toughness,'5');
  assert.equal(u.datasheet.characteristics['Objective Control'],'1');
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Power Fist').strength,'8');
  assert.ok(u.datasheet.abilities.some(x=>x.name==='Hammer of Wrath'));
  assert.match(renderWargearEditor(u),/Hammer of Wrath/);
 }
});
test('Vanguard Jump Pack unit: Sergeant Relic Blade, 2 ordinary plasma per 5, individual shield replaces pistol',()=>{
 for(const count of [5,10]){
  const u=get('Vanguard Veteran Squad with Jump Packs',count),st=createWargearChoiceState(u);
  assert.deepEqual(getBuilderModelCounts(u),[5,10]);
  assert.equal(getWargearSlots(u).length,count+1);
  const base=inspect(u,st);
  assert.equal(quantity(base.selections,'Heavy Bolt Pistol'),count);
  assert.equal(quantity(base.selections,'Master-crafted Power Weapon'),count-1);
  assert.equal(quantity(base.selections,'Relic Blade'),1);
  set(st,'jump-vanguard-sergeant-melee',0,'Thunder Hammer');
  set(st,'jump-vanguard-sergeant-pistol',0,'Sergeant Plasma Pistol');
  for(let i=0;i<count/5*2;i++)set(st,'jump-vanguard-trooper-pistol',i,'Plasma Pistol');
  set(st,'jump-vanguard-trooper-pistol',count-2,'Combat Shield');
  const reviewed=inspect(u,st);
  assert.equal(quantity(reviewed.selections,'Thunder Hammer'),1);
  assert.equal(quantity(reviewed.selections,'Relic Blade'),0);
  assert.equal(quantity(reviewed.selections,'Plasma Pistol'),count/5*2);
  assert.equal(quantity(reviewed.selections,'Sergeant Plasma Pistol'),1);
  assert.equal(quantity(reviewed.selections,'Combat Shield'),1);
  assert.equal(quantity(reviewed.loadout.equippedWeapons,'Combat Shield'),0,'shields are defensive gear not an attack');
  const bad={...st,assignments:{...st.assignments}};
  set(bad,'jump-vanguard-trooper-pistol',count/5*2,'Plasma Pistol');
  assert.match(validateWargearLoadout({...u,equippedWargear:readWargearChoiceState(u,bad)}).errors.join(';'),/Plasma Pistol/);
  assert.match(u.datasheet.abilities.find(x=>x.name==='Combat Shield').description,/only/i);
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Master-crafted Power Weapon').damage,'2');
  assert.match(renderWargearEditor(u),/5\+ invulnerable save/);
 }
});
test('Both jump datasheets reject obsolete 10th edition Vanguard weapons and preserve new 11e additional-copy pricing',()=>{
 const v=get('Vanguard Veteran Squad with Jump Packs',5);
 for(const name of ['Storm Shield','Grav-pistol','Inferno Pistol','Hand Flamer']){
  const invalid=validateWargearLoadout({...v,equippedWargear:[
   ...readWargearChoiceState(v,createWargearChoiceState(v)),{name,quantity:1}
  ]});
  assert.equal(invalid.status,'rules-invalid');
 }
 const a=get('Assault Intercessors with Jump Packs',5,'ja');
 const b=get('Assault Intercessors with Jump Packs',10,'jb');
 const c=get('Assault Intercessors with Jump Packs',5,'jc');
 assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,{units:[a,b,c]}).points),[95,190,105]);
 const vd=get('Vanguard Veteran Squad with Jump Packs',10,'vd');
 assert.equal(resolveBuilderUnitCost(vd,{units:[vd]}).points,220);
 const v3=get('Vanguard Veteran Squad with Jump Packs',5,'v3');
 assert.equal(resolveBuilderUnitCost(v3,{units:[get(v.name,5,'v1'),get(v.name,10,'v2'),v3]}).points,130);
 assert.equal(getTyranidWargearRuleSet('space-marines:ancient'),null,'next batch still pending');
});
