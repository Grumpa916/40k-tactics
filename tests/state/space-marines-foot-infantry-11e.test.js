import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {getTyranidWargearRuleSet} from '../../src/data/tyranid-wargear-rules.js';
import {getWargearSlots,createWargearChoiceState,readWargearChoiceState} from '../../src/rules/army-wargear-choices.js';
import {validateWargearLoadout,buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {getBuilderModelCounts,resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {assessUnitLoadoutReadiness} from '../../src/rules/roster-loadout-readiness.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {importWarhammerAppRoster} from '../../src/state/warhammer-app-roster-import.js';
const get=(name,size,id=name)=>{
 const u=findArmyUnitCandidates({faction:'Space Marines'}).find(x=>x.name===name);
 assert.ok(u,name);
 return {...u,id,datasheetId:u.id,modelCount:size??u.defaultModelCount};
};
const qty=(items,name)=>items.find(x=>x.name===name)?.quantity??0;
const set=(state,slot,index,name)=>{const id=slot+':'+index;assert.ok(id in state.assignments,id);state.assignments[id]=name;};
function review(u,state){
 const selections=readWargearChoiceState(u,state);
 const check=validateWargearLoadout({...u,equippedWargear:selections});
 assert.equal(check.status,'rules-reviewed-valid',check.errors.join('; '));
 const built=buildManualWargearLoadout(u,selections);
 assert.equal(built.loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(assessUnitLoadoutReadiness({...u,...built}).status,'complete');
 return {selections,built};
}

test('Assault Intercessors: only Sergeant has pistol and melee replacements, 5/10 bodies have fixed default weapons',()=>{
 for(const n of [5,10]){
  const u=get('Assault Intercessor Squad',n),state=createWargearChoiceState(u);
  assert.deepEqual(getBuilderModelCounts(u),[5,10]);
  assert.equal(getWargearSlots(u).length,2);
  let base=review(u,state);
  assert.equal(qty(base.selections,'Heavy Bolt Pistol'),n);
  assert.equal(qty(base.selections,'Chainsword'),n);
  set(state,'assault-intercessor-sergeant-pistol',0,'Plasma Pistol');
  set(state,'assault-intercessor-sergeant-melee',0,'Thunder Hammer');
  const updated=review(u,state);
  assert.equal(qty(updated.selections,'Heavy Bolt Pistol'),n-1);
  assert.equal(qty(updated.selections,'Chainsword'),n-1);
  assert.equal(qty(updated.selections,'Thunder Hammer'),1);
  assert.equal(qty(updated.built.equippedWeapons,'Plasma Pistol - Standard'),1);
  assert.equal(qty(updated.built.equippedWeapons,'Plasma Pistol - Supercharge'),1);
  assert.ok(u.datasheet.abilities.some(x=>x.name==='Targeted Intercession'));
  assert.equal(u.datasheet.characteristics['Objective Control'],'2');
  assert.equal(u.datasheet.weapons.find(x=>x.name==='Thunder Hammer').damage,'3');
 }
});

test('Heavy Intercessors: the Sergeant must retain Heavy Bolt Rifle; one ordinary Heavy Bolter per five models',()=>{
 for(const n of [5,10]){
  const u=get('Heavy Intercessor Squad',n),state=createWargearChoiceState(u);
  assert.deepEqual(getBuilderModelCounts(u),[5,10]);
  assert.equal(getWargearSlots(u).length,n-1);
  let original=review(u,state);
  assert.equal(qty(original.selections,'Heavy Bolt Rifle'),n);
  for(let i=0;i<n/5;i++)set(state,'heavy-intercessor-ranged',i,'Heavy Bolter');
  const selected=review(u,state);
  assert.equal(qty(selected.selections,'Heavy Bolter'),n/5);
  assert.equal(qty(selected.selections,'Heavy Bolt Rifle'),n-n/5);
  const bad={...state,assignments:{...state.assignments}};
  set(bad,'heavy-intercessor-ranged',n/5,'Heavy Bolter');
  assert.match(validateWargearLoadout({...u,equippedWargear:readWargearChoiceState(u,bad)}).errors.join(';'),/Heavy Bolter/);
  assert.equal(u.datasheet.characteristics.Move,'5"');
  assert.equal(u.datasheet.weapons.find(w=>w.name==='Heavy Bolter').attacks,'3');
  assert.match(renderWargearEditor(u),/Unyielding in the Face of the Foe/);
 }
});

test('Infernus equipment and Company Heroes four-role composition are fixed and import without typing',()=>{
 for(const n of [5,10]){
  const u=get('Infernus Squad',n),state=createWargearChoiceState(u);
  assert.equal(getWargearSlots(u).length,0);
  const selected=review(u,state).selections;
  assert.equal(qty(selected,'Pyreblaster'),n);
  assert.equal(qty(selected,'Bolt Pistol'),n);
  assert.equal(qty(selected,'Ceramite Fists'),n);
  const weapon=u.datasheet.weapons.find(w=>w.name==='Pyreblaster');
  assert.deepEqual([weapon.range,weapon.attacks,weapon.strength,weapon.ap],['12"','3','5','-1']);
  assert.match(weapon.abilities,/Blast 1, Torrent/);
  assert.ok(u.datasheet.abilities.some(a=>a.name==='Driven from Cover'));
 }
 const heroes=get('Company Heroes',4);
 assert.deepEqual(getBuilderModelCounts(heroes),[4]);
 assert.equal(getWargearSlots(heroes).length,0);
 const selected=review(heroes,createWargearChoiceState(heroes)).selections;
 assert.deepEqual(selected.map(x=>[x.name,x.quantity]),[
  ['Master-crafted Bolt Pistol',4],['Master-crafted Bolt Rifle',2],
  ['Master-crafted Heavy Bolter',1],['Combat Knife',3],['Master-crafted Power Weapon',1]
 ]);
 assert.equal(heroes.datasheet.characteristics.Wounds,'4');
 assert.equal(heroes.datasheet.characteristics.Toughness,'5');
 assert.equal(heroes.datasheet.weapons.find(w=>w.name==='Master-crafted Heavy Bolter').attacks,'4');
 assert.ok(heroes.datasheet.abilities.some(a=>a.name==='Raise the Banner'));
 const imported=importWarhammerAppRoster({text:
  'Space Marines\nOTHER DATASHEETS\nInfernus Squad (95 pts)\nCompany Heroes (125 pts)',
  faction:'Space Marines',name:'fixed infantry test',id:'fixed-infantry',pointsLimit:2000
 });
 assert.equal(imported.unrecognized.length,0);
 assert.equal(imported.roster.units.length,2);
 for(const u of imported.roster.units) {
  assert.equal(u.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(u.loadoutValidation.source,'reviewed-fixed-equipment-import');
 }
});

test('Desolation: Sergeant Vengor is unique, other models have two launchers; points vary by copy plus optional 5 pts',()=>{
 const a=get('Desolation Squad',5,'a'),b=get('Desolation Squad',5,'b'),c=get('Desolation Squad',5,'c');
 assert.deepEqual(getBuilderModelCounts(a),[5]);
 assert.equal(getWargearSlots(a).length,5);
 const original=review(a,createWargearChoiceState(a));
 assert.equal(qty(original.selections,'Castellan Launcher'),5);
 assert.equal(qty(original.selections,'Superfrag Rocket Launcher'),5);
 const state=createWargearChoiceState(c);
 set(state,'desolation-sergeant-rocket',0,'Vengor Launcher');
 for(let i=0;i<4;i++)set(state,'desolation-marine-rocket',i,i%2?'Superfrag Rocket Launcher':'Superkrak Rocket Launcher');
 const selected=review(c,state);
 assert.equal(qty(selected.selections,'Vengor Launcher'),1);
 assert.equal(qty(selected.selections,'Superkrak Rocket Launcher'),2);
 assert.equal(qty(selected.selections,'Superfrag Rocket Launcher'),2);
 assert.equal(qty(selected.selections,'Castellan Launcher'),5);
 assert.equal(c.datasheet.weapons.find(x=>x.name==='Vengor Launcher').damage,'2');
 const roster={units:[a,b,c]};
 assert.equal(resolveBuilderUnitCost(a,roster).points,140);
 assert.equal(resolveBuilderUnitCost(b,roster).points,140);
 assert.equal(resolveBuilderUnitCost(c,roster,selected.selections).points,155);
 assert.equal(resolveBuilderUnitCost(c,roster,[{name:'Vengor Launcher',quantity:2}]).points,null);
 assert.match(renderWargearEditor(c),/Vengor Launcher/);
 const invalid=validateWargearLoadout({...c,equippedWargear:[
  ...readWargearChoiceState(c,createWargearChoiceState(c)),{name:'Vengor Launcher',quantity:1}
 ]});
 assert.equal(invalid.status,'rules-invalid','cannot equip a second Vengor');
});

test('Infernus additional-copy points and Company Heroes copy points remain reviewed; unverified vehicles stay flagged',()=>{
 const a=get('Infernus Squad',5,'a'),b=get('Infernus Squad',10,'b'),c=get('Infernus Squad',5,'c');
 assert.deepEqual([a,b,c].map(x=>resolveBuilderUnitCost(x,{units:[a,b,c]}).points),[95,190,105]);
 const h1=get('Company Heroes',4,'h1'),h2=get('Company Heroes',4,'h2'),h3=get('Company Heroes',4,'h3');
 assert.deepEqual([h1,h2,h3].map(x=>resolveBuilderUnitCost(x,{units:[h1,h2,h3]}).points),[125,125,145]);
 assert.equal(getTyranidWargearRuleSet('space-marines:captain'),null);
});
