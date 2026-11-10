import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLiveMarkerBaseScale, applyLiveMarkerBaseScales } from '../../src/ui/live-map-marker-base-scale.js';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../../src/ui/map-planning-geometry.js';

const unit=(id,name,slug,count=1)=>({id,ownerId:'p1',name,status:'deployed',
  metadata:{datasheetId:'adeptus-custodes:'+slug,modelCount:count},
  position:{x:12,y:22}});
const trajann=unit('trajann','Trajann Valoris','trajann-valoris');
const galatus=unit('galatus','Contemptor-Galatus Dreadnought','contemptor-galatus-dreadnought');
const telemon=unit('telemon','Telemon Heavy Dreadnought','telemon-heavy-dreadnought');
const vertus=unit('vertus','Vertus Praetors','vertus-praetors',2);
const allarus=unit('allarus','Allarus Custodians','allarus-custodians',3);

test('physical dimensions convert to percent of 60x44-inch battlefield, not a fixed pixel count', () => {
  for (const [u,width,height] of [
    [trajann,40,40],[galatus,60,60],[telemon,100,100],
    [vertus,75,42],[allarus,40,40]
  ]) {
    const scaled=getLiveMarkerBaseScale(u);
    assert.ok(scaled,u.name);
    assert.ok(Math.abs(scaled.widthPct-width/(BOARD_WIDTH*25.4)*100)<1e-10);
    assert.ok(Math.abs(scaled.heightPct-height/(BOARD_HEIGHT*25.4)*100)<1e-10);
    for (const boardWidth of [420,700,1000]) {
      const boardHeight=boardWidth*BOARD_HEIGHT/BOARD_WIDTH;
      assert.ok(Math.abs((scaled.widthPct/100)*boardWidth-width/25.4*(boardWidth/BOARD_WIDTH))<1e-8);
      assert.ok(Math.abs((scaled.heightPct/100)*boardHeight-height/25.4*(boardHeight/BOARD_HEIGHT))<1e-8);
    }
  }
  assert.equal(getLiveMarkerBaseScale(trajann).shape,'round');
  assert.equal(getLiveMarkerBaseScale(vertus).shape,'oval');
  assert.equal(getLiveMarkerBaseScale(trajann).reference,false);
  assert.equal(getLiveMarkerBaseScale(vertus).reference,true);
  assert.equal(getLiveMarkerBaseScale(allarus).reference,true);
});

test('size derived from one model is explicitly a reference for multi-model unit centres', () => {
  const tracked={...allarus,models:[
    {id:'m1',position:{x:10,y:20}},
    {id:'m2',position:{x:11,y:21}},
    {id:'m3',position:{x:12,y:22}}
  ]};
  assert.equal(getLiveMarkerBaseScale(tracked).reference,true,
    'group marker is not the footprint of even a fully tracked squad');
  assert.equal(getLiveMarkerBaseScale({...trajann,models:[{id:'t',position:{x:12,y:22}}]}).reference,false);
  assert.equal(getLiveMarkerBaseScale({name:'Unknown dreadnought'}),null);
  assert.equal(getLiveMarkerBaseScale({name:'Anathema Psykana Rhino'}),null,'hull must not invent a round base');
  assert.equal(getLiveMarkerBaseScale({name:'Trajann Valoris',faction:'Space Marines'}),null);
});

function node(unitId,memberId=null) {
  const attrs={};
  const classes=new Set();
  const css=new Map();
  const marker={
    getAttribute(key){return key==='data-map-unit-id'?unitId:
      key==='data-map-member-id'?memberId:attrs[key]??null;},
    setAttribute(key,value){attrs[key]=value;},
    removeAttribute(key){delete attrs[key];},
    classList:{toggle(key,on){if(on)classes.add(key);else classes.delete(key);}},
    style:{setProperty(key,value){css.set(key,value);},removeProperty(key){css.delete(key);}}
  };
  return {marker,attrs,classes,css};
}

test('marker attributes update in place and manual size overrides recalculate immediately', () => {
  const one=node('telemon'),bike=node('vertus'),unknown=node('unknown');
  const attached=node('leader-root','trajann');
  const container={querySelectorAll:selector=>selector==='.live-map [data-map-unit-id]'
    ? [one.marker,bike.marker,unknown.marker,attached.marker] : []};
  const state={units:[telemon,vertus,trajann,
    {id:'unknown',name:'Mystery Unit',ownerId:'p2',status:'deployed'}]};
  applyLiveMarkerBaseScales(container,state);
  assert.ok(one.classes.has('is-base-scaled'));
  assert.equal(one.attrs['data-live-base-mm'],'100x100');
  assert.equal(one.attrs['data-live-base-kind'],'single-model');
  assert.equal(one.css.get('--live-base-width'),(100/(60*25.4)*100).toFixed(6)+'%');
  assert.equal(one.css.get('--live-base-height'),(100/(44*25.4)*100).toFixed(6)+'%');
  assert.ok(bike.classes.has('is-base-oval'));
  assert.ok(bike.classes.has('is-base-reference'));
  assert.equal(bike.attrs['data-live-base-kind'],'reference');
  assert.equal(attached.attrs['data-live-base-mm'],'40x40',
    'attached model uses its member ID and base, not the group root');
  assert.equal(unknown.classes.has('is-base-scaled'),false);
  assert.equal(unknown.css.has('--live-base-width'),false);
  const saved={'adeptus-custodes:vertus-praetors':{width:90,length:52}};
  applyLiveMarkerBaseScales(container,state,saved);
  assert.equal(bike.attrs['data-live-base-mm'],'90x52');
  assert.equal(bike.css.get('--live-base-width'),(90/(60*25.4)*100).toFixed(6)+'%');
  assert.equal(bike.css.get('--live-base-height'),(52/(44*25.4)*100).toFixed(6)+'%');
  assert.ok(bike.classes.has('is-base-reference'));
  assert.equal(state.units[1].position.x,12,'no battle state update');
});

test('Top-down CSS uses percent-scaled physical base shape; Standard view retains existing fixed markers', () => {
  const css=readFileSync(new URL('../../src/ui/styles/live-map.css',import.meta.url),'utf8');
  const rules=css.slice(css.lastIndexOf('/* Top-down physical-size markers:'));
  assert.ok(rules.length>300);
  assert.match(rules,/\.live-map\.is-top-down\.is-planner-view \.battlefield-map__unit\.is-compact\.is-base-scaled \{/);
  assert.match(rules,/width:var\(--live-base-width\) !important;/);
  assert.match(rules,/height:var\(--live-base-height\) !important;/);
  assert.match(rules,/min-width:0 !important;/);
  assert.match(rules,/border-radius:50% !important;/);
  assert.match(rules,/\.is-base-reference \{[\s\S]*?border-style:dashed !important;/);
  assert.match(rules,/::before \{[\s\S]*?width:max\(44px, 100%\) !important;/);
  assert.doesNotMatch(rules,/\.live-map\.is-standard/,'Standard stays unchanged');
});

test('live event handlers refresh scaled marker dimensions on manual override and mode switch', () => {
  const source=readFileSync(new URL('../../src/ui/live-map-view.js',import.meta.url),'utf8');
  assert.match(source,/import \{ applyLiveMarkerBaseScales, getLiveOvalAngle \} from '\.\/live-map-marker-base-scale\.js';/);
  assert.ok((source.match(/applyLiveMarkerBaseScales\(container, state, preferences\.baseSizes, preferences\.ovalAngles\)/g)??[]).length>=3);
  assert.match(source,/Fallback size/);
});
