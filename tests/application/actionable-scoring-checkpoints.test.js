import test from 'node:test';
import assert from 'node:assert/strict';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { getPrimaryCheckpointOpportunity, estimateReviewMissionVp } from '../../src/application/scoring-checkpoint-opportunities.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';

function control(controllerId = null, controlState = controllerId ? 'controlled' : 'uncontrolled') {
  return { id: '', controllerId, contestingPlayerIds: [], controlState };
}

function objective(id, name, controllerId, { fresh = true, turn = 3, round = 2 } = {}) {
  return {
    id,
    name,
    control: control(controllerId),
    ...(fresh ? { controlRecordedAt: { turn, round, phase: 'command' } } : {})
  };
}

function baseState({ opponentDisposition = 'Priority Assets', phase = 'movement', fresh = true } = {}) {
  return {
    phase,
    turn: 3,
    activePlayer: 'p1',
    battle: { status: 'active', round: 2, activePlayerId: 'p1', firstPlayerId: 'p1' },
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    units: [{ id: 'enemy', ownerId: 'p2', status: 'deployed', name: 'Enemy' }],
    history: [],
    objectives: [
      objective('myHome', 'My Home', 'p1', { fresh }),
      objective('myExp', 'My Expansion', 'p1', { fresh }),
      objective('center1', 'Central 1', 'p1', { fresh }),
      objective('center2', 'Central 2', null, { fresh }),
      objective('oppExp', 'Opponent Expansion', 'p2', { fresh }),
      objective('oppHome', 'Opponent Home', 'p2', { fresh })
    ],
    battlefieldMap: { missionSetup: { myDisposition: 'Purge the Foe', opponentDisposition } },
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: 'tactical', p2: 'tactical' } }
  };
}

function endTurnState(options = {}) {
  return { ...baseState(options), phase: 'end_turn' };
}

function destroyed(turn, unitId, ownerId) {
  return { type: 'unit.destroyed', payload: { turn, round: 2, unitId, ownerId } };
}

test('fresh recorded state with no scoring opportunity produces no popup', () => {
  const state = baseState();
  state.objectives = [
    objective('myHome', 'My Home', 'p1'),
    objective('myExp', 'My Expansion', null),
    objective('center1', 'Central 1', 'p2'),
    objective('center2', 'Central 2', null),
    objective('oppExp', 'Opponent Expansion', 'p2'),
    objective('oppHome', 'Opponent Home', 'p2')
  ];
  assert.equal(getScoringCheckpointReminder(state, { previousPhase: 'command', perspectivePlayerId: 'p1' }), null);
  assert.equal(renderScoringCheckpointDialog(state, null), '');
});

test('stale objective-dependent Primary opens only to confirm objective state', () => {
  const state = baseState({ fresh: false });
  state.objectives = state.objectives.map((item) => ({ ...item, controlRecordedAt: { turn: 2, round: 1, phase: 'fight' } }));
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'command', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.requiresObjectiveConfirmation, true);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Confirm objective control before scoring/);
  assert.doesNotMatch(html, /Confirm \+10 VP/);
});

test("Destroyer's Wrath command opportunity calculates 10 VP and offers one-tap confirmation", () => {
  const state = baseState();
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'command', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.requiresObjectiveConfirmation, false);
  assert.equal(reminder.groups[0].opportunity.calculatedPoints, 10);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Potential 10 VP/);
  assert.match(html, /Potential score from recorded state: 10 VP/);
  assert.match(html, /Confirm \+10 VP/);
  assert.doesNotMatch(html, /Confirm objective control before scoring/);
});

test("Destroyer's Wrath end turn stays silent with no kills and calculates 7 VP when both kill conditions are met", () => {
  const none = endTurnState();
  none.objectives = none.objectives.map((item) => ({ ...item, controlRecordedAt: { turn: 3, round: 2, phase: 'fight' } }));
  none.history = [destroyed(2, 'lost', 'p1')];
  assert.equal(getScoringCheckpointReminder(none, { previousPhase: 'fight', perspectivePlayerId: 'p1' }), null);

  const scored = endTurnState();
  scored.history = [destroyed(3, 'enemy', 'p2')];
  const reminder = getScoringCheckpointReminder(scored, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.groups[0].opportunity.calculatedPoints, 7);
  assert.match(renderScoringCheckpointDialog(scored, reminder), /Confirm \+7 VP/);
});

test('Unstoppable Force new-control opportunity uses the turn-start snapshot', () => {
  const state = endTurnState({ opponentDisposition: 'Take and Hold' });
  state.history = [];
  state.scoring.turnSnapshots = [{
    turn: 3, round: 2, playerId: 'p1',
    objectives: state.objectives.map((item) => ({
      id: item.id,
      control: item.id === 'myExp' ? control('p2') : item.control
    })),
    units: []
  }];
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.groups[0].opportunity.calculatedPoints, 3);

  const noCapture = structuredClone(state);
  noCapture.scoring.turnSnapshots[0].objectives = noCapture.objectives.map((item) => ({ id: item.id, control: item.control }));
  assert.equal(getScoringCheckpointReminder(noCapture, { previousPhase: 'fight', perspectivePlayerId: 'p1' }), null);
});

