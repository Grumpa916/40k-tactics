import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateCheckpointVp } from '../../src/rules/checkpoint-vp-estimate.js';
import { renderCheckpointScore } from '../../src/ui/checkpoint-score-controls.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';

const mission = {
  category:'primary', definitionId:'primary-immovable-object', definitionName:'Immovable Object',
  scoringWindows:[{items:[{vp:5,summary:'Per controlled objective other than your home objective.'}]}]
};
const controlled = (id, name, controllerId) => ({id,name,control:{controlState:'controlled',controllerId}});
const state = objectives => ({turn:3,battle:{round:2},objectives,history:[]});

test('Immovable Object suggests recorded non-home VP without awarding or preselecting it', () => {
  const game = state([
    controlled('home','My Home','p1'), controlled('centre','Central 1','p1'),
    controlled('opp','Opponent Home','p2')
  ]);
  assert.deepEqual(estimateCheckpointVp(game,'p1',mission),{points:5,partial:false,capped:false});
  const html = renderCheckpointScore(game,{playerId:'p1',checkpoint:'command-phase'},mission);
  assert.match(html,/Estimated from recorded state: 5 VP/);
  assert.match(html,/<option value="">Choose VP…<\/option>/);
  assert.equal(game.victoryPoints,undefined);
});

test('incomplete control yields a clearly partial estimate, never an invented zero', () => {
  const partial = state([controlled('centre','Central 1','p1'),{id:'expansion',name:'Expansion 1'}]);
  assert.deepEqual(estimateCheckpointVp(partial,'p1',mission),{points:5,partial:true,capped:false});
  assert.match(renderCheckpointScore(partial,{playerId:'p1',checkpoint:'command-phase'},mission),/Partial evidence/);
  assert.equal(estimateCheckpointVp(state([{id:'centre',name:'Central 1'}]),'p1',mission),null);
  assert.deepEqual(estimateCheckpointVp(state([controlled('centre','Central 1','p2')]),'p1',mission),{points:0,partial:false,capped:false});
});

test('estimate respects remaining Primary VP allowance and undone awards', () => {
  const game=state([controlled('centre','Central 1','p1')]);
  game.history=[{type:'victory_points.awarded',id:'old',payload:{playerId:'p1',category:'primary',amount:12,turn:3,round:2}}];
  assert.deepEqual(estimateCheckpointVp(game,'p1',mission),{points:3,partial:false,capped:true});
  game.history.push({type:'victory_points.award_undone',payload:{originalAwardEventId:'old'}});
  assert.deepEqual(estimateCheckpointVp(game,'p1',mission),{points:5,partial:false,capped:false});
});

test('end-of-battle estimate observes the game cap without the turn cap', () => {
  const game=state([controlled('centre','Central 1','p1'),controlled('other','Expansion 1','p1')]);
  game.history=[{type:'victory_points.awarded',id:'old',payload:{playerId:'p1',category:'primary',amount:12,turn:3,round:2}}];
  assert.deepEqual(estimateCheckpointVp(game,'p1',mission,'end-of-battle'),{points:10,partial:false,capped:false});
});

test('unsupported mission conditions have no numeric estimate and dialog omits crossed-out introduction', () => {
  const unsupported={...mission,scoringWindows:[{items:[{vp:4,summary:'Perform an unrecorded mission action.'}]}]};
  assert.equal(estimateCheckpointVp(state([]),'p1',unsupported),null);
  const html=renderScoringCheckpointDialog(state([]),{label:"End of You’s Command phase",groups:[]});
  assert.doesNotMatch(html,/Record any Primary or Secondary score shown below before continuing/);
});
