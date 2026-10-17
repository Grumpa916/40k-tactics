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

test('Movement UI hides model IDs and X/Y coordinate entry', () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const game = createGameSession(baseState('movement'));
  const handlers = {};
  const root = {
    innerHTML: '',
    replaceChildren() {},
    querySelector() { return null; },
    addEventListener(type, fn) { handlers[type] = fn; },
    removeEventListener(type) { delete handlers[type]; }
  };
  const screen = createMovementScreen(root, { session: game, perspectivePlayerId: 'p1' });
  try {
    assert.doesNotMatch(root.innerHTML, /data-move-x|data-move-y|move-coordinate-row/);
    assert.doesNotMatch(root.innerHTML, /p1:|p2:/);
    assert.match(root.innerHTML, /Position is handled only by dragging the map marker/);
  } finally {
    screen.destroy();
  }
});
