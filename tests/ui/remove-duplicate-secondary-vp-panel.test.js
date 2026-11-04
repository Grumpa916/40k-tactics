import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';

test('Command sidebar no longer shows the duplicate secondary VP form', () => {
  const source = fs.readFileSync(new URL('../../src/ui/command-screen.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Confirm secondary mission VP|data-secondary-vp-form|secondaryVpForm|command-secondary-award/);
  assert.match(source, /<summary>Secondaries<\/summary>/, 'active cards and draw controls remain available');
  assert.match(source, /<summary>Scoring review<\/summary>/, 'the manual scoring review remains available');
  assert.match(source, /data-vp-form/, 'the existing VP correction form remains available');
});

test('the existing checkpoint popup remains the manual scoring entry point', () => {
  const state = {
    phase: 'end_turn', turn: 1, activePlayer: 'p1',
    battle: { round: 1, activePlayerId: 'p1' },
    players: [{ id: 'p1', name: 'You' }],
    units: [], objectives: [], history: [],
    scoring: {
      secondaryMissionModeByPlayer: { p1: 'tactical' },
      secondaryMissions: [{
        instanceId: 'card-1', playerId: 'p1', definitionId: 'test-card', status: 'active',
        definition: { id: 'test-card', name: 'Test Secondary', category: 'secondary',
          missionMode: 'tactical', scoringWindows: [
            { timing: 'end-of-turn', tiers: [{ vp: 3, summary: 'Confirm the tabletop result.' }] }
          ] }
      }]
    }
  };
  const reminder = { timing: 'end-of-turn', activePlayerId: 'p1',
    groups: [{ playerId: 'p1', playerName: 'You', checkpoint: 'end-of-turn',
      review: { primary: [], secondary: [] } }] };
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /role="dialog"/);
  assert.match(html, /Test Secondary/);
  assert.match(html, /3 VP/);
  assert.match(html, /data-checkpoint/);
  assert.match(html, /Done \/ continue/);
});
