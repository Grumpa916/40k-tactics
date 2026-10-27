import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventPreparationScreen } from '../../src/ui/event-preparation-screen.js';
import { createBattleSetupScreen } from '../../src/ui/battle-setup-screen.js';
import { createGameSession } from '../../src/application/game-session.js';
import { createGameState } from '../../src/state/game-state.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { COMMAND_TYPES as C } from '../../src/commands/game-commands.js';
clearCommandHandlers();registerCoreCommandHandlers();
function element() {
 const listeners = new Map(), fields = new Map();
 return {innerHTML:'', fields, contains:()=>true, replaceChildren(){this.innerHTML='';},
 addEventListener(k,f){if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(f);},
 removeEventListener(k,f){listeners.get(k)?.delete(f);}, querySelector(s){return fields.get(s)??null;},querySelectorAll(){return [];},
 click(attrs){const t={hasAttribute:k=>Object.hasOwn(attrs,k),getAttribute:k=>attrs[k]??null,closest(s){return s==='button'||Object.keys(attrs).some(k=>s==='['+k+']')?this:null;}};for(const f of [...(listeners.get('click')??[])])f({target:t});},
 listenerCount(){return [...listeners.values()].reduce((n,s)=>n+s.size,0);}};
}
function fixture(){return createGameSession(createGameState({battle:{id:'test',status:'setup',round:0},battleSetup:{battleSize:'strike_force'},battlefieldMap:{missionSetup:{myDisposition:'Take and Hold',opponentDisposition:'Take and Hold',layout:'A'}},players:[{id:'p1',name:'Mine'},{id:'p2',name:'Other'}],units:[{id:'a',name:'A',ownerId:'p1',status:'reserves',points:100},{id:'b',name:'B',ownerId:'p2',status:'reserves',points:100}]}));}
test('guided controller traverses setup to Command, keeps first player unset until roll and cleans listeners',()=>{
 const session=fixture(),root=element(),child=element();root.fields.set('[data-prep-child]',child);
 const screen=createEventPreparationScreen(root,{session,guidedOrder:true});
 const next=()=>root.click({'data-prep-next':''});
 assert.match(root.innerHTML,/Missions &amp; layout/);next();assert.match(root.innerHTML,/Create battlefield/);
 next();assert.doesNotMatch(child.innerHTML,/Who takes the first turn/);
 session.dispatch({type:C.SET_PRE_GAME_ROLES,payload:{attackerPlayerId:'p1'}});next();
 for(const playerId of ['p1','p2'])session.dispatch({type:C.SET_SECONDARY_MISSION_MODE,payload:{playerId,mode:'tactical'}});
 next();next();assert.equal(session.getState().battle.status,'deployment');
 assert.doesNotMatch(child.innerHTML,/data-start-first-turn/);assert.doesNotMatch(child.innerHTML,/data-declare-reserve/);
 for(const [unitId,playerId] of [['a','p1'],['b','p2']])session.dispatch({type:C.SET_ACTUAL_DEPLOYMENT_POSITION,payload:{unitId,playerId,position:{x:10,y:10}}});
 next();assert.match(root.innerHTML,/Redeploy units/);next();assert.match(root.innerHTML,/Determine first turn/);
 root.click({'data-prep-first':'p2'});next();assert.match(root.innerHTML,/Resolve pre-battle rules/);next();next();
 assert.equal(session.getState().phase,'command');assert.equal(session.getState().activePlayer,'p2');
 screen.destroy();assert.equal(root.listenerCount(),0);assert.equal(child.listenerCount(),0);
});
test('Fixed card UI accepts input while battle is in setup, rather than rejecting every battle record',()=>{
 const session=fixture(),root=element();
 session.replaceState({...session.getState(),preparation:{version:1,step:'secondaries',confirmed:['mission','terrain','roles']},scoring:{secondaryMissionModeByPlayer:{p1:'fixed'}}});
 root.fields.set('[data-setup-secondary-definition]',{value:'fixture-card'});
 root.fields.set('[data-setup-secondary-name]',{value:''});
 root.fields.set('[data-setup-secondary-timing]',{value:'end-of-turn'});
 const screen=createBattleSetupScreen(root,{session,eventStage:'secondaries',secondaryMissionCatalog:[{id:'fixture-card',name:'Fixture card',category:'secondary',fixedAvailable:true,availableModes:['fixed'],scoringWindows:[{timing:'end-of-turn'}]}]});
 assert.match(root.innerHTML,/data-setup-fixed-add/);
 root.click({'data-setup-fixed-add':'p1'});
 assert.equal(session.getState().scoring.secondaryMissions.length,1);
 assert.equal(session.getState().scoring.secondaryMissions[0].definitionId,'fixture-card');
 screen.destroy();
});

