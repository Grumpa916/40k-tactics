import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { getMissionActionOptions, getMissionActionReviews } from '../../src/rules/mission-action-state.js';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { evaluateScoringCheckpoint } from '../../src/engine/scoring-check-coordinator.js';
import { createMissionActionPicker } from '../../src/ui/mission-action-picker.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';
import { fakeDom } from '../helpers/combat-dom.js';

function seed(phase='shooting') {
  const definition=(id,name,windows)=>({
    id,name,category:'secondary',rulesVerified:false,
    scoringWindows:windows.map(([timing,mode])=>({timing,modes:[mode],tiers:[]}))
  });
  const mission=(instanceId,playerId,definition)=>({
    instanceId,playerId,definitionId:definition.id,definition,status:'active',scoringHistory:[]
  });
  return createGameState({
    phase,turn:1,activePlayer:'p1',
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battle:{id:'b',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},
    units:[
      {id:'u1',name:'Unit One',ownerId:'p1',status:'deployed',wounds:5,position:{x:10,y:10}},
      {id:'u2',name:'Unit Two',ownerId:'p1',status:'deployed',wounds:5,position:{x:12,y:10}},
      {id:'enemy',name:'Enemy',ownerId:'p2',status:'deployed',wounds:5,position:{x:15,y:10}}
    ],
    scoring:{
      secondaryMissionMode:'fixed',
      secondaryMissionModeByPlayer:{p1:'tactical',p2:'fixed'},
      secondaryMissions:[
        mission('clean','p1',definition('secondary-cleanse','Cleanse',[['end-of-turn','tactical']])),
        mission('plunder','p1',definition('secondary-plunder','Plunder',[['end-of-turn','tactical']])),
        mission('old-card','p1',definition('secondary-custom','Retained card',[['end-of-opponent-turn','tactical']])),
        mission('enemy-card','p2',definition('secondary-assassination','Assassination',[['end-of-turn','tactical'],['end-of-opponent-turn','fixed']]))
      ]
    }
  });
}

function game(initial=seed()) {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  return createGameSession(initial);
}

const startAction=(session,extra={})=>session.dispatch({
  type:'shooting.record_activation',
  payload:{
    unitId:'u1',actionType:'mission_action',actionId:'secondary-cleanse',
    missionInstanceId:'clean',reviewTiming:'end-of-turn',rulesConfirmed:true,...extra
  }
});

function legacyActionEvent({ reviewTiming='end-of-turn' }={}) {
  return {
    type:'shooting.unit_activated',
    payload:{
      round:1,turn:1,playerId:'p1',unitId:'u1',
      actionType:'mission_action',actionId:'secondary-cleanse',
      missionInstanceId:'clean',missionDefinitionId:'secondary-cleanse',
      missionName:'Cleanse',reviewTiming,rulesConfirmed:true,
      missionRulesVerified:false
    }
  };
}

function withLegacyAction(state, options={}) {
  return { ...state, history:[...(state.history??[]),legacyActionEvent(options)] };
}

test('historical mission Action helpers retain active Secondary cards while the live picker excludes them',()=>{
  const state=seed();
  assert.deepEqual(getMissionActionOptions(state).map(item=>item.id),['clean','plunder','old-card']);
  const html=createMissionActionPicker().render(state,'u1');
  assert.doesNotMatch(html,/Cleanse/);
  assert.doesNotMatch(html,/Plunder/);
  assert.doesNotMatch(html,/Assassination/);
  assert.match(html,/Secondary missions are scored manually at their checkpoint/);
});

test('live action command rejects Secondary mission Actions regardless of legacy confirmation payload',()=>{
  const session=game(),before=session.getState();
  assert.throws(()=>startAction(session,{missionInstanceId:'enemy-card'}),/available primary mission Action/);
  assert.throws(()=>startAction(session,{rulesConfirmed:false}),/available primary mission Action/);
  assert.throws(()=>startAction(session,{reviewTiming:'event'}),/available primary mission Action/);
  assert.equal(session.getState(),before);
});

