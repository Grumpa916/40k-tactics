import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { COMMAND_TYPES as C } from '../../src/commands/game-commands.js';
import { deploymentWorkspaceIssues } from '../../src/rules/deployment-workspace.js';
import { reserveSummary } from '../../src/rules/event-preparation.js';
import { getDeploymentTransports, getDeploymentTransportChoices, getDeploymentTransportOccupancy, assessDeploymentEmbarkation } from '../../src/rules/deployment-transport-eligibility.js';
import { renderDeployBeginView } from '../../src/ui/deploy-begin-view.js';
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
  x.session.replaceState({...s,armyRosters:{p1:{faction:'Space Marines',units:[{id:'guard',points:100,modelCount:5},{id:'leader',points:50,modelCount:1,attachedToBodyguardId:'guard'},{id:'carrier',points:200,modelCount:1,datasheetId:'space-marines:rhino'}]}},units:[{id:'a',name:'Guard',ownerId:'p1',status:'reserves',keywords:['Infantry','Adeptus Astartes'],metadata:{rosterUnitId:'guard'}},{id:'leader',name:'Leader',ownerId:'p1',status:'reserves',keywords:['Infantry','Adeptus Astartes'],metadata:{rosterUnitId:'leader'}},{id:'carrier',name:'Transport',ownerId:'p1',status:'reserves',keywords:['Transport','Dedicated Transport'],metadata:{rosterUnitId:'carrier',datasheetId:'space-marines:rhino'}},s.units[1]]});
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

function marineTransportFixture({transportId='space-marines:impulsor',models=5,passengerKeywords=['Infantry','Adeptus Astartes','Tacticus']}={}) {
  const x=fixture();
  const s=x.session.getState();
  x.session.replaceState({...s,armyRosters:{p1:{faction:'Space Marines',units:[
    {id:'troops',name:'Troops',modelCount:models,datasheetId:'space-marines:intercessor-squad'},
    {id:'bus',name:'Carrier',modelCount:1,datasheetId:transportId}
  ]}},units:[
    {id:'troops',name:'Troops',ownerId:'p1',status:'reserves',keywords:passengerKeywords,metadata:{rosterUnitId:'troops'}},
    {id:'bus',name:'Carrier',ownerId:'p1',status:'reserves',metadata:{rosterUnitId:'bus',datasheetId:transportId}},
    s.units[1]
  ],battlefieldMap:{...s.battlefieldMap,deploymentPlan:{troops:{x:12,y:8},bus:{x:14,y:9},b:{x:15,y:32}}}});
  x.ready();
  return x;
}
test('transport section is hidden when neither army has an actual Transport',()=>{
  const x=fixture();x.ready();
  assert.equal(getDeploymentTransports(x.session.getState()).length,0);
  assert.doesNotMatch(renderDeployBeginView(x.session.getState()),/Transport assignments/);
});
test('only real transports appear; Impulsor rejects Terminators and requires whole-unit capacity',()=>{
  const x=marineTransportFixture({models:7});
  let s=x.session.getState();
  assert.deepEqual(getDeploymentTransports(s).map(x=>x.id),['bus']);
  assert.deepEqual(getDeploymentTransportChoices(s,s.units[0]).map(x=>x.id),['bus']);
  x.send({action:'location',unitId:'troops',kind:'embarked',transportId:'bus'});
  s=x.session.getState();
  assert.deepEqual(getDeploymentTransportOccupancy(s,s.units[1]),{used:7,capacity:7});
  assert.equal(s.units[0].status,'embarked');
  assert.doesNotMatch(renderBattlefieldMap(s,{mode:'deployment'}),/data-map-unit-id="troops"/);
  assert.throws(()=>x.send({action:'location',unitId:'b',kind:'embarked',transportId:'bus'}),/friendly/);
  const y=marineTransportFixture({models:8});
  assert.equal(getDeploymentTransportChoices(y.session.getState(),y.session.getState().units[0]).length,0);
  assert.throws(()=>y.send({action:'location',unitId:'troops',kind:'embarked',transportId:'bus'}),/spaces remaining/);
  const z=marineTransportFixture({models:5,passengerKeywords:['Infantry','Adeptus Astartes','Terminator']});
  assert.equal(getDeploymentTransportChoices(z.session.getState(),z.session.getState().units[0]).length,0);
  assert.throws(()=>z.send({action:'location',unitId:'troops',kind:'embarked',transportId:'bus'}),/TERMINATOR/);
});
test('Gravis model costs 2 spaces; empty Dedicated Transport cannot begin a battle',()=>{
  const x=marineTransportFixture({models:4,passengerKeywords:['Infantry','Adeptus Astartes','Gravis']});
  let s=x.session.getState();
  assert.equal(assessDeploymentEmbarkation(s,s.units[0],s.units[1]).ok,false);
  assert.ok(deploymentWorkspaceIssues(s).some(issue=>/Dedicated Transport/.test(issue)));
  assert.throws(()=>x.send({action:'begin'}),/Dedicated Transport/);
  const y=marineTransportFixture({models:3,passengerKeywords:['Infantry','Adeptus Astartes','Gravis']});
  y.send({action:'location',unitId:'troops',kind:'embarked',transportId:'bus'});
  s=y.session.getState();
  assert.deepEqual(getDeploymentTransportOccupancy(s,s.units[1]),{used:6,capacity:7});
  assert.equal(deploymentWorkspaceIssues(s).filter(issue=>/Transport/.test(issue)).length,0);
});
test('a non-Transport cannot carry units, and unknown transport capacity is never assumed',()=>{
  const x=marineTransportFixture({models:5});const s=x.session.getState();
  assert.equal(assessDeploymentEmbarkation(s,s.units[0],s.units[2]).ok,false);
  const changed={...s,units:s.units.map(u=>u.id==='bus'?{...u,keywords:['Transport'],metadata:{rosterUnitId:'bus',datasheetId:'space-marines:unsupported-transport'}}:u),
    armyRosters:{p1:{...s.armyRosters.p1,units:s.armyRosters.p1.units.map(u=>u.id==='bus'?{...u,datasheetId:'space-marines:unsupported-transport'}:u)}}};
  assert.equal(getDeploymentTransports(changed).length,1);
  assert.equal(getDeploymentTransportChoices(changed,changed.units[0]).length,0);
  assert.match(assessDeploymentEmbarkation(changed,changed.units[0],changed.units[1]).reason,/not yet verified/);
});