test('Punishment only opens when a condemned unit is recorded leaving the battlefield', () => {
  const state = endTurnState({ opponentDisposition: 'Disruption' });
  state.scoring.punishmentCondemnations = [{ playerId: 'p1', round: 2, turn: 3, unitIds: ['enemy'], unitNames: ['Enemy'] }];
  assert.equal(getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' }), null);
  state.history.push({ type: 'unit.entered_reserves', payload: { turn: 3, round: 2, unitId: 'enemy' } });
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.groups[0].opportunity.calculatedPoints, 5);
});

test('Consecrate end-turn tier is 3 VP for one marker and 6 VP for three markers', () => {
  const one = endTurnState({ opponentDisposition: 'Reconnaissance' });
  one.history = [{ type: 'primary.objective_consecrated', payload: { playerId: 'p1', unitId: 'u1', objectiveId: 'myExp', turn: 2, round: 1 } }];
  let reminder = getScoringCheckpointReminder(one, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.groups[0].opportunity.calculatedPoints, 3);

  const three = structuredClone(one);
  three.history.push(
    { type: 'primary.objective_consecrated', payload: { playerId: 'p1', unitId: 'u2', objectiveId: 'center1', turn: 2, round: 1 } },
    { type: 'primary.objective_consecrated', payload: { playerId: 'p1', unitId: 'u3', objectiveId: 'center2', turn: 3, round: 2 } }
  );
  reminder = getScoringCheckpointReminder(three, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.groups[0].opportunity.calculatedPoints, 6);
});

test('due-only unverified Secondary does not force a popup when no evidence or action was recorded', () => {
  const state = endTurnState();
  delete state.battlefieldMap;
  state.scoring.secondaryMissions = [{
    instanceId: 'unknown-card', playerId: 'p1', definitionId: 'unknown-card', status: 'active',
    definition: {
      id: 'unknown-card', name: 'Unknown Card', category: 'secondary', rulesVerified: false, conditions: [],
      scoringWindows: [{ timing: 'end-of-turn', tiers: [{ vp: 4, summary: 'Wholly within the enemy deployment zone.' }] }]
    }
  }];
  assert.equal(getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' }), null);
});

test('recorded Secondary home-control evidence produces a calculated scoring opportunity', () => {
  const state = endTurnState();
  delete state.battlefieldMap;
  state.scoring.secondaryMissions = [{
    instanceId: 'home-card', playerId: 'p1', definitionId: 'home-card', status: 'active',
    definition: {
      id: 'home-card', name: 'Hold Home', category: 'secondary', rulesVerified: false, conditions: [],
      scoringWindows: [{ timing: 'end-of-turn', tiers: [{ vp: 3, summary: 'You control your home objective.' }] }]
    }
  }];
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  const entry = reminder.groups[0].secondaryOpportunities[0];
  assert.equal(entry.opportunity.calculatedPoints, 3);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Hold Home · Potential 3 VP/);
  assert.match(html, /Confirm \+3 VP &amp; remove card/);
});

test('cumulative Secondary tiers can produce a calculated combined VP value', () => {
  const state = endTurnState();
  const mission = {
    category: 'secondary', definitionId: 'stronghold', instanceId: 'stronghold',
    result: { scoringWindows: [{ tiers: [
      { vp: 3, relationship: 'cumulative', summary: 'You control your home objective.' },
      { vp: 2, relationship: 'cumulative', summary: 'Control at least one non-home objective.' }
    ] }] }
  };
  const estimate = estimateReviewMissionVp(state, 'p1', mission);
  assert.equal(estimate.points, 5);
  assert.equal(estimate.partial, false);
});

test('recorded mission action keeps checkpoint actionable even when its card text is otherwise manual', () => {
  const state = endTurnState();
  delete state.battlefieldMap;
  state.units.push({ id: 'actor', ownerId: 'p1', status: 'deployed', name: 'Actor' });
  state.scoring.secondaryMissions = [{
    instanceId: 'manual-card', playerId: 'p1', definitionId: 'manual-card', status: 'active',
    definition: {
      id: 'manual-card', name: 'Manual Card', category: 'secondary', conditions: [], rulesVerified: false,
      scoringWindows: [{ timing: 'end-of-turn', tiers: [{ vp: 4, summary: 'Manual tabletop condition.' }] }]
    }
  }];
  state.history.push({ type: 'shooting.unit_activated', payload: {
    round: 2, turn: 3, playerId: 'p1', unitId: 'actor', missionInstanceId: 'manual-card',
    missionName: 'Manual Card', reviewTiming: 'end-of-turn'
  }});
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.groups[0].actionableActions.length, 1);
});

test('optional Tactical discard alone does not force an end-turn popup', () => {
  const state = endTurnState();
  delete state.battlefieldMap;
  state.scoring.secondaryMissions = [{
    instanceId: 'command-card', playerId: 'p1', definitionId: 'command-card', status: 'active',
    definition: {
      id: 'command-card', name: 'Command Card', category: 'secondary', missionMode: 'tactical', conditions: [],
      scoringWindows: [{ timing: 'command-phase', tiers: [{ vp: 4, summary: 'Manual condition.' }] }]
    }
  }];
  assert.equal(getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' }), null);
});
