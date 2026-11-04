import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState,chooseWargear,checkWargearChoice} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';

const make=(name,id='u',size)=>{
  const entry=findArmyUnitCandidates({faction:'Space Marines'}).find(candidate=>candidate.name===name);
  assert.ok(entry,'catalog has '+name);
  return {...entry,id,datasheetId:entry.id,modelCount:size??entry.defaultModelCount};
};
const count=(items,name)=>items.find(item=>item.name===name)?.quantity??0;
const save=(unit,state)=>{
 const selections=readWargearChoiceState(unit,state);
 const validation=validateWargearLoadout({...unit,equippedWargear:selections});
 assert.equal(validation.status,'rules-reviewed-valid',validation.errors?.join(' | '));
 const built=buildManualWargearLoadout(unit,selections);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...unit,...built}).status,'complete');
 return built;
};

test('Sternguard Veteran weapons use one Sergeant and per-five heavy replacement limits',()=>{
 for(const n of [5,10]){
  const unit=make('Sternguard Veteran Squad','sv'+n,n);
  const rules=getTyranidWargearRuleSet(unit.datasheetId);
  assert.equal(rules.slots.length,2);
  assert.deepEqual(getBuilderModelCounts(unit),[5,10]);
  assert.equal(unit.datasheet.characteristics.Toughness,'5');
  const slots=getWargearSlots(unit);
  assert.equal(slots.filter(slot=>slot.slotId==='sternguard-sergeant-melee').length,1);
  assert.equal(slots.filter(slot=>slot.slotId==='sternguard-veteran-ranged').length,n-1);
  let state=createWargearChoiceState(unit);
  const base=readWargearChoiceState(unit,state);
  assert.equal(count(base,'Bolt Pistol'),n);
  assert.equal(count(base,'Artificer Firearm'),n);
  assert.equal(count(base,'Chainsword'),1);
  assert.equal(count(base,'Ceramite Fists'),n-1);
  save(unit,state);
  state=chooseWargear(unit,state,'sternguard-sergeant-melee:0','Power Fist');
  assert.equal(count(readWargearChoiceState(unit,state),'Power Fist'),1);
  const limit=Math.floor(n/5);
  for(let j=0;j<limit;j++){
    state=chooseWargear(unit,state,'sternguard-veteran-ranged:'+j,j%2?'Pyrecannon':'Heavy Bolter');
  }
  const selected=save(unit,state);
  assert.equal(count(selected.equippedWargear,'Artificer Firearm'),n-limit);
  assert.equal(count(selected.equippedWeapons,'Artificer Firearm - Infernus'),n-limit);
  assert.equal(count(selected.equippedWeapons,'Artificer Firearm - Purgatus'),n-limit);
  assert.equal(count(selected.equippedWeapons,'Artificer Firearm - Damnatus'),n-limit);
  assert.ok(checkWargearChoice(unit,state,'sternguard-veteran-ranged:'+limit,'Pyrecannon'),
    'combined heavy Bolter/Pyrecannon cap must block excessive selections');
  const invalid={...unit,equippedWargear:[
    ...base.filter(item=>item.name!=='Artificer Firearm'),
    {name:'Artificer Firearm',quantity:n-limit-1},
    {name:'Heavy Bolter',quantity:limit},
    {name:'Pyrecannon',quantity:1}
  ]};
  assert.equal(validateWargearLoadout(invalid).status,'rules-invalid');
  assert.match(renderWargearEditor(unit),/sternguard sergeant melee/);
 }
 const gun=make('Sternguard Veteran Squad').datasheet.weapons;
 assert.equal(gun.find(w=>w.name==='Artificer Firearm - Damnatus').damage,'D3+2');
 assert.equal(gun.find(w=>w.name==='Artificer Firearm - Purgatus').strength,'7');
 assert.match(gun.find(w=>w.name==='Pyrecannon').abilities,/Blast 2/);
});

test('Sternguard 5/10 models and first/third-copy pricing do not infer a per-model cost',()=>{
 const one=make('Sternguard Veteran Squad','sv1',5);
 const two=make('Sternguard Veteran Squad','sv2',5);
 const three=make('Sternguard Veteran Squad','sv3',5);
 const roster={units:[one,two,three]};
 assert.deepEqual([one,two,three].map(unit=>resolveBuilderUnitCost(unit,roster).points),[105,105,120]);
 const large=make('Sternguard Veteran Squad','sv10',10);
 assert.equal(resolveBuilderUnitCost(large,{units:[large]}).points,210);
 const thirdLarge=make('Sternguard Veteran Squad','sv10t',10);
 assert.equal(resolveBuilderUnitCost(thirdLarge,{units:[large,one,thirdLarge]}).points,225);
});

