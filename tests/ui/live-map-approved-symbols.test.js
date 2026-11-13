import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyApprovedLiveMapSymbols, liveUnitSymbolLabels } from '../../src/ui/live-map-symbols.js';
import { createLiveMapView } from '../../src/ui/live-map-view.js';
import { renderPhaseArmyRoster } from '../../src/ui/phase-army-roster.js';

const units = [
  {id:'hive',ownerId:'p1',name:'Hive Tyrant'},
  {id:'horm-a',ownerId:'p1',name:'Hormagaunts'},
  {id:'horm-b',ownerId:'p1',name:'Hormagaunts'},
  {id:'trajann',ownerId:'p2',name:'Trajann Valoris'}
];

test('live unit symbols stay short and keep duplicate numbering stable', () => {
  const labels = liveUnitSymbolLabels(units);
  assert.equal(labels.get('hive'), 'HT');
  assert.equal(labels.get('horm-a'), 'HO1');
  assert.equal(labels.get('horm-b'), 'HO2');
  assert.equal(labels.get('trajann'), 'TRA');
});

test('approved symbol transform preserves unit status badge and abbreviates objective markers', () => {
  const html = '<div class="battlefield-map__unit friendly is-compact" data-map-unit-id="hive">Hive Tyrant<span class="unit-activation-badge">✓</span></div>' +
    '<button type="button" class="battlefield-map__objective is-mine" data-map-objective-id="a">MY HOME</button>' +
    '<button type="button" class="battlefield-map__objective is-contested" data-map-objective-id="b">C1</button>' +
    '<button type="button" class="battlefield-map__objective is-opponent" data-map-objective-id="c">OPP EXP</button>';
  const result = applyApprovedLiveMapSymbols(html, {units});
  assert.match(result, />HT<span class="unit-activation-badge">✓<\/span>/);
  assert.match(result, /data-map-objective-id="a">mH<\/button>/);
  assert.match(result, /data-map-objective-id="b">C1<\/button>/);
  assert.match(result, /data-map-objective-id="c">oE<\/button>/);
  assert.doesNotMatch(result, /data-objective-number=/);
  const numbered = applyApprovedLiveMapSymbols(html, {units}, {preserveObjectiveLabels:true,numberedMarkers:true});
  assert.ok(numbered.includes('data-map-unit-id="hive">1<span class="unit-activation-badge">✓</span>'));
  assert.ok(numbered.includes('data-map-objective-id="a">MY HOME</button>'));
  const planner = applyApprovedLiveMapSymbols(html, {units}, {preserveObjectiveLabels:true});
  assert.match(planner, /data-map-objective-id="a">MY HOME<\/button>/);
  assert.match(planner, /data-map-objective-id="c">OPP EXP<\/button>/);
});

