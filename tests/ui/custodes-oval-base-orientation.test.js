import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLiveMapView } from '../../src/ui/live-map-view.js';
import { getLiveOvalAngle, applyLiveMarkerBaseScales } from '../../src/ui/live-map-marker-base-scale.js';
import { renderUnitDetails } from '../../src/ui/army-unit-details.js';
import { ADEPTUS_CUSTODES_ARMY_CATALOG } from '../../src/data/adeptus-custodes-army-catalog.js';
import { getAdeptusCustodesBaseSize, modelBaseSizeLabel } from '../../src/data/adeptus-custodes-base-sizes.js';

const vertus={
  id:'vertus',ownerId:'p1',name:'Vertus Praetors',status:'deployed',
  metadata:{datasheetId:'adeptus-custodes:vertus-praetors',modelCount:2},
  position:{x:19,y:15}
};
const telemon={
  id:'telemon',ownerId:'p1',name:'Telemon Heavy Dreadnought',status:'deployed',
  metadata:{datasheetId:'adeptus-custodes:telemon-heavy-dreadnought',modelCount:1},
  position:{x:15,y:15}
};

test('oval orientations are per-unit, normalized into 0–179°, with fallback to recorded model angle', () => {
  assert.equal(getLiveOvalAngle(vertus),0);
  assert.equal(getLiveOvalAngle(vertus,{vertus:45}),45);
  assert.equal(getLiveOvalAngle(vertus,{vertus:225}),45);
  assert.equal(getLiveOvalAngle(vertus,{vertus:-45}),135);
  assert.equal(getLiveOvalAngle(vertus,{vertus:'bad'}),0);
  assert.equal(getLiveOvalAngle({...vertus,models:[{position:{x:1,y:1},angle:135}]}),135);
  assert.equal(getLiveOvalAngle({...vertus,models:[{position:{x:1,y:1},angle:135}]},{vertus:90}),90);
  assert.equal(getLiveOvalAngle({...vertus,id:'other'},{vertus:45}),0);
});

test('Top-down oval marker and physical base layer rotate together while label stays upright', () => {
  const old=globalThis.localStorage;
  let saved='{}';
  try {
    globalThis.localStorage={getItem:()=>saved,setItem:(_key,value)=>{saved=value;}};
    const view=createLiveMapView();
    const state={units:[vertus,telemon],objectives:[],players:[{id:'p1'},{id:'p2'}],
      battle:{status:'active'},activePlayer:'p1',phase:'command'};
    const rendered=view.render(state,{perspectivePlayerId:'p1',selectedUnitId:'vertus'});
    assert.match(rendered,/data-live-map-oval-rotate data-unit-id="vertus"/);
    assert.match(rendered,/Rotate oval · 0°/);

    const attrs={};const properties={};const classes=new Set();
    const marker={
      firstChild:{nodeType:3,nodeValue:'1'},
      getAttribute:k=>k==='data-map-unit-id'?'vertus':attrs[k]??null,
      setAttribute:(k,v)=>{attrs[k]=v;},
      removeAttribute:k=>{delete attrs[k];},
      classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)},
      style:{setProperty:(k,v)=>{properties[k]=v;},removeProperty:k=>{delete properties[k];}}
    };
    const grid={style:{}},major={style:{}},bases={style:{},innerHTML:''};
    const sight={style:{},setAttribute(){}};
    const overlay={querySelector:sel=>({
      '[data-live-map-grid]':grid,
      '[data-live-map-major-grid]':major,
      '[data-live-map-sight]':sight
    })[sel]};
    const callbacks={};
    const button={textContent:'Rotate oval · 0°',
      addEventListener:(type,listener)=>{callbacks[type]=listener;}};
    const container={
      querySelector:sel=>sel==='[data-battlefield-map-board]'?{}:
        sel==='[data-live-map-precision]'?overlay:
        sel==='[data-live-map-bases]'?bases:
        sel==='[data-live-map-oval-rotate]'?button:null,
      querySelectorAll:sel=>sel==='.live-map [data-map-unit-id]'?[marker]:[]
    };
    view.bind(container,state,{perspectivePlayerId:'p1',selectedUnitId:'vertus'});
    assert.equal(attrs['data-live-base-mm'],'75x42');
    assert.equal(attrs['data-live-oval-angle'],'0');
    assert.ok(classes.has('is-base-reference'));
    assert.ok(classes.has('is-base-oval'));
    assert.match(bases.innerHTML,/data-live-base-mm="75x42"/);
    assert.match(bases.innerHTML,/transform="rotate\(0 19\.0000 29\.0000\)"/);
    const initialLabel=marker.firstChild.nodeValue;
    const initialPosition=JSON.stringify(state.units[0].position);
    for(const value of [45,90,135,0]){
      callbacks.click({currentTarget:button});
      assert.equal(properties['--live-oval-angle'],value+'deg');
      assert.equal(attrs['data-live-oval-angle'],String(value));
      assert.equal(button.textContent,'Rotate oval · '+value+'°');
      assert.match(bases.innerHTML,new RegExp('transform="rotate\\('+value+' 19\\.0000 29\\.0000\\)"'));
      assert.equal(marker.firstChild.nodeValue,initialLabel,'unit number never rotates or changes');
      assert.equal(JSON.stringify(state.units[0].position),initialPosition,'no game state mutation');
    }
    assert.equal(JSON.parse(saved).ovalAngles.vertus,0);
    assert.equal(getLiveOvalAngle(telemon,JSON.parse(saved).ovalAngles),0);

    const css=readFileSync(new URL('../../src/ui/styles/live-map.css',import.meta.url),'utf8');
    assert.match(css,/\.is-base-scaled\.is-base-oval::after \{[\s\S]*?transform:rotate\(var\(--live-oval-angle,0deg\)\)/);
    assert.match(css,/\.is-base-oval\.is-base-reference::after \{[\s\S]*?border-style:dashed/);
    assert.doesNotMatch(css.slice(css.lastIndexOf('/* Rotatable oval miniatures:')),/\.live-map\.is-standard/);
  } finally {
    if(old===undefined) delete globalThis.localStorage;
    else globalThis.localStorage=old;
  }
});

test('rotation button exists only when selected unit has a physical oval base', () => {
  const old=globalThis.localStorage;
  try {
    globalThis.localStorage={getItem:()=>JSON.stringify({ovalAngles:{vertus:90}}),setItem(){}};
    const state={units:[vertus,telemon],objectives:[],players:[],battle:{status:'active'}};
    const view=createLiveMapView();
    assert.match(view.render(state,{selectedUnitId:'vertus'}),/Rotate oval · 90°/);
    assert.doesNotMatch(view.render(state,{selectedUnitId:'telemon'}),/data-live-map-oval-rotate/);
    assert.doesNotMatch(view.render(state,{}),/data-live-map-oval-rotate/);
  }finally{
    if(old===undefined) delete globalThis.localStorage;
    else globalThis.localStorage=old;
  }
});

test('complete 36-datasheet Custodes base map is surfaced in army-unit details', () => {
  assert.equal(ADEPTUS_CUSTODES_ARMY_CATALOG.length,36);
  const known=ADEPTUS_CUSTODES_ARMY_CATALOG.map(unit=>({
    name:unit.name,base:unit.baseSize
  }));
  assert.deepEqual(known.filter(({base})=>base==null),[]);
  assert.equal(known.filter(({base})=>base.shape==='round').length,27);
  assert.equal(known.filter(({base})=>base.shape==='oval').length,7);
  assert.equal(known.filter(({base})=>base.shape==='hull').length,2);
  assert.equal(known.filter(({base})=>base.source==='kit').length,2);
  for(const row of ADEPTUS_CUSTODES_ARMY_CATALOG){
    const item={id:row.id,name:row.name,faction:row.faction,baseSize:row.baseSize,
      datasheet:{characteristics:{},weapons:[],abilities:[]}};
    const html=renderUnitDetails(item,{current:{faction:'Adeptus Custodes'}});
    assert.match(html,new RegExp('data-unit-physical-base="'+row.baseSize.shape+'"'),row.name);
    assert.ok(html.includes(modelBaseSizeLabel(row.baseSize)),row.name);
    assert.match(html,/Base source<\/a>/,'provenance accessible for every Custodes entry');
  }
  const safeOther=renderUnitDetails({id:'space-marines:intercessors',name:'Intercessor Squad',faction:'Space Marines',
    datasheet:{characteristics:{},weapons:[],abilities:[]}},{current:{faction:'Space Marines'}});
  assert.doesNotMatch(safeOther,/data-unit-physical-base/);
});

test('new kit ovals remain distinct from old GW guide entries', () => {
  const byName=name=>getAdeptusCustodesBaseSize({name});
  assert.equal(modelBaseSizeLabel(byName('Vertus Praetors')),'75×42mm oval');
  assert.equal(modelBaseSizeLabel(byName('Gyrfalcon Jetbike Sodality')),'90×52mm oval');
  assert.equal(modelBaseSizeLabel(byName('Pallas Grav-Attack')),'105×70mm oval');
  assert.equal(modelBaseSizeLabel(byName('Caladius Grav-Tank')),'170×109mm oval');
  assert.equal(modelBaseSizeLabel(byName('Caladius Annihilator Grav-Tank')),'150×95mm oval');
  assert.equal(byName('Caladius Annihilator Grav-Tank').source,'kit');
  assert.equal(byName('Caladius Grav-Tank').source,'event-guide');
});
