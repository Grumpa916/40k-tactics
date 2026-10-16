import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG as catalog } from '../../src/data/event-companion-map-catalog.js';
import { buildCompleteTerrainPlacementOverlay } from '../../src/ui/terrain-placement-guide-model.js';
import { renderApprovedTerrainPlacementMap, enhanceTerrainPlacementMap } from '../../src/ui/terrain-placement-map.js';
import { createBattleSetupScreen } from '../../src/ui/battle-setup-screen.js';

function stateFor(layout) {
  for (const a of catalog.forceDispositions) for (const b of catalog.forceDispositions) {
    const matrix = catalog.forceDispositionMissionMatrix;
    if ([matrix[a][b], matrix[b][a]].sort().join('|') === [layout.missionA, layout.missionB].sort().join('|')) {
      return { players: [{ id: 'p1' }, { id: 'p2' }], units: [{ id: 'must-stay-hidden', ownerId: 'p1', status: 'deployed', position: { x: 5, y: 5 } }], battlefieldMap: { missionSetup: { myDisposition: a, opponentDisposition: b, layout: layout.layout } } };
    }
  }
  throw Error('Unresolvable page ' + layout.page);
}
class Element {
  constructor(dataset = {}) { this.dataset = dataset; this.style = {}; this.attributes = {}; this.events = {}; this.classList = { add() {}, toggle() {} }; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener(k, fn) { this.events[k] = fn; }
  click() { this.events.click?.({ preventDefault() {}, stopPropagation() {} }); }
  remove() {}
}
function mapDom(layout) {
  const shapes = Object.keys(layout.terrainGeometry).map(terrain => new Element({ terrain }));
  let nodes = [];
  const geometry = new Element();
  geometry.querySelectorAll = selector => selector.includes('__terrain') ? shapes : [];
  const board = new Element();
  board.querySelector = selector => selector.includes('__geometry') ? geometry : null;
  board.querySelectorAll = selector => selector.includes('__terrain[') ? shapes : nodes.filter(n => selector.includes(n.kind));
  board.insertAdjacentHTML = (_, html) => {
    nodes = [...html.matchAll(/<(line|circle|g) class="([^"]+)" data-terrain="([^"]*)"/g)].map(m => Object.assign(new Element({ terrain: m[3] }), { kind: m[2] }));
  };
  const mapRoot = { insertBefore(controls) { this.controls = controls; } };
  const mount = { querySelector: selector => selector === '.battlefield-map__board' ? board : selector === '.battlefield-map' ? mapRoot : null, querySelectorAll: () => [] };
  return { mount, shapes, mapRoot, nodes: () => nodes };
}
function controls() {
  const root = new Element(), status = new Element(), button = new Element();
  root.querySelector = selector => selector.includes('status') ? status : button;
  return root;
}

for (const layout of catalog.layouts) test(`Step 3 page ${layout.page}: approved overlay, focus, keyboard, Show/Hide all and rerender`, () => {
  const state = stateFor(layout), before = JSON.stringify(state);
  const html = renderApprovedTerrainPlacementMap(state, layout);
  assert.match(html, new RegExp('data-terrain-placement-page="' + layout.page + '"'));
  assert.doesNotMatch(html, /data-map-unit-id=/);
  assert.doesNotMatch(html, /class="battlefield-map__ruler/);
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: controls };
  try {
    const dom = mapDom(layout);
    const controller = enhanceTerrainPlacementMap(layout.page, layout, dom.mount);
    assert.deepEqual(controller.guides, buildCompleteTerrainPlacementOverlay(layout).guides);
    assert.equal(dom.shapes.length, 16);
    for (const shape of dom.shapes) {
      shape.click();
      assert.equal(controller.getFocus().focusedTerrain, shape.dataset.terrain);
      assert.ok(dom.nodes().filter(n => n.style.display !== 'none' && n.kind.includes('dimension-line')).every(n => n.dataset.terrain === shape.dataset.terrain));
      assert.ok(dom.nodes().some(n => n.kind === 'terrain-point-callout' && n.dataset.terrain === shape.dataset.terrain && n.style.display !== 'none'));
      shape.events.keydown({ key: 'Enter', preventDefault() {} });
      assert.equal(controller.getFocus().focusedTerrain, shape.dataset.terrain);
      shape.events.keydown({ key: ' ', preventDefault() {} });
    }
    const button = dom.mapRoot.controls.querySelector('[data-terrain-show-all]');
    button.click();
    assert.equal(controller.getFocus().showAll, true);
    assert.equal(button.textContent, 'Hide all');
    assert.ok(dom.nodes().every(n => n.style.display !== 'none'));
    const rerender = mapDom(layout);
    const restored = enhanceTerrainPlacementMap(layout.page, layout, rerender.mount, { initialFocus: controller.getFocus() });
    assert.equal(restored.getFocus().showAll, true);
    button.click();
    assert.equal(button.textContent, 'Show all');
    assert.ok(dom.nodes().filter(n => n.kind !== 'battlefield-map__dimension-anchor').every(n => n.style.display === 'none'));
    assert.equal(JSON.stringify(state), before);
  } finally { globalThis.document = previousDocument; }
});

test('Step 3 fails closed for an unapproved or absent map', () => {
  assert.match(renderApprovedTerrainPlacementMap({}, null), /Select both Force Dispositions/);
  assert.match(renderApprovedTerrainPlacementMap({}, { page: 999 }), /approved Layout/);
  assert.equal(enhanceTerrainPlacementMap(999, {}, null), null);
});

test('Step 3 fullscreen closes when leaving the terrain tab without mutating battle state', () => {
  const state = stateFor(catalog.layouts[0]), before = JSON.stringify(state), listeners = {};
  const container = { innerHTML: '', replaceChildren() {}, querySelector() { return null; }, addEventListener(k, fn) { listeners[k] = fn; }, removeEventListener() {} };
  const session = { getState: () => state, subscribe: () => () => {} };
  const screen = createBattleSetupScreen(container, { session, setupTab: 'battlefield' });
  listeners.click({ target: { closest: s => s === '[data-toggle-battlefield-fullscreen]' ? {} : null } });
  assert.match(container.innerHTML, /battlefield-map-section is-fullscreen/);
  screen.setTab('mission-map');
  assert.doesNotMatch(container.innerHTML, /battlefield-map-section is-fullscreen/);
  screen.setTab('battlefield');
  assert.match(container.innerHTML, /data-terrain-placement-page=/);
  assert.equal(JSON.stringify(state), before);
  screen.destroy();
});
