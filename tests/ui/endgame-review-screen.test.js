import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { createBattleShell } from '../../src/ui/battle-shell.js';
import { createEndgameReviewScreen, renderEndgameReview } from '../../src/ui/endgame-review-screen.js';
import { renderPrototypeWorkspaceTools } from '../../src/ui/prototype-workspace.js';
const seed=()=>createGameState({phase:'movement',turn:3,activePlayer:'p1',players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],units:[],battle:{id:'b',status:'active',round:2,firstPlayerId:'p1',activePlayerId:'p1'},victoryPoints:{p1:10,p2:15},timers:{turnClock:{elapsedMsByPlayer:{p1:1000,p2:0},activePlayerId:'p1',running:true,startedAtMs:Date.now()}}});
function fixture() {
 const handlers={},checkbox={checked:false,focus(){}},confirmButton={disabled:true};
 return {innerHTML:'',replaceChildren(){},contains:()=>true,addEventListener(t,f){handlers[t]=f;},removeEventListener(t){delete handlers[t];},querySelector(s){return s==='[data-final-score-confirmed]'?checkbox:s==='[data-confirm-end-game]'?confirmButton:null;},querySelectorAll(){return [];},
 click(attr){const b={hasAttribute:n=>n===attr};handlers.click?.({target:{closest:()=>b}});},
 check(value){checkbox.checked=value;handlers.change?.({target:{hasAttribute:n=>n==='data-final-score-confirmed',checked:value}});},handlers,checkbox,confirmButton};
}
test('review renders escaped names, unknown score gaps, both armies, and no invented mistakes',()=>{
 const s=seed();s.players[0].name='<img src=x onerror=alert(1)>';
 const html=renderEndgameReview(s);
 assert.match(html,/Game so far/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.match(html,/Opponent/);assert.match(html,/Unallocated/);assert.match(html,/No mistakes inferred/);
 assert.match(renderPrototypeWorkspaceTools(),/data-battle-phase-button="review"/);
});
test('completion requires explicit confirmation, uses the engine, pauses clock, and awards no points',()=>{
 clearCommandHandlers();registerCoreCommandHandlers();const session=createGameSession(seed()),root=fixture(),screen=createEndgameReviewScreen(root,{session});
 const original=session.getState();assert.equal(session.getState(),original);
 root.click('data-confirm-end-game');assert.equal(session.getState(),original);
 root.click('data-end-game');assert.match(root.innerHTML,/Record all final Primary/);
 root.click('data-confirm-end-game');assert.equal(session.getState(),original);
 root.click('data-cancel-end-game');assert.equal(session.getState(),original);
 root.click('data-end-game');root.check(true);assert.equal(root.confirmButton.disabled,false);
 root.click('data-confirm-end-game');assert.equal(session.getState().battle.status,'complete');assert.equal(session.getState().timers.turnClock.running,false);assert.deepEqual(session.getState().victoryPoints,original.victoryPoints);assert.match(root.innerHTML,/Endgame review/);assert.doesNotMatch(root.innerHTML,/data-end-game/);
 screen.destroy();assert.equal(Object.keys(root.handlers).length,0);
});
test('rejected completion is shown without hiding the ongoing game',()=>{
 const root=fixture(),session=createGameSession(seed(),{commandExecutor(){throw Error('Cannot complete this battle.');}}),screen=createEndgameReviewScreen(root,{session});
 root.click('data-end-game');root.check(true);root.click('data-confirm-end-game');assert.equal(session.getState().battle.status,'active');assert.match(root.innerHTML,/role="alert">Cannot complete this battle/);screen.destroy();
});
test('real shell routes to review without advancing play and restores completed games into review',()=>{
 clearCommandHandlers();registerCoreCommandHandlers();
 for (const complete of [false,true]) {
  const initial=seed();if(complete){initial.phase='complete';initial.battle.status='complete';initial.timers.turnClock.running=false;}
  const session=createGameSession(initial),screen=fixture(),listeners=new Set();
  const root={innerHTML:'',replaceChildren(){},contains:()=>true,querySelector:s=>s==='[data-battle-screen]'?screen:null,addEventListener(t,f){if(t==='click')listeners.add(f);},removeEventListener(t,f){listeners.delete(f);}};
  let movementMounts=0;
  const shell=createBattleShell(root,{session,screenFactories:{movement:()=>{movementMounts++;return {destroy(){}};},review:createEndgameReviewScreen}});
  try{
   if(!complete){const button={getAttribute:n=>n==='data-battle-phase-button'?'review':null};for(const fn of listeners)fn({target:{closest:s=>s==='[data-battle-phase-button]'?button:null}});}
   assert.match(screen.innerHTML,complete?/Endgame review/:/Game so far/);assert.equal(session.getState(),initial);assert.match(root.innerHTML,/is-review-view/);
   if(!complete){for(const fn of listeners)fn({target:{closest:s=>s==='[data-return-current-phase]'?{}:null}});assert.equal(movementMounts,2);assert.equal(session.getState(),initial);}
  }finally{shell.destroy();}
 }
});
test('review refreshes with saved scoring corrections and keeps the requested perspective',()=>{
 const root=fixture(),session=createGameSession(seed()),screen=createEndgameReviewScreen(root,{session,perspectivePlayerId:'p2'});
 assert.match(root.innerHTML,/Lessons to consider · Opponent/);
 session.replaceState({...session.getState(),victoryPoints:{p1:10,p2:10}});
 assert.match(root.innerHTML,/Recorded score is tied/);screen.destroy();
});
