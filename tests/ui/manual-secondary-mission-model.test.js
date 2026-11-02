import test from 'node:test';
import assert from 'node:assert/strict';
import { getLiveMissionActionOptions } from '../../src/rules/mission-action-state.js';
import { createMissionActionPicker } from '../../src/ui/mission-action-picker.js';
import { renderPersistentMissionSummary } from '../../src/ui/mission-summary-panel.js';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';

function cleanseDefinition() {
  return {
    id: 'secondary-cleanse',
    name: 'Cleanse',
    category: 'secondary',
    missionMode: 'tactical',
    rulesVerified: true,
    missionAction: {
      id: 'cleanse',
      name: 'Cleanse',
      phase: 'shooting',
      completion: 'end-of-turn',
      summary: 'A qualifying unit cleanses a non-home objective.'
    },
    scoringWindows: [{
      timing: 'end-of-turn',
      timingLabel: 'End of your turn',
      modes: ['tactical'],
      tiers: [
        { vp: 2, relationship: 'or', summary: 'One objective was cleansed by your army this turn.' },
        { vp: 5, relationship: 'or', summary: 'Two or more objectives were cleansed by your army this turn.' }
      ]
    }]
  };
}

function baseState({ myDisposition = 'Purge the Foe', opponentDisposition = 'Purge the Foe', phase = 'shooting' } = {}) {
  return {
    phase,
    turn: 3,
    activePlayer: 'p1',
    battle: { id: 'battle', status: 'active', round: 2, activePlayerId: 'p1', firstPlayerId: 'p1' },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    units: [{ id: 'u1', name: 'Unit', ownerId: 'p1', status: 'deployed', profile: { weaponIds: [] } }],
    objectives: [],
    history: [],
    battlefieldMap: { missionSetup: { myDisposition, opponentDisposition } },
    scoring: {
      secondaryMissionModeByPlayer: { p1: 'tactical', p2: 'tactical' },
      secondaryMissions: [{
        instanceId: 'cleanse-1',
        playerId: 'p1',
        definitionId: 'secondary-cleanse',
        status: 'active',
        drawnRound: 2,
        drawnTurn: 3,
        definition: cleanseDefinition()
      }]
    }
  };
}

test('active Secondary cards do not become live Shooting mission Actions', () => {
  const state = baseState();
  assert.deepEqual(getLiveMissionActionOptions(state, 'p1'), []);
  const html = createMissionActionPicker().render(state, 'u1');
  assert.equal(html.includes('Cleanse'), false);
  assert.match(html, /Secondary missions are scored manually at their checkpoint/);
});

test('Primary Actions remain available while an active Secondary stays out of the picker', () => {
  const state = baseState({ myDisposition: 'Disruption', opponentDisposition: 'Take and Hold' });
  const actions = getLiveMissionActionOptions(state, 'p1');
  assert.equal(actions.length, 1);
  assert.equal(actions[0].definitionId, 'primary-death-trap');
  const html = createMissionActionPicker().render(state, 'u1');
  assert.match(html, /Death Trap|Booby Trap/);
  assert.equal(html.includes('Cleanse'), false);
});

test('Secondary mission summary is reference-only and does not show live Action progress', () => {
  const state = baseState();
  state.history.push({
    type: 'shooting.unit_activated',
    payload: {
      round: 2, turn: 3, playerId: 'p1', unitId: 'u1', actionType: 'mission_action',
      missionDefinitionId: 'secondary-cleanse', missionInstanceId: 'cleanse-1', reviewTiming: 'end-of-turn'
    }
  });
  const html = renderPersistentMissionSummary(state, { perspectivePlayerId: 'p1' });
  assert.match(html, /Cleanse/);
  assert.match(html, /Reference only/);
  assert.match(html, /Secondary Action completion is not tracked live/);
  assert.match(html, /Secondary scoring is manual and player-confirmed/);
  assert.doesNotMatch(html, /Cleanse this turn:/);
  assert.doesNotMatch(html, /awaiting end-of-turn review/);
  assert.doesNotMatch(html, /attempted/);
});

test('known Secondary still opens manual scoring with all configured VP choices and no Action history', () => {
  const state = baseState({ phase: 'end_turn' });
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  const group = reminder.groups.find(item => item.playerId === 'p1');
  assert.ok(group);
  assert.equal(group.review.secondary.length, 1);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Cleanse/);
  assert.match(html, /2 VP/);
  assert.match(html, /5 VP/);
  assert.match(html, /physical tabletop/i);
  assert.doesNotMatch(html, /Verify recorded actions/i);
});
