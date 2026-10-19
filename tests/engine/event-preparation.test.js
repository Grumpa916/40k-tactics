import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { COMMAND_TYPES as C } from '../../src/commands/game-commands.js';
import { preparationStep, preparationIssues, reserveSummary } from '../../src/rules/event-preparation.js';
import { evaluatePreGameReadiness } from '../../src/rules/pre-game-readiness.js';
import { renderBattlefieldMap } from '../../src/ui/battlefield-map.js';
clearCommandHandlers();registerCoreCommandHandlers();
function fixture() {
 const session=createGameSession(createGameState({battle:{id:'test',status:'setup',missionId:'test',round:0},battleSetup:{battleSize:'strike_force'},battlefieldMap:{missionSetup:{myDisposition:'Take and Hold',opponentDisposition:'Take and Hold',layout:'A'}},players:[{id:'p1',name:'Mine'},{id:'p2',name:'Opponent'}], units:[{id:'a',ownerId:'p1',name:'A',status:'reserves',points:100},{id:'b',ownerId:'p2',name:'B',status:'reserves',points:100}], scoring:{secondaryMissions:[]}}));
 const cmd=(type,payload={})=>session.dispatch({type,payload});
 const prep=payload=>cmd(C.UPDATE_PREPARATION,payload);
 const confirm=()=>prep({action:'confirm'});
 function toFormations(){confirm();confirm();cmd(C.SET_PRE_GAME_ROLES,{attackerPlayerId:'p1'});confirm();for(const playerId of ['p1','p2'])cmd(C.SET_SECONDARY_MISSION_MODE,{playerId,mode:'tactical'});confirm();}
 function toDeployment(){toFormations();confirm();cmd(C.ENTER_DEPLOYMENT);}
 function placeAll(){for(const u of session.getState().units)if(u.status!=='embarked'&&!session.getState().battlefieldMap?.declaredReserves?.[u.id])cmd(C.SET_ACTUAL_DEPLOYMENT_POSITION,{unitId:u.id,playerId:u.ownerId,position:{x:10,y:10}});}
 return {session,cmd,prep,confirm,toFormations,toDeployment,placeAll};
}
test('complete official sequence requires redeployment, explicit roll winner and pre-battle confirmation',()=>{
 const x=fixture();assert.throws(()=>x.cmd(C.ENTER_DEPLOYMENT),/checkpoints/);x.toDeployment();
 assert.equal(x.session.getState().preparation.firstPlayerId,undefined);
 assert.equal(evaluatePreGameReadiness(x.session.getState()).ready,true);
 assert.throws(x.confirm,/Place/);x.placeAll();x.confirm();
 assert.equal(preparationStep(x.session.getState()),'redeployment');
 assert.throws(()=>x.cmd(C.START_FIRST_TURN,{activePlayerId:'p1'}),/checkpoints/);
 x.confirm();assert.throws(x.confirm,/roll winner/);
 x.prep({action:'first-player',playerId:'p2'});x.confirm();
 assert.throws(()=>x.cmd(C.START_FIRST_TURN,{activePlayerId:'p2'}),/checkpoints/);
 x.confirm();assert.throws(()=>x.cmd(C.START_FIRST_TURN,{activePlayerId:'p1'}),/recorded/);
 x.cmd(C.START_FIRST_TURN,{activePlayerId:'p2'});x.cmd(C.CHANGE_PHASE,{phase:'command'});
 assert.equal(x.session.getState().battle.round,1);assert.equal(x.session.getState().activePlayer,'p2');
});
test('sequence guard prevents early secondary choices, role changes and first-turn selection',()=>{
 const x=fixture();assert.throws(()=>x.cmd(C.SET_SECONDARY_MISSION_MODE,{playerId:'p1',mode:'fixed'}),/checkpoint/);
 assert.throws(()=>x.prep({action:'first-player',playerId:'p1'}),/redeployment/);
 x.toDeployment();assert.throws(()=>x.cmd(C.SET_PRE_GAME_ROLES,{attackerPlayerId:'p2'}),/checkpoint/);
 assert.throws(()=>x.cmd(C.DECLARE_UNIT_RESERVE,{unitId:'a',playerId:'p1'}),/checkpoint/);
});
test('back invalidates dependent confirmations and preserves source roster snapshots',()=>{
 const x=fixture();x.toFormations();x.prep({action:'back'});
 assert.equal(preparationStep(x.session.getState()),'secondaries');
 assert.deepEqual(x.session.getState().preparation.confirmed,['mission','terrain','roles']);
 x.prep({action:'back'});x.prep({action:'back'});x.prep({action:'back'});
 assert.deepEqual(x.session.getState().preparation.confirmed,[]);
});
test('Fixed mode needs two distinct cards before formations; setup battle record permits selection',()=>{
 const x=fixture();x.confirm();x.confirm();x.cmd(C.SET_PRE_GAME_ROLES,{attackerPlayerId:'p1'});x.confirm();
 x.cmd(C.SET_SECONDARY_MISSION_MODE,{playerId:'p1',mode:'fixed'});x.cmd(C.SET_SECONDARY_MISSION_MODE,{playerId:'p2',mode:'tactical'});
 assert.throws(x.confirm,/two Fixed/);
 for(const id of ['cleanse','other'])x.cmd(C.DRAW_SECONDARY_MISSION,{playerId:'p1',definition:{id,category:'secondary',availableModes:['fixed']}});
 x.confirm();assert.equal(preparationStep(x.session.getState()),'formations');
});
test('transport passengers count toward reserves but never get independent deployment markers',()=>{
 const x=fixture();x.session.replaceState({...x.session.getState(),units:[...x.session.getState().units,{id:'transport',ownerId:'p1',name:'Transport',status:'reserves',points:200}]});
 x.toFormations();x.prep({action:'formation',unitId:'a',kind:'embarked',transportId:'transport'});x.prep({action:'formation',unitId:'transport',kind:'reserve'});
 assert.equal(reserveSummary(x.session.getState(),'p1').points,300);
 assert.equal(x.session.getState().units.find(u=>u.id==='a').status,'embarked');
 x.confirm();x.cmd(C.ENTER_DEPLOYMENT);x.placeAll();
 assert.deepEqual(preparationIssues(x.session.getState()),[]);
 assert.doesNotMatch(renderBattlefieldMap(x.session.getState(),{mode:'deployment'}),/data-map-unit-id="a"/);
 assert.throws(()=>x.cmd(C.SET_ACTUAL_DEPLOYMENT_POSITION,{unitId:'transport',playerId:'p1',position:{x:5,y:5}}),/off the battlefield/);
});
test('unknown reserve costs require recorded review; changed formations invalidate review',()=>{
 const x=fixture();x.session.replaceState({...x.session.getState(),units:x.session.getState().units.map(u=>({...u,points:null}))});x.toFormations();
 x.prep({action:'formation',unitId:'a',kind:'reserve'});assert.throws(x.confirm,/reserve review/);
 x.prep({action:'reserve-review',playerId:'p1',note:'Physical roster: 100 points of 1000 allowance'});
 assert.deepEqual(preparationIssues(x.session.getState()),[]);
 x.prep({action:'formation',unitId:'a',kind:'field'});assert.deepEqual(x.session.getState().preparation.reserveReview,{});
});
test('reject enemy transports, circular passengers and known Fortification reserves',()=>{
 const x=fixture();x.toFormations();assert.throws(()=>x.prep({action:'formation',unitId:'a',kind:'embarked',transportId:'b'}),/friendly/);
 x.session.replaceState({...x.session.getState(),units:x.session.getState().units.map(u=>u.id==='a'?{...u,keywords:['FORTIFICATION']}:u)});
 x.prep({action:'formation',unitId:'a',kind:'reserve'});assert.throws(x.confirm,/Fortification/);
});
test('redeployment and Scout reserve setup are separate from initial declarations and must be placed',()=>{
 const x=fixture();x.toDeployment();x.placeAll();x.confirm();
 x.prep({action:'formation',unitId:'a',kind:'reserve'});assert.equal(x.session.getState().preparation.formations.a.source,'redeployment');
 x.confirm();x.prep({action:'first-player',playerId:'p1'});x.confirm();
 x.prep({action:'formation',unitId:'a',kind:'field'});assert.throws(x.confirm,/Place A/);
 x.cmd(C.SET_ACTUAL_DEPLOYMENT_POSITION,{unitId:'a',playerId:'p1',position:{x:6,y:6}});x.confirm();
});
test('save/resume keeps exact checkpoint; older deployment save must review missing checkpoints',()=>{
 const x=fixture();x.toDeployment();x.placeAll();x.confirm();
 const copy=JSON.parse(JSON.stringify(x.session.getState()));x.session.replaceState(copy);assert.equal(preparationStep(x.session.getState()),'redeployment');
 delete copy.preparation;x.session.replaceState(copy);assert.throws(x.confirm,/checkpoints/);
 x.prep({action:'review-legacy'});assert.equal(x.session.getState().phase,'setup');assert.equal(preparationStep(x.session.getState()),'mission');assert.ok(x.session.getState().battlefieldMap.actualDeployment.a);
});
test('attached roster members follow bodyguard placement and original roster remains unchanged',()=>{
 const x=fixture();const roster={pointsLimit:2000,units:[{id:'g',points:100},{id:'l',points:50,attachedToBodyguardId:'g'}]};
 x.session.replaceState({...x.session.getState(),armyRosters:{p1:roster},units:[{id:'p1:g',name:'Guard',ownerId:'p1',status:'reserves',metadata:{rosterUnitId:'g'}},{id:'p1:l',name:'Leader',ownerId:'p1',status:'reserves',metadata:{rosterUnitId:'l'}},x.session.getState().units[1]]});
 const before=JSON.stringify(x.session.getState().armyRosters);x.toDeployment();
 x.cmd(C.SET_ACTUAL_DEPLOYMENT_POSITION,{unitId:'p1:g',playerId:'p1',position:{x:10,y:10}});
 assert.equal(x.session.getState().units.find(u=>u.id==='p1:l').status,'deployed');
 assert.throws(()=>x.cmd(C.SET_ACTUAL_DEPLOYMENT_POSITION,{unitId:'p1:l',playerId:'p1',position:{x:5,y:5}}),/bodyguard/);
 x.cmd(C.SET_ACTUAL_DEPLOYMENT_POSITION,{unitId:'b',playerId:'p2',position:{x:10,y:30}});x.confirm();
 assert.equal(JSON.stringify(x.session.getState().armyRosters),before);
});
