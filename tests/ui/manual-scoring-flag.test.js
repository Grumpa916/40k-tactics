import test from 'node:test';
import assert from 'node:assert/strict';
import { isManualScoringEnabled, setManualScoringEnabledForTests } from '../../src/config/feature-flags.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';
import { renderCheckpointScore } from '../../src/ui/checkpoint-score-controls.js';
import { renderEndTurnContent } from '../../src/ui/end-turn-screen.js';
import { renderStatusSummaryContent } from '../../src/ui/battle-shell-scoreboard.js';
import { createGameState } from '../../src/state/game-state.js';

const state = createGameState({
  phase: 'end_turn', turn: 1, activePlayer: 'p1',
  players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
  battle: { id: 'b', status: 'active', round: 1, activePlayerId: 'p1' },
  units: []
});
const reminder = {
  timing: 'end-of-turn', activePlayerId: 'p1',
  groups: [{ playerId: 'p1', playerName: 'You', checkpoint: 'end-of-turn', review: { primary: [], secondary: [] } }]
};
const mission = {
  category: 'primary', definitionId: 'primary-1', definitionName: 'Take and Hold', victoryPoints: 5,
  scoringWindows: [{ when: 'End of own turn', items: [{ vp: 5, summary: 'Control the objective.' }] }]
};

test('manual scoring controls are hidden while the flag is off and present when it is on', () => {
  setManualScoringEnabledForTests(undefined);
  assert.equal(isManualScoringEnabled(), false);
  assert.equal(renderScoringCheckpointDialog(state, reminder), '');
  assert.equal(renderCheckpointScore(state, { playerId: 'p1', checkpoint: 'end-of-turn' }, mission), '');
  assert.doesNotMatch(renderEndTurnContent(state, { perspectivePlayerId: 'p1' }), /<button[^>]*data-open-scoring-checkpoint|Review mission scoring/);
  const hidden = renderStatusSummaryContent(state, 'end_turn');
  assert.doesNotMatch(hidden, /data-open-score-adjust-kind="vp"/);
  assert.match(hidden, /data-open-score-adjust-kind="cp"/);

  setManualScoringEnabledForTests(true);
  assert.match(renderScoringCheckpointDialog(state, reminder), /role="dialog"/);
  assert.match(renderCheckpointScore(state, { playerId: 'p1', checkpoint: 'end-of-turn' }, mission), /data-checkpoint-score|Record/);
  assert.match(renderEndTurnContent(state, { perspectivePlayerId: 'p1' }), /Scoring remains manual/);
  assert.match(renderStatusSummaryContent(state, 'end_turn'), /data-open-score-adjust-kind="vp"/);
  setManualScoringEnabledForTests(undefined);
});
