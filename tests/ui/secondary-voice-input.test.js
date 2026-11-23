import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { drawSecondaryMission, getSecondaryMissionHistory, setSecondaryMissionMode } from '../../src/rules/secondary-mission-lifecycle.js';
import { previewSpokenSecondaryPair } from '../../src/ui/secondary-voice-input.js';

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
