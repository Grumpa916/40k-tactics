import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { drawSecondaryMission, getSecondaryMissionHistory, setSecondaryMissionMode } from '../../src/rules/secondary-mission-lifecycle.js';
import { previewSpokenSecondaryPair, createSecondarySpeechCapture } from '../../src/ui/secondary-voice-input.js';

const catalog = ['Cleanse', 'Plunder', 'Assassination', 'A Tempting Target', 'Display of Might'].map(name => ({
  id: 'secondary-' + name.toLowerCase(), name, category: 'secondary',
  availableModes: ['tactical'], scoringWindows: [{
    timing: 'end-of-turn', timingLabel: 'End of your turn',
    modes: ['tactical'], tiers: [{vp: '5'}]
  }]
}));
function battle(activePlayer = 'p2') {
  const state = createGameState({
    phase: 'command', turn: 1, activePlayer,
    battle: {id:'voice-test',status:'active',round:1,activePlayerId:activePlayer,firstPlayerId:activePlayer},
    players: [{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    commandPoints: {p1:2,p2:2}
  });
  return setSecondaryMissionMode(state,{playerId:activePlayer,mode:'tactical'});
}

test('spoken opponent cards resolve to the active opponent and can enter the shared active-card list', () => {
  const state=battle();
  const before=JSON.stringify(state);
  const pair=previewSpokenSecondaryPair(state,'Opponent secondaries drawn were Cleanse and Assassinate',
    [...catalog,...catalog], 'p1');
  assert.equal(pair.playerId,'p2');
  assert.deepEqual(pair.definitions.map(item=>item.name),['Cleanse','Assassination']);
  assert.equal(JSON.stringify(state),before,'preview does not record cards');
  const first=drawSecondaryMission(state,{definition:pair.definitions[0],playerId:pair.playerId,round:1,turn:1});
  const next=drawSecondaryMission(first,{definition:pair.definitions[1],playerId:pair.playerId,round:1,turn:1});
  assert.deepEqual(getSecondaryMissionHistory(next,'p2').map(item=>item.definitionId),
    ['secondary-cleanse','secondary-assassination']);
});

test('dictation variants resolve to exact card names for review without recording them', () => {
  const state = battle();
  const before = JSON.stringify(state);
  const pair = previewSpokenSecondaryPair(state, 'Attempting Target and Display of Mike', catalog, 'p1');
  assert.deepEqual(pair.definitions.map(item => item.name), ['A Tempting Target', 'Display of Might']);
  assert.equal(JSON.stringify(state), before);
  const exact = previewSpokenSecondaryPair(state, 'A Tempting Target and Display of Might', catalog, 'p1');
  assert.deepEqual(exact.definitions.map(item => item.name), pair.definitions.map(item => item.name));
  assert.throws(() => previewSpokenSecondaryPair(state, 'A Tempting Tower and Display of Mic', catalog, 'p1'), /catalog/);
});

test('voice preview rejects a mismatched player, unknown card, duplicate, and full hand', () => {
  const state=battle();
  assert.throws(()=>previewSpokenSecondaryPair(state,'My secondaries are Cleanse and Plunder',catalog,'p1'),/active player/);
  assert.throws(()=>previewSpokenSecondaryPair(state,'Cleanse and Unknown',catalog,'p1'),/catalog/);
  assert.throws(()=>previewSpokenSecondaryPair(state,'Cleanse and Cleanse',catalog,'p1'),/different/);
  const one=drawSecondaryMission(state,{definition:catalog[0],playerId:'p2',round:1,turn:1});
  assert.throws(()=>previewSpokenSecondaryPair(one,'Cleanse and Plunder',catalog,'p1'),/already/);
});

test('a silent Safari microphone session times out, aborts, and ignores late results', () => {
  const instances = [];
  class FakeRecognition {
    constructor() { this.aborted = false; instances.push(this); }
    start() { this.started = true; }
    abort() { this.aborted = true; }
  }
  const pending = new Map();
  let nextId = 0;
  const failures = [], transcripts = [], stages = [];
  const capture = createSecondarySpeechCapture(FakeRecognition, {
    onTranscript: text => transcripts.push(text),
    onFailure: message => failures.push(message),
    onStage: stage => stages.push(stage),
    schedule: callback => { pending.set(++nextId, callback); return nextId; },
    cancel: id => pending.delete(id)
  });
  assert.equal(capture.start(), true);
  assert.equal(capture.listening, true);
  instances[0].onstart();
  instances[0].onaudiostart();
  const staleAudio = instances[0].onaudiostart;
  assert.deepEqual(stages, ['starting', 'started', 'audio']);
  const staleResult = instances[0].onresult;
  pending.get(1)();
  assert.equal(capture.listening, false);
  assert.equal(instances[0].aborted, true);
  assert.match(failures[0], /No transcript after 15 seconds \(audio\)/);
  staleAudio();
  assert.deepEqual(stages, ['starting', 'started', 'audio']);
  staleResult({results:[[ { transcript:'Cleanse and Plunder' } ]]});
  assert.deepEqual(transcripts, []);

  assert.equal(capture.start(), true);
  instances[1].onspeechstart();
  instances[1].onresult({results:[[ { transcript:'Cleanse and Plunder' } ]]});
  assert.deepEqual(stages, ['starting', 'started', 'audio', 'starting', 'speech']);
  assert.deepEqual(transcripts, ['Cleanse and Plunder']);
  assert.equal(capture.listening, false);
  assert.equal(pending.size, 0);
});

test('stop and destroy release the microphone without a late callback', () => {
  const instances = [];
  class FakeRecognition {
    constructor() { this.aborted = false; instances.push(this); }
    start() {}
    abort() { this.aborted = true; }
  }
  const ended = [];
  const capture = createSecondarySpeechCapture(FakeRecognition, {onEnded:()=>ended.push(true)});
  capture.start();
  const staleEnd = instances[0].onend;
  capture.stop();
  staleEnd();
  assert.equal(instances[0].aborted, true);
  assert.equal(capture.listening, false);
  assert.deepEqual(ended, []);
  capture.start();
  capture.destroy();
  assert.equal(instances[1].aborted, true);
});
