import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createBattleShell } from '../../src/ui/battle-shell.js';
import { renderPhaseProgressionPanel, getPhaseProgressionAction } from '../../src/ui/phase-progression-panel.js';

function setup({ phase = 'command', rejected = false } = {}) {
  clearCommandHandlers(); registerCoreCommandHandlers();
  const state = createGameState({ phase, turn: 1, activePlayer: 'p1', players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }], units: [], timers: { turnClock: { elapsedMsByPlayer: { p1: 1000, p2: 0 }, activePlayerId: 'p1', running: true, startedAtMs: Date.now() } }, battle: { id: 'test', status: 'active', round: 1, firstPlayerId: 'p1', activePlayerId: 'p1' } });
  const session = createGameSession(state, rejected ? { commandExecutor: () => { throw Error('Record remaining activations before continuing.'); } } : {});
  const listeners = new Set(), host = { innerHTML: '' }, screen = { innerHTML: '', replaceChildren() {} };
  const root = { innerHTML: '', replaceChildren() {}, contains: () => true, querySelector(selector) { return selector === '[data-phase-progression-host]' ? host : selector === '[data-battle-screen]' ? screen : null; }, addEventListener(type, fn) { if (type === 'click') listeners.add(fn); }, removeEventListener(type, fn) { listeners.delete(fn); } };
  const shell = createBattleShell(root, { session, screenFactories: {} });
  const click = (selector, phase) => { const button = { getAttribute: name => ['data-battle-phase-button','data-setup-workspace-tab'].includes(name) ? phase : null }; const event = { target: { closest: value => value === selector ? button : null } }; for (const fn of [...listeners]) fn(event); };
  return { state, session, root, host, shell, click };
}

test('real shell advances all phases, switches player within Round 1, then starts Round 2', () => {
  const x = setup();
  try {
    assert.match(x.host.innerHTML, /End Command · Continue to Movement/);
    for (const phase of ['movement', 'shooting', 'charge', 'fight', 'end_turn']) {
      x.click('[data-advance-game-phase]'); assert.equal(x.session.getState().phase, phase);
    }
    x.click('[data-advance-game-phase]');
    assert.equal(x.session.getState().activePlayer, 'p2');
    assert.equal(x.session.getState().battle.round, 1);
    assert.equal(x.session.getState().phase, 'start_turn');
    assert.equal(x.session.getState().timers.turnClock.activePlayerId, 'p2');
    for (const phase of ['command', 'movement', 'shooting', 'charge', 'fight', 'end_turn', 'end_battle_round', 'start_turn']) {
      x.click('[data-advance-game-phase]'); assert.equal(x.session.getState().phase, phase);
    }
    assert.equal(x.session.getState().battle.round, 2);
    assert.equal(x.session.getState().activePlayer, 'p1');
    assert.equal(x.session.getState().timers.turnClock.activePlayerId, 'p1');
    assert.ok(x.session.getState().history.some(e => e.type === 'turn.phase_changed'));
  } finally { x.shell.destroy(); }
});

test('browsing Fight cannot advance Command; Return restores current phase without changing state', () => {
  const x = setup();
  try {
    x.click('[data-battle-phase-button]', 'fight');
    assert.match(x.host.innerHTML, /Return to current phase · Command/);
    const before = x.session.getState();
    x.click('[data-advance-game-phase]'); assert.equal(x.session.getState(), before);
    x.click('[data-return-current-phase]'); assert.equal(x.session.getState(), before);
    assert.match(x.host.innerHTML, /End Command · Continue to Movement/);
  } finally { x.shell.destroy(); }
});

test('engine rejection is visible and keeps the current phase', () => {
  const x = setup({ phase: 'shooting', rejected: true });
  try {
    x.click('[data-advance-game-phase]');
    assert.equal(x.session.getState().phase, 'shooting');
    assert.match(x.host.innerHTML, /Record remaining activations/);
  } finally { x.shell.destroy(); }
});

test('stale current-phase rejection is hidden while previewing another phase', () => {
  const state = createGameState({ phase: 'shooting', activePlayer: 'p1', players: [{ id: 'p1' }, { id: 'p2' }], battle: { status: 'active', round: 1, activePlayerId: 'p1' } });
  const message = 'Shooting phase cannot be completed while eligible units remain.';
  const current = renderPhaseProgressionPanel(state, 'shooting', message);
  const preview = renderPhaseProgressionPanel(state, 'fight', message);
  assert.match(current, /Shooting phase cannot be completed while eligible units remain/);
  assert.match(preview, /Return to current phase · Shooting/);
  assert.doesNotMatch(preview, /Shooting phase cannot be completed while eligible units remain/);
});

test('setup and completed battles do not offer phase advancement', () => {
  for (const status of ['setup', 'deployment', 'complete']) {
    const state = { phase: 'command', battle: { status } };
    assert.equal(getPhaseProgressionAction(state), null);
    assert.equal(renderPhaseProgressionPanel(state, 'command'), '');
  }
});

test('delayed cloud connection preserves setup input, then mounts cloud containers on returning to account or army tabs', () => {
  for (const tab of ['saves','army-selection','army-builder']) {
    const x=setup({phase:'setup'});
    try {
      x.click('[data-setup-workspace-tab]','pre-game');
      const before=x.root.innerHTML;
      x.shell.connectCloud({auth:{getUser:async()=>({data:{user:null}})},from(){}});
      assert.equal(x.root.innerHTML,before);
      x.click('[data-setup-workspace-tab]',tab);
      assert.match(x.root.innerHTML,/data-supabase-auth-panel/);
      assert.match(x.root.innerHTML,/data-army-selection-panel/);
    } finally {x.shell.destroy();}
  }
});
test('cloud arrival never remounts the current live phase', () => {
  const x=setup();
  try {
    const before=x.root.innerHTML;
    x.shell.connectCloud({auth:{getUser:async()=>({data:{user:null}})},from(){}});
    assert.equal(x.root.innerHTML,before);
  } finally {x.shell.destroy();}
});