test('default preparation keeps terrain reference before deployment and uses the map reserve tray',()=>{
 const session=fixture(),root=element(),workspace=element(),terrain=element();
 root.fields.set('[data-live-deploy-begin]',workspace);
 root.fields.set('[data-prep-terrain-content]',terrain);
 const screen=createEventPreparationScreen(root,{session});
 assert.match(root.innerHTML,/data-prep-terrain-reference/);
 root.click({'data-prep-terrain-reference':''});
 assert.match(root.innerHTML,/role="dialog"/);
 root.click({'data-prep-close-terrain':''});
 assert.doesNotMatch(root.innerHTML,/role="dialog"/);
 assert.match(root.innerHTML,/Continue to Deploy &amp; Begin/);
 root.click({'data-prep-next':''});
 assert.equal(session.getState().preparation.mode,'combined');
 assert.match(workspace.innerHTML,/Reserves tray/);
 assert.doesNotMatch(workspace.innerHTML,/View terrain setup/);
 assert.doesNotMatch(workspace.innerHTML,/data-deploy-location=/);
 assert.doesNotMatch(workspace.innerHTML,/>Placed</);
 assert.doesNotMatch(workspace.innerHTML,/>Battlefield</);
 assert.doesNotMatch(workspace.innerHTML,/Deploy &amp; Begin/);
 assert.doesNotMatch(workspace.innerHTML,/Confirm current checkpoint/);
 workspace.click({'data-deploy-role':'attacker','data-deploy-player':'p1'});
 workspace.click({'data-deploy-role':'first-player','data-deploy-player':'p2'});
 for(const playerId of ['p1','p2'])session.dispatch({type:C.SET_SECONDARY_MISSION_MODE,payload:{playerId,mode:'tactical'}});
 workspace.click({'data-map-reserve-area':''});
 assert.equal(session.getState().preparation.formations.a.kind,'reserve');
 session.dispatch({type:C.SET_ACTUAL_DEPLOYMENT_POSITION,payload:{unitId:'b',playerId:'p2',position:{x:12,y:10}}});
 assert.match(workspace.innerHTML, /data-deploy-begin>Deployment complete/);
 workspace.click({'data-deploy-begin':''});
 assert.equal(session.getState().phase,'command');
 assert.equal(session.getState().activePlayer,'p2');
 screen.destroy();assert.equal(root.listenerCount(),0);assert.equal(workspace.listenerCount(),0);
});

test('Fixed secondary choices remain editable inside combined deployment',()=>{
 const session=fixture(),root=element();
 session.dispatch({type:C.UPDATE_DEPLOYMENT_WORKSPACE,payload:{action:'open'}});
 session.dispatch({type:C.SET_SECONDARY_MISSION_MODE,payload:{playerId:'p1',mode:'fixed'}});
 root.fields.set('[data-setup-secondary-definition]',{value:'fixture-card'});
 root.fields.set('[data-setup-secondary-name]',{value:''});
 root.fields.set('[data-setup-secondary-timing]',{value:'end-of-turn'});
 const screen=createBattleSetupScreen(root,{session,eventStage:'secondaries',secondaryMissionCatalog:[{id:'fixture-card',name:'Fixture card',category:'secondary',fixedAvailable:true,availableModes:['fixed'],scoringWindows:[{timing:'end-of-turn'}]}]});
 root.click({'data-setup-fixed-add':'p1'});
 assert.equal(session.getState().scoring.secondaryMissions[0].definitionId,'fixture-card');
 screen.destroy();assert.equal(root.listenerCount(),0);
});