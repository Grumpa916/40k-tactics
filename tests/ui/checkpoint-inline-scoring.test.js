import test from 'node:test';
import assert from 'node:assert/strict';
import { missionConditionEvidence, primaryWindowDue } from '../../src/rules/checkpoint-mission-evidence.js';
import { recordSecondaryMissionScore } from '../../src/engine/secondary-mission-scoring.js';
import { recordVictoryPointsAward, undoLatestVictoryPointsAward } from '../../src/engine/victory-points-ledger.js';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';
import { checkpointScoreKey, bindCheckpointScores } from '../../src/ui/checkpoint-score-controls.js';
function seed(mode='tactical') {return {phase:'end_turn',turn:3,activePlayer:'p1',battle:{round:2},players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],units:[],history:[],objectives:[{id:'central',name:'Central 1',control:{controlState:'controlled',controllerId:'p1'}}],battlefieldMap:{missionSetup:{myDisposition:'Disruption',opponentDisposition:'Take and Hold'}},scoring:{secondaryMissionModeByPlayer:{p1:mode},secondaryMissions:[{instanceId:'card',playerId:'p1',definitionId:'cleanse',status:'active',definition:{id:'cleanse',name:'Cleanse',category:'secondary',scoringWindows:[{timing:'end-of-turn',tiers:[{vp:3,summary:'Complete the action.'}]}]}}]}};}
test('primary timing alternatives enforce their own round range and no-op checkpoints stay silent',()=>{
  const when='R2+ Command phase / R5 end of turn';
  assert.equal(primaryWindowDue(when,'command-phase',1),false);
  assert.equal(primaryWindowDue(when,'command-phase',2),true);
  assert.equal(primaryWindowDue(when,'end-of-turn',2),false);
  assert.equal(primaryWindowDue(when,'end-of-turn',5),true);
  assert.equal(primaryWindowDue('R1–2 end of your turn','end-of-turn',3),false);
  const state=seed();state.phase='movement';state.battle.round=1;
  assert.equal(getScoringCheckpointReminder(state,{previousPhase:'command'}),null);
});
test('objective evidence distinguishes recorded success, failure, and unavailable data',()=>{
  const state=seed(),condition='Control at least one non-home objective.';
  assert.equal(missionConditionEvidence(state,'p1',condition).count,1);
  assert.equal(missionConditionEvidence(state,'p2',condition).count,0);
  assert.equal(missionConditionEvidence({...state,objectives:[{id:'unknown'}]},'p1',condition).count,null);
  assert.equal(missionConditionEvidence(state,'p1','Wholly within enemy deployment zone.').count,null);
});
test('confirmed secondary scoring is atomic, retires card, rejects repeat, persists, stays silent when resolved, and undo restores card',()=>{
  for(const mode of ['tactical','fixed']) {
    const state=seed(mode),payload={playerId:'p1',instanceId:'card',amount:3,scoringTiming:'end-of-turn',retireAfterScoring:true};
    assert.throws(()=>recordSecondaryMissionScore(state,{...payload,amount:0}));
    assert.equal(state.scoring.secondaryMissions[0].status,'active');
    const scored=JSON.parse(JSON.stringify(recordSecondaryMissionScore(state,payload)));
    assert.equal(scored.victoryPoints.p1,3);assert.equal(scored.scoring.secondaryMissions[0].status,'scored');
    assert.throws(()=>recordSecondaryMissionScore(scored,payload),/active secondary/);
    const isolated={...scored,battlefieldMap:null};
    const reminder=getScoringCheckpointReminder(isolated,{previousPhase:'fight'});
    assert.equal(reminder,null);
    assert.equal(renderScoringCheckpointDialog(isolated,reminder),'');
    const undone=undoLatestVictoryPointsAward(scored,{playerId:'p1'});
    assert.equal(undone.victoryPoints.p1,0);assert.equal(undone.scoring.secondaryMissions[0].status,'active');
    assert.equal(recordSecondaryMissionScore(undone,payload).victoryPoints.p1,3);
  }
});
test('primary scores once per checkpoint, does not create a receipt-only popup, and stays available next turn',()=>{
  const state=seed();state.phase='movement';
  const payload={playerId:'p1',amount:4,reason:'Death Trap',missionDefinitionId:'primary-death-trap',category:'primary',scoringTiming:'command-phase',opportunityKey:checkpointScoreKey(state,'p1','command-phase')};
  const scored=recordVictoryPointsAward(state,payload);
  assert.equal(scored.battlefieldMap,state.battlefieldMap);
  assert.throws(()=>recordVictoryPointsAward(scored,payload),/already been recorded/);
  assert.equal(getScoringCheckpointReminder(scored,{previousPhase:'command'}),null);
  const later={...scored,turn:5,battle:{round:3}};
  assert.equal(recordVictoryPointsAward(later,{...payload,opportunityKey:checkpointScoreKey(later,'p1','command-phase')}).victoryPoints.p1,8);
});
test('inline form dispatches selected VP and card lifecycle in one command',()=>{
  let submit,command;
  const attrs={'data-player':'p1','data-checkpoint':'end-of-turn','data-instance':'card'};
  const form={addEventListener:(event,handler)=>{submit=handler;},getAttribute:name=>attrs[name],querySelector:()=>({value:'4'})};
  bindCheckpointScores({querySelectorAll:()=>[form]},{getState:seed,dispatch:c=>{command=c;}},message=>assert.fail(message));
  submit({preventDefault(){}});
  assert.equal(command.type,'secondary_mission.record_score');assert.equal(command.payload.amount,4);assert.equal(command.payload.retireAfterScoring,true);
});
test('destruction evidence resolves legacy combat target ownership from live units',()=>{
  const state=seed();state.units=[{id:'enemy',ownerId:'p2'}];
  state.history=[{type:'combat.attack_resolved',payload:{turn:3,targetId:'enemy',stateDelta:{target:{statusBefore:'deployed',statusAfter:'destroyed'}}}}];
  assert.equal(missionConditionEvidence(state,'p1','Destroy at least one enemy unit this turn.').count,1);
});
