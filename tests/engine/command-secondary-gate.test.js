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
const card = (playerId, id, status = 'active', { round = 1, turn = 1 } = {}) => ({
  playerId, instanceId: id, status, scoringHistory: [], drawnRound: round, drawnTurn: turn
});

test('Tactical player needs two new cards from this Command phase before advancing', () => {
  for (const cards of [[], [card('p1', 'a')], [card('p1', 'a'), card('p1', 'b', 'returned-to-deck')]]) {
    assert.throws(() => changePhase(state('tactical', cards), { phase: 'movement' }), /two new Tactical secondary cards/);
  }
  const ready = state('tactical', [card('p1', 'a'), card('p1', 'b')]);
  assert.equal(changePhase(ready, { phase: 'movement' }).phase, 'movement');
});

test('only the active player and current Command draws count; Fixed cards persist', () => {
  const oldOpponentCard = card('p2', 'old', 'active', { round: 1, turn: 0 });
  const oneDraw = state('tactical', [
    card('p1', 'a'), oldOpponentCard, card('p2', 'b')
  ], 'p2');
  assert.throws(() => changePhase(oneDraw, { phase: 'movement' }), /two new Tactical secondary cards/);
  const opponentTurn = state('tactical', [
    card('p1', 'a'), oldOpponentCard, card('p2', 'b'), card('p2', 'c')
  ], 'p2');
  assert.equal(changePhase(opponentTurn, { phase: 'movement' }).phase, 'movement');
  assert.equal(changePhase(state('fixed'), { phase: 'movement' }).phase, 'movement');
});