test('approved symbol transform preserves already-escaped custom objective text', () => {
  const html = '<button type="button" class="battlefield-map__objective is-uncontrolled" data-map-objective-id="custom">A &amp; B&#039;s Point</button>';
  const result = applyApprovedLiveMapSymbols(html, {units:[]});
  assert.match(result, /data-map-objective-id="custom">A &amp; B&#039;s Point<\/button>/);
  assert.doesNotMatch(result, /&amp;amp;|&amp;#039;/);
});

test('live map loads the approved symbol stylesheet after the base live-map stylesheet', () => {
  const view = createLiveMapView();
  const state = {units:[],objectives:[],players:[],history:[],battle:{status:'active',round:1,activePlayerId:'p1'},activePlayer:'p1',phase:'movement'};
  const html = view.render(state, {perspectivePlayerId:'p1'});
  const base = html.indexOf('live-map.css');
  const symbols = html.indexOf('live-map-symbols.css');
  assert.ok(base >= 0);
  assert.ok(symbols > base);
  assert.match(html, /live-map\.css\?v=compact-map-tools-4/);
  assert.match(html, /live-map-symbols\.css\?v=approved-symbols-2/);
});

test('live map replaces the old legend with a key for visible friendly designators', () => {
  const positioned = [
    {id:'trajann',ownerId:'p1',name:'Trajann Valoris',status:'deployed',position:{x:10,y:10}},
    {id:'telemon',ownerId:'p1',name:'Telemon Heavy Dreadnought',status:'deployed',position:{x:20,y:10}},
    {id:'reserve',ownerId:'p1',name:'Blade Champion',status:'reserves',position:{x:25,y:10}},
    {id:'enemy',ownerId:'p2',name:'Hellblaster Squad',status:'deployed',position:{x:40,y:10}}
  ];
  const html = createLiveMapView().render({units:positioned,objectives:[]}, {perspectivePlayerId:'p1'});
  const key = html.match(/<div class="battlefield-map__unit-key"[^>]*>(.*?)<\/div>/)?.[1];
  assert.ok(key);
  assert.match(key, /<strong>TRA<\/strong> Trajann Valoris/);
  assert.match(key, /<strong>TEL<\/strong> Telemon Heavy Dreadnought/);
  assert.doesNotMatch(key, /Blade Champion|Hellblaster Squad|Your army|Opponent control/);
  assert.ok(html.indexOf('battlefield-map-board-end') < html.indexOf('battlefield-map__unit-key'));
  assert.doesNotMatch(html, /class="battlefield-map__legend"/);
  const empty = createLiveMapView().render({units:positioned.filter(unit=>unit.ownerId==='p2')}, {perspectivePlayerId:'p1'});
  assert.doesNotMatch(empty, /class="battlefield-map__unit-key"|class="battlefield-map__legend"/);
});

test('approved live symbol CSS keeps compact objectives below both armies', () => {
  const css = fs.readFileSync(new URL('../../src/ui/styles/live-map-symbols.css', import.meta.url), 'utf8');
  assert.match(css, /battlefield-map__unit\.is-compact[\s\S]*width:32px[\s\S]*height:32px[\s\S]*z-index:6/);
  assert.match(css, /battlefield-map__unit\.opponent[\s\S]*z-index:6/);
  assert.match(css, /battlefield-map__unit\.friendly[\s\S]*z-index:7/);
  assert.match(css, /battlefield-map__unit\.is-selected[\s\S]*z-index:8/);
  assert.match(css, /battlefield-map__objective[\s\S]*width:36px[\s\S]*height:36px[\s\S]*font-size:8px[\s\S]*z-index:4/);
  assert.match(css, /battlefield-map__objective::before[\s\S]*clip-path:polygon\(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%\)/);
  assert.match(css, /is-contested[\s\S]*linear-gradient\(90deg,#205d87 0 50%,#7a3035 50% 100%\)/);
});

test('Standard map renders the identical abbreviations used in both army roster tabs', () => {
  const snapshot = {
    units: [
      {id:'trajann',ownerId:'p1',name:'Trajann Valoris',status:'deployed',position:{x:8,y:8}},
      {id:'telemon',ownerId:'p1',name:'Telemon Heavy Dreadnought',status:'deployed',position:{x:22,y:10}},
      {id:'enemy',ownerId:'p2',name:'Custodian Guard',status:'deployed',position:{x:40,y:33}}
    ],
    battle:{status:'active',round:1,activePlayerId:'p1'},players:[{id:'p1'},{id:'p2'}],
    activePlayer:'p1',phase:'command',objectives:[],history:[]
  };
  const storage = globalThis.localStorage;
  try {
    globalThis.localStorage = {getItem:()=>JSON.stringify({topDown:false}),setItem:()=>{}};
    const rendered = createLiveMapView().render(snapshot,{perspectivePlayerId:'p1'});
    const roster = renderPhaseArmyRoster(snapshot,'p1');
    const symbols = liveUnitSymbolLabels(snapshot.units);
    assert.match(rendered,/class="live-map is-standard"/);
    for(const unit of snapshot.units) {
      const abbreviation=symbols.get(unit.id);
      const marker=rendered.match(new RegExp('data-map-unit-id="'+unit.id+'"[^>]*>([^<]*)'))?.[1];
      assert.equal(marker,abbreviation,unit.name+' should use the left roster abbreviation');
      assert.ok(roster.includes('>'+abbreviation+'</span>'),unit.name+' abbreviation should appear in the roster');
    }
  } finally {
    if (storage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage=storage;
  }
});

test('view toggle preserves roster abbreviations, badge, unit IDs and event targets', () => {
  const state = {
    units: [
      {id:'guard',ownerId:'p1',name:'Custodian Guard',status:'deployed'},
      {id:'leader',ownerId:'p1',name:'Trajann Valoris',status:'deployed'},
      {id:'enemy',ownerId:'p2',name:'Hellblaster Squad',status:'deployed'}
    ],objectives:[],battle:{status:'active'},phase:'command'
  };
  const storage=globalThis.localStorage;
  try {
    globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
    const view=createLiveMapView();
    const markers= [
      {member:'guard',root:'guard',expected:'CG'},
      {member:'leader',root:'guard',expected:'TRA'},
      {member:'enemy',root:'enemy',expected:'HEL'}
    ].map((item,index)=>{
      const firstChild={nodeType:3,nodeValue:String(index+1)};
      const statusBadge={className:'unit-activation-badge'};
      return {...item,firstChild,badge:statusBadge,
        getAttribute(name){return name==='data-map-member-id'?(this.member===this.root?null:this.member):name==='data-map-unit-id'?this.root:null;}
      };
    });
    const handlers={};
    const button={addEventListener(event,cb){handlers[event]=cb;},setAttribute(){},textContent:'Standard map'};
    const live={classList:{toggle(){}},setAttribute(){}};
    const container={
      querySelector(selector){return selector==='.live-map'?live:
        selector==='[data-live-map-style]'||selector==='button[data-live-map-style]'?button:null;},
      querySelectorAll(selector){return selector==='.live-map [data-map-unit-id]'?markers:[];}
    };
    view.bind(container,state,{perspectivePlayerId:'p1'});
    assert.deepEqual(markers.map(marker=>marker.firstChild.nodeValue),markers.map(marker=>marker.expected));
    handlers.click();
    for(const marker of markers) {
      assert.equal(marker.firstChild.nodeValue,marker.expected,'both map modes retain the roster abbreviation');
      assert.equal(marker.badge.className,'unit-activation-badge','status badge is unchanged');
    }
    assert.equal(button.textContent,'Top-down map');
    handlers.click();
    assert.deepEqual(markers.map(marker=>marker.firstChild.nodeValue),markers.map(marker=>marker.expected));
    assert.equal(button.textContent,'Standard map');
  } finally {
    if(storage===undefined) delete globalThis.localStorage;
    else globalThis.localStorage=storage;
  }
});


test('a deployed attached formation has one selectable marker in Standard and Top-down maps',()=>{
  const state={
    phase:'charge',battle:{status:'active',round:1,activePlayerId:'p1'},activePlayer:'p1',
    armyRosters:{p1:{units:[
      {id:'guard-roster',name:'Custodian Guard Sodality',attachedLeaderIds:['blade-roster']},
      {id:'blade-roster',name:'Blade Champion',attachedToBodyguardId:'guard-roster'}
    ]}},
    units:[
      {id:'guard',name:'Custodian Guard Sodality',ownerId:'p1',status:'deployed',position:{x:40,y:18},metadata:{rosterUnitId:'guard-roster'}},
      {id:'blade',name:'Blade Champion',ownerId:'p1',status:'deployed',position:{x:20,y:8},metadata:{rosterUnitId:'blade-roster'}},
      {id:'enemy',name:'Neurotyrant',ownerId:'p2',status:'deployed',position:{x:35,y:32}}
    ],players:[{id:'p1'},{id:'p2'}],objectives:[],history:[]
  };
  const initial=JSON.stringify(state.units);
  for(const topDown of [true,false]) {
    const prior=globalThis.localStorage;
    try {
      globalThis.localStorage={getItem:()=>JSON.stringify({topDown}),setItem:()=>{}};
      const html=createLiveMapView().render(state,{perspectivePlayerId:'p1',selectedUnitId:'blade'});
      assert.match(html,/data-map-unit-id="guard" data-map-formation-symbol="CG\+BC"/);
      assert.match(html,/is-selected is-attached-formation/);
      assert.doesNotMatch(html,/data-map-unit-id="blade"/);
      assert.match(html,/data-map-unit-id="enemy"/);
      assert.match(html,/CG\+BC/);
    } finally {
      if(prior===undefined)delete globalThis.localStorage;
      else globalThis.localStorage=prior;
    }
  }
  assert.equal(JSON.stringify(state.units),initial,'rendering cannot mutate saved leader offsets');
  state.units[0].status='destroyed';
  assert.match(createLiveMapView().render(state,{perspectivePlayerId:'p1'}),/data-map-unit-id="blade"/,
    'a surviving Leader becomes its own marker after Bodyguard loss');
});


test('live map puts the acting army above the other army, even when perspective remains p1',()=>{
  const base={
    phase:'movement',battle:{status:'active',round:1,activePlayerId:'p2'},
    activePlayer:'p2',players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    units:[
      {id:'you',ownerId:'p1',name:'Custodian Guard',status:'deployed',position:{x:25,y:22}},
      {id:'enemy',ownerId:'p2',name:'Termagants',status:'deployed',position:{x:25,y:22}}
    ],objectives:[],history:[]
  };
  const original=JSON.stringify(base);
  for(const topDown of [false,true]){
    const oldStorage=globalThis.localStorage;
    try{
      globalThis.localStorage={getItem:()=>JSON.stringify({topDown}),setItem:()=>{}};
      const render = (state,selectedUnitId)=>createLiveMapView().render(state,{perspectivePlayerId:'p1',selectedUnitId});
      const activeEnemy=render(base,'you');
      assert.match(activeEnemy,/class="battlefield-map__unit opponent is-compact is-active-turn[^"]*" data-map-unit-id="enemy"/,
        'Tyranids receive the higher layer on their turn even in the blue-player perspective');
      assert.match(activeEnemy,/class="battlefield-map__unit friendly is-compact is-selected[^"]*" data-map-unit-id="you"/,
        'selected units are still distinguishable and have the highest layer');
      const ownTurn=render({...base,activePlayer:'p1',battle:{...base.battle,activePlayerId:'p1'}},'enemy');
      assert.match(ownTurn,/class="battlefield-map__unit friendly is-compact is-active-turn[^"]*" data-map-unit-id="you"/,
        'Custodes receive the higher layer on their turn');
      assert.doesNotMatch(ownTurn,/class="battlefield-map__unit opponent is-compact is-active-turn/,
        'enemy marker loses active-layer status when the turn changes');
      assert.match(ownTurn,/class="battlefield-map__unit opponent is-compact is-selected/,
        'selection remains possible across both turn directions');
    } finally{
      if(oldStorage===undefined)delete globalThis.localStorage;
      else globalThis.localStorage=oldStorage;
    }
  }
  assert.equal(JSON.stringify(base),original,'display priority must not mutate the live battle or saved markers');
});

test('live CSS raises acting units, selected units, and dragged units in both map styles',()=>{
  const css=fs.readFileSync(new URL('../../src/ui/styles/live-map.css',import.meta.url),'utf8');
  const layers=Array.from(css.matchAll(/\.battlefield-map__unit\.(is-active-turn|is-selected|is-dragging)\s*\{\s*z-index:(\d+);/g));
  const byClass=new Map(layers.map(([,key,value])=>[key,Number(value)]));
  assert.ok(byClass.get('is-active-turn')>7,'active turn above friendly/opponent baseline');
  assert.ok(byClass.get('is-selected')>byClass.get('is-active-turn'),'selected unit should be top');
  assert.ok(byClass.get('is-dragging')>byClass.get('is-selected'),'dragged handle should be highest');
  for(const suffix of ['is-active-turn','is-selected','is-dragging']){
    const selector='.live-map.is-planner-view .battlefield-map__unit.is-compact.'+suffix+' {';
    const start=css.indexOf(selector);
    assert.ok(start>=0,suffix+' has a Top-down layer override');
    assert.match(css.slice(start,start+selector.length+44),new RegExp('z-index:'+byClass.get(suffix)+';'),
      suffix+' shares the intended top-down stacking priority');
  }
});
