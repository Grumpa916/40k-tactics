import test from 'node:test';
import assert from 'node:assert/strict';
import { changePhase } from '../../src/engine/state-transitions.js';

const state = (mode, cards = [], activePlayer = 'p1') => ({
  players: [{ id: 'p1' }, { id: 'p2' }],
  battle: { status: 'active', round: 1, activePlayerId: activePlayer },
  activePlayer, phase: 'command', turn: 1, history: [],
  scoring: { secondaryMissionModeByPlayer: { [activePlayer]: mode }, secondaryMissions: cards },
  units: [], objectives: []
});
const card = (playerId, id, status = 'active') => ({ playerId, instanceId: id, status, scoringHistory: [] });

test('Tactical player needs two active cards before Command advances', () => {
  for (const cards of [[], [card('p1', 'a')], [card('p1', 'a'), card('p1', 'b', 'scored')]]) {
    assert.throws(() => changePhase(state('tactical', cards), { phase: 'movement' }), /two active Tactical secondary cards/);
  }
  const ready = state('tactical', [card('p1', 'a'), card('p1', 'b')]);
  assert.equal(changePhase(ready, { phase: 'movement' }).phase, 'movement');
});

test('only the active player is checked; Fixed cards persist across turns', () => {
  const opponentTurn = state('tactical', [card('p1', 'a'), card('p2', 'b'), card('p2', 'c')], 'p2');
  assert.equal(changePhase(opponentTurn, { phase: 'movement' }).phase, 'movement');
  assert.equal(changePhase(state('fixed'), { phase: 'movement' }).phase, 'movement');
});
