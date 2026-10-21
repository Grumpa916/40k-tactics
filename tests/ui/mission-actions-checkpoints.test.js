import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { getMissionActionOptions, getMissionActionReviews } from '../../src/rules/mission-action-state.js';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { evaluateScoringCheckpoint } from '../../src/engine/scoring-check-coordinator.js';
import { createShootingScreen } from '../../src/ui/shooting-screen.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';
import { fakeDom } from '../helpers/combat-dom.js';

function seed(phase='shooting') {
  const definition=(id,name,windows)=>({id,name,category:'secondary',rulesVerified:false,scoringWindows:windows.map(([timing,mode])=>({timing,modes:[mode],tiers:[]}))});
  const mission=(instanceId,playerId,definition)=>({instanceId,playerId,definitionId:definition.id,definition,status:'active',scoringHistory:[]});
  return createGameState({phase,turn:1,activePlayer:'p1',players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],battle:{id:'b',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},
    units:[{id:'u1',name:'Unit One',ownerId:'p1',status:'deployed',wounds:5,position:{x:10,y:10}},{id:'u2',name:'Unit Two',ownerId:'p1',status:'deployed',wounds:5,position:{x:12,y:10}},{id:'enemy',name:'Enemy',ownerId:'p2',status:'deployed',wounds:5,position:{x:15,y:10}}],
    scoring:{secondaryMissionMode:'fixed',secondaryMissionModeByPlayer:{p1:'tactical',p2:'fixed'},secondaryMissions:[
      mission('clean','p1',definition('secondary-cleanse','Cleanse',[['end-of-turn','tactical']])),
      mission('plunder','p1',definition('secondary-plunder','Plunder',[['end-of-turn','tactical']])),
      mission('old-card','p1',definition('secondary-custom','Retained card',[['end-of-opponent-turn','tactical']])),
      mission('enemy-card','p2',definition('secondary-assassination','Assassination',[['end-of-turn','tactical'],['end-of-opponent-turn','fixed']]))
    ]}});
}
function game(initial=seed()) {clearCommandHandlers();registerCoreCommandHandlers();return createGameSession(initial);}
const startAction=(session,extra={})=>session.dispatch({type:'shooting.record_activation',payload:{unitId:'u1',actionType:'mission_action',actionId:'secondary-cleanse',missionInstanceId:'clean',reviewTiming:'end-of-turn',rulesConfirmed:true,...extra}});

test('Shooting actions list active cards of acting player including retained cards; confirmation links exact instance',()=>{
  const session=game(),root=fakeDom();
  assert.deepEqual(getMissionActionOptions(session.getState()).map(item=>item.id),['clean','plunder','old-card']);
  const screen=createShootingScreen(root,{session,perspectivePlayerId:'p1'});
  try {
    root.change('[data-shooting-unit-picker]','u1'); root.click('[data-choice-action-toggle]');
    assert.match(root.innerHTML,/Cleanse/); assert.match(root.innerHTML,/Plunder/); assert.doesNotMatch(root.innerHTML,/Assassination/);
    root.change('[data-choice-action]','plunder');
    assert.equal(root.node('[data-choice-action-confirm]').disabled,true);
    root.node('[data-action-rules-confirmed]').events.change({target:{checked:true}});
    root.click('[data-choice-action-confirm]');
    const action=session.getState().history.at(-1).payload;
    assert.equal(action.missionInstanceId,'plunder');assert.equal(action.missionName,'Plunder');assert.equal(action.reviewTiming,'end-of-turn');
    assert.equal(session.getState().history.some(e=>e.type.includes('victory_points')),false);
  } finally {screen.destroy();}
});

