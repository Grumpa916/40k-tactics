import test from 'node:test';
import assert from 'node:assert/strict';
import { endTurn } from '../../src/engine/state-transitions.js';
import { getTurnSnapshot } from '../../src/rules/scoring-evidence-state.js';

function control(controllerId) {
  return {
    id: 'center',
    controllerId,
    contestingPlayerIds: [],
    controlState: 'controlled'
  };
}

test('ending the first player turn captures the second player turn-start objective snapshot', () => {
  const state = {
    phase: 'end_turn',
    turn: 1,
    activePlayer: 'p1',
    players: [{ id: 'p1' }, { id: 'p2' }],
    battle: {
      id: 'battle',
      status: 'active',
      round: 1,
      firstPlayerId: 'p1',
      activePlayerId: 'p1'
    },
    objectives: [{ id: 'center', control: control('p2') }],
    units: [],
    history: [],
    scoring: {
      turnSnapshots: [{
        turn: 1,
        round: 1,
        playerId: 'p1',
        objectives: [{ id: 'center', control: control('p1') }],
        units: []
      }]
    },
    timers: {
      turnClock: {
        elapsedMsByPlayer: { p1: 0, p2: 0 },
        activePlayerId: 'p1',
        running: true,
        startedAtMs: 0
      }
    }
  };

  const next = endTurn(state, { nextActivePlayerId: 'p2', nowMs: 1000 });
  const snapshot = getTurnSnapshot(next, 2);

  assert.equal(next.phase, 'start_turn');
  assert.equal(next.turn, 2);
  assert.equal(next.activePlayer, 'p2');
  assert.equal(snapshot?.playerId, 'p2');
  assert.equal(snapshot?.round, 1);
  assert.equal(snapshot?.objectives[0]?.control?.controllerId, 'p2');
  assert.equal(getTurnSnapshot(next, 1)?.objectives[0]?.control?.controllerId, 'p1');
});
