import test from 'node:test';
import assert from 'node:assert/strict';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { estimateReviewMissionVp } from '../../src/application/scoring-checkpoint-opportunities.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';

const control = (controllerId = null, controlState = controllerId ? 'controlled' : 'uncontrolled') => ({
  id: '', controllerId, contestingPlayerIds: [], controlState
});
const objective = (id, name, controllerId, { fresh = true, turn = 3, round = 2 } = {}) => ({
  id,
  name,
  control: control(controllerId),
  ...(fresh ? { controlRecordedAt: { turn, round, phase: 'command' } } : {})
});

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
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: 'tactical', p2: 'tactical' }
    }
  };
}

const endTurnState = (options = {}) => ({ ...baseState(options), phase: 'end_turn' });
const destroyed = (turn, unitId, ownerId) => ({ type: 'unit.destroyed', payload: { turn, round: 2, unitId, ownerId } });
const playerGroup = (reminder, playerId = 'p1') => reminder?.groups?.find(group => group.playerId === playerId) ?? null;

// Live scoring is timing-driven. Recorded objective state, combat history and mission Actions
// may inform advice/review elsewhere, but they do not decide whether a due scoring checkpoint opens.
test('due Primary checkpoint opens even when recorded state suggests no scoring opportunity', () => {
  const state = baseState();
  state.objectives = [
    objective('myHome', 'My Home', 'p1'),
    objective('myExp', 'My Expansion', null),
    objective('center1', 'Central 1', 'p2'),
    objective('center2', 'Central 2', null),
    objective('oppExp', 'Opponent Expansion', 'p2'),
    objective('oppHome', 'Opponent Home', 'p2')
  ];
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'command', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.requiresObjectiveConfirmation, false);
  assert.equal(playerGroup(reminder).primaryReference.name, "Destroyer's Wrath");
  assert.equal(playerGroup(reminder).primaryScoringWindows.length, 1);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Destroyer&#39;s Wrath|Destroyer's Wrath/);
  assert.match(html, /manual scoring/i);
  assert.doesNotMatch(html, /Potential score from recorded state/i);
});

test('stale objective data never creates an objective-confirmation scoring gate', () => {
  const state = baseState({ fresh: false });
  state.objectives = state.objectives.map(item => ({ ...item, controlRecordedAt: { turn: 2, round: 1, phase: 'fight' } }));
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'command', perspectivePlayerId: 'p1' });
  assert.ok(reminder);
  assert.equal(reminder.requiresObjectiveConfirmation, false);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.doesNotMatch(html, /Confirm objective control before scoring/i);
  assert.match(html, /physical tabletop/i);
});

test("Destroyer's Wrath command checkpoint lists configured VP choices instead of calculating a result", () => {
  const state = baseState();
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'command', perspectivePlayerId: 'p1' });
  const group = playerGroup(reminder);
  assert.ok(group);
  assert.equal(group.opportunity, undefined);
  assert.deepEqual(group.primaryScoringWindows[0].items.map(item => item.vp), [4, 6]);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Choose agreed VP/);
  assert.match(html, />4 VP</);
  assert.match(html, />6 VP</);
  assert.match(html, />10 VP</);
  assert.doesNotMatch(html, /Potential 10 VP|Confirm \+10 VP/);
});