test('historical Secondary action attempts survive saves, remain reviewable when due, and never award VP',()=>{
  const session=game(withLegacyAction(seed()));
  const actionKey='1:1:u1';
  const payload={actionKey,playerId:'p1',checkpoint:'end-of-turn',outcome:'completed'};
  assert.throws(()=>session.dispatch({type:'mission_action.review',payload}),/recorded scoring checkpoint/);
  const restored=JSON.parse(JSON.stringify(session.getState()));
  restored.phase='end_turn';
  session.replaceState(restored);
  assert.equal(getMissionActionReviews(session.getState(),{playerId:'p1',checkpoint:'end-of-turn'}).length,1);
  session.dispatch({type:'mission_action.review',payload});
  assert.equal(getMissionActionReviews(session.getState(),{playerId:'p1',checkpoint:'end-of-turn'})[0].review.outcome,'completed');
  assert.throws(()=>session.dispatch({type:'mission_action.review',payload}),/already been reviewed/);
  assert.equal(session.getState().scoring.secondaryMissions[0].status,'active');
  assert.equal(session.getState().history.some(e=>e.type.includes('victory_points')),false);
});

test('due end-turn windows open a manual scoring popup without objective-control or action-review gates',()=>{
  const state=seed('end_turn');
  const reminder=getScoringCheckpointReminder(state,{previousPhase:'fight',perspectivePlayerId:'p1'});
  assert.ok(reminder);
  assert.equal(reminder.requiresObjectiveConfirmation,false);
  const html=renderScoringCheckpointDialog(state,reminder);
  assert.match(html,/physical tabletop/i);
  assert.match(html,/Cleanse/);
  assert.match(html,/Plunder/);
  assert.match(html,/Assassination/);
  assert.doesNotMatch(html,/Verify recorded actions/i);
  assert.equal(getScoringCheckpointReminder({...state,phase:'start_turn',activePlayer:'p2'},{previousPhase:'end_turn'}),null);
});

test('Command checkpoint filters mission owner and minimum round; historical actions remain reviewable only when due',()=>{
  const session=game(withLegacyAction(seed(),{reviewTiming:'end-of-opponent-turn'}));
  const endOwn={...session.getState(),phase:'end_turn'};
  assert.equal(getMissionActionReviews(endOwn,{playerId:'p1',checkpoint:'end-of-opponent-turn'}).length,0);
  const endOpponent={...endOwn,activePlayer:'p2',turn:2};
  assert.equal(getMissionActionReviews(endOpponent,{playerId:'p1',checkpoint:'end-of-opponent-turn'}).length,1);
  const state=seed('movement');
  state.scoring.secondaryMissions[0].definition.scoringWindows=[{timing:'command-phase',minRound:2,modes:['tactical'],tiers:[]}];
  assert.equal(getScoringCheckpointReminder(state,{previousPhase:'command'}),null);
  const definition={id:'foreign-primary',name:'Other primary',category:'primary',playerId:'p2',timing:'command-phase',conditions:[]};
  assert.equal(evaluateScoringCheckpoint(state,{checkpoint:'command-phase',scoringPlayerId:'p1',activePlayerId:'p1',primaryDefinitions:[definition]}).primary.length,0);
});

test('historical recorded mission actions do not create scoring-dialog review gates',async()=>{
  const{refreshScoringCheckpointDialog}=await import('../../src/ui/scoring-checkpoint-dialog.js');
  const session=game(withLegacyAction(seed()));
  session.replaceState({...session.getState(),phase:'end_turn'});
  const reminder=getScoringCheckpointReminder(session.getState(),{previousPhase:'fight'});
  assert.ok(reminder);
  const host=fakeDom(),container={querySelector:selector=>selector==='[data-scoring-reminder-host]'?host:null};
  const refresh=()=>refreshScoringCheckpointDialog(container,session.getState(),reminder,session);
  const unsubscribe=session.subscribe(refresh);
  try{
    refresh();
    assert.match(host.innerHTML,/Cleanse/);
    assert.match(host.innerHTML,/data-checkpoint-score/);
    assert.match(host.innerHTML,/physical tabletop/i);
    assert.equal(host.querySelector('[data-action-review]'),null);
    assert.doesNotMatch(host.innerHTML,/Verify recorded actions/i);
    refreshScoringCheckpointDialog(container,session.getState(),null,session);
    assert.equal(host.innerHTML,'');
    refresh();
    assert.match(host.innerHTML,/Cleanse/);
    assert.equal(host.querySelector('[data-action-review]'),null);
  }finally{unsubscribe();}
});
