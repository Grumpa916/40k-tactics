import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyApprovedLiveMapSymbols, liveUnitSymbolLabels } from '../../src/ui/live-map-symbols.js';
import { createLiveMapView } from '../../src/ui/live-map-view.js';

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

test('approved symbol transform preserves unit status badge and named objective markers', () => {
  const html = '<div class="battlefield-map__unit friendly is-compact" data-map-unit-id="hive">Hive Tyrant<span class="unit-activation-badge">✓</span></div>' +
    '<button type="button" class="battlefield-map__objective is-mine" data-map-objective-id="a">My Home</button>' +
    '<button type="button" class="battlefield-map__objective is-contested" data-map-objective-id="b">Center 1</button>';
  const result = applyApprovedLiveMapSymbols(html, {units});
  assert.match(result, />HT<span class="unit-activation-badge">✓<\/span>/);
  assert.match(result, /data-map-objective-id="a"><span class="battlefield-map__objective-label-line">My<\/span><span class="battlefield-map__objective-label-line">Home<\/span><\/button>/);
  assert.match(result, /data-map-objective-id="b"><span class="battlefield-map__objective-label-line">Center<\/span><span class="battlefield-map__objective-label-line">1<\/span><\/button>/);
  assert.doesNotMatch(result, /data-objective-number=/);
});

test('live map loads the approved symbol stylesheet after the base live-map stylesheet', () => {
  const view = createLiveMapView();
  const state = {units:[],objectives:[],players:[],history:[],battle:{status:'active',round:1,activePlayerId:'p1'},activePlayer:'p1',phase:'movement'};
  const html = view.render(state, {perspectivePlayerId:'p1'});
  const base = html.indexOf('live-map.css');
  const symbols = html.indexOf('live-map-symbols.css');
  assert.ok(base >= 0);
  assert.ok(symbols > base);
  assert.match(html, /approved-symbols-1/);
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

test('approved live symbol CSS overrides prototype pills with circles, touch targets and named hex objectives', () => {
  const css = fs.readFileSync(new URL('../../src/ui/styles/live-map-symbols.css', import.meta.url), 'utf8');
  assert.match(css, /battlefield-map__unit\.is-compact[\s\S]*width:32px[\s\S]*height:32px[\s\S]*border-radius:50%/);
  assert.match(css, /battlefield-map__unit\.is-compact::before[\s\S]*width:48px[\s\S]*height:48px/);
  assert.match(css, /battlefield-map__unit\.is-selected[\s\S]*box-shadow:/);
  assert.match(css, /battlefield-map__objective[\s\S]*font-size:8px[\s\S]*flex-direction:column/);
  assert.match(css, /battlefield-map__objective-label-line[\s\S]*display:block/);
  assert.match(css, /battlefield-map__objective::before[\s\S]*clip-path:polygon\(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%\)/);
  assert.match(css, /is-contested[\s\S]*linear-gradient\(90deg,#205d87 0 50%,#7a3035 50% 100%\)/);
});
