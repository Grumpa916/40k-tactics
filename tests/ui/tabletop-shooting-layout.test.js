import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createShootingScreen } from '../../src/ui/shooting-screen.js';
import { createPrototypeWorkspace } from '../../src/ui/prototype-workspace.js';
import { getTargetThreatImpact } from '../../src/rules/tactical-threat-impact.js';

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
        scrollTop: 0,
        offsetTop: attrs.get('class')?.includes('shoot-tabletop__advisor') ? 240 : 0,
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
    if (selector.startsWith('.')) return nodes.find((candidate) => candidate.attrs.get('class')?.split(/\s+/).includes(selector.slice(1)));
    const attr = attrName(selector);
    return nodes.find((candidate) => candidate.attrs.has(attr) && (value == null || candidate.attrs.get(attr) === value));
  };
  return {
    get innerHTML() { return html; },
    set innerHTML(value) { rebuild(value); },
    replaceChildren() { rebuild(''); },
    querySelector(selector) {
      if (selector.startsWith('.')) return findNode(selector) ?? null;
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
    assert.match(root.innerHTML, /data-tabletop-map-phase="shooting"/);
    assert.match(root.innerHTML, /TACTICAL ADVISOR/);
    assert.doesNotMatch(root.innerHTML, /Battlefield · Shooting|Tabletop measurements and eligibility take priority/);

    root.click('[data-map-unit-id]', 'exo');
    assert.match(root.innerHTML, /data-choice-shoot/);
    root.click('[data-choice-shoot]');
    assert.match(root.innerHTML, /Bio-plasmic cannon/);
    const targetMarker = root.node('[data-map-unit-id]', 'marine');
    assert.equal(targetMarker.getAttribute('data-shoot-target-marker'), 'true');
    assert.equal(targetMarker.style.touchAction, 'none', 'iPad markers accept drag gestures while remaining tappable');
    root.click('[data-map-unit-id]', 'marine');
    assert.equal(root.querySelector('.shoot-tabletop__control-scroll').scrollTop, 0,
      'target selection keeps the shooter and weapon controls visible');
    assert.match(root.innerHTML, /Intercessor Squad/);
    const selectedMarker = root.node('[data-map-unit-id]', 'marine');
    assert.equal(selectedMarker.getAttribute('aria-pressed'), 'true');
    assert.equal(selectedMarker.style.outline, '3px solid #ffd36a');
    assert.match(root.innerHTML, /Advisor assumptions &amp; detail/);
    assert.doesNotMatch(root.innerHTML, /shoot-advisory__details" open/);
    const footer = root.innerHTML.split('<footer class="shoot-tabletop__footer">')[1].split('</footer>')[0];
    assert.match(footer, /data-shoot-damage-plus/);
    assert.match(footer, /data-attack/);
    assert.match(footer, /data-finish-unit/);
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

test('Secondary Action is absent from Shooting while enemy map taps still cycle targets', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const state = testState();
  state.units.push({ ...state.units[1], id: 'marine2', name: 'Second squad', position: { x: 30, y: 25 } });
  const session = createGameSession(state), root = fakeDom();
  const screen = createShootingScreen(root, {
    session,
    perspectivePlayerId: 'p1',
    gameData,
    missionActions: [{ id: 'cleanse', name: 'Cleanse', missionKind: 'secondary', definitionId: 'secondary-cleanse' }]
  });
  try {
    root.click('[data-map-unit-id]', 'exo');
    assert.equal(root.querySelector('[data-choice-action-toggle]'), null,
      'Secondary cards do not create a Shooting-phase Action choice');
    assert.doesNotMatch(root.innerHTML, /Cleanse/);
    root.click('[data-choice-shoot]');
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

test('selecting shooter and target previews the attack until Shoot is explicitly chosen', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const state = testState();
  state.units[0].profile.weaponIds.push('sidearm');
  const sidearm = { ...gameData.weapons[0], id: 'sidearm', name: 'Sidearm' };
  const session = createGameSession(state), root = fakeDom();
  const screen = createShootingScreen(root, {
    session, perspectivePlayerId: 'p1', gameData: { weapons: [...gameData.weapons, sidearm] },
    missionActions: [{ id:'primary-demo', name:'Primary Action', missionKind:'primary' }]
  });
  try {
    assert.match(root.innerHTML, /phase-army-roster__section-heading">Ready</);
    assert.equal(root.node('[data-map-unit-id]', 'exo').getAttribute('data-phase-map-select'), 'true');
    root.click('[data-select-phase-unit]', 'exo');
    assert.ok(root.node('[data-open-unit-details]', 'exo'));
    root.change('[data-weapon]', 'sidearm');
    root.click('[data-map-unit-id]', 'marine');
    assert.match(root.innerHTML, /value="marine" selected/);
    assert.equal(root.node('[data-map-unit-id]', 'marine').getAttribute('aria-pressed'), 'true');
    assert.match(root.innerHTML, /Advisor assumptions &amp; detail/);
    assert.ok(root.node('[data-choice-action-toggle]'));
    assert.equal(root.querySelector('[data-attack]'), null);
    assert.equal(session.getState(), state);
    root.click('[data-choice-shoot]');
    assert.match(root.innerHTML, /value="marine" selected/);
    assert.match(root.innerHTML, /value="sidearm" selected/);
    assert.match(root.innerHTML, /phase-army-roster__section-heading">Acting</);
    assert.ok(root.node('[data-attack]'));
    assert.equal(root.querySelector('[data-review-end-shooting]'), null);
    assert.equal(session.getState().history.filter(e => e.type === 'shooting.unit_activated').length, 1);
    root.click('[data-finish-unit]');
    assert.match(root.innerHTML, /phase-army-roster__section-heading">Finished</);
    assert.ok(root.node('[data-open-unit-details]', 'exo'));
  } finally { screen.destroy(); }
});

test('Shooting map and Units drawer selections keep phase panel closed until explicitly opened', () => {
  const attrs = new Map();
  const listeners = new Map();
  const shell = { setAttribute: (name, value) => attrs.set(name, value) };
  const root = {
    querySelector(selector) {
      if (selector === '.battle-shell') return shell;
      if (selector === '.shoot-screen--tabletop, .combat-workspace') return {};
       if (selector === '#live-units') return {id:'live-units'};
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name) => listeners.delete(name)
  };
  const workspace = createPrototypeWorkspace(root, { session: { getState: testState } });
  const target = attr => ({ closest: selector => selector.includes(`[${attr}]`) ? {} : null });
  try {
    workspace.refresh();
    assert.equal(attrs.get('data-controls-collapsed'), 'true');
    listeners.get('click')({ target: target('data-select-phase-unit') });
    assert.equal(attrs.get('data-controls-collapsed'), 'true');
    listeners.get('keydown')({ target: target('data-phase-map-select'), key: 'Enter' });
    assert.equal(attrs.get('data-controls-collapsed'), 'true');
    listeners.get('click')({ target: target('data-workspace-panel') });
    assert.equal(attrs.get('data-controls-collapsed'), 'false');
    listeners.get('click')({ target: target('data-workspace-panel') });
    assert.equal(attrs.get('data-controls-collapsed'), 'true');
  } finally { workspace.destroy(); }
});

test('browsing Shooting during Command leaves the phase read-only', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const state = testState(); state.phase = 'command';
  const session = createGameSession(state), root = fakeDom();
  const screen = createShootingScreen(root, { session, perspectivePlayerId: 'p1', gameData });
  try {
    assert.match(root.innerHTML, /game is still in command/);
    root.click('[data-map-unit-id]', 'exo');
    assert.equal(root.querySelector('[data-choice-action-toggle]'), null);
    assert.equal(root.querySelector('[data-choice-shoot]'), null);
    assert.equal(root.querySelector('[data-review-end-shooting]'), null);
    assert.equal(session.getState(), state);
    root.click('[data-map-unit-id]', 'marine');
    assert.equal(session.getState(), state);
  } finally { screen.destroy(); }
});

test('Shooting rail selects an attached formation from either member and retains individual details', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const initial = testState();
  initial.units[1].metadata = { rosterUnitId: 'squad' };
  initial.units.push({
    id: 'captain', name: 'Captain', ownerId: 'p2', status: 'deployed', wounds: 5,
    position: { x: 26, y: 27 }, metadata: { rosterUnitId: 'leader' }
  });
  initial.armyRosters = { p2: { units: [
    { id: 'squad', attachedLeaderIds: ['leader'] },
    { id: 'leader', attachedToBodyguardId: 'squad' }
  ] } };
  const session = createGameSession(initial), root = fakeDom();
  const screen = createShootingScreen(root, { session, perspectivePlayerId: 'p1', gameData });
  try {
    root.click('[data-select-phase-unit]', 'exo');
    root.click('[data-select-phase-unit]', 'captain');
    assert.match(root.innerHTML, /value="marine" selected/);
    assert.equal(root.node('[data-select-phase-unit]', 'captain').getAttribute('aria-pressed'), 'true');
    assert.equal(root.node('[data-select-phase-unit]', 'marine').getAttribute('aria-pressed'), 'true');
    assert.equal(root.node('[data-map-unit-id]', 'marine').getAttribute('aria-pressed'), 'true');
    assert.ok(root.node('[data-open-unit-details]', 'captain'));
    assert.ok(root.node('[data-open-unit-details]', 'marine'));
    assert.equal(session.getState(), initial);

    root.click('[data-choice-shoot]');
    root.click('[data-shoot-damage-plus]');
    root.click('[data-attack]');
    const attack = session.getState().history.find(event => event.type === 'combat.attack_resolved');
    assert.equal(attack?.payload.targetId, 'marine');
    assert.equal(session.getState().units.find(unit => unit.id === 'captain').wounds, 5);
  } finally { screen.destroy(); }
});

test('ending tabletop Shooting asks for review and records skipped results as unlogged', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const session = createGameSession(testState()), root = fakeDom();
  const screen = createShootingScreen(root, { session, perspectivePlayerId:'p1', gameData });
  try {
    root.click('[data-review-end-shooting]');
    assert.equal(session.getState().phase, 'shooting');
    assert.match(root.innerHTML, /1 remaining unit as result not logged/);
    root.click('[data-cancel-end-shooting]');
    assert.equal(root.querySelector('[data-confirm-end-shooting]'), null);
    root.click('[data-review-end-shooting]');
    root.click('[data-confirm-end-shooting]');
    assert.equal(session.getState().phase, 'charge');
    const activation = session.getState().history.find(event => event.type === 'shooting.unit_activated');
    assert.equal(activation.payload.actionType, 'unlogged');
    assert.equal(getTargetThreatImpact(session.getState(), { playerId:'p2', targetUnitId:'exo' }).activations, 0);
  } finally { screen.destroy(); }
});

test('opponent shooter can be chosen by name and resolve damage without Advisor ownership errors', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const initial=testState();
  initial.activePlayer='p2'; initial.battle.activePlayerId='p2';
  initial.units[1].profile.weaponIds=['bio'];
  const session=createGameSession(initial), root=fakeDom();
  const screen=createShootingScreen(root,{session,perspectivePlayerId:'p1',gameData});
  try {
    root.click('[data-select-phase-unit]','marine'); root.click('[data-choice-shoot]');
    assert.match(root.innerHTML,/data-attack/);
    root.change('[data-target]','exo'); root.click('[data-shoot-damage-plus]'); root.click('[data-attack]');
    assert.equal(session.getState().units.find(u=>u.id==='exo').wounds,13);
    assert.equal(session.getState().history.filter(e=>e.type==='combat.attack_resolved').length,1);
    root.click('[data-finish-unit]');
    assert.ok(session.getState().history.some(e=>e.type==='combat.activation_finished'&&e.payload.unitId==='marine'));
    root.click('[data-map-unit-id]','marine');
    assert.equal(root.querySelector('[data-attack]'),null);
  } finally { screen.destroy(); }
});

test('classic Shooting opens the linked Primary mission picker instead of the legacy action selector', () => {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const state = testState();
  state.battlefieldMap = { missionSetup: { myDisposition: 'Disruption', opponentDisposition: 'Take and Hold' } };
  const session = createGameSession(state), root = fakeDom();
  const screen = createShootingScreen(root, {
    session,
    perspectivePlayerId: 'p1',
    gameData,
    layoutMode: 'classic'
  });
  try {
    root.click('[data-shoot-unit]');
    assert.ok(root.querySelector('[data-choice-action-toggle]'));
    assert.equal(root.querySelector('[data-choice-action]'), null,
      'linked Primary Action controls stay collapsed until explicitly opened');
    root.click('[data-choice-action-toggle]');
    assert.match(root.innerHTML, /mission-action-picker/);
    assert.ok(root.querySelector('[data-choice-action]'));
    assert.match(root.innerHTML, /Death Trap/);
    root.change('[data-choice-action]', 'primary:p1:primary-death-trap');
    assert.ok(root.querySelector('[data-action-terrain]'));
    assert.match(root.innerHTML, /data-action-rules-confirmed/);
    assert.match(root.innerHTML, /Action requirements met/);
  } finally { screen.destroy(); }
});


test('Shooting map identifies selected unit and target without opening the Units drawer',()=>{
  clearCommandHandlers(); registerCoreCommandHandlers();
  const session=createGameSession(testState()), root=fakeDom();
  const screen=createShootingScreen(root,{session,perspectivePlayerId:'p1',gameData});
  try {
    assert.doesNotMatch(root.innerHTML,/data-shoot-map-identity/);
    root.click('[data-map-unit-id]','exo');
    assert.match(root.innerHTML,/<div class="shoot-tabletop__map-identity" data-shoot-map-identity[^>]*>[\s\S]*?<small>Selected unit<\/small><strong>Exocrine<\/strong>/);
    root.click('[data-map-unit-id]','marine');
    assert.match(root.innerHTML,/<small>Target<\/small><strong>Intercessor Squad<\/strong>/);
    assert.match(root.innerHTML,/<small>Shooter<\/small><strong>Exocrine<\/strong>/);
    root.click('[data-choice-not-shoot]');
    assert.doesNotMatch(root.innerHTML,/data-shoot-map-identity/);
  } finally {screen.destroy();}
});
test('selected-unit name is a noninteractive overlay that preserves the full 60:44 map height',()=>{
  const css=readFileSync(new URL('../../src/ui/styles/shooting-panel.css',import.meta.url),'utf8');
  assert.match(css,/\.shoot-tabletop__map-identity\s*\{[\s\S]*?position:absolute;/);
  assert.match(css,/\.shoot-tabletop__map-identity\s*\{[\s\S]*?pointer-events:none;/);
  assert.match(css,/\.shoot-tabletop__map-identity-item strong\s*\{[\s\S]*?text-overflow:ellipsis;/);
});
