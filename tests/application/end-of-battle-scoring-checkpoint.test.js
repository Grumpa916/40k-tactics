import test from 'node:test';
import assert from 'node:assert/strict';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';
import { recordVictoryPointsAward } from '../../src/engine/victory-points-ledger.js';
import { checkpointScoreKey } from '../../src/ui/checkpoint-score-controls.js';

function completedBattleState() {
  return {
    phase: 'complete',
    turn: 10,
    activePlayer: 'p1',
    battle: { status: 'complete', round: 5, activePlayerId: 'p1', firstPlayerId: 'p1' },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    units: [],
    history: [],
    objectives: [],
    battlefieldMap: {
      missionSetup: {
        myDisposition: 'Purge the Foe',
        opponentDisposition: 'Reconnaissance'
      }
    },
    scoring: {
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: 'tactical', p2: 'tactical' }
    }
  };
}

const groupFor = (reminder, playerId) => reminder?.groups?.find(group => group.playerId === playerId) ?? null;

test('battle completion opens end-of-battle manual primary scoring for both players', () => {
  const state = completedBattleState();
  const reminder = getScoringCheckpointReminder(state, {
    previousPhase: 'end_turn',
    perspectivePlayerId: 'p1'
  });

  assert.ok(reminder);
  assert.equal(reminder.timing, 'end-of-battle');
  assert.equal(reminder.label, 'End of battle');
  assert.equal(reminder.groups.length, 2);

  const mine = groupFor(reminder, 'p1');
  const opponent = groupFor(reminder, 'p2');
  assert.equal(mine.checkpoint, 'end-of-battle');
  assert.equal(opponent.checkpoint, 'end-of-battle');
  assert.equal(mine.primaryReference.name, 'Consecrate');
  assert.equal(opponent.primaryReference.name, 'Triangulation');
  assert.deepEqual(mine.primaryScoringWindows.map(window => window.items.map(item => item.vp)), [[5]]);
  assert.deepEqual(opponent.primaryScoringWindows.map(window => window.items.map(item => item.vp)), [[10]]);

  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /End of battle/);
  assert.match(html, /Consecrate/);
  assert.match(html, /Triangulation/);
  assert.match(html, /Record \+5 VP/);
  assert.match(html, /Record \+10 VP/);
});

test('end-of-battle reminder is emitted only on the transition into complete', () => {
  const state = completedBattleState();
  assert.ok(getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' }));
  assert.equal(getScoringCheckpointReminder(state, { previousPhase: 'complete', perspectivePlayerId: 'p1' }), null);
});

test('a recorded end-of-battle primary is suppressed without hiding the other player', () => {
  const state = completedBattleState();
  const scored = recordVictoryPointsAward(state, {
    playerId: 'p1',
    amount: 5,
    reason: 'Consecrate',
    missionDefinitionId: 'primary-consecrate',
    category: 'primary',
    scoringTiming: 'end-of-battle',
    opportunityKey: checkpointScoreKey(state, 'p1', 'end-of-battle'),
    round: 5,
    turn: 10
  });

  const reminder = getScoringCheckpointReminder(scored, {
    previousPhase: 'end_turn',
    perspectivePlayerId: 'p1'
  });

  assert.ok(reminder);
  assert.equal(groupFor(reminder, 'p1'), null);
  assert.equal(groupFor(reminder, 'p2').primaryReference.name, 'Triangulation');
});
