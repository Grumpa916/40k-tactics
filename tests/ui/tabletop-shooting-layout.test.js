import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createShootingScreen } from '../../src/ui/shooting-screen.js';

function testState() {
  return createGameState({
    phase: 'shooting',
    turn: 1,
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'Tyranids' }, { id: 'p2', name: 'Space Marines' }],
    battle: { id: 'b', status: 'active', round: 2, firstPlayerId: 'p1', activePlayerId: 'p1' },
    units: [
      {
        id: 'exo', name: 'Exocrine', ownerId: 'p1', status: 'deployed', wounds: 14,
        position: { x: 20, y: 8 },
        profile: { weaponIds: ['bio'], characteristics: { ballisticSkill: 3, toughness: 10, save: 3 } }
      },
      {
        id: 'marine', name: 'Intercessor Squad', ownerId: 'p2', status: 'deployed', wounds: 10,
        position: { x: 25, y: 27 },
        profile: { characteristics: { toughness: 4, save: 3 } }
      }
    ]
  });
}

function parseAttrs(text) {
  const attrs = new Map();
  for (const match of text.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs.set(match[1], match[2] ?? '');
  return attrs;
}

function fakeDom() {
  let html = '';
  let nodes = [];
  const rebuild = (value) => {
    html = value;
    nodes = [...value.matchAll(/<(button|select|div|details|summary)([^>]*)>/g)].map((match) => {
      const attrs = parseAttrs(match[2]);
      return {
        attrs,
        events: {},
        style: {},
        disabled: attrs.has('disabled'),
        value: attrs.get('value') ?? '',
        getAttribute(name) { return this.attrs.get(name) ?? null; },
        setAttribute(name, value) { this.attrs.set(name, String(value)); },
        addEventListener(name, fn) { this.events[name] = fn; },
        classList: { add() {}, remove() {} }
      };
    });
  };
  const attrName = (selector) => selector.match(/^\[([^\]]+)\]$/)?.[1] ?? null;
  const findNode = (selector, value = null) => {
    const attr = attrName(selector);
    return nodes.find((candidate) => candidate.attrs.has(attr) && (value == null || candidate.attrs.get(attr) === value));
  };
  return {
    get innerHTML() { return html; },
    set innerHTML(value) { rebuild(value); },
    replaceChildren() { rebuild(''); },
    querySelector(selector) {
      const attr = attrName(selector);
      return attr ? nodes.find((node) => node.attrs.has(attr)) ?? null : null;
    },
    querySelectorAll(selector) {
      const attr = attrName(selector);
      return attr ? nodes.filter((node) => node.attrs.has(attr)) : [];
    },
    node(selector, value = null) {
      const node = findNode(selector, value);
      assert.ok(node, `Missing ${selector}${value == null ? '' : '=' + value}`);
      return node;
    },
    click(selector, value = null) {
      const node = findNode(selector, value);
      assert.ok(node, `Missing ${selector}${value == null ? '' : '=' + value}`);
      assert.equal(typeof node.events.click, 'function', `No click handler for ${selector}`);
      node.events.click({ target: node, preventDefault() {} });
    },
    change(selector, value) {
      const node = findNode(selector);
      assert.ok(node, `Missing ${selector}`);
      assert.equal(typeof node.events.change, 'function', `No change handler for ${selector}`);
      node.value = value;
      node.events.change({ target: node, preventDefault() {} });
    }
  };
}

const gameData = {
  weapons: [{
    id: 'bio', name: 'Bio-plasmic cannon', type: 'ranged',
    characteristics: { range: 36, attacks: 6, strength: 9, ap: -3, damage: 3 }
  }]
};

test('tabletop Shooting mode renders the preferred map-plus-controls workspace without replacing classic mode', () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const tabletopSession = createGameSession(testState());
  const root = fakeDom();
  const tabletop = createShootingScreen(root, {
    session: tabletopSession,
    perspectivePlayerId: 'p1',
    gameData
  });
  try {
    assert.match(root.innerHTML, /shoot-screen--tabletop/);
    assert.match(root.innerHTML, /BATTLEFIELD/);
    assert.match(root.innerHTML, /TACTICAL ADVISOR/);
    assert.match(root.innerHTML, /Tabletop range, visibility and measurements remain authoritative/);

    root.click('[data-map-unit-id]', 'exo');
    assert.match(root.innerHTML, /data-choice-shoot/);
    root.click('[data-choice-shoot]');
    assert.match(root.innerHTML, /Bio-plasmic cannon/);
    const targetMarker = root.node('[data-map-unit-id]', 'marine');
    assert.equal(targetMarker.getAttribute('data-shoot-target-marker'), 'true');
    assert.equal(targetMarker.style.touchAction, 'manipulation');
    root.click('[data-map-unit-id]', 'marine');
    assert.match(root.innerHTML, /Intercessor Squad/);
    const selectedMarker = root.node('[data-map-unit-id]', 'marine');
    assert.equal(selectedMarker.getAttribute('aria-pressed'), 'true');
    assert.equal(selectedMarker.style.outline, '3px solid #ffd36a');
    assert.match(root.innerHTML, /Advisor assumptions &amp; detail/);
    assert.match(root.innerHTML, /shoot-advisory__details" open/);
    assert.match(root.innerHTML, /Primary impact/);
    assert.match(root.innerHTML, /Secondary impact/);
    assert.match(root.innerHTML, /recent threat/);
  } finally {
    tabletop.destroy();
  }

  const classicRoot = fakeDom();
  const classicSession = createGameSession(testState());
  const classic = createShootingScreen(classicRoot, {
    session: classicSession,
    perspectivePlayerId: 'p1',
    gameData,
    layoutMode: 'classic'
  });
  try {
    assert.doesNotMatch(classicRoot.innerHTML, /shoot-screen--tabletop/);
    assert.match(classicRoot.innerHTML, /Eligible units/);
  } finally {
    classic.destroy();
  }
});

test('Action picker returns to Shoot and enemy map taps cycle targets without reactivating shooter', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const state = testState();
  state.units.push({ ...state.units[1], id: 'marine2', name: 'Second squad', position: { x: 30, y: 25 } });
  const session = createGameSession(state), root = fakeDom();
  const screen = createShootingScreen(root, {
    session,
    perspectivePlayerId: 'p1',
    gameData,
    missionActions: [{ id: 'cleanse', name: 'Cleanse' }]
  });
  try {
    root.click('[data-map-unit-id]', 'exo');
    root.click('[data-choice-action-toggle]');
    assert.match(root.innerHTML, /data-choice-action-confirm/);
    root.change('[data-choice-action]', 'cleanse');
    assert.equal(root.node('[data-choice-action-confirm]').disabled, false);
    root.click('[data-choice-shoot]');
    assert.doesNotMatch(root.innerHTML, /data-choice-action-confirm/);
    assert.ok(root.querySelector('[data-target]'));
    assert.equal(root.node('[data-map-unit-id]', 'marine').getAttribute('data-shoot-target-marker'), 'true');
    assert.equal(root.node('[data-map-unit-id]', 'marine2').getAttribute('data-shoot-target-marker'), 'true');
    root.click('[data-map-unit-id]', 'marine');
    assert.match(root.innerHTML, /value="marine" selected/);
    root.click('[data-map-unit-id]', 'marine2');
    assert.match(root.innerHTML, /value="marine2" selected/);
    assert.match(root.innerHTML, /Advisor assumptions &amp; detail/);
    assert.equal(session.getState().history.filter(e => e.type === 'shooting.unit_activated').length, 1);
  } finally { screen.destroy(); }
});

test('tap shooter then enemy selects a target directly and preserves a single activation', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const session = createGameSession(testState()), root = fakeDom();
  const screen = createShootingScreen(root, { session, perspectivePlayerId: 'p1', gameData });
  try {
    root.click('[data-map-unit-id]', 'exo');
    root.click('[data-map-unit-id]', 'marine');
    assert.match(root.innerHTML, /value="marine" selected/);
    assert.equal(root.node('[data-map-unit-id]', 'marine').getAttribute('aria-pressed'), 'true');
    assert.match(root.innerHTML, /Advisor assumptions &amp; detail/);
    assert.equal(session.getState().history.filter(e => e.type === 'shooting.unit_activated').length, 1);
  } finally { screen.destroy(); }
});

test('browsing Shooting during Command shows rejection, closes action picker, and preserves battle state', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const state = testState(); state.phase = 'command';
  const session = createGameSession(state), root = fakeDom();
  const screen = createShootingScreen(root, { session, perspectivePlayerId: 'p1', gameData });
  try {
    assert.match(root.innerHTML, /game is still in command/);
    root.click('[data-map-unit-id]', 'exo');
    root.click('[data-choice-action-toggle]');
    root.click('[data-choice-shoot]');
    assert.doesNotMatch(root.innerHTML, /data-choice-action-confirm/);
    assert.match(root.innerHTML, /Shooting activations may only be recorded in the Shooting phase/);
    assert.equal(session.getState(), state);
    root.click('[data-map-unit-id]', 'marine');
    assert.equal(session.getState(), state);
  } finally { screen.destroy(); }
});
