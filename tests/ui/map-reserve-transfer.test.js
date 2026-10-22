import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { transferMapReserve } from '../../src/engine/map-reserve-transitions.js';
import { getFightEngagementState } from '../../src/rules/fight-engagement-state.js';
import { createMovementScreen } from '../../src/ui/movement-screen.js';
import { createDeploymentScreen } from '../../src/ui/deployment-screen.js';
import { createDeployBeginScreen } from '../../src/ui/deploy-begin-screen.js';
import { renderMapReserveTray, tappedMapPosition } from '../../src/ui/map-reserve-tray.js';
function seed(deploy=false){return createGameState({phase:deploy?'deployment':'movement',turn:2,activePlayer:'p2',players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],battle:{id:'b',status:deploy?'deployment':'active',round:1,activePlayerId:'p2',firstPlayerId:'p1'},preparation:{mode:'combined',step:'deployment',formations:{a:{kind:'field'},b:{kind:'field'}}},units:[{id:'a',name:'Alpha',ownerId:'p1',status:'deployed',position:{x:5,y:5}},{id:'b',name:'Beta',ownerId:'p2',status:'deployed',position:{x:30,y:20}}],battlefieldMap:{actualDeployment:{a:{x:5,y:5},b:{x:30,y:20}}}});}
function game(state){clearCommandHandlers();registerCoreCommandHandlers();return createGameSession(state);}
function dom(){const handlers={};return {handlers,innerHTML:'',replaceChildren(){},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(k,fn){handlers[k]=fn;},removeEventListener(k){delete handlers[k];}};}
const target=matches=>({closest:selector=>matches[selector]??null});
const attr=(name,value)=>({getAttribute:key=>key===name?value:null});
const board={getBoundingClientRect:()=>({left:0,top:0,width:600,height:440}),closest:()=>true};

test('Movement tap transfer works for opponent, persists and clears old engagements',()=>{
  const state=seed();state.history=[{type:'charge.outcome_recorded',payload:{unitId:'b',targetIds:['a'],outcome:'successful'}}];
  assert.ok(getFightEngagementState(state).engagedUnitIds.includes('b'));
  const session=game(state),root=dom(),screen=createMovementScreen(root,{session,perspectivePlayerId:'p1'});
  try {
    root.handlers.click({target:target({'[data-map-reserve-area]':{}})});
    assert.equal(session.getState().units[1].status,'reserves');
    assert.doesNotMatch(root.innerHTML,/data-map-unit-id="b"/);
    assert.match(root.innerHTML,/data-map-reserve-select="b"/);
    assert.deepEqual(getFightEngagementState(session.getState()).engagedUnitIds,[]);
    root.handlers.click({target:target({'[data-map-reserve-select]':attr('data-map-reserve-select','b')})});
    root.handlers.click({target:target({'[data-battlefield-map-board]':board}),clientX:420,clientY:110});
    const restored=JSON.parse(JSON.stringify(session.getState()));
    assert.equal(restored.units[1].status,'deployed');assert.deepEqual(restored.units[1].position,{x:42,y:33});
    assert.equal(restored.battlefieldMap.declaredReserves.b,undefined);
    assert.equal(restored.battlefieldMap.actualDeployment.b,undefined);
    assert.match(root.innerHTML,/data-map-unit-id="b"/);
    assert.equal(restored.history.at(-1).type,'unit.arrived_from_reserves');
  }finally{screen.destroy();}
});
test('live transfers reject wrong army, wrong phase, destroyed/embarked units and bad positions atomically',()=>{
  const state=seed();
  assert.throws(()=>transferMapReserve(state,{unitId:'a',destination:'reserves'}),/active army/);
  assert.throws(()=>transferMapReserve({...state,phase:'shooting'},{unitId:'b',destination:'reserves'}),/Movement/);
  for(const status of ['destroyed','embarked'])assert.throws(()=>transferMapReserve({...state,units:state.units.map(u=>u.id==='b'?{...u,status}:u)},{unitId:'b',destination:'reserves'}));
  const reserve=transferMapReserve(state,{unitId:'b',destination:'reserves'});
  assert.throws(()=>transferMapReserve(reserve,{unitId:'b',destination:'battlefield',position:{x:61,y:5}}));
  assert.equal(reserve.units[1].status,'reserves');
});
test('deployment tray accepts selected unit of either army and map tap returns it atomically',()=>{
  const session=game(seed(true)),root=dom(),screen=createDeployBeginScreen(root,{session});
  try {
    const button={hasAttribute:name=>name==='data-deploy-select',getAttribute:()=> 'a'};
    root.handlers.click({target:target({button})});
    root.handlers.click({target:target({'[data-map-reserve-area]':{}})});
    assert.equal(session.getState().units[0].status,'reserves');
    assert.equal(session.getState().preparation.formations.a.kind,'reserve');
    assert.equal(session.getState().battlefieldMap.actualDeployment.a,undefined);
  }finally{screen.destroy();}
  const mapRoot=dom(),map=createDeploymentScreen(mapRoot,{session,mapOnly:true,guidedPreparation:true,initialSelectedUnitId:'a'});
  try {
    mapRoot.handlers.click({target:target({'[data-battlefield-map-board]':board}),clientX:120,clientY:330});
    assert.equal(session.getState().units[0].status,'deployed');
    assert.equal(session.getState().preparation.formations.a.kind,'field');
    assert.deepEqual(session.getState().battlefieldMap.actualDeployment.a,{x:12,y:11});
    assert.equal(session.getState().battlefieldMap.declaredReserves.a,undefined);
  }finally{map.destroy();}
});
test('linked leaders transfer with bodyguard, not independently, and only active army appears in live tray',()=>{
  const state=seed();state.units.push({id:'leader',name:'Leader',ownerId:'p2',status:'deployed',attachedToUnitId:'b'});
  // Use the saved-roster attachment representation used by the app.
  state.units[1].metadata={rosterUnitId:'guard'};state.units[2].metadata={rosterUnitId:'leader'};
  state.armyRosters={p2:{units:[{id:'guard'},{id:'leader',attachedToBodyguardId:'guard'}]}};
  const reserved=transferMapReserve(state,{unitId:'b',destination:'reserves'});
  assert.equal(reserved.units[2].status,'reserves');
  assert.throws(()=>transferMapReserve(reserved,{unitId:'leader',destination:'battlefield',position:{x:3,y:3}}),/bodyguard/);
  const html=renderMapReserveTray(reserved,{playerId:'p2',selectedUnitId:'b'});
  assert.match(html,/aria-pressed="true"/);assert.doesNotMatch(html,/data-map-reserve-select="leader"/);
  assert.deepEqual(tappedMapPosition({clientX:300,clientY:220},board),{x:30,y:22});
});
