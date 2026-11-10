import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADEPTUS_CUSTODES_BASE_CATALOG, CUSTODES_BASE_GUIDE_URL,
  getAdeptusCustodesBaseSize, modelBaseSizeForUnit, modelBaseSizeLabel
} from '../../src/data/adeptus-custodes-base-sizes.js';
import { ADEPTUS_CUSTODES_ARMY_CATALOG } from '../../src/data/adeptus-custodes-army-catalog.js';
import { baseDimensions } from '../../src/ui/map-planning-geometry.js';
import { createLiveMapView } from '../../src/ui/live-map-view.js';
import { readFileSync } from 'node:fs';

const sized = (name, id = null) => getAdeptusCustodesBaseSize({
  name, ...(id ? {metadata:{datasheetId:'adeptus-custodes:'+id}} : {})
});

test('2026 Games Workshop Event Companion p.56 is represented as round, oval, and hull base data', () => {
  assert.equal(ADEPTUS_CUSTODES_BASE_CATALOG.filter(x=>x.source==='event-guide').length,31);
  assert.ok(CUSTODES_BASE_GUIDE_URL.startsWith('https://assets.warhammer-community.com/'));
  for(const [name,shape,width,length] of [
    ['Trajann Valoris','round',40,40],
    ['Allarus Custodians','round',40,40],
    ['Contemptor-Galatus Dreadnought','round',60,60],
    ['Telemon Heavy Dreadnought','round',100,100],
    ['Vertus Praetors','oval',75,42],
    ['Prosecutors','round',32,32],
    ['Witchseekers','round',32,32],
    ['Pallas Grav-attack','oval',105,70],
    ['Caladius Grav-tank','oval',170,109],
    ['Venatari Custodians','round',40,40],
    ['Aquilon Custodians','round',50,50],
    ['Anathema Psykana Rhino','hull',null,null],
    ['Venerable Land Raider','hull',null,null]
  ]) {
    const entry=sized(name);
    assert.ok(entry, 'Missing official base for '+name);
    assert.deepEqual([entry.shape,entry.widthMm,entry.lengthMm,entry.source],[shape,width,length,'event-guide'],name);
  }
});

test('newer 2026 kits are not silently equated to older jetbikes and tanks', () => {
  const gyrfalcon=sized('Gyrfalcon Jetbike Sodality');
  assert.deepEqual([gyrfalcon.shape,gyrfalcon.widthMm,gyrfalcon.lengthMm,gyrfalcon.source],
    ['oval',90,52,'kit']);
  const annihilator=sized('Caladius Annihilator Grav-Tank');
  assert.deepEqual([annihilator.widthMm,annihilator.lengthMm,annihilator.source],
    [150,95,'kit']);
  assert.notEqual(gyrfalcon.widthMm,sized('Vertus Praetors').widthMm);
  assert.notEqual(annihilator.widthMm,sized('Caladius Grav-tank').widthMm);
});

test('all 11e Adeptus Custodes army-catalog datasheets have a sourced physical base entry', () => {
  assert.equal(ADEPTUS_CUSTODES_ARMY_CATALOG.length,36);
  const unresolved=ADEPTUS_CUSTODES_ARMY_CATALOG.filter(row=>!row.baseSize);
  assert.deepEqual(unresolved.map(row=>row.name),[]);
  for(const entry of ADEPTUS_CUSTODES_ARMY_CATALOG){
    assert.ok(entry.baseSize.sourceUrl,entry.name+' missing base source');
    assert.deepEqual(getAdeptusCustodesBaseSize({name:entry.name,metadata:{datasheetId:entry.id}}),entry.baseSize);
  }
  assert.equal(sized('Custodian Guard Sodality').widthMm,40);
  assert.equal(sized('Sentinel Guard Sodality').widthMm,40);
  assert.equal(sized('Aquilon Terminators with Solarite Power Talons').widthMm,50);
  assert.equal(sized('Witchseeker Squad').widthMm,32);
});

test('manual sizes override inferred defaults without changing the default catalog', () => {
  const unit={name:'Vertus Praetors',metadata:{datasheetId:'adeptus-custodes:vertus-praetors'}};
  assert.equal(modelBaseSizeLabel(modelBaseSizeForUnit(unit)),'75×42mm oval');
  const custom=modelBaseSizeForUnit(unit,{width:'90',length:'52'});
  assert.deepEqual([custom.widthMm,custom.lengthMm,custom.source],[90,52,'manual']);
  assert.equal(modelBaseSizeForUnit(unit,{width:'invalid'}).widthMm,75);
  assert.equal(modelBaseSizeForUnit(unit,{width:'',length:''}).widthMm,75);
  assert.equal(modelBaseSizeForUnit(unit).widthMm,75);
  assert.equal(baseDimensions(75,42).width,75/25.4);
  assert.equal(sized('Anathema Psykana Rhino').shape,'hull');
  assert.equal(modelBaseSizeForUnit({name:'Unknown custom unit'}),null);
  assert.equal(getAdeptusCustodesBaseSize({name:'Trajann Valoris',faction:'Space Marines'}),null);
  assert.equal(getAdeptusCustodesBaseSize({name:'Trajann Valoris',metadata:{datasheetId:'space-marines:trajann-valoris'}}),null);
});

