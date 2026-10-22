import test from 'node:test';
import assert from 'node:assert/strict';
import { importArmyRoster } from '../../src/state/army-roster-import.js';
import { filterCatalog, renderArmyBuilder } from '../../src/ui/army-builder-view.js';
import { createArmyRosterPanel } from '../../src/ui/army-roster-panel.js';
const roster={schemaVersion:1,id:'r',name:'Swarm',faction:'Tyranids',pointsLimit:2000,units:[]};
test('import remaps army and unit IDs including attachments without mutating the original',()=>{
 const original={...roster,units:[{id:'l',name:'Leader',modelCount:1,attachedToBodyguardId:'b'},{id:'b',name:'Bodyguard',modelCount:5,attachedLeaderIds:['l']}]};
 let id=0;const imported=importArmyRoster(JSON.stringify(original),()=>`new-${++id}`,'now');
 assert.notEqual(imported.id,original.id);assert.equal(imported.units[0].attachedToBodyguardId,imported.units[1].id);assert.deepEqual(imported.units[1].attachedLeaderIds,[imported.units[0].id]);assert.equal(original.units[0].id,'l');
 assert.throws(()=>importArmyRoster('{',()=>'', ''),/JSON/);
 assert.throws(()=>importArmyRoster(JSON.stringify({...roster,schemaVersion:99}),()=>'', ''),/version/);
});
test('catalog filters keyword search, category, costs and unknown budget safely',()=>{
 const all=filterCatalog({current:roster});assert.ok(all.length>10);
 const search=filterCatalog({current:roster,unitSearch:'tyrant'});assert.ok(search.length);assert.ok(search.every(u=>[u.name,...u.datasheet.keywords,...u.datasheet.abilities.map(a=>a.name)].join(' ').toLowerCase().includes('tyrant')));
 assert.deepEqual(filterCatalog({current:{...roster,pointsLimit:null},fits:true}),[]);
 const cheap=filterCatalog({current:{...roster,pointsLimit:100},fits:true,sort:'points'});assert.ok(cheap.every(u=>u.defaultPoints<=100));
 const html=renderArmyBuilder({current:roster,page:'editor',records:[],players:[],unitSearch:'',category:'',sort:'name'});assert.match(html,/ab-workspace/);assert.match(html,/Add units/);
});
test('one-tap catalog addition persists an independent entry and reports failures',async()=>{
 let saved=structuredClone(roster),fail=false; const listeners={};
 const root={innerHTML:'',replaceChildren(){},contains:()=>true,addEventListener:(t,f)=>listeners[t]=f,removeEventListener(){},querySelector:()=>null};
 const panel=createArmyRosterPanel(root,{store:{list:async()=>[{id:'r',name:'Swarm'}],load:async()=>({roster:structuredClone(saved)}),save:async({roster:r})=>{if(fail)throw Error('Save unavailable');saved=structuredClone(r);},remove:async()=>{}}});
 await new Promise(r=>setImmediate(r));
 const click=async(attr,value)=>listeners.click({target:{closest:()=>({matches:s=>s===`[${attr}]`,getAttribute:()=>value})}});
 await click('data-roster-load','r');
 const candidate=filterCatalog({current:roster})[0];await click('data-add-catalog-unit',candidate.id);
 assert.equal(saved.units.length,1);assert.equal(saved.units[0].name,candidate.name);assert.equal(saved.units[0].modelCount,candidate.defaultModelCount);
 fail=true;await click('data-add-catalog-unit',candidate.id);assert.equal(saved.units.length,1);assert.match(root.innerHTML,/Save unavailable/);panel.destroy();
});
