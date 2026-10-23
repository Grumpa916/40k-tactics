import test from 'node:test';
import assert from 'node:assert/strict';
import {ARMY_UNIT_CATALOG} from '../../src/data/army-unit-catalog.js';
import {resolveBuilderUnitCost} from '../../src/rules/army-builder-cost.js';
import {createWargearChoiceState,readWargearChoiceState,chooseWargear,changeWargearQuantity,chooseWargearBaseline,resizeWargearChoices} from '../../src/rules/army-wargear-choices.js';
import {buildManualWargearLoadout} from '../../src/rules/wargear-loadout-validation.js';
import {renderWargearEditor} from '../../src/ui/army-wargear-editor.js';
import {getDatasheetWeaponOptions} from '../../src/rules/saved-roster-combat-profile.js';
import {createArmyRosterPanel} from '../../src/ui/army-roster-panel.js';
function unit(slug,modelCount=1,id='u') {const candidate=ARMY_UNIT_CATALOG.find(x=>x.id==='tyranids:'+slug);return {...structuredClone(candidate),id,datasheetId:candidate.id,modelCount};}

test('Carnifex size prices and independent replacement groups save legal combat quantities',()=>{
 const u=unit('carnifexes',2),roster={units:[u]};
 assert.equal(resolveBuilderUnitCost(u,roster).points,180);
 let state=createWargearChoiceState(u);
 state=chooseWargear(u,state,'extra-talons-slot:0','Heavy venom cannon');
 state=chooseWargear(u,state,'extra-talons-slot:1','Stranglethorn cannon');
 assert.throws(()=>chooseWargear(u,state,'scything-talons-slot:0','Heavy venom cannon'),/Not an option/);
 state.optional['Bio-plasma']=2;
 const loadout=buildManualWargearLoadout(u,readWargearChoiceState(u,state));
 assert.equal(loadout.loadoutValidation.status,'rules-reviewed-valid');
 const saved={...u,...loadout},battleUnit={id:'battle',ownerId:'p1',metadata:{rosterUnitId:u.id}};
 const options=getDatasheetWeaponOptions({armyRosters:{p1:{units:[saved]}}},battleUnit,{type:'ranged'});
 assert.deepEqual(options.map(x=>x.name).sort(),['Bio-plasma','Heavy venom cannon','Stranglethorn cannon'].sort());
 const html=renderWargearEditor({...u,builderWargearState:state});
 assert.match(html,/Carnifex 1/);assert.match(html,/Carnifex 2/);assert.match(html,/>WS\/BS<\/th>/);assert.match(html,/>4\+<\/td>/);assert.match(html,/>9<\/td>/);assert.match(html,/>-2<\/td>/);assert.match(html,/>3<\/td>/);assert.doesNotMatch(html,/type="number"/);
});
test('Hive Tyrant mutually exclusive cannons and duplicate limits are blocked before saving',()=>{
 const u=unit('hive-tyrant');let state=createWargearChoiceState(u);
 state=chooseWargear(u,state,'primary:0','Heavy venom cannon');
 assert.throws(()=>chooseWargear(u,state,'secondary:0','Stranglethorn cannon'),/cannot be equipped together/);
 assert.throws(()=>chooseWargear(u,state,'secondary:0','Heavy venom cannon'),/maximum 1/);
 const html=renderWargearEditor({...u,builderWargearState:state});
 assert.match(html,/value="Stranglethorn cannon"[^>]*disabled/);
});
test('Termagant special limits, unit-wide baseline and resize keep a legal allocation',()=>{
 const u=unit('termagants',10);let state=createWargearChoiceState(u);
 state=chooseWargearBaseline(u,state,'ranged-weapon','Termagant devourer');
 state=changeWargearQuantity(u,state,'ranged-weapon','Shardlauncher',1);
 assert.equal(changeWargearQuantity(u,state,'ranged-weapon','Shardlauncher',1),state);
 assert.equal(readWargearChoiceState(u,state).find(x=>x.name==='Termagant devourer').quantity,9);
 const larger={...u,modelCount:20};state=resizeWargearChoices(u,larger,state);
 state=changeWargearQuantity(larger,state,'ranged-weapon','Shardlauncher',1);
 const selected=readWargearChoiceState(larger,state);
 assert.equal(selected.find(x=>x.name==='Shardlauncher').quantity,2);
 assert.equal(selected.find(x=>x.name==='Termagant devourer').quantity,18);
 assert.equal(buildManualWargearLoadout(larger,selected).loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(resolveBuilderUnitCost(larger,{units:[larger]},selected).points,110);
});
test('existing conditional prices use weapon choice and roster occurrence without user arithmetic',()=>{
 const u=unit('tyrannofex'),r={units:[u]};
 assert.equal(resolveBuilderUnitCost(u,r,[{name:'Acid spray',quantity:1}]).points,180);
 assert.equal(resolveBuilderUnitCost(u,r,[{name:'Rupture cannon',quantity:1}]).points,190);
 r.units=[{...u,id:'first'},{...u,id:'second'},u];
 assert.equal(resolveBuilderUnitCost(u,r,[{name:'Rupture cannon',quantity:1}]).points,200);
 const x=unit('genestealers',10);assert.equal(resolveBuilderUnitCost(x,{units:[x]}).points,140);
 assert.equal(resolveBuilderUnitCost({...x,modelCount:7},{units:[x]}).points,null);
});
test('model-size tap updates preview and saves size, points and legal wargear together',async()=>{
 let saved={schemaVersion:1,id:'r',name:'Test',faction:'Tyranids',units:[{...unit('carnifexes'),points:90}]};
 const listeners={},root={innerHTML:'',replaceChildren(){},contains:()=>true,addEventListener:(t,f)=>listeners[t]=f,removeEventListener(){},querySelector:()=>null};
 const panel=createArmyRosterPanel(root,{store:{list:async()=>[{id:'r',name:'Test'}],load:async()=>({roster:structuredClone(saved)}),save:async({roster})=>{saved=structuredClone(roster);},remove:async()=>{}}});
 await new Promise(r=>setImmediate(r));
 const click=(attr,value)=>listeners.click({preventDefault(){},target:{closest:()=>({disabled:false,matches:s=>s===`[${attr}]`,getAttribute:name=>name===attr?value:null})}});
 await click('data-roster-load','r');await click('data-view-unit-detail','u');await click('data-unit-size','2');
 assert.match(root.innerHTML,/180 pts/);assert.equal(saved.units[0].modelCount,1);
 await click('data-save-unit','u');
 assert.equal(saved.units[0].modelCount,2);assert.equal(saved.units[0].points,180);
 assert.equal(saved.units[0].loadoutValidation.status,'rules-reviewed-valid');
 assert.equal(saved.units[0].builderWargearState,undefined);
 panel.destroy();
});

test('resized fixed-loadout units update combat copies as well as unit points',async()=>{
 const {resizeBuilderFixedEquipment}=await import('../../src/rules/army-builder-fixed-equipment.js');
 const u={...unit('hormagaunts',20),equippedWargear:[{name:'Hormagaunt talons',quantity:10}]};
 const next=resizeBuilderFixedEquipment(u);
 assert.equal(next.equippedWeapons[0].quantity,20);
 const battle={id:'battle',ownerId:'p1',metadata:{rosterUnitId:u.id,modelCount:20},status:'deployed'};
 const options=getDatasheetWeaponOptions({armyRosters:{p1:{units:[next]}}},battle,{type:'melee'});
 assert.equal(options[0].characteristics.attacks,60);
 const zoan=resizeBuilderFixedEquipment(unit('zoanthropes',6));
 assert.equal(zoan.equippedWeapons.filter(x=>x.name.startsWith('Warp Blast')).length,2);
 assert.ok(zoan.equippedWeapons.every(x=>x.quantity===6));
});
