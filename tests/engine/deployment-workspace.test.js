import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { COMMAND_TYPES as C } from '../../src/commands/game-commands.js';
import { deploymentWorkspaceIssues } from '../../src/rules/deployment-workspace.js';
import { reserveSummary } from '../../src/rules/event-preparation.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
clearCommandHandlers();registerCoreCommandHandlers();
export function fixture(overrides={}) {
  const initial=createGameState({battle:{id:'test',status:'setup',round:0},battleSetup:{battleSize:'strike_force'},players:[{id:'p1',name:'Mine'},{id:'p2',name:'Other'}],
    units:[{id:'a',name:'A',ownerId:'p1',status:'reserves',points:100},{id:'b',name:'B',ownerId:'p2',status:'reserves',points:100}],
    battlefieldMap:{missionSetup:{myDisposition:'Take and Hold',opponentDisposition:'Take and Hold',layout:'A'},deploymentPlan:{a:{x:12,y:8},b:{x:15,y:32}}},...overrides});
  const session=createGameSession(initial),cmd=(type,payload={})=>session.dispatch({type,payload}),send=payload=>cmd(C.UPDATE_DEPLOYMENT_WORKSPACE,payload);
  const ready=()=>{send({action:'open'});send({action:'attacker',playerId:'p1'});send({action:'first-player',playerId:'p2'});for(const playerId of ['p1','p2'])cmd(C.SET_SECONDARY_MISSION_MODE,{playerId,mode:'tactical'});};
  return {session,cmd,send,ready};
}
test('one workspace imports both plans, retains saved actual positions and starts opponent Round 1 atomically',()=>{
  const x=fixture();x.session.replaceState({...x.session.getState(),battlefieldMap:{...x.session.getState().battlefieldMap,actualDeployment:{a:{x:20,y:9}}}});
  x.ready();assert.deepEqual(x.session.getState().battlefieldMap.actualDeployment,{a:{x:20,y:9},b:{x:15,y:32}});
  assert.deepEqual(deploymentWorkspaceIssues(x.session.getState()),[]);
  assert.equal(x.session.getState().preparation.confirmed,undefined);
  x.send({action:'begin',nowMs:123});
  const s=x.session.getState();assert.equal(s.phase,'command');assert.equal(s.turn,1);assert.equal(s.battle.round,1);assert.equal(s.activePlayer,'p2');assert.equal(s.timers.turnClock.startedAtMs,123);
  assert.throws(()=>x.send({action:'location',unitId:'a',kind:'reserve'}),/closed/);
});
test('reserves remove markers and restoring Battlefield preserves the last position across reload',()=>{
  const x=fixture();x.ready();x.cmd(C.SET_ACTUAL_DEPLOYMENT_POSITION,{unitId:'a',playerId:'p1',position:{x:23,y:11}});
  x.send({action:'location',unitId:'a',kind:'reserve'});
  assert.doesNotMatch(renderBattlefieldMap(x.session.getState(),{mode:'deployment'}),/data-map-unit-id="a"/);
  assert.equal(x.session.getState().units[0].position,null);
  x.session.replaceState(JSON.parse(JSON.stringify(x.session.getState())));
  x.send({action:'location',unitId:'a',kind:'field'});
  assert.deepEqual(x.session.getState().units[0].position,{x:23,y:11});
  assert.equal(x.session.getState().units[0].status,'deployed');
});
test('legacy checkpoints migrate in place, keeping reserve assignment, first player and roster snapshots',()=>{
  const x=fixture();const old=x.session.getState();
  x.session.replaceState({...old,phase:'deployment',battle:{...old.battle,status:'deployment'},preparation:{version:1,step:'pre-battle',firstPlayerId:'p2',formations:{a:{kind:'reserve'}}},armyRosters:{p1:{name:'Keep roster',units:[]}},battlefieldMap:{...old.battlefieldMap,declaredReserves:{a:true},actualDeployment:{a:{x:4,y:5},b:{x:20,y:30}}}});
  x.send({action:'open'});const s=x.session.getState();assert.equal(s.preparation.firstPlayerId,'p2');assert.equal(s.preparation.previousCheckpoint,'pre-battle');assert.equal(s.units[0].status,'reserves');assert.equal(s.battlefieldMap.actualDeployment.a,undefined);assert.deepEqual(s.battlefieldMap.actualDeployment.b,{x:20,y:30});assert.equal(s.armyRosters.p1.name,'Keep roster');
});
test('unknown reserve costs get one tap review, invalidated by a changed assignment',()=>{
  const x=fixture();x.session.replaceState({...x.session.getState(),units:x.session.getState().units.map(u=>({...u,points:null}))});x.ready();x.send({action:'location',unitId:'a',kind:'reserve'});
  assert.ok(deploymentWorkspaceIssues(x.session.getState()).some(issue=>/reserve review/.test(issue)));
  const before=JSON.stringify(x.session.getState());assert.throws(()=>x.send({action:'begin'}),/reserve review/);assert.equal(JSON.stringify(x.session.getState()),before);
  x.send({action:'reserve-review',playerId:'p1'});assert.deepEqual(deploymentWorkspaceIssues(x.session.getState()),[]);
  x.send({action:'location',unitId:'a',kind:'field'});assert.deepEqual(x.session.getState().preparation.reserveReview,{});
});
test('linked leaders and passengers count toward reserved transport total and stay off the map',()=>{
  const x=fixture();const s=x.session.getState();
  x.session.replaceState({...s,armyRosters:{p1:{units:[{id:'guard',points:100},{id:'leader',points:50,attachedToBodyguardId:'guard'},{id:'carrier',points:200}]}},units:[{id:'a',name:'Guard',ownerId:'p1',status:'reserves',metadata:{rosterUnitId:'guard'}},{id:'leader',name:'Leader',ownerId:'p1',status:'reserves',metadata:{rosterUnitId:'leader'}},{id:'carrier',name:'Transport',ownerId:'p1',status:'reserves',metadata:{rosterUnitId:'carrier'}},s.units[1]]});
  x.ready();x.send({action:'location',unitId:'a',kind:'embarked',transportId:'carrier'});x.send({action:'location',unitId:'carrier',kind:'reserve'});
  assert.equal(reserveSummary(x.session.getState(),'p1').points,350);
  assert.doesNotMatch(renderBattlefieldMap(x.session.getState(),{mode:'deployment'}),/data-map-unit-id="(?:a|leader|carrier)"/);
  assert.throws(()=>x.send({action:'location',unitId:'b',kind:'embarked',transportId:'carrier'}),/friendly/);
  assert.throws(()=>x.send({action:'location',unitId:'leader',kind:'reserve'}),/valid unit/);
});
test('unplaced units, absent rolls and Fixed cards remain real requirements, without per-step confirmations',()=>{
  const x=fixture();const s=x.session.getState();x.session.replaceState({...s,battlefieldMap:{...s.battlefieldMap,deploymentPlan:{}}});x.send({action:'open'});
  const issues=deploymentWorkspaceIssues(x.session.getState());assert.ok(issues.some(item=>/Place A/.test(item)));assert.ok(issues.some(item=>/first-turn roll/.test(item)));
  assert.throws(()=>x.cmd(C.START_FIRST_TURN,{activePlayerId:'p1'}),/Deploy & Begin/);
  x.cmd(C.SET_SECONDARY_MISSION_MODE,{playerId:'p1',mode:'fixed'});
  assert.ok(deploymentWorkspaceIssues(x.session.getState()).some(item=>/two Fixed/.test(item)));
  for(const id of ['card1','card2'])x.cmd(C.DRAW_SECONDARY_MISSION,{playerId:'p1',definition:{id,category:'secondary',availableModes:['fixed']}});
  assert.equal(deploymentWorkspaceIssues(x.session.getState()).some(item=>/two Fixed/.test(item)),false);
});
test('opening and reselecting Battlefield never moves an already placed unit or mutates the plan',()=>{
  const x=fixture();x.ready();const before=JSON.stringify(x.session.getState());
  x.send({action:'open'});x.send({action:'location',unitId:'a',kind:'field'});
  assert.equal(JSON.stringify(x.session.getState()),before);
});
