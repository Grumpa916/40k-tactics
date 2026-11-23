import test from 'node:test';
import assert from 'node:assert/strict';
import { correctSecondaryMissionScore, getCorrectableSecondaryAwards } from '../../src/engine/secondary-score-correction.js';
import { getVictoryPointScore } from '../../src/engine/victory-points-ledger.js';
import { renderScoreAdjustOverlay } from '../../src/ui/battle-shell-scoreboard.js';

const card=(status='discarded')=>({instanceId:'p1:cleanse:1',playerId:'p1',definitionId:'secondary-cleanse',
  definition:{id:'secondary-cleanse',name:'Cleanse',category:'secondary',missionMode:'tactical'},
  status,drawnRound:1,drawnTurn:1,scoringHistory:[],scoredRound:null,scoredTurn:null});
const state=()=>({battle:{status:'active',round:3},turn:5,phase:'command',
  players:[{id:'p1',name:'You'}],victoryPoints:{p1:10},history:[],
  scoring:{secondaryMissionModeByPlayer:{p1:'tactical'},secondaryMissions:[card()]}});
test('discarded card can receive a historical secondary award with mission and round attribution',()=>{
  const corrected=correctSecondaryMissionScore(state(),{playerId:'p1',instanceId:'p1:cleanse:1',amount:5,round:1});
  assert.equal(getVictoryPointScore(corrected,'p1'),15);
  assert.equal(corrected.scoring.secondaryMissions[0].status,'scored');
  const award=corrected.history.find(event=>event.type==='victory_points.awarded');
  assert.equal(award.payload.category,'secondary');
  assert.equal(award.payload.round,1);
  assert.equal(award.payload.missionDefinitionId,'secondary-cleanse');
  assert.equal(getCorrectableSecondaryAwards(corrected,'p1').length,1);
});
test('historical award can be corrected without double-counting and retains an audit reversal',()=>{
  const scored=correctSecondaryMissionScore(state(),{playerId:'p1',instanceId:'p1:cleanse:1',amount:5,round:2});
  const index=scored.history.findIndex(event=>event.type==='victory_points.awarded');
  const corrected=correctSecondaryMissionScore(scored,{playerId:'p1',instanceId:'p1:cleanse:1',amount:3,round:1,awardEventIndex:index});
  assert.equal(getVictoryPointScore(corrected,'p1'),13);
  assert.equal(getCorrectableSecondaryAwards(corrected,'p1').length,1);
  assert.equal(getCorrectableSecondaryAwards(corrected,'p1')[0].round,1);
  assert.ok(corrected.history.some(event=>event.type==='victory_points.award_undone'));
  assert.match(renderScoreAdjustOverlay(corrected,corrected.players,'p1',false,'','vp'),/Correct a secondary card/);
});
test('cannot backdate before the card was drawn or beyond the played rounds',()=>{
  assert.throws(()=>correctSecondaryMissionScore(state(),{playerId:'p1',instanceId:'p1:cleanse:1',amount:5,round:4}),/played battle round/);
});
