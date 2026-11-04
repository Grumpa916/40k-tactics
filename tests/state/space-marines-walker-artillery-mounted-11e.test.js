import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {createWargearChoiceState,readWargearChoiceState,chooseWargear,getWargearSlots} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
const get=(name,size,id=name)=>{
 const u=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name);
 assert.ok(u,'Missing '+name);
 return {...u,id,datasheetId:u.id,modelCount:size??u.defaultModelCount};
};
const qty=(items,name)=>items.find(x=>x.name===name)?.quantity??0;
function reviewed(u,state){
 const selections=readWargearChoiceState(u,state);
 const valid=validateWargearLoadout({...u,equippedWargear:selections});
 assert.equal(valid.status,'rules-reviewed-valid',valid.errors.join('; '));
 const out=buildManualWargearLoadout(u,selections);
 assert.equal(out.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...u,...out}).status,'complete');
 return {...out,equippedWargear:selections};
}

test('Invictor is one model, keeps four weapons and swaps only Incendium for Twin Ironhail Autocannon',()=>{
 const u=get('Invictor Tactical Warsuit',1),st=createWargearChoiceState(u);
 assert.deepEqual(getBuilderModelCounts(u),[1]);
 assert.equal(getWargearSlots(u).length,1);
 const base=reviewed(u,st);
 for(const n of ['Fragstorm Grenade Launcher','Heavy Bolter','Invictor Fist','Ironhail Heavy Stubbers','Incendium Cannon'])
  assert.equal(qty(base.equippedWargear,n),1,n);
 assert.equal(qty(base.equippedWargear,'Twin Ironhail Autocannon'),0);
 const change=chooseWargear(u,st,'invictor-primary-gun:0','Twin Ironhail Autocannon');
 const next=reviewed(u,change);
 assert.equal(qty(next.equippedWargear,'Incendium Cannon'),0);
 assert.equal(qty(next.equippedWargear,'Twin Ironhail Autocannon'),1);
 assert.equal(u.datasheet.characteristics.Toughness,'9');
 assert.equal(u.datasheet.characteristics.Move,'10"');
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Twin Ironhail Autocannon').range,'48"');
 assert.ok(u.datasheet.abilities.some(x=>x.name==='Forward Assault Warsuit'));
 assert.match(renderWargearEditor(u),/Scouts 8 inches/);
 const invalid=validateWargearLoadout({...u,equippedWargear:[
  ...base.equippedWargear,{name:'Twin Ironhail Autocannon',quantity:1}
 ]});
 assert.equal(invalid.status,'rules-invalid','cannot take both primary guns');
});

test('Firestrike Servo-turrets can choose each of 1/2 main guns, retain Hovering Bulk and use 11e Overwatch',()=>{
 for(const n of [1,2]){
  const u=get('Firestrike Servo-turrets',n),st=createWargearChoiceState(u);
  assert.deepEqual(getBuilderModelCounts(u),[1,2]);
  assert.equal(getWargearSlots(u).length,n);
  const base=reviewed(u,st);
  assert.equal(qty(base.equippedWargear,'Hovering Bulk'),n);
  assert.equal(qty(base.equippedWargear,'Twin Firestrike Las-talon'),n);
  const next=chooseWargear(u,st,'firestrike-main-gun:0','Twin Firestrike Autocannon');
  const selected=reviewed(u,next);
  assert.equal(qty(selected.equippedWargear,'Twin Firestrike Autocannon'),1);
  assert.equal(qty(selected.equippedWargear,'Twin Firestrike Las-talon'),n-1);
  assert.equal(u.datasheet.characteristics.Move,'5"');
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Twin Firestrike Las-talon').damage,'D3+3');
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Twin Firestrike Autocannon').attacks,'4');
  assert.match(u.datasheet.abilities.find(a=>a.name==='Sentinel Protocols').description,/4\+/);
  assert.match(renderWargearEditor(u),/Fire Overwatch/);
  assert.equal(resolveBuilderUnitCost(u,{units:[u]}).points,n*80);
 }
});
test('Invader ATVs 1/2 model weapons are per-model, 2+ Twin Bolt Rifle, and Multi-melta +5 per model',()=>{
 for(const n of [1,2]){
  const u=get('Invader ATVs',n),st=createWargearChoiceState(u);
  assert.deepEqual(getBuilderModelCounts(u),[1,2]);
  assert.equal(getWargearSlots(u).length,n);
  const base=reviewed(u,st);
  for(const name of ['Armoured Impact','Bolt Pistol','Twin Bolt Rifle','Onslaught Gatling Cannon'])
   assert.equal(qty(base.equippedWargear,name),n);
  assert.equal(qty(base.equippedWargear,'Multi-melta'),0);
  let state=chooseWargear(u,st,'invader-main-gun:0','Multi-melta');
  let selected=reviewed(u,state);
  assert.equal(qty(selected.equippedWargear,'Multi-melta'),1);
  assert.equal(qty(selected.equippedWargear,'Onslaught Gatling Cannon'),n-1);
  if(n===2) {
   state=chooseWargear(u,state,'invader-main-gun:1','Multi-melta');
   selected=reviewed(u,state);
   assert.equal(qty(selected.equippedWargear,'Multi-melta'),2);
   assert.equal(qty(selected.equippedWargear,'Onslaught Gatling Cannon'),0);
  }
  assert.equal(u.datasheet.characteristics.Wounds,'8');
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Twin Bolt Rifle').skill,'2+');
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Multi-melta').damage,'D3+2');
  assert.match(u.datasheet.abilities.find(a=>a.name==='Aggressive Reconnaissance').description,/6 inches/);
  assert.match(renderWargearEditor(u),/5 points each/);
  const invalid=validateWargearLoadout({...u,equippedWargear:[
   ...selected.equippedWargear,{name:'Multi-melta',quantity:1}
  ]});
  assert.equal(invalid.status,'rules-invalid','cannot carry extra Multi-meltas');
 }
});
test('Invader copy order and 1/2 model sizes; Multi-melta upgrade is added to base price',()=>{
 for(const size of [1,2]) {
  const a=get('Invader ATVs',size,'a'+size),b=get('Invader ATVs',size,'b'+size),c=get('Invader ATVs',size,'c'+size);
  const list={units:[a,b,c]},base=size===1?65:130,third=size===1?75:140;
  assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,list).points),[base,base,third]);
  assert.equal(resolveBuilderUnitCost(c,list,[{name:'Multi-melta',quantity:size}]).points,third+5*size);
  assert.equal(resolveBuilderUnitCost(a,list,[{name:'Multi-melta',quantity:1}]).points,base+5);
  assert.equal(resolveBuilderUnitCost(a,list,[{name:'Multi-melta',quantity:size+1}]).points,null);
 }
 const a=get('Invictor Tactical Warsuit',1,'i1'),b=get('Invictor Tactical Warsuit',1,'i2'),c=get('Invictor Tactical Warsuit',1,'i3');
 assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,{units:[a,b,c]}).points),[135,135,150]);
 assert.equal(getTyranidWargearRuleSet('space-marines:ancient'),null);
});
