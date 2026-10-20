import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { getShootingCandidates } from '../../src/rules/shooting-candidates.js';
import { recordShootingActivation, completeShootingPhase } from '../../src/engine/shooting-transitions.js';
import { resolveAdvance } from '../../src/engine/movement-transitions.js';
import { getShootingWeaponOptions, getShootingTargetOptions } from '../../src/application/shooting-workflow.js';
import { summarizeGameEvent } from '../../src/ui/battle-context-panels.js';
import { createShootingScreen } from '../../src/ui/shooting-screen.js';
import { createMovementScreen } from '../../src/ui/movement-screen.js';

function state(phase = 'shooting') {
  return createGameState({ phase, turn: 2, activePlayer: 'p2', players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }], battle: { id: 'b', status: 'active', round: 1, firstPlayerId: 'p1', activePlayerId: 'p2' }, units: [
    { id: 'friendly', name: 'Friendly', ownerId: 'p1', status: 'deployed', position: { x: 4, y: 4 }, profile: { characteristics: { movement: 6 } } },
    { id: 'enemy', name: 'Enemy', ownerId: 'p2', status: 'deployed', position: { x: 10, y: 10 }, profile: { characteristics: { movement: 6 } } }
  ] });
}
function session(initial) { clearCommandHandlers(); registerCoreCommandHandlers(); return createGameSession(initial); }

test('opting not to shoot records the choice without an action ID and permits Charge', () => {
  const next = recordShootingActivation(state(), { unitId: 'enemy', actionType: 'not_shoot' });
  assert.equal(next.history.at(-1).payload.actionType, 'not_shoot');
  assert.equal(completeShootingPhase(next).phase, 'charge');
  assert.deepEqual(getShootingWeaponOptions(next, { attackerId: 'enemy', gameData: { weapons: [{ id: 'rifle', type: 'ranged' }] } }), []);
  assert.deepEqual(getShootingTargetOptions(next, { attackerId: 'enemy' }), []);
  assert.match(summarizeGameEvent(next.history.at(-1), next).detail, /Did not shoot/);
  assert.equal(next.history.some(e => e.type === 'combat.attack_resolved'), false);
  assert.throws(() => recordShootingActivation(next, { unitId: 'enemy', actionType: 'not_shoot' }), /available/);
  assert.throws(() => recordShootingActivation(state(), { unitId: 'friendly', actionType: 'not_shoot' }), /active player/);
});

test('confirmed melee-only units do not block completion but may still perform Actions', () => {
  const initial = state(); initial.units[1].profile.weapons = [{ name: 'Claws', range: 'Melee' }];
  assert.deepEqual(getShootingCandidates(initial).available, []);
  assert.deepEqual(getShootingCandidates(initial).actionOnly, ['enemy']);
  assert.equal(completeShootingPhase(initial).phase, 'charge');
  assert.throws(() => recordShootingActivation(initial, { unitId: 'enemy', actionType: 'shoot' }), /available/);
  const action = recordShootingActivation(initial, { unitId: 'enemy', actionType: 'mission_action', actionId: 'cleanse' });
  assert.equal(action.history.at(-1).payload.actionType, 'mission_action');
  assert.deepEqual(getShootingCandidates(action).actionOnly, []);
});

test('saved melee-only datasheets are recognized; missing and mixed weapon data remain unresolved', () => {
  const initial = state(); initial.units[1].metadata = { rosterUnitId: 'saved' };
  initial.armyRosters = { p2: { units: [{ id: 'saved', datasheet: { weapons: [{ range: 'Melee' }] } }] } };
  assert.deepEqual(getShootingCandidates(initial).available, []);
  for (const weapons of [[], [{ name: 'Unknown' }], [{ range: 'Melee' }, { range: '18"' }]]) {
    initial.armyRosters.p2.units[0].datasheet.weapons = weapons;
    assert.deepEqual(getShootingCandidates(initial).available, ['enemy']);
  }
});