test('live map base editor automatically fills the verified size and leaves visual marker sizing independent', () => {
  const prev=globalThis.localStorage;
  try {
    globalThis.localStorage={getItem:()=>null,setItem(){}};
    const unit={id:'trajann',ownerId:'p1',name:'Trajann Valoris',status:'deployed',
      metadata:{datasheetId:'adeptus-custodes:trajann-valoris',modelCount:1},position:{x:15,y:15}};
    const html=createLiveMapView().render({units:[unit],objectives:[],players:[]}, {selectedUnitId:'trajann',perspectivePlayerId:'p1'});
    assert.match(html,/data-live-map-base-width value="40"/);
    assert.match(html,/data-live-map-base-length value=""/);
    assert.match(html,/GW 2026 Event Companion · 40mm round/);
    assert.match(html,/--live-marker-size:18px/);
    const jetbike={id:'vertus',ownerId:'p1',name:'Vertus Praetors',status:'deployed',
      metadata:{datasheetId:'adeptus-custodes:vertus-praetors',modelCount:2},position:{x:15,y:15}};
    const bikeHtml=createLiveMapView().render({units:[jetbike],objectives:[],players:[]}, {selectedUnitId:'vertus',perspectivePlayerId:'p1'});
    assert.match(bikeHtml,/data-live-map-base-width value="75"/);
    assert.match(bikeHtml,/data-live-map-base-length value="42"/);
  } finally {
    if(prev===undefined) delete globalThis.localStorage;
    else globalThis.localStorage=prev;
  }
});

test('live base overlay draws recorded model positions and never treats a squad centre as one base', () => {
  const prev=globalThis.localStorage;
  try {
    globalThis.localStorage={getItem:()=>null,setItem(){}};
    const base= {id:'telemon',name:'Telemon Heavy Dreadnought',ownerId:'p1',status:'deployed',
      metadata:{datasheetId:'adeptus-custodes:telemon-heavy-dreadnought',modelCount:1},position:{x:12,y:14}};
    const squad= {id:'allarus',name:'Allarus Custodians',ownerId:'p1',status:'deployed',
      metadata:{datasheetId:'adeptus-custodes:allarus-custodians',modelCount:3},position:{x:25,y:24}};
    const units=[base,squad];
    const state={units,objectives:[],players:[]};
    const view=createLiveMapView();
    view.render(state,{perspectivePlayerId:'p1'});
    const grid={style:{}},major={style:{}},sight={style:{},setAttribute(){}},bases={style:{},innerHTML:''};
    const overlay={querySelector:sel=>({
      '[data-live-map-grid]':grid,'[data-live-map-major-grid]':major,
      '[data-live-map-bases]':bases,'[data-live-map-sight]':sight
    })[sel]};
    const container={
      querySelector:sel=>sel==='[data-battlefield-map-board]'?{}:sel==='[data-live-map-precision]'?overlay:null,
      querySelectorAll:()=>[]
    };
    view.bind(container,state,{perspectivePlayerId:'p1'});
    assert.match(bases.innerHTML,/data-live-map-model="telemon"/);
    assert.match(bases.innerHTML,/rx="1\.9685"/);
    assert.match(bases.innerHTML,/data-live-map-model="allarus"/);
    assert.match(bases.innerHTML,/data-live-base-kind="reference"/,'squad without model positions must be a dashed one-model reference');
    assert.match(bases.innerHTML,/one model base \(representative only; squad positions untracked\)/);
    const withModels={...squad,models:[{id:'a1',position:{x:24,y:24}},{id:'a2',position:{x:26,y:24}}]};
    const stateWithModels={...state,units:[base,withModels]};
    view.bind(container,stateWithModels,{perspectivePlayerId:'p1'});
    assert.match(bases.innerHTML,/data-live-map-model="a1"/);
    assert.match(bases.innerHTML,/data-live-map-model="a2"/);
    assert.doesNotMatch(bases.innerHTML,/data-live-base-kind="reference"/,'fully recorded model positions draw actual base rings');
  } finally {
    if(prev===undefined) delete globalThis.localStorage;
    else globalThis.localStorage=prev;
  }
});

test('Map Planner uses verified defaults while retaining its custom base editor', () => {
  const source=readFileSync(new URL('../../src/ui/map-planning.js',import.meta.url),'utf8');
  assert.match(source,/verifiedBase: getAdeptusCustodesBaseSize\(unit\)/);
  assert.match(source,/const verified = unit\?\.verifiedBase/);
  assert.match(source,/dimensions\?\.width \?\? defaultBase\?\.widthMm/);
  assert.match(source,/sizes\.has\(selected\?\.sizeKey\)/);
});

