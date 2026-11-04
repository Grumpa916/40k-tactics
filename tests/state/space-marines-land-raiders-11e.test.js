import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {createWargearChoiceState,getWargearSlots,readWargearChoiceState} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';

const variants=[
 {name:'Land Raider',price:[245,265],move:'10"',capacity:14,guns:[['Armoured Tracks',1],['Godhammer Lascannon',2],['Twin Heavy Bolter',1]],ability:'Power of the Machine Spirit'},
 {name:'Land Raider Crusader',price:[230,250],move:'12"',capacity:16,guns:[['Armoured Tracks',1],['Hurricane Bolter',2],['Twin Assault Cannon',1]],ability:'Fury of the Machine Spirit'},
 {name:'Land Raider Redeemer',price:[245,265],move:'12"',capacity:14,guns:[['Armoured Tracks',1],['Flamestorm Cannon',2],['Twin Assault Cannon',1]],ability:'Wrath of the Machine Spirit'}
];
const get=(name,id=name)=>{const x=findArmyUnitCandidates({faction:'Space Marines'}).find(c=>c.name===name);assert.ok(x,'Missing '+name);return {...x,id,datasheetId:x.id,modelCount:1};};
const qty=(items,name)=>items.find(x=>x.name===name)?.quantity??0;
function check(u,selections) {
 const status=validateWargearLoadout({...u,equippedWargear:selections});
 assert.equal(status.status,'rules-reviewed-valid',status.errors?.join('; '));
 const built=buildManualWargearLoadout(u,selections);
 assert.equal(assessUnitLoadoutReadiness({...u,...built}).status,'complete');
 return built;
}
test('Land Raider variants: mandatory twin guns, optional guns independently capped at one and no weapon slots',()=>{
 for(const v of variants){
  const u=get(v.name),rules=getTyranidWargearRuleSet(u.datasheetId);
  assert.ok(rules);assert.equal(rules.reviewedAt,'2026-11-04');
  assert.deepEqual(getBuilderModelCounts(u),[1]);
  assert.equal(getWargearSlots(u).length,0);
  const state=createWargearChoiceState(u);
  assert.deepEqual(readWargearChoiceState(u,state).map(x=>[x.name,x.quantity]),v.guns);
  check(u,readWargearChoiceState(u,state));
  for(const name of ['Hunter-killer Missile','Multi-melta','Storm Bolter']) {
   assert.equal(rules.optional.find(x=>x.name===name).maxTotal,1);
   const plus={...state,optional:{...state.optional,[name]:1}};
   const withGun=readWargearChoiceState(u,plus);
   assert.equal(qty(withGun,name),1);
   const built=check(u,withGun);
   assert.equal(qty(built.equippedWeapons,name),1);
   const illegal=[...withGun.filter(x=>x.name!==name),{name,quantity:2}];
   assert.equal(validateWargearLoadout({...u,equippedWargear:illegal}).status,'rules-invalid');
  }
  assert.match(renderWargearEditor(u),/Hunter-killer Missile/);
  assert.match(renderWargearEditor(u),/Assault Ramp/);
  assert.equal(u.datasheet.characteristics.Move,v.move);
  assert.equal(u.datasheet.characteristics.Toughness,'12');
  assert.equal(u.datasheet.characteristics.Wounds,'16');
  assert.equal(u.datasheet.characteristics.Save,'2+');
  assert.equal(u.datasheet.characteristics['Objective Control'],'5');
  assert.ok(u.datasheet.abilities.some(x=>x.name===v.ability));
  assert.match(u.datasheet.abilities.find(x=>x.name==='Assault Ramp').description,new RegExp('Capacity '+v.capacity));
  assert.match(u.datasheet.abilities.find(x=>x.name==='Assault Ramp').description,/no JUMP PACK/);
  assert.equal(u.datasheet.weapons.find(x=>x.name==='Hunter-killer Missile').abilities,'One Shot');
 }
});
test('Machine Spirit effects keep distinct 11e target conditions and weapon profiles',()=>{
 const land=get('Land Raider'),crusader=get('Land Raider Crusader'),redeemer=get('Land Raider Redeemer');
 const stats=u=>u.datasheet.weapons;
 assert.equal(stats(land).find(w=>w.name==='Godhammer Lascannon').damage,'D3+3');
 assert.equal(stats(land).find(w=>w.name==='Godhammer Lascannon').range,'48"');
 assert.match(land.datasheet.abilities.find(x=>x.name==='Power of the Machine Spirit').description,/one hit roll and one wound roll/);
 assert.equal(stats(crusader).find(w=>w.name==='Hurricane Bolter').attacks,'6');
 assert.match(crusader.datasheet.abilities.find(x=>x.name==='Fury of the Machine Spirit').description,/12 inches.*Lethal Hits/);
 assert.equal(stats(redeemer).find(w=>w.name==='Flamestorm Cannon').attacks,'4');
 assert.equal(stats(redeemer).find(w=>w.name==='Flamestorm Cannon').damage,'2');
 assert.match(stats(redeemer).find(w=>w.name==='Flamestorm Cannon').abilities,/Torrent/);
 assert.match(redeemer.datasheet.abilities.find(x=>x.name==='Wrath of the Machine Spirit').description,/non-MONSTER\/VEHICLE/);
 assert.match(redeemer.datasheet.abilities.find(x=>x.name==='Wrath of the Machine Spirit').description,/within 12 inches/);
 assert.equal(stats(crusader).find(w=>w.name==='Multi-melta').damage,'D3+3',
  'Current independent reference lists D3+3 on Crusader; must remain flagged for official comparison');
 assert.equal(stats(redeemer).find(w=>w.name==='Multi-melta').damage,'D3+2');
});
test('First Land Raider copy uses different price from second and later copies',()=>{
 for(const v of variants){
  const a=get(v.name,'a'),b=get(v.name,'b'),c=get(v.name,'c');
  assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,{units:[a,b,c]}).points),[v.price[0],v.price[1],v.price[1]]);
 }
});
test('Land Raider loadouts remain player-confirmed when Warhammer App import omits optional equipment',()=>{
 for(const v of variants){
  const u=get(v.name);const rules=getTyranidWargearRuleSet(u.datasheetId);
  assert.equal(rules.optional.length,3);
  const unknown=assessUnitLoadoutReadiness({...u,equippedWargear:[]});
  assert.equal(unknown.status,'needs-confirmation');
  assert.equal(unknown.blocking,true,'optional equipment must not be silently assumed from incomplete imports');
 }
});
