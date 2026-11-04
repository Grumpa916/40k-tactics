import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';

function unit(name,size,id='review') {
 const found=findArmyUnitCandidates({faction:'Space Marines'}).find(u=>u.name===name);
 assert.ok(found,'catalog: '+name);
 return {...found,id,datasheetId:found.id,modelCount:size};
}
const qty=(selections,name)=>selections.find(x=>x.name===name)?.quantity??0;
function check(u,state) {
 const choices=readWargearChoiceState(u,state);
 const validation=validateWargearLoadout({...u,equippedWargear:choices});
 assert.equal(validation.status,'rules-reviewed-valid',validation.errors?.join('; '));
 const built=buildManualWargearLoadout(u,choices);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...u,...built}).status,'complete');
 return choices;
}
function set(state,slotId,index,name) {
 const id=slotId+':'+index;
 assert.ok(id in state.assignments,id);
 state.assignments[id]=name;
}

test('Scout Squad: 5/10 model legal Sergeant and ordinary Scout selections, one of each per-five specialty',()=>{
 for(const size of [5,10]) {
  const u=unit('Scout Squad',size,'scout'+size),state=createWargearChoiceState(u);
  assert.deepEqual(getBuilderModelCounts(u),[5,10]);
  const rules=getTyranidWargearRuleSet(u.datasheetId);
  assert.equal(rules.slots.length,3);
  assert.equal(rules.fixed.length,2);
  assert.equal(getWargearSlots(u).length,size+1); // Sergeant ranged + melee; other Scouts ranged
  const initial=check(u,state);
  assert.equal(qty(initial,'Boltgun'),size);
  assert.equal(qty(initial,'Combat Knife'),size);
  assert.equal(qty(initial,'Bolt Pistol'),size);
  set(state,'scout-sergeant-ranged',0,'Shotgun');
  set(state,'scout-sergeant-melee',0,'Chainsword');
  set(state,'scout-ranged',0,'Sniper Rifle');
  set(state,'scout-ranged',1,'Heavy Bolter');
  if(size===10) {
   set(state,'scout-ranged',2,'Sniper Rifle');
   set(state,'scout-ranged',3,'Missile Launcher');
  }
  const selected=check(u,state);
  assert.equal(qty(selected,'Chainsword'),1);
  assert.equal(qty(selected,'Combat Knife'),size-1);
  assert.equal(qty(selected,'Sniper Rifle'),size/5);
  assert.equal(qty(selected,'Heavy Bolter')+qty(selected,'Missile Launcher'),size/5);
  assert.equal(qty(selected,'Shotgun'),1);
  const built=buildManualWargearLoadout(u,selected);
  assert.equal(qty(built.equippedWeapons,'Missile Launcher - Frag'),size===10?1:0);
  assert.equal(qty(built.equippedWeapons,'Missile Launcher - Krak'),size===10?1:0);
  assert.match(renderWargearEditor(u),/scout sergeant ranged/);
  const invalid={...state,assignments:{...state.assignments}};
  // A second heavy weapon is impermissible for a five-Scout unit.
  if(size===5) {
   set(invalid,'scout-ranged',2,'Missile Launcher');
   const errors=validateWargearLoadout({...u,equippedWargear:readWargearChoiceState(u,invalid)});
   assert.equal(errors.status,'rules-invalid');
   assert.match(errors.errors.join(' '),/Heavy Bolter \/ Missile Launcher/);
  }
 }
});

test('Scout special weapon cannot exceed 1 per 5 models and obsolete loadouts remain rejected',()=>{
 const u=unit('Scout Squad',5),state=createWargearChoiceState(u);
 set(state,'scout-ranged',0,'Sniper Rifle');
 set(state,'scout-ranged',1,'Sniper Rifle');
 const bad=validateWargearLoadout({...u,equippedWargear:readWargearChoiceState(u,state)});
 assert.equal(bad.status,'rules-invalid');
 assert.match(bad.errors.join(';'),/Sniper Rifle/);
 const impossible=validateWargearLoadout({...u,equippedWargear:[
  ...readWargearChoiceState(u,createWargearChoiceState(u)),{name:'Scout Sniper Carbine',quantity:1}
 ]});
 assert.equal(impossible.status,'rules-invalid');
 assert.equal(u.datasheet.characteristics.Move,'6"');
 assert.equal(u.datasheet.characteristics.Save,'4+');
 assert.equal(u.datasheet.weapons.find(x=>x.name==='Missile Launcher - Krak').damage,'D3+3');
 assert.ok(u.datasheet.abilities.some(a=>a.name==='Flexible Asset'));
});

test('Outrider: 3/6 models retain twin rifles and legal Sergeant melee plus 1 plasma per 3',()=>{
 for(const size of [3,6]){
  const u=unit('Outrider Squad',size,'rider'+size),state=createWargearChoiceState(u);
  assert.deepEqual(getBuilderModelCounts(u),[3,6]);
  assert.equal(getWargearSlots(u).length,size+1);
  const initial=check(u,state);
  assert.equal(qty(initial,'Twin Bolt Rifle'),size);
  assert.equal(qty(initial,'Chainsword'),size);
  assert.equal(qty(initial,'Heavy Bolt Pistol'),size);
  set(state,'outrider-sergeant-melee',0,'Thunder Hammer');
  for(let i=0;i<size/3;i++)set(state,'outrider-pistol',i,'Plasma Pistol');
  const reviewed=check(u,state);
  assert.equal(qty(reviewed,'Thunder Hammer'),1);
  assert.equal(qty(reviewed,'Chainsword'),size-1);
  assert.equal(qty(reviewed,'Plasma Pistol'),size/3);
  assert.equal(qty(reviewed,'Heavy Bolt Pistol'),size-size/3);
  const built=buildManualWargearLoadout(u,reviewed);
  assert.equal(qty(built.equippedWeapons,'Plasma Pistol - Standard'),size/3);
  assert.equal(qty(built.equippedWeapons,'Plasma Pistol - Supercharge'),size/3);
  const invalid={...state,assignments:{...state.assignments}};
  set(invalid,'outrider-pistol',size/3,'Plasma Pistol');
  const bad=validateWargearLoadout({...u,equippedWargear:readWargearChoiceState(u,invalid)});
  assert.equal(bad.status,'rules-invalid');
  assert.match(bad.errors.join('; '),/Plasma Pistol/);
  assert.equal(u.datasheet.characteristics.Toughness,'6');
  assert.equal(u.datasheet.characteristics['Objective Control'],'2');
  assert.equal(u.datasheet.weapons.find(x=>x.name==='Twin Bolt Rifle').skill,'2+');
  assert.match(u.datasheet.abilities.find(a=>a.name==='Full-throttle Assault').description,/charge/);
  assert.match(renderWargearEditor(u),/complete October Codex/i);
 }
});

test('Scout and Outrider current reviewed size/points entries retain existing import identifiers',()=>{
 const scout5=unit('Scout Squad',5,'s5'),scout10=unit('Scout Squad',10,'s10');
 const out3=unit('Outrider Squad',3,'o3'),out6=unit('Outrider Squad',6,'o6');
 assert.deepEqual([scout5,scout10,out3,out6].map(u=>resolveBuilderUnitCost(u,{units:[u]}).points),[65,120,80,160]);
 assert.equal(scout5.datasheetId,'space-marines:scout-squad');
 assert.equal(out3.datasheetId,'space-marines:outrider-squad');
 assert.equal(getTyranidWargearRuleSet('space-marines:ancient'),null);
});