test('physical base outlines are their own visible layer above numbered tokens', () => {
  const prev=globalThis.localStorage;
  try {
    // A previously saved "bases off" setting cannot hide the new layer,
    // because the old toggle was removed from live play.
    globalThis.localStorage={getItem:()=>JSON.stringify({bases:false,markerSize:26}),setItem(){}};
    const map=createLiveMapView();
    const state={units:[{id:'telemon',ownerId:'p1',name:'Telemon Heavy Dreadnought',status:'deployed',
      metadata:{datasheetId:'adeptus-custodes:telemon-heavy-dreadnought',modelCount:1},
      position:{x:25,y:20}}],objectives:[],players:[],battle:{status:'active'}};
    const html=map.render(state,{selectedUnitId:'telemon',perspectivePlayerId:'p1'});
    assert.match(html,/class="live-map__precision-overlay"/);
    assert.match(html,/class="live-map__physical-base-overlay" data-live-map-bases-layer/);
    assert.match(html,/<g data-live-map-bases><\/g>/);
    assert.ok(html.indexOf('live-map__physical-base-overlay') < html.indexOf('data-map-unit-id="telemon"'));
    assert.match(html,/--live-marker-size:26px/,'visual marker remains independently adjustable');
    const css=readFileSync(new URL('../../src/ui/styles/live-map.css',import.meta.url),'utf8');
    assert.match(css,/\.live-map__physical-base-overlay \{[\s\S]*?z-index:11 !important;[\s\S]*?pointer-events:none !important;/);
    assert.match(css,/\.live-map__physical-base-overlay \.live-map__model-base \{[\s\S]*?stroke-width:\.19;[\s\S]*?vector-effect:none;/);
    assert.match(css,/\.live-map__model-base\.is-reference \{[\s\S]*?stroke-dasharray:\.29 \.18;/);
    const grid={style:{}},major={style:{}},sight={style:{},setAttribute(){}},bases={style:{},innerHTML:''};
    const overlay={querySelector:sel=>({'[data-live-map-grid]':grid,
      '[data-live-map-major-grid]':major,'[data-live-map-sight]':sight})[sel]};
    const container={
      querySelector:sel=>sel==='[data-battlefield-map-board]'?{}:
        sel==='[data-live-map-precision]'?overlay:sel==='[data-live-map-bases]'?bases:null,
      querySelectorAll:()=>[]
    };
    map.bind(container,state,{perspectivePlayerId:'p1',selectedUnitId:'telemon'});
    assert.equal(bases.style.display,'');
    assert.match(bases.innerHTML,/data-live-base-kind="model"/);
    assert.match(bases.innerHTML,/data-live-base-mm="100x100"/);
    assert.match(bases.innerHTML,/rx="1\.9685"/);
  } finally {
    if(prev===undefined) delete globalThis.localStorage;
    else globalThis.localStorage=prev;
  }
});

test('oval bases remain elliptical and manually overridden size changes the physical outline', () => {
  const prev=globalThis.localStorage;
  try {
    globalThis.localStorage={getItem:()=>JSON.stringify({
      topDown:true,baseSizes:{'adeptus-custodes:vertus-praetors':{width:90,length:52}}
    }),setItem(){}};
    const map=createLiveMapView();
    const state={units:[{id:'bike',ownerId:'p1',name:'Vertus Praetors',status:'deployed',
      metadata:{datasheetId:'adeptus-custodes:vertus-praetors',modelCount:1},position:{x:19,y:15}}],
      objectives:[],players:[],battle:{status:'active'}};
    const grid={style:{}},major={style:{}},sight={style:{},setAttribute(){}},bases={style:{},innerHTML:''};
    const overlay={querySelector:sel=>({'[data-live-map-grid]':grid,
      '[data-live-map-major-grid]':major,'[data-live-map-sight]':sight})[sel]};
    const container={
      querySelector:sel=>sel==='[data-battlefield-map-board]'?{}:
        sel==='[data-live-map-precision]'?overlay:sel==='[data-live-map-bases]'?bases:null,
      querySelectorAll:()=>[]
    };
    map.bind(container,state,{perspectivePlayerId:'p1'});
    assert.match(bases.innerHTML,/data-live-base-mm="90x52"/);
    assert.match(bases.innerHTML,/rx="1\.7717"/);
    assert.match(bases.innerHTML,/ry="1\.0236"/);
    assert.doesNotMatch(bases.innerHTML,/data-live-base-kind="reference"/);
  } finally {
    if(prev===undefined) delete globalThis.localStorage;
    else globalThis.localStorage=prev;
  }
});