test("Destroyer's Wrath end-turn checkpoint stays available regardless of recorded kills", () => {
  const none = endTurnState();
  none.history = [destroyed(2, 'lost', 'p1')];
  const noKillReminder = getScoringCheckpointReminder(none, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const noKillGroup = playerGroup(noKillReminder);
  assert.ok(noKillGroup);
  assert.equal(noKillGroup.primaryScoringWindows.length, 2);

  const withKill = endTurnState();
  withKill.history = [destroyed(3, 'enemy', 'p2')];
  const killReminder = getScoringCheckpointReminder(withKill, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const killGroup = playerGroup(killReminder);
  assert.ok(killGroup);
  assert.deepEqual(
    killGroup.primaryScoringWindows.map(window => window.items.map(item => item.vp)),
    noKillGroup.primaryScoringWindows.map(window => window.items.map(item => item.vp))
  );
  const html = renderScoringCheckpointDialog(withKill, killReminder);
  assert.match(html, /Choose agreed VP/);
  assert.doesNotMatch(html, /Confirm \+7 VP|Potential 7 VP/);
});

test('Unstoppable Force due checkpoint is independent of the turn-start objective snapshot', () => {
  const state = endTurnState({ opponentDisposition: 'Take and Hold' });
  state.scoring.turnSnapshots = [{
    turn: 3,
    round: 2,
    playerId: 'p1',
    objectives: state.objectives.map(item => ({ id: item.id, control: item.id === 'myExp' ? control('p2') : item.control })),
    units: []
  }];
  let reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const captured = playerGroup(reminder);
  assert.ok(captured);

  const noCapture = structuredClone(state);
  noCapture.scoring.turnSnapshots[0].objectives = noCapture.objectives.map(item => ({ id: item.id, control: item.control }));
  reminder = getScoringCheckpointReminder(noCapture, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const unchanged = playerGroup(reminder);
  assert.ok(unchanged);
  assert.equal(unchanged.primaryReference.name, captured.primaryReference.name);
  assert.deepEqual(unchanged.primaryScoringWindows, captured.primaryScoringWindows);
});

test('Punishment due checkpoint does not depend on recorded condemnation resolution', () => {
  const state = endTurnState({ opponentDisposition: 'Disruption' });
  state.scoring.punishmentCondemnations = [{ playerId: 'p1', round: 2, turn: 3, unitIds: ['enemy'], unitNames: ['Enemy'] }];
  let reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const before = playerGroup(reminder);
  assert.ok(before);

  state.history.push({ type: 'unit.entered_reserves', payload: { turn: 3, round: 2, unitId: 'enemy' } });
  reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const after = playerGroup(reminder);
  assert.ok(after);
  assert.equal(after.primaryReference.name, before.primaryReference.name);
  assert.deepEqual(after.primaryScoringWindows, before.primaryScoringWindows);
});

test('Consecrate end-turn scoring remains manual regardless of recorded marker count', () => {
  const one = endTurnState({ opponentDisposition: 'Reconnaissance' });
  one.history = [{ type: 'primary.objective_consecrated', payload: { playerId: 'p1', unitId: 'u1', objectiveId: 'myExp', turn: 2, round: 1 } }];
  let reminder = getScoringCheckpointReminder(one, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const oneGroup = playerGroup(reminder);
  assert.ok(oneGroup);

  const three = structuredClone(one);
  three.history.push(
    { type: 'primary.objective_consecrated', payload: { playerId: 'p1', unitId: 'u2', objectiveId: 'center1', turn: 2, round: 1 } },
    { type: 'primary.objective_consecrated', payload: { playerId: 'p1', unitId: 'u3', objectiveId: 'center2', turn: 3, round: 2 } }
  );
  reminder = getScoringCheckpointReminder(three, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const threeGroup = playerGroup(reminder);
  assert.ok(threeGroup);
  assert.equal(threeGroup.primaryReference.name, oneGroup.primaryReference.name);
  assert.deepEqual(threeGroup.primaryScoringWindows, oneGroup.primaryScoringWindows);
  assert.doesNotMatch(renderScoringCheckpointDialog(three, reminder), /Current recorded-state result|Potential score from recorded state/);
});

test('due unverified Secondary opens for manual scoring without evidence or an Action', () => {
  const state = endTurnState();
  delete state.battlefieldMap;
  state.scoring.secondaryMissions = [{
    instanceId: 'unknown-card',
    playerId: 'p1',
    definitionId: 'unknown-card',
    status: 'active',
    definition: {
      id: 'unknown-card',
      name: 'Unknown Card',
      category: 'secondary',
      rulesVerified: false,
      conditions: [],
      scoringWindows: [{ timing: 'end-of-turn', tiers: [{ vp: 4, summary: 'Wholly within the enemy deployment zone.' }] }]
    }
  }];
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const group = playerGroup(reminder);
  assert.ok(group);
  assert.equal(group.review.secondary.length, 1);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Unknown Card/);
  assert.match(html, /Record \+4 VP &amp; remove card|Record \+4 VP & remove card/);
  assert.doesNotMatch(html, /Verify recorded actions/i);
});

test('Secondary recorded objective evidence does not promote an automatic scoring result', () => {
  const state = endTurnState();
  delete state.battlefieldMap;
  state.scoring.secondaryMissions = [{
    instanceId: 'home-card',
    playerId: 'p1',
    definitionId: 'home-card',
    status: 'active',
    definition: {
      id: 'home-card',
      name: 'Hold Home',
      category: 'secondary',
      rulesVerified: false,
      conditions: [],
      scoringWindows: [{ timing: 'end-of-turn', tiers: [{ vp: 3, summary: 'You control your home objective.' }] }]
    }
  }];
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const group = playerGroup(reminder);
  assert.ok(group);
  assert.equal(group.review.secondary.length, 1);
  assert.equal(group.review.secondary[0].result.manualReviewRequired, true);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Hold Home/);
  assert.match(html, /Record \+3 VP &amp; remove card|Record \+3 VP & remove card/);
  assert.doesNotMatch(html, /Potential 3 VP|Current recorded-state result/);
});

test('cumulative Secondary tiers can still be estimated for advisor/review context', () => {
  const state = endTurnState();
  const mission = {
    category: 'secondary',
    definitionId: 'stronghold',
    instanceId: 'stronghold',
    result: {
      scoringWindows: [{ tiers: [
        { vp: 3, relationship: 'cumulative', summary: 'You control your home objective.' },
        { vp: 2, relationship: 'cumulative', summary: 'Control at least one non-home objective.' }
      ] }]
    }
  };
  const estimate = estimateReviewMissionVp(state, 'p1', mission);
  assert.equal(estimate.points, 5);
  assert.equal(estimate.partial, false);
});

test('recorded mission Action does not create a scoring gate or special action-review requirement', () => {
  const state = endTurnState();
  delete state.battlefieldMap;
  state.units.push({ id: 'actor', ownerId: 'p1', status: 'deployed', name: 'Actor' });
  state.scoring.secondaryMissions = [{
    instanceId: 'manual-card',
    playerId: 'p1',
    definitionId: 'manual-card',
    status: 'active',
    definition: {
      id: 'manual-card',
      name: 'Manual Card',
      category: 'secondary',
      conditions: [],
      rulesVerified: false,
      scoringWindows: [{ timing: 'end-of-turn', tiers: [{ vp: 4, summary: 'Manual tabletop condition.' }] }]
    }
  }];
  state.history.push({
    type: 'shooting.unit_activated',
    payload: {
      round: 2,
      turn: 3,
      playerId: 'p1',
      unitId: 'actor',
      missionInstanceId: 'manual-card',
      missionName: 'Manual Card',
      reviewTiming: 'end-of-turn'
    }
  });
  const reminder = getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' });
  const group = playerGroup(reminder);
  assert.ok(group);
  assert.equal(group.review.secondary.length, 1);
  assert.equal(group.actionableActions, undefined);
  const html = renderScoringCheckpointDialog(state, reminder);
  assert.match(html, /Manual Card/);
  assert.doesNotMatch(html, /Verify recorded actions/i);
});

test('optional Tactical discard alone does not force an end-turn popup', () => {
  const state = endTurnState();
  delete state.battlefieldMap;
  state.scoring.secondaryMissions = [{
    instanceId: 'command-card',
    playerId: 'p1',
    definitionId: 'command-card',
    status: 'active',
    definition: {
      id: 'command-card',
      name: 'Command Card',
      category: 'secondary',
      missionMode: 'tactical',
      conditions: [],
      scoringWindows: [{ timing: 'command-phase', tiers: [{ vp: 4, summary: 'Manual condition.' }] }]
    }
  }];
  assert.equal(getScoringCheckpointReminder(state, { previousPhase: 'fight', perspectivePlayerId: 'p1' }), null);
});
