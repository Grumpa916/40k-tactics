import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';

const css = readFileSync(new URL('../../src/ui/styles/scoring-checkpoints.css',import.meta.url),'utf8');
const reviewSource = readFileSync(new URL('../../src/ui/scoring-checkpoint-review.js',import.meta.url),'utf8');
const shellSource = readFileSync(new URL('../../src/ui/battle-shell.js',import.meta.url),'utf8');

function exampleState() {
  const card = (instanceId,definitionId,name,vp) => ({
    instanceId, definitionId, playerId:'p1', status:'active',
    definition: {
      id:definitionId, name, missionMode:'tactical', rulesVerified:true,
      scoringWindows:[{timing:'end-of-turn',tiers:[{vp,summary:'Agree this condition on the tabletop.'}]}]
    }
  });
  return {
    phase:'end_turn', activePlayer:'p1', turn:7,
    battle:{round:4,activePlayerId:'p1'}, players:[{id:'p1',name:'You'}],
    units:[], objectives:[], history:[], victoryPoints:{p1:0},
    scoring:{secondaryMissionModeByPlayer:{p1:'tactical'},secondaryMissions:[
      card('p1:outflank','secondary-outflank','Outflank',3),
      card('p1:secure','secondary-secure-no-mans-land',"Secure No Man's Land",5)
    ]}
  };
}

const reminder = {
  timing:'end-of-turn', activePlayerId:'p1',
  groups:[{playerId:'p1',playerName:'You',checkpoint:'end-of-turn',
    primaryScoringWindows:[], review:{primary:[],secondary:[{instanceId:'p1:outflank'},{instanceId:'p1:secure'}]}}]
};

test('one compact secondary source note is shown for multiple due secondaries', () => {
  const html=renderScoringCheckpointDialog(exampleState(),reminder);
  assert.equal((html.match(/Secondary card text checked against physical-card photographs/g)??[]).length,1);
  assert.match(html,/Nov 8, 2026/);
  assert.match(html,/Outflank/);
  assert.match(html,/Secure No Man&#39;s Land|Secure No Man's Land/);
  assert.doesNotMatch(reviewSource,/All 18 Secondary card faces were checked against supplied photographs/);
});

test('Tactical discard uses independent tap-size card rows with the existing named values and submit handler', () => {
  const html=renderScoringCheckpointDialog(exampleState(),reminder);
  assert.match(html,/<form data-tactical-discard-form>/);
  assert.match(html,/class="battle-tactical-discard__choices" role="group"/);
  assert.equal((html.match(/class="battle-tactical-discard__choice"/g)??[]).length,2);
  assert.equal((html.match(/name="discard-instance"/g)??[]).length,2);
  assert.match(html,/value="p1:outflank"/);
  assert.match(html,/value="p1:secure"/);
  assert.match(html,/class="battle-tactical-discard__submit" type="submit"/);
  assert.match(html,/gain \+1 CP/);
  assert.match(shellSource,/formData\.getAll\("discard-instance"\)/);
  assert.match(css,/\.battle-tactical-discard__choice \{[\s\S]*?min-height:52px;/);
  assert.match(css,/\.battle-tactical-discard__choice input\[type="checkbox"\] \{[\s\S]*?width:24px;[\s\S]*?height:24px;/);
  assert.match(css,/\.battle-tactical-discard__submit \{[\s\S]*?width:100%;[\s\S]*?min-height:50px;/);
});

test('no secondary certification or discard form for an exclusively primary checkpoint', () => {
  const state=exampleState();
  state.scoring.secondaryMissionModeByPlayer.p1='fixed';
  const html=renderScoringCheckpointDialog(state,{timing:'command-phase',activePlayerId:'p1',groups:[]});
  assert.doesNotMatch(html,/Secondary card text checked/);
  assert.doesNotMatch(html,/data-tactical-discard-form/);
});
