import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGameState } from '../../src/state/game-state.js';
import { changePhase } from '../../src/engine/state-transitions.js';
import { getCommandPhaseExitBlocker } from '../../src/rules/command-phase-readiness.js';
import { getPhaseProgressionAction, renderPhaseProgressionPanel } from '../../src/ui/phase-progression-panel.js';

function commandState(){
  const state=createGameState({
    phase:'command',turn:1,activePlayer:'p1',
    battle:{id:'command-footer',status:'active',round:1,firstPlayerId:'p1',activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}]
  });
  return {...state,scoring:{...(state.scoring??{}),
    secondaryMissionModeByPlayer:{p1:'tactical'},
    secondaryMissions:[]}};
}
const card=(playerId,number,status='active',{round=1,turn=1,isRedrawReplacement=false}={})=>({
  instanceId:playerId+'-card-'+number,playerId,
  definitionId:'secondary-test-'+number,status,drawnRound:round,drawnTurn:turn,
  ...(isRedrawReplacement ? {isRedrawReplacement:true} : {})
});
function withCards(state,cards){
  return {...state,scoring:{...state.scoring,secondaryMissions:cards}};
}
function assertBlocked(state,reason){
  const before=JSON.stringify(state);
  const action=getPhaseProgressionAction(state);
  assert.equal(action.disabled,true);
  assert.match(action.blockedReason,reason);
  const html=renderPhaseProgressionPanel(state,'command');
  assert.match(html,/data-phase-ready="false"/);
  assert.match(html,/<button type="button" disabled title="/);
  assert.doesNotMatch(html,/data-advance-game-phase/);
  assert.match(html,reason);
  assert.throws(()=>changePhase(state,{phase:'movement'}),reason);
  assert.equal(JSON.stringify(state),before,'rendering and validation cannot mutate the battle');
}
test('Command starts neutral and locked until two current Command Tactical draws recorded',()=>{
  const state=commandState();
  assertBlocked(state,/Record two new Tactical secondary cards/);
  assertBlocked(withCards(state,[card('p1',1)]),/Record two new Tactical secondary cards/);
  assertBlocked(withCards(state,[card('p1',1),card('p2',2)]),/Record two new Tactical secondary cards/);
  assertBlocked(withCards(state,[card('p1',1),card('p1',2,'returned-to-deck')]),/Record two new Tactical secondary cards/);
  const ready=withCards(state,[card('p1',1),card('p1',2)]);
  assert.equal(getCommandPhaseExitBlocker(ready),null);
  assert.equal(getPhaseProgressionAction(ready).disabled,undefined);
  assert.match(renderPhaseProgressionPanel(ready,'command'),/data-phase-ready="true"/);
  assert.match(renderPhaseProgressionPanel(ready,'command'),/<button type="button" data-advance-game-phase /);
  assert.equal(changePhase(ready,{phase:'movement'}).phase,'movement');
});

test('Older active cards cannot unlock a later opponent Command phase',()=>{
  const base=commandState();
  const state={...base,turn:4,activePlayer:'p2',
    battle:{...base.battle,round:2,activePlayerId:'p2'},
    scoring:{...base.scoring,secondaryMissionModeByPlayer:{p1:'tactical',p2:'tactical'}}};
  const carriedOver=[
    card('p2',1,'active',{round:1,turn:2}),
    card('p2',2,'active',{round:1,turn:2})
  ];
  assertBlocked(withCards(state,carriedOver),/Record two new Tactical secondary cards/);
  const newCard=card('p2',3,'active',{round:2,turn:4});
  assertBlocked(withCards(state,[...carriedOver,newCard]),/Record two new Tactical secondary cards/);
  assertBlocked(withCards(state,[...carriedOver,newCard,card('p1',4,'active',{round:2,turn:4})]),
    /Record two new Tactical secondary cards/,'Other player draws must not count');
  assertBlocked(withCards(state,[...carriedOver,newCard,card('p2',5,'active',{round:2,turn:3})]),
    /Record two new Tactical secondary cards/,'Earlier-turn draws in the same round must not count');
  const ready=withCards(state,[...carriedOver,newCard,card('p2',6,'active',{round:2,turn:4})]);
  assert.equal(getCommandPhaseExitBlocker(ready),null);
  assert.equal(getPhaseProgressionAction(ready).disabled,undefined);
  assert.equal(changePhase(ready,{phase:'movement'}).phase,'movement');
});

test('Returned cards and New Orders replacements do not count as normal Command draws',()=>{
  const state=commandState();
  const first=card('p1',1);
  const returned=card('p1',2,'returned-to-deck');
  const extraRedraw=card('p1',3,'active',{isRedrawReplacement:true});
  assertBlocked(withCards(state,[first,returned]),/Record two new Tactical secondary cards/);
  assertBlocked(withCards(state,[first,extraRedraw]),/Record two new Tactical secondary cards/);
  const ready=withCards(state,[first,returned,extraRedraw,card('p1',4)]);
  assert.equal(getCommandPhaseExitBlocker(ready),null);
});

test('pending New Orders or When Drawn card choices keep the footer neutral even with two cards',()=>{
  const ready=withCards(commandState(),[card('p1',1),card('p1',2)]);
  const add=(key,value)=>({...ready,scoring:{...ready.scoring,[key]:{p1:value}}});
  assertBlocked(add('secondaryMissionRedrawPendingByPlayer',{round:1,turn:1}),/New Orders replacement/);
  assertBlocked(add('secondaryMissionCardChoicePendingByPlayer',{choiceType:'beacon'}),/Resolve the beacon choice/);
  assertBlocked(add('secondaryMissionRuleReplacementPendingByPlayer',{stage:'return'}),/Return Defend Stronghold/);
  assertBlocked(add('secondaryMissionRuleReplacementPendingByPlayer',{stage:'draw'}),/replacement Tactical card/);
  const oldRedraw=add('secondaryMissionRedrawPendingByPlayer',{round:0,turn:0});
  assert.equal(getCommandPhaseExitBlocker(oldRedraw),null,'old turn pending does not block current Command');
});

test('Fixed secondary mode does not require two Tactical cards, and viewing another phase offers Return',()=>{
  const ready={...commandState(),scoring:{secondaryMissionModeByPlayer:{p1:'fixed'},secondaryMissions:[]}};
  assert.equal(getPhaseProgressionAction(ready).disabled,undefined);
  assert.match(renderPhaseProgressionPanel(ready,'command'),/data-phase-ready="true"/);
  const blocked=commandState();
  const preview=renderPhaseProgressionPanel(blocked,'fight');
  assert.match(preview,/data-return-current-phase/);
  assert.doesNotMatch(preview,/<button type="button" disabled/);
  assert.doesNotMatch(preview,/Record two new Tactical secondary cards/);
});

test('Landscape Command footer has disabled dark-phase styling and an enabled green highlight',()=>{
  const css=readFileSync(new URL('../../src/ui/styles/prototype-workspace.css',import.meta.url),'utf8');
  const section=css.slice(css.lastIndexOf('/* Command starts neutral.'));
  assert.match(section,/\.battle-phase-progress button:disabled\s*\{[\s\S]*?background:#233037;/);
  assert.match(section,/\.battle-phase-progress button:not\(:disabled\)\s*\{[\s\S]*?background:#c4e99b;/);
});
