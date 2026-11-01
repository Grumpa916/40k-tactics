import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createMovementScreen } from '../../src/ui/movement-screen.js';
import { recordFightActivation } from '../../src/engine/fight-transitions.js';
import { getFightAttackOptions, getFightWeaponOptions } from '../../src/application/fight-workflow.js';

function baseState(phase = 'fight') {
  return createGameState({
    phase,
    turn: 1,
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    battle: { id: 'b', status: 'active', round: 1, firstPlayerId: 'p1', activePlayerId: 'p1' },
    units: [
      { id: 'tyrannofex', name: 'Tyrannofex', ownerId: 'p1', status: 'deployed', position: { x: 5, y: 5 }, profile: null },
      { id: 'enemy', name: 'Hormagaunts', ownerId: 'p2', status: 'deployed', position: { x: 8, y: 8 }, profile: null }
    ]
  });
}

test('legacy/live Tyrannofex resolves catalog melee weapon by unit name', () => {
  const state = baseState('fight');
  const options = getFightWeaponOptions(state, { attackerId: 'tyrannofex', gameData: { weapons: [] } });
  assert.ok(options.some((weapon) => weapon.name === 'Powerful limbs'));
  assert.ok(options.every((weapon) => weapon.type === 'melee'));
});

test('Do not fight resolves the unit without making it an attack option', () => {
  const next = recordFightActivation(baseState('fight'), { unitId: 'tyrannofex', actionType: 'not_fight' });
  assert.equal(next.history.at(-1).payload.actionType, 'not_fight');
  assert.equal(getFightAttackOptions(next, { perspectivePlayerId: 'p1' }).attackers.some((unit) => unit.unitId === 'tyrannofex'), false);
});

test('Movement UI shows explicit Normal Move, Advance, and Did Not Move choices before movement', () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const game = createGameSession(baseState('movement'));
  const handlers = {};
  const root = {
    innerHTML: '',
    replaceChildren() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { handlers[type] = fn; },
    removeEventListener(type) { delete handlers[type]; }
  };
  const screen = createMovementScreen(root, { session: game, perspectivePlayerId: 'p1' });
  try {
    assert.doesNotMatch(root.innerHTML, /data-move-x|data-move-y|move-coordinate-row/);
    assert.doesNotMatch(root.innerHTML, /p1:|p2:/);
    assert.match(root.innerHTML, /data-move-stationary>Did Not Move<\/button>/);
    assert.match(root.innerHTML, /data-move-save>Normal Move<\/button>/);
    assert.match(root.innerHTML, /data-move-advance disabled>Select Advance roll<\/button>/);
    assert.match(root.innerHTML, /data-advance-roll="1"/);
    assert.match(root.innerHTML, /data-advance-roll="6"/);
    assert.doesNotMatch(root.innerHTML, /data-refine-advance/);

    game.dispatch({
      type: 'unit.normal_move',
      payload: { unitId:'tyrannofex', moves:[{ modelId:'tyrannofex', position:{ x:7, y:5 } }] }
    });

    assert.match(root.innerHTML, /Normal Move recorded/);
    assert.match(root.innerHTML, /<summary>Refine move type<\/summary>/);
    assert.match(root.innerHTML, /data-advance-roll="1"/);
    assert.match(root.innerHTML, /data-advance-roll="6"/);
    assert.match(root.innerHTML, /data-refine-advance disabled>Select Advance roll<\/button>/);
    assert.match(root.innerHTML, /data-refine-fallback>Mark Fall Back<\/button>/);
    assert.match(root.innerHTML, /data-refine-special>Special movement<\/button>/);
  } finally {
    screen.destroy();
  }
});

test('Movement Advance choice records the selected roll before dragging the map marker', () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const game = createGameSession(baseState('movement'));
  const handlers = {};
  const root = {
    innerHTML: '', replaceChildren() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener(type, fn) { handlers[type] = fn; }, removeEventListener(type) { delete handlers[type]; }
  };
  const screen = createMovementScreen(root, { session: game, perspectivePlayerId: 'p1', layoutMode: 'tabletop' });
  const tap = (name, value = null) => {
    const button = { dataset: {}, hasAttribute: key => key === name, getAttribute: key => key === name ? value : null };
    handlers.click({ target: { closest: selector => selector === 'button' ? button : null } });
  };
  try {
    assert.match(root.innerHTML, /data-move-save>Normal Move<\/button>/);
    tap('data-advance-roll', '3');
    assert.match(root.innerHTML, /data-move-advance>Advance \+3"<\/button>/);
    tap('data-move-advance');
    assert.equal(game.getState().history.at(-1).type, 'unit.advanced');
    assert.equal(game.getState().history.at(-1).payload.advanceRoll, 3);
    assert.match(root.innerHTML, /Advance recorded · \+3&quot;/);
  } finally {
    screen.destroy();
  }
});
