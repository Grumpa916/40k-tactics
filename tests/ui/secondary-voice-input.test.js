import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { drawSecondaryMission, getSecondaryMissionHistory, setSecondaryMissionMode } from '../../src/rules/secondary-mission-lifecycle.js';
import { previewSpokenSecondaryPair, createSecondarySpeechCapture } from '../../src/ui/secondary-voice-input.js';

const catalog = ['Cleanse', 'Plunder', 'Assassination'].map(name => ({
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

test('opt-in Safari cue starts recognition only after the cue and lets results end naturally', () => {
  const instances = [];
  class FakeRecognition {
    constructor() { this.aborted = false; instances.push(this); }
    start() { this.started = true; }
    abort() { this.aborted = true; }
  }
  let ready;
  const stages = [], transcripts = [];
  const capture = createSecondarySpeechCapture(FakeRecognition, {
    preflight: callbacks => { ready = callbacks.ready; return () => {}; },
    onStage: stage => stages.push(stage),
    onTranscript: transcript => transcripts.push(transcript)
  });
  assert.equal(capture.start(), true);
  assert.equal(capture.listening, true);
  assert.deepEqual(stages, ['preparing']);
  assert.equal(instances.length, 0);
  ready();
  assert.equal(instances.length, 1);
  assert.equal(instances[0].started, true);
  assert.equal(instances[0].continuous, false);
  instances[0].onresult({results:[[ { transcript:'Cleanse and Plunder' } ]]});
  assert.deepEqual(transcripts, ['Cleanse and Plunder']);
  assert.equal(instances[0].aborted, false);
  assert.equal(capture.listening, false);
});

test('stopping during the Safari cue cancels it and ignores late completion', () => {
  let ready;
  let canceled = 0;
  class FakeRecognition { constructor() { throw new Error('recognition must not open'); } }
  const capture = createSecondarySpeechCapture(FakeRecognition, {
    preflight: callbacks => { ready = callbacks.ready; return () => { canceled++; }; }
  });
  capture.start();
  capture.stop();
  ready();
  assert.equal(canceled, 1);
  assert.equal(capture.listening, false);
});

test('a stalled Safari cue is bounded and reports a useful failure', () => {
  const pending = new Map();
  const failures = [];
  const capture = createSecondarySpeechCapture(class {}, {
    preflight: () => () => {},
    onFailure: message => failures.push(message),
    schedule: callback => { pending.set(1, callback); return 1; },
    cancel: id => pending.delete(id)
  });
  capture.start();
  pending.get(1)();
  assert.equal(capture.listening, false);
  assert.match(failures[0], /audio cue stalled/);
});
