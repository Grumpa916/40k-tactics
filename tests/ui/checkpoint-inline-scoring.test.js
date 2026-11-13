import test from 'node:test';
import assert from 'node:assert/strict';
import { missionConditionEvidence, primaryWindowDue } from '../../src/rules/checkpoint-mission-evidence.js';
import { recordSecondaryMissionScore } from '../../src/engine/secondary-mission-scoring.js';
import {
  recordVictoryPointsAward, recordZeroVictoryPointsCheckpoint,
  hasEffectiveZeroVictoryPointConfirmation, hasEffectiveVictoryPointOpportunity,
  undoLatestZeroVictoryPointsCheckpoint, undoLatestVictoryPointsAward
} from '../../src/engine/victory-points-ledger.js';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';
import { checkpointScoreKey, bindCheckpointScores, renderCheckpointScore } from '../../src/ui/checkpoint-score-controls.js';
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
test('checkpoint dialog labels each scoring window separately',()=>{
  const state=seed();state.phase='end_turn';
  state.battlefieldMap.missionSetup={myDisposition:'Purge the Foe',opponentDisposition:'Take and Hold'};
  const reminder=getScoringCheckpointReminder(state,{previousPhase:'fight'});
  const html=renderScoringCheckpointDialog(state,reminder);
  assert.match(html,/Scoring requirements · check each window below/);
  assert.match(html,/End of your turn/);
});
test('objective evidence distinguishes recorded success, failure, and unavailable data',()=>{
  const state=seed(),condition='Control at least one non-home objective.';
  assert.equal(missionConditionEvidence(state,'p1',condition).count,1);
  assert.equal(missionConditionEvidence(state,'p2',condition).count,0);
  assert.equal(missionConditionEvidence({...state,objectives:[{id:'unknown'}]},'p1',condition).count,null);
  assert.equal(missionConditionEvidence(state,'p1','Wholly within enemy deployment zone.').count,null);
});
test('confirmed Secondary scoring retires Tactical, retains Fixed, prevents repeat, and supports undo',()=>{
  for(const mode of ['tactical','fixed']) {
    const state=seed(mode),payload={playerId:'p1',instanceId:'card',amount:3,scoringTiming:'end-of-turn',retireAfterScoring:true};
    assert.throws(()=>recordSecondaryMissionScore(state,{...payload,amount:0}));
    assert.equal(state.scoring.secondaryMissions[0].status,'active');
    const scored=JSON.parse(JSON.stringify(recordSecondaryMissionScore(state,payload)));
    assert.equal(scored.victoryPoints.p1,3);
    assert.equal(scored.scoring.secondaryMissions[0].status,mode==='fixed'?'active':'scored');
    assert.throws(()=>recordSecondaryMissionScore(scored,payload),mode==='fixed'?/already been recorded/: /active secondary/);
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
  let fixed;
  bindCheckpointScores({querySelectorAll:()=>[form]}, {getState:()=>seed('fixed'),dispatch:c=>{fixed=c;}},message=>assert.fail(message));
  submit({preventDefault(){}});
  assert.equal(fixed.payload.retireAfterScoring,false,'Fixed card must remain active');
});
test('destruction evidence resolves legacy combat target ownership from live units',()=>{
  const state=seed();state.units=[{id:'enemy',ownerId:'p2'}];
  state.history=[{type:'combat.attack_resolved',payload:{turn:3,targetId:'enemy',stateDelta:{target:{statusBefore:'deployed',statusAfter:'destroyed'}}}}];
  assert.equal(missionConditionEvidence(state,'p1','Destroy at least one enemy unit this turn.').count,1);
});


test('Consecrate primary permits explicit 0 VP without changing totals and preserves the audited checkpoint',()=>{
  const s=seed(),key=checkpointScoreKey(s,'p1','end-of-turn');
  const mission={category:'primary',definitionId:'primary-consecrate',definitionName:'Consecrate',
    scoringWindows:[{items:[{vp:3,summary:'One or two objectives consecrated'},{vp:6,summary:'Three or more objectives consecrated'}]}]};
  const html=renderCheckpointScore(s,{playerId:'p1',checkpoint:'end-of-turn'},mission);
  assert.match(html,/<option value="0">0 VP — No points earned<\/option>/);
  const zero=recordZeroVictoryPointsCheckpoint(s,{playerId:'p1',amount:0,category:'primary',
    reason:'Consecrate',missionDefinitionId:'primary-consecrate',opportunityKey:key,scoringTiming:'end-of-turn'});
  assert.equal(zero.victoryPoints,undefined);
  assert.equal(zero.history.at(-1).type,'victory_points.zero_confirmed');
  assert.equal(hasEffectiveVictoryPointOpportunity(zero,'p1','primary-consecrate',key),true);
  assert.match(renderCheckpointScore(zero,{playerId:'p1',checkpoint:'end-of-turn'},mission),/0 VP confirmed/);
  assert.throws(()=>recordVictoryPointsAward(zero,{playerId:'p1',amount:3,reason:'Consecrate',
    missionDefinitionId:'primary-consecrate',category:'primary',opportunityKey:key}),/already been recorded/);
  const amended=undoLatestZeroVictoryPointsCheckpoint(zero,{playerId:'p1',missionDefinitionId:'primary-consecrate',opportunityKey:key});
  assert.equal(hasEffectiveZeroVictoryPointConfirmation(amended,'p1','primary-consecrate',key),false);
  assert.match(renderCheckpointScore(amended,{playerId:'p1',checkpoint:'end-of-turn'},mission),/Choose agreed VP/);
  const awarded=recordVictoryPointsAward(amended,{playerId:'p1',amount:3,reason:'Consecrate',
    missionDefinitionId:'primary-consecrate',category:'primary',opportunityKey:key});
  assert.equal(awarded.victoryPoints.p1,3);
});
test('zero-point Tactical review retains active card and records a single auditable result',()=>{
  const s=seed('tactical');
  const result=recordSecondaryMissionScore(s,{playerId:'p1',instanceId:'card',amount:0,
    scoringTiming:'end-of-turn',retireAfterScoring:true});
  assert.equal(result.victoryPoints,undefined);
  assert.equal(result.scoring.secondaryMissions[0].status,'active');
  assert.equal(result.history.at(-1).type,'victory_points.zero_confirmed');
  assert.throws(()=>recordSecondaryMissionScore(result,{playerId:'p1',instanceId:'card',amount:3,
    scoringTiming:'end-of-turn'}),/already been recorded/);
  const later={...result,turn:5,battle:{round:3}};
  const scored=recordSecondaryMissionScore(later,{playerId:'p1',instanceId:'card',amount:3,
    scoringTiming:'end-of-turn'});
  assert.equal(scored.victoryPoints.p1,3);
  assert.equal(scored.scoring.secondaryMissions[0].status,'scored');
});
test('explicit 0 VP dispatches through the existing checkpoint controls, not as a positive award',()=>{
  let submit,command;
  const attrs={'data-player':'p1','data-checkpoint':'end-of-turn','data-instance':'',
    'data-name':'Consecrate','data-mission':'primary-consecrate','data-category':'primary'};
  const form={addEventListener:(_,handler)=>{submit=handler;},
    getAttribute:name=>attrs[name],querySelector:()=>({value:'0'})};
  bindCheckpointScores({querySelectorAll:selector=>selector==='[data-checkpoint-score]'?[form]:[]},
    {getState:()=>seed(),dispatch:next=>{command=next;}},message=>assert.fail(message));
  submit({preventDefault(){}});
  assert.equal(command.type,'victory_points.record_award');
  assert.equal(command.payload.amount,0);
  assert.equal(command.payload.missionDefinitionId,'primary-consecrate');
});