test('Inceptor Squad individually selects bolters or plasma; Standard and Supercharge are weapon modes',()=>{
 for(const size of [3,6]){
  const unit=make('Inceptor Squad','in'+size,size);
  const slots=getWargearSlots(unit);
  assert.equal(slots.length,size);
  assert.equal(unit.datasheet.characteristics.Toughness,'6');
  assert.equal(unit.datasheet.characteristics.Move,'10"');
  const guns=unit.datasheet.weapons;
  assert.equal(guns.find(w=>w.name==='Plasma Exterminators - Supercharge').damage,'3');
  assert.match(guns.find(w=>w.name==='Assault Bolters').abilities,/Sustained Hits 2/);
  let state=createWargearChoiceState(unit);
  assert.equal(count(readWargearChoiceState(unit,state),'Assault Bolters'),size);
  save(unit,state);
  state=chooseWargear(unit,state,'inceptor-ranged:0','Plasma Exterminators');
  const mixed=save(unit,state);
  assert.equal(count(mixed.equippedWargear,'Plasma Exterminators'),1);
  assert.equal(count(mixed.equippedWargear,'Assault Bolters'),size-1);
  assert.equal(count(mixed.equippedWeapons,'Plasma Exterminators - Standard'),1);
  assert.equal(count(mixed.equippedWeapons,'Plasma Exterminators - Supercharge'),1);
  assert.equal(count(mixed.equippedWeapons,'Ceramite Fists'),size);
  assert.match(renderWargearEditor(unit),/Plasma Exterminators/);
 }
 const first=make('Inceptor Squad','first');
 const third=make('Inceptor Squad','third');
 // These are the existing, independently cross-checked price options; other
 // contemporary references disagree and direct official MFM reading is pending.
 assert.equal(resolveBuilderUnitCost(first,{units:[first]}).points,130);
 assert.equal(resolveBuilderUnitCost(third,{units:[make('Inceptor Squad','a'),make('Inceptor Squad','b'),third]}).points,150);
});

test('Eliminator Sergeant can select Instigator; non-Sergeants only Bolt Sniper or Las Fusil',()=>{
 const unit=make('Eliminator Squad','eliminators',3);
 const slots=getWargearSlots(unit);
 assert.equal(slots.length,3);
 assert.equal(slots.filter(slot=>slot.model==null).length,1);
 assert.equal(slots.filter(slot=>slot.slotId==='eliminator-trooper-ranged').length,2);
 assert.equal(unit.datasheet.characteristics.Move,'8"');
 assert.equal(unit.datasheet.characteristics.Toughness,'4');
 let state=createWargearChoiceState(unit);
 const initial=readWargearChoiceState(unit,state);
 assert.equal(count(initial,'Bolt Sniper Rifle'),3);
 assert.equal(count(initial,'Bolt Pistol'),3);
 assert.equal(count(initial,'Ceramite Fists'),3);
 save(unit,state);
 state=chooseWargear(unit,state,'eliminator-sergeant-ranged:0','Instigator Bolt Carbine');
 state=chooseWargear(unit,state,'eliminator-trooper-ranged:0','Las Fusil');
 const saved=save(unit,state);
 assert.equal(count(saved.equippedWeapons,'Instigator Bolt Carbine'),1);
 assert.equal(count(saved.equippedWeapons,'Las Fusil'),1);
 assert.equal(count(saved.equippedWeapons,'Bolt Sniper Rifle'),1);
 assert.ok(checkWargearChoice(unit,state,'eliminator-trooper-ranged:1','Instigator Bolt Carbine'),
   'Instigator cannot be chosen by a regular Eliminator');
 const profiles=unit.datasheet.weapons;
 assert.equal(profiles.find(w=>w.name==='Bolt Sniper Rifle').strength,'6');
 assert.equal(profiles.find(w=>w.name==='Instigator Bolt Carbine').skill,'2+');
 assert.equal(profiles.find(w=>w.name==='Las Fusil').damage,'D3+3');
 assert.equal(resolveBuilderUnitCost(unit,{units:[unit]}).points,85);
 assert.match(renderWargearEditor(unit),/Sergeant/);
 assert.match(renderWargearEditor(unit),/Instigator Bolt Carbine/);
});

test('Only the three newly reviewed unit sets gain wargear selection; other faction behavior stays untouched',()=>{
 const other=make('Incursor Squad');
 assert.equal(getTyranidWargearRuleSet(other.datasheetId),null);
 assert.match(renderWargearEditor(other),/review pending/);
 for(const name of ['Sternguard Veteran Squad','Inceptor Squad','Eliminator Squad']){
  const unit=make(name);
  assert.ok(getTyranidWargearRuleSet(unit.datasheetId));
  assert.equal(unit.datasheet.officialOctoberCodexFullTextVerified,false);
 }
});
