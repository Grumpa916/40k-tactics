import test from 'node:test';
import assert from 'node:assert/strict';
import { bindCheckpointScores, getMissionVpOptions, renderCheckpointScore } from '../../src/ui/checkpoint-score-controls.js';

const defendStronghold = {
  category: 'secondary',
  instanceId: 'defend-card',
  definitionId: 'defend-stronghold',
  definitionName: 'Defend Stronghold',
  calculatedPoints: 3,
  calculatedPartial: true,
  result: {
    scoringWindows: [{
      timing: 'end-of-opponent-turn',
      timingLabel: "End of opponent's turn",
      tiers: [
        { vp: 3, summary: 'You control your home objective.' },
        { vp: 2, relationship: 'cumulative', summary: 'No enemy units are within your deployment zone; cumulative with the 3 VP condition.' }
      ]
    }]
  }
};

function state() {
  return {
    battle: { round: 2 },
    turn: 2,
    history: [],
    objectives: [{
      id: 'p1-home',
      name: 'Player home objective',
      control: { controlState: 'controlled', controllerId: 'p1' }
    }],
    scoring: {
      secondaryMissions: [{ instanceId: 'defend-card', playerId: 'p1', status: 'active' }]
    }
  };
}

test('cumulative secondary tiers expose valid total outcomes rather than the bonus by itself', () => {
  assert.deepEqual(getMissionVpOptions(defendStronghold), [3, 5]);
  const cleanse = {
    category: 'secondary', instanceId: 'cleanse-card',
    result: { scoringWindows: [{ tiers: [
      { vp: 2, relationship: 'or', summary: 'One objective was cleansed.' },
      { vp: 5, relationship: 'or', summary: 'Two objectives were cleansed.' }
    ] }] }
  };
  assert.deepEqual(getMissionVpOptions(cleanse), [2, 5]);
});

test('multi-tier scoring shows the current result and the higher scoring requirement together', () => {
  const html = renderCheckpointScore(state(), { playerId: 'p1', checkpoint: 'end-of-opponent-turn' }, defendStronghold);
  assert.match(html, /Scoring options/);
  assert.match(html, /3 VP · Current recorded-state result/);
  assert.match(html, /Score 3 VP now &amp; remove card|Score 3 VP now & remove card/);
  assert.match(html, /5 VP/);
  assert.match(html, /No enemy units are within your deployment zone/);
  assert.match(html, /Confirm on tabletop/);
  assert.match(html, /Confirm 5 VP &amp; remove card|Confirm 5 VP & remove card/);
  assert.doesNotMatch(html, /data-vp-option="2"/);
  assert.doesNotMatch(html, /Choose VP/);
});

test('clicked scoring tier supplies its own VP amount to the scoring action', () => {
  let submitHandler = null;
  let dispatched = null;
  const attributes = {
    'data-player': 'p1',
    'data-checkpoint': 'end-of-opponent-turn',
    'data-instance': 'defend-card',
    'data-name': 'Defend Stronghold',
    'data-mission': 'defend-stronghold'
  };
  const form = {
    addEventListener(type, handler) { if (type === 'submit') submitHandler = handler; },
    getAttribute(name) { return attributes[name] ?? ''; },
    querySelector() { return { value: '3' }; }
  };
  const container = { querySelectorAll() { return [form]; } };
  const session = {
    getState() { return state(); },
    dispatch(action) { dispatched = action; }
  };
  bindCheckpointScores(container, session, error => { throw error; });
  submitHandler({ preventDefault() {}, submitter: { name: 'vp', value: '5' } });
  assert.equal(dispatched.type, 'secondary_mission.record_score');
  assert.equal(dispatched.payload.amount, 5);
  assert.equal(dispatched.payload.instanceId, 'defend-card');
  assert.equal(dispatched.payload.retireAfterScoring, true);
});
