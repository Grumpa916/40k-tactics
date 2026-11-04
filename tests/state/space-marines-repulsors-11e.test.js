import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {createWargearChoiceState,getWargearSlots,readWargearChoiceState,chooseWargear} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
const find=(name,id=name)=>{const x=findArmyUnitCandidates({faction:'Space Marines'}).find(c=>c.name===name);assert.ok(x,'Missing '+name);return {...x,id,datasheetId:x.id,modelCount:1};};
const qty=(items,name)=>items.find(x=>x.name===name)?.quantity??0;
function inspect(unit,state) {
 const selections=readWargearChoiceState(unit,state);
 const check=validateWargearLoadout({...unit,equippedWargear:selections});
 assert.equal(check.status,'rules-reviewed-valid',check.errors?.join('; '));
 const built=buildManualWargearLoadout(unit,selections);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...unit,...built}).status,'complete');
 return {...built,selections};
}
test('Repulsor has two independent, legal main-gun swaps and fixed once-per-battle missile',()=>{
 const u=find('Repulsor'),state=createWargearChoiceState(u);
 assert.deepEqual(getBuilderModelCounts(u),[1]);
 assert.equal(getWargearSlots(u).length,2);
 const base=inspect(u,state);
 for(const name of ['Armoured Hull','Defensive Array','Hunter-slayer Missile','Heavy Onslaught Gatling Cannon','Twin Heavy Bolter'])
  assert.equal(qty(base.selections,name),1,name);
 let switched=chooseWargear(u,state,'repulsor-primary-gun:0','Las-talon');
 switched=chooseWargear(u,switched,'repulsor-secondary-gun:0','Twin Lascannon');
 const newer=inspect(u,switched);
 assert.equal(qty(newer.selections,'Las-talon'),1);
 assert.equal(qty(newer.selections,'Twin Lascannon'),1);
 assert.equal(qty(newer.selections,'Twin Heavy Bolter'),0);
 assert.equal(qty(newer.selections,'Heavy Onslaught Gatling Cannon'),0);
 for(const name of ['Heavy Onslaught Gatling Cannon','Twin Heavy Bolter']){
  assert.equal(validateWargearLoadout({...u,equippedWargear:[...newer.selections,{name,quantity:1}]}).status,'rules-invalid');
 }
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Hunter-slayer Missile').abilities,'Indirect Fire, One Shot');
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Heavy Onslaught Gatling Cannon').attacks,'12');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Combat Embarkation').description,/Opponent Charge phase/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Combat Embarkation').description,/3 inches/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Transport Capacity').description,/14 ADEPTUS/);
 assert.match(renderWargearEditor(u),/Combat Embarkation/);
});

test('Executioner carries exactly one Heavy Laser Destroyer or plasma gun with two alternate profiles',()=>{
 const u=find('Repulsor Executioner'),state=createWargearChoiceState(u);
 assert.deepEqual(getBuilderModelCounts(u),[1]);
 assert.equal(getWargearSlots(u).length,1);
 const base=inspect(u,state);
 for(const name of ['Armoured Hull','Defensive Array','Heavy Onslaught Gatling Cannon','Twin Heavy Bolter','Heavy Laser Destroyer'])
  assert.equal(qty(base.selections,name),1);
 assert.equal(qty(base.equippedWeapons,'Macro Plasma Incinerator - Standard'),0);
 const next=chooseWargear(u,state,'executioner-main-gun:0','Macro Plasma Incinerator');
 const updated=inspect(u,next);
 assert.equal(qty(updated.selections,'Heavy Laser Destroyer'),0);
 assert.equal(qty(updated.selections,'Macro Plasma Incinerator'),1);
 assert.equal(qty(updated.equippedWeapons,'Macro Plasma Incinerator - Standard'),1);
 assert.equal(qty(updated.equippedWeapons,'Macro Plasma Incinerator - Supercharge'),1);
 assert.equal(qty(updated.equippedWeapons,'Heavy Laser Destroyer'),0);
 assert.equal(validateWargearLoadout({...u,equippedWargear:[...updated.selections,{name:'Heavy Laser Destroyer',quantity:1}]}).status,'rules-invalid');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Heavy Laser Destroyer').damage,'D6+4');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Heavy Laser Destroyer').strength,'16');
 assert.equal(u.datasheet.weapons.find(w=>w.name==='Macro Plasma Incinerator - Supercharge').damage,'3');
 assert.match(u.datasheet.abilities.find(x=>x.name==='Executioner').description,/NOT below half-strength/);
 assert.match(u.datasheet.abilities.find(x=>x.name==='Transport Capacity').description,/7 ADEPTUS/);
 assert.match(renderWargearEditor(u),/HEAVY LASER DESTROYER/);
});

test('Repulsor copy tiers and Executioner Heavy Laser +10 are modeled without changing saved points',()=>{
 const a=find('Repulsor','r1'),b=find('Repulsor','r2'),c=find('Repulsor','r3'),list={units:[a,b,c]};
 assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,list).points),[190,190,210]);
 const e1=find('Repulsor Executioner','e1'),e2=find('Repulsor Executioner','e2'),e3=find('Repulsor Executioner','e3'),eList={units:[e1,e2,e3]};
 assert.deepEqual([e1,e2,e3].map(x=>resolveBuilderUnitCost(x,eList).points),[260,260,280]);
 const heavy=[{name:'Heavy Laser Destroyer',quantity:1}];
 assert.deepEqual([e1,e2,e3].map(x=>resolveBuilderUnitCost(x,eList,heavy).points),[270,270,290]);
 assert.equal(resolveBuilderUnitCost(e3,eList,[{name:'Heavy Laser Destroyer',quantity:2}]).points,null);
 const plasma=[{name:'Macro Plasma Incinerator',quantity:1}];
 assert.equal(resolveBuilderUnitCost(e3,eList,plasma).points,280);
});
test('Both Repulsors preserve manual, non-automated transport and damage behavior',()=>{
 for(const name of ['Repulsor','Repulsor Executioner']) {
  const u=find(name),rules={...u};
  assert.equal(u.datasheet.characteristics.Toughness,'12');
  assert.equal(u.datasheet.characteristics.Wounds,'16');
  assert.equal(u.datasheet.characteristics['Objective Control'],'5');
  assert.equal(u.datasheet.characteristics.Move,'10"');
  assert.ok(u.datasheet.abilities.find(a=>a.name==='Damaged 6 and Deadly Demise D6'));
  assert.match(u.datasheet.abilities.find(a=>a.name==='Transport Capacity').description,/no JUMP PACK/);
  assert.equal(assessUnitLoadoutReadiness({...rules,equippedWargear:[]}).status,'needs-confirmation');
 }
});