test('action command rejects foreign/inactive missions and missing printed-card confirmation',()=>{
  const session=game(),before=session.getState();
  assert.throws(()=>startAction(session,{missionInstanceId:'enemy-card'}),/active player's active secondary/);
  assert.throws(()=>startAction(session,{rulesConfirmed:false}),/physical mission card/);
  assert.throws(()=>startAction(session,{reviewTiming:'event'}),/scoring checkpoint/);
  assert.equal(session.getState(),before);
});

test('action attempts survive saves, review only when due, persist result once, and never award VP',()=>{
  const session=game();startAction(session);
  const actionKey='1:1:u1';
  const payload={actionKey,playerId:'p1',checkpoint:'end-of-turn',outcome:'completed'};
  assert.throws(()=>session.dispatch({type:'mission_action.review',payload}),/recorded scoring checkpoint/);
  const restored=JSON.parse(JSON.stringify(session.getState()));restored.phase='end_turn';session.replaceState(restored);
  assert.equal(getMissionActionReviews(session.getState(),{playerId:'p1',checkpoint:'end-of-turn'}).length,1);
  session.dispatch({type:'mission_action.review',payload});
  assert.equal(getMissionActionReviews(session.getState(),{playerId:'p1',checkpoint:'end-of-turn'})[0].review.outcome,'completed');
  assert.throws(()=>session.dispatch({type:'mission_action.review',payload}),/already been reviewed/);
  assert.equal(session.getState().scoring.secondaryMissions[0].status,'active');
  assert.equal(session.getState().history.some(e=>e.type.includes('victory_points')),false);
});

test('end-turn popup contains both players due windows before turn advances and respects independent modes',()=>{
  const state=seed('end_turn');
  const reminder=getScoringCheckpointReminder(state,{previousPhase:'fight',perspectivePlayerId:'p1'});
  assert.deepEqual(reminder.groups.map(g=>[g.playerId,g.checkpoint]),[['p1','end-of-turn'],['p2','end-of-opponent-turn']]);
  assert.ok(reminder.groups[0].review.secondary.some(item=>item.instanceId==='clean'));
  assert.ok(reminder.groups[1].review.secondary.some(item=>item.instanceId==='enemy-card'));
  const html=renderScoringCheckpointDialog(state,reminder);
  assert.match(html,/Cleanse/);assert.match(html,/Assassination/);assert.match(html,/data-scoring-player="p2"/);
  assert.equal(getScoringCheckpointReminder({...state,phase:'start_turn',activePlayer:'p2'},{previousPhase:'end_turn'}),null);
});

test('Command checkpoint filters mission owner and minimum round; opponent-turn action waits for opponent end',()=>{
  const session=game();startAction(session,{reviewTiming:'end-of-opponent-turn'});
  const endOwn={...session.getState(),phase:'end_turn'};
  assert.equal(getMissionActionReviews(endOwn,{playerId:'p1',checkpoint:'end-of-opponent-turn'}).length,0);
  const endOpponent={...endOwn,activePlayer:'p2',turn:2};
  assert.equal(getMissionActionReviews(endOpponent,{playerId:'p1',checkpoint:'end-of-opponent-turn'}).length,1);
  const state=seed('movement');state.scoring.secondaryMissions[0].definition.scoringWindows=[{timing:'command-phase',minRound:2,modes:['tactical'],tiers:[]}];
  const reminder=getScoringCheckpointReminder(state,{previousPhase:'command'});
  assert.equal(reminder.groups.length,1);assert.equal(reminder.groups[0].review.secondary.length,0);
  const definition={id:'foreign-primary',name:'Other primary',category:'primary',playerId:'p2',timing:'command-phase',conditions:[]};
  assert.equal(evaluateScoringCheckpoint(state,{checkpoint:'command-phase',scoringPlayerId:'p1',activePlayerId:'p1',primaryDefinitions:[definition]}).primary.length,0);
});

test('checkpoint action result refreshes the open dialog and survives re-opening',async()=>{
  const {refreshScoringCheckpointDialog}=await import('../../src/ui/scoring-checkpoint-dialog.js');
  const session=game();startAction(session);
  session.replaceState({...session.getState(),phase:'end_turn'});
  const reminder=getScoringCheckpointReminder(session.getState(),{previousPhase:'fight'});
  const host=fakeDom(),container={querySelector:selector=>selector==='[data-scoring-reminder-host]'?host:null};
  const refresh=()=>refreshScoringCheckpointDialog(container,session.getState(),reminder,session);
  const unsubscribe=session.subscribe(refresh);
  try {
    refresh();
    host.click('[data-action-review]','1:1:u1');
    assert.match(host.innerHTML,/Confirmed completed/);
    assert.equal(host.querySelector('[data-action-review]'),null);
    refreshScoringCheckpointDialog(container,session.getState(),null,session);assert.equal(host.innerHTML,'');
    refresh();assert.match(host.innerHTML,/Confirmed completed/);
  } finally {unsubscribe();}
});
