import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { COMMAND_TYPES } from '../../src/commands/game-commands.js';
import { renderLiveCasualtyStatus } from '../../src/ui/live-casualty-panel.js';

function state(phase = 'shooting') {
  return createGameState({
    phase,
    turn: 2,
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    battle: { id: 'b', status: 'active', round: 2, firstPlayerId: 'p1', activePlayerId: 'p1' },
    battlefieldMap: { declaredReserves: { enemyReserve: true } },
    units: [
      { id: 'hero', name: 'Hero', ownerId: 'p1', status: 'deployed', wounds: 5, startingWounds: 5, position: { x: 10, y: 10 } },
      { id: 'enemyField', name: 'Enemy Field', ownerId: 'p2', status: 'deployed', wounds: 4, startingWounds: 4, position: { x: 30, y: 20 } },
      { id: 'enemyReserve', name: 'Enemy Reserve', ownerId: 'p2', status: 'reserves', wounds: 3, startingWounds: 3, position: null }
    ]
  });
}

function session(initial = state()) {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  return createGameSession(initial);
}

test('wounds can be corrected in any live phase and a mistaken destruction can be restored', () => {
  const game = session(state('shooting'));
  game.dispatch({ type: COMMAND_TYPES.ADJUST_UNIT_WOUNDS, payload: { unitId: 'hero', amount: -2 } });
  assert.equal(game.getState().units.find(unit => unit.id === 'hero').wounds, 3);
  assert.equal(game.getLastCorrection()?.label, 'wound adjustment');

  game.dispatch({ type: COMMAND_TYPES.ADJUST_UNIT_WOUNDS, payload: { unitId: 'hero', amount: -3 } });
  assert.equal(game.getState().units.find(unit => unit.id === 'hero').status, 'destroyed');
  game.dispatch({ type: COMMAND_TYPES.ADJUST_UNIT_WOUNDS, payload: { unitId: 'hero', amount: 1 } });
  const restored = game.getState().units.find(unit => unit.id === 'hero');
  assert.equal(restored.wounds, 1);
  assert.equal(restored.status, 'deployed');
  assert.equal(game.getState().history.at(-1).type, 'unit.wounds_adjusted');
});

test('Battle-shock can be toggled as a manual correction outside Command phase', () => {
  const game = session(state('fight'));
  game.dispatch({ type: COMMAND_TYPES.SET_MANUAL_BATTLE_SHOCK, payload: { unitId: 'hero', battleShocked: true } });
  assert.equal(game.getState().units.find(unit => unit.id === 'hero').battleShocked, true);
  game.dispatch({ type: COMMAND_TYPES.SET_MANUAL_BATTLE_SHOCK, payload: { unitId: 'hero', battleShocked: false } });
  assert.equal(game.getState().units.find(unit => unit.id === 'hero').battleShocked, false);
});

test('either army can be moved between reserves and battlefield during any active phase', () => {
  const game = session(state('shooting'));
  game.dispatch({
    type: COMMAND_TYPES.TRANSFER_MAP_RESERVE,
    payload: { unitId: 'enemyReserve', destination: 'battlefield', position: { x: 42, y: 16 } }
  });
  let enemy = game.getState().units.find(unit => unit.id === 'enemyReserve');
  assert.equal(enemy.status, 'deployed');
  assert.deepEqual(enemy.position, { x: 42, y: 16 });
  assert.equal(game.getState().history.at(-1).payload.reason, 'Manual live-state correction');

  game.dispatch({ type: COMMAND_TYPES.TRANSFER_MAP_RESERVE, payload: { unitId: 'enemyReserve', destination: 'reserves' } });
  enemy = game.getState().units.find(unit => unit.id === 'enemyReserve');
  assert.equal(enemy.status, 'reserves');
  assert.equal(enemy.position, null);
});

test('opponent map coordinates can be corrected outside Movement and Charge', () => {
  const game = session(state('command'));
  game.dispatch({
    type: COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION,
    payload: {
      unitId: 'enemyField',
      playerId: 'p2',
      moves: [{ modelId: 'enemyField', position: { x: 27, y: 18 } }]
    }
  });
  assert.deepEqual(game.getState().units.find(unit => unit.id === 'enemyField').position, { x: 27, y: 18 });
});

test('persistent unit status controls expose live corrections for deployed and reserve units', () => {
  const current = state('fight');
  const hero = current.units.find(unit => unit.id === 'hero');
  const reserve = current.units.find(unit => unit.id === 'enemyReserve');
  const heroControls = renderLiveCasualtyStatus(current, hero).controls;
  const reserveControls = renderLiveCasualtyStatus(current, reserve).controls;

  assert.match(heroControls, /data-adjust-unit-wounds="-1"/);
  assert.match(heroControls, /data-toggle-live-battle-shock/);
  assert.match(heroControls, /data-live-map-reposition/);
  assert.match(heroControls, /data-live-reserve-transfer="reserves"/);
  assert.match(reserveControls, /data-live-reserve-transfer="battlefield"/);
});
