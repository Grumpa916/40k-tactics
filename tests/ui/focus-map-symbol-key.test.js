import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderLiveMapKey } from '../../src/ui/live-map-key.js';
import { renderCombatMapPanel } from '../../src/ui/combat-workspace.js';

const style = readFileSync(new URL('../../src/ui/styles/live-map-key.css', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../../src/ui/prototype-workspace.js', import.meta.url), 'utf8');

test('Map key covers unit colors, objective control, readiness, fight and phase badges', () => {
  const html = renderLiveMapKey();
  assert.match(html, /<details class="live-map-key" data-live-map-key>/);
  for (const item of ['Your unit','Opponent unit','Selected unit','Objective you control',
    'opponent controls','Contested objective','Ka’tah ready','re-readied',
    'Ka’tah active','Ka’tah spent','Fights First','Charged this turn',
    'Engaged in melee','Battle-shocked','Mission Action','Combat Doctrine',
    'Activation resolved','Activation in progress','Destroyed','Reserves',
    'Physical base outline','Territory boundary','Terrain area']) {
    assert.ok(html.includes(item), item);
  }
  for (const symbol of ['FF','↟','⚔','⌛','↻','AC2']) {
    assert.ok(html.includes(symbol), symbol);
  }
  assert.doesNotMatch(html, /onclick=|localStorage|data-map-unit-id/);
});

test('Map key is in the shared live toolbar and not duplicated over the board', () => {
  const source = readFileSync(new URL('../../src/ui/live-map-view.js', import.meta.url), 'utf8');
  const nav = source.slice(source.indexOf('const controls = `<nav class="live-map__tools"'),
    source.indexOf('</nav>`;', source.indexOf('const controls = `<nav class="live-map__tools"')));
  assert.match(nav, /\$\{renderLiveMapKey\(\)\}/);
  assert.ok(nav.indexOf('renderLiveMapKey()') < nav.indexOf('data-live-map-zoom'));
  const mapView = { render: () => '<div class="battlefield-map__board" data-battlefield-map-board>map</div>' };
  for (const phase of ['command','movement','shooting','charge','fight']) {
    const html = renderCombatMapPanel({state:{units:[]},phase,perspectivePlayerId:'p1',selectedUnitId:null,mapView});
    assert.match(html, /styles\/live-map-key\.css/);
    assert.match(html, /data-battlefield-map-board/);
    assert.doesNotMatch(html, /data-live-map-key/);
  }
});

test('The landscape key expands inside the toolbar and scrolls there', () => {
  assert.match(style,/\.live-map-key \{ display:none; \}/);
  assert.match(style,/\.live-map__tools > \.live-map-key\[open\] \{/);
  assert.match(style,/flex-basis:100%/);
  assert.match(style,/flex-wrap:wrap !important/);
  assert.match(style,/max-height:min\(190px,25dvh\)/);
  assert.match(style,/overflow-y:auto/);
  assert.doesNotMatch(style,/position:absolute|z-index:24/);
  assert.match(shell,/setAttribute\('data-battle-focus', String\(combat\)\)/);
});

test('map key does not store state, change unit maps, or bind actions', () => {
  const source=readFileSync(new URL('../../src/ui/live-map-key.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/localStorage|session\.dispatch|addEventListener|data-map-unit-id|style\.left/);
  assert.match(source,/return '<details class="live-map-key"/);
});