// Minimal event-capable elements exercise the actual Shoot/Action/Do not shoot handlers.
function shootingDom() {
  let html = '', nodes = [];
  return {
    get innerHTML() { return html; }, set innerHTML(value) {
      html = value; nodes = [...value.matchAll(/<(?:button|select)[^>]*\s(data-[\w-]+)(?:="([^"]*)")?[^>]*>/g)].map(m => ({ key: m[1], value: m[2] ?? '', events: {}, getAttribute(k) { return k === this.key ? this.value : null; }, addEventListener(k, fn) { this.events[k] = fn; } }));
    },
    querySelector(selector) { return nodes.find(n => selector === '[' + n.key + ']') ?? null; },
    querySelectorAll(selector) { return nodes.filter(n => selector === '[' + n.key + ']'); },
    replaceChildren() { html = ''; },
    click(selector) { const n = this.querySelector(selector); assert.ok(n, selector); n.events.click(); }
  };
}
test('Shooting UI offers and records Do not shoot for the selected unit', () => {
  const game = session(state()), root = shootingDom();
  const screen = createShootingScreen(root, { session: game, perspectivePlayerId: 'p1', layoutMode: 'classic' });
  try {
    root.click('[data-shoot-unit]');
    assert.match(root.innerHTML, /data-choice-not-shoot>Do not shoot/);
    root.click('[data-choice-not-shoot]');
    assert.equal(game.getState().history.at(-1).payload.actionType, 'not_shoot');
    assert.match(root.innerHTML, /Did not shoot/);
    assert.equal(game.getState().phase, 'shooting');
    root.click('[data-complete]'); assert.equal(game.getState().phase, 'charge');
  } finally { screen.destroy(); }
});

function movementFixture({ savedMovement = false } = {}) {
  const initial = state('movement');
  if (savedMovement) {
    initial.units[1].profile = null; initial.units[1].metadata = { rosterUnitId: 'saved' };
    initial.armyRosters = { p2: { units: [{ id: 'saved', datasheet: { characteristics: { Move: '6"' } } }] } };
  }
  const game = session(initial), handlers = {};
  const root = { innerHTML: '', replaceChildren() {}, querySelector() { return null; }, addEventListener(k, fn) { handlers[k] = fn; }, removeEventListener(k) { delete handlers[k]; } };
  const screen = createMovementScreen(root, { session: game, perspectivePlayerId: 'p1' });
  const board = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 440 }) };
  function drag(id, x = 120, y = 340) {
    const unit = game.getState().units.find(u => u.id === id);
    const marker = { style: { left: unit.position.x / 60 * 100 + '%', top: (44 - unit.position.y) / 44 * 100 + '%' }, classList: { add() {}, remove() {} }, setPointerCapture() {}, getAttribute: () => id, closest: selector => selector.includes('data-map-mode') ? {} : board };
    const down = { target: { closest: () => marker }, pointerId: 1, clientX: unit.position.x * 10, clientY: (44 - unit.position.y) * 10 };
    handlers.pointerdown(down); handlers.pointermove({ pointerId: 1, clientX: x, clientY: y, preventDefault() {} }); handlers.pointerup({ pointerId: 1, clientX: x, clientY: y });
  }
  return { root, game, screen, drag };
}
for (const savedMovement of [false, true]) test(`opponent can drag its units with fixed p1 perspective; saved Movement fallback=${savedMovement}`, () => {
  const x = movementFixture({ savedMovement });
  try {
    assert.match(x.root.innerHTML, /data-move-unit="enemy"/);
    assert.doesNotMatch(x.root.innerHTML, /data-move-unit="friendly"/);
    assert.match(x.root.innerHTML, /class="battlefield-map__unit opponent[^>]*data-map-unit-id="enemy" role="button"/);
    const friendly = { ...x.game.getState().units[0].position };
    x.drag('friendly', 60, 400); assert.deepEqual(x.game.getState().units[0].position, friendly);
    x.drag('enemy');
    assert.deepEqual(x.game.getState().units[1].position, { x: 12, y: 10 });
    assert.equal(x.game.getState().history.at(-1).payload.playerId, 'p2');
    assert.match(x.root.innerHTML, /Normal Move recorded/);
    x.drag('enemy', 300, 200);
    assert.deepEqual(x.game.getState().units[1].position, { x: 30, y: 24 });
    assert.equal(x.game.getState().history.filter(e => e.type === 'unit.normal_move_resolved').length, 1);
  } finally { x.screen.destroy(); }
});
test('opponent map movement is advisory and does not enforce movement distance', () => {
  const x = movementFixture();
  try {
    x.drag('enemy', 500, 40);
    assert.deepEqual(x.game.getState().units[1].position, { x: 50, y: 40 });
    assert.doesNotMatch(x.root.innerHTML, /cannot move farther/);
  } finally { x.screen.destroy(); }
});


test('Advance records approximate destination without enforcing map distance', () => {
  const initial = state('movement');
  const next = resolveAdvance(initial, {
    unitId: 'enemy',
    advanceRoll: 1,
    moves: [{ modelId: 'enemy', position: { x: 55, y: 40 } }]
  });
  assert.deepEqual(next.units.find(u => u.id === 'enemy').position, { x: 55, y: 40 });
  assert.equal(next.history.at(-1).type, 'unit.advanced');
  assert.ok(next.history.at(-1).payload.moves[0].distance > 7);
});

test('saved-roster ranged weapons populate Shooting weapon choices after choosing Shoot', () => {
  const initial = state('shooting');
  initial.activePlayer = 'p1';
  initial.battle.activePlayerId = 'p1';
  initial.units[0].profile = null;
  initial.units[0].metadata = { rosterUnitId: 'gargoyles' };
  initial.armyRosters = {
    p1: {
      units: [{
        id: 'gargoyles',
        datasheet: {
          weapons: [
            { name: 'Fleshborer', range: '18"', attacks: 1, skill: '4+', strength: 5, ap: 0, damage: 1 },
            { name: 'Blinding venom', range: 'Melee', attacks: 1, skill: '4+', strength: 3, ap: 0, damage: 1 }
          ]
        }
      }]
    }
  };
  const game = session(initial);
  game.dispatch({ type: 'shooting.record_activation', payload: { unitId: 'friendly', actionType: 'shoot', actionId: null } });
  const options = getShootingWeaponOptions(game.getState(), { attackerId: 'friendly', gameData: { weapons: [] } });
  assert.equal(options.length, 1);
  assert.equal(options[0].name, 'Fleshborer');
  assert.equal(options[0].type, 'ranged');
  assert.equal(options[0].characteristics.range, 18);
  assert.equal(options[0].characteristics.skill, 4);
});

test('saved-roster shooter can record actual damage even when live combat profiles are incomplete', () => {
  const initial = state('shooting');
  initial.activePlayer = 'p1';
  initial.battle.activePlayerId = 'p1';
  initial.units[0].profile = null;
  initial.units[0].metadata = { rosterUnitId: 'gargoyles' };
  initial.units[1].profile = null;
  initial.armyRosters = {
    p1: {
      units: [{
        id: 'gargoyles',
        datasheet: {
          weapons: [{ name: 'Fleshborer', range: '18"', attacks: 1, skill: '4+', strength: 5, ap: 0, damage: 1 }]
        }
      }]
    }
  };
  const game = session(initial);
  game.dispatch({ type: 'shooting.record_activation', payload: { unitId: 'friendly', actionType: 'shoot', actionId: null } });
  const [weapon] = getShootingWeaponOptions(game.getState(), { attackerId: 'friendly', gameData: { weapons: [] } });
  game.dispatch({ type: 'combat.resolve_attack', payload: { attackerId: 'friendly', targetId: 'enemy', weapon, actualDamage: 3 } });
  const event = game.getState().history.at(-1);
  assert.equal(event.type, 'combat.attack_resolved');
  assert.equal(event.payload.actualDamage, 3);
  assert.equal(event.payload.weaponId, weapon.id);
});
