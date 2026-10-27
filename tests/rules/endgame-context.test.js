import test from 'node:test';
import assert from 'node:assert/strict';
import {getEndgameContext} from '../../src/rules/endgame-context.js';
import {getReviewContextSnapshot,getAttackReviewSnapshot} from '../../src/rules/review-context-snapshot.js';
import {getEndgameReview} from '../../src/rules/endgame-review.js';
import {recordObjectiveControl,changePhase} from '../../src/engine/state-transitions.js';
import {adjustLiveMapPosition} from '../../src/engine/battlefield-map-transitions.js';
import {recordVictoryPointsAward} from '../../src/engine/victory-points-ledger.js';
import {renderEndgameReview} from '../../src/ui/endgame-review-screen.js';
const seed=()=>({phase:'movement',turn:3,activePlayer:'p1',battle:{status:'active',round:2},players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],history:[],victoryPoints:{p1:0,p2:0},units:[{id:'a',name:'Guard',ownerId:'p1',status:'deployed',position:{x:10,y:10},wounds:5}],objectives:[{id:'o',control:{controlState:'uncontrolled'}}]});

test('objective records preserve old/new control and timing; scoring snapshot is detached',()=>{
 const s=seed(),before=JSON.stringify(s);
 let next=recordObjectiveControl(s,{objectiveId:'o',controllerId:'p1',controlState:'controlled'});
 const p=next.history.at(-1).payload;assert.equal(p.phase,'movement');assert.equal(p.round,2);assert.equal(p.turn,3);assert.equal(p.previousControl.controlState,'uncontrolled');
 next=recordVictoryPointsAward(next,{playerId:'p1',amount:5,category:'primary',reason:'Verified'});
 const snapshot=next.history.at(-1).payload.reviewSnapshot;
 next.units[0].position.x=22;next.objectives[0].controlRecordedAt.phase='fight';
 assert.equal(snapshot.units[0].position.x,10);assert.equal(snapshot.objectives[0].confirmedAt.phase,'movement');
 // No nested object in the original state was changed by capturing snapshots.
 s.units[0].position.x=10;assert.equal(JSON.stringify(s),before);
});

test('phase ending saves previous phase and positions, and a map correction records one drop',()=>{
 const s=seed(),next=changePhase(s,{phase:'shooting'}),p=next.history.at(-1).payload;
 assert.equal(p.reviewSnapshot.phase,'movement');assert.equal(p.previousPhase,'movement');
 const moved=adjustLiveMapPosition(s,{unitId:'a',playerId:'p1',moves:[{modelId:'a',position:{x:12,y:13}}]});
 assert.equal(moved.history.length,1);assert.deepEqual(moved.history[0].payload.moves[0].from,{x:10,y:10});
 assert.equal(s.units[0].position.x,10);assert.equal(moved.history[0].payload.phase,'movement');
 assert.equal(getEndgameContext(moved).positions[0].kind,'Map correction');
});

test('effective manual losses use stable undo references and remain separate from combat kills',()=>{
 const s=seed();s.history=[{id:'death',type:'unit.casualty_recorded',payload:{unitId:'a',playerId:'p1',round:2,modelsBefore:1,modelsAfter:0,statusBefore:'deployed',statusAfter:'destroyed'}},
 {type:'unit.casualty_undone',payload:{unitId:'a',originalCasualtyEventId:'death',originalCasualtyEventIndex:99}},
 {type:'unit.casualty_recorded',payload:{unitId:'a',playerId:'p1',round:3,modelsBefore:2,modelsAfter:1,statusBefore:'deployed',statusAfter:'deployed'}}];
 const c=getEndgameContext(s);assert.equal(c.losses.length,1);assert.equal(c.losses[0].modelsLost,1);assert.equal(c.losses[0].attackerId,null);
 assert.equal(getEndgameReview(s).units[0].kills,0);
 s.history=[{type:'unit.casualty_recorded',payload:{unitId:'a',playerId:'p1',round:2,modelsBefore:1,modelsAfter:0,statusBefore:'deployed',statusAfter:'destroyed'}}];
 assert.deepEqual(getEndgameReview(s).evidence.rounds[0].players[0].lost,['Guard']);
 s.history.push({type:'unit.casualty_undone',payload:{unitId:'a'}});assert.equal(getEndgameContext(s).losses.length,0);
});

test('forecast retains destruction chance and contextual rules without a full distribution',()=>{
 const d={expectedDamage:4,outcomes:[{damage:0,probability:0.25},{damage:5,probability:0.75}],contextualAbilities:{appliedRules:['Shield'],halfRangeStatus:'uncertain'}};
 const snapshot=getAttackReviewSnapshot(d,{id:'b',wounds:5},'leader');
 assert.equal(snapshot.destructionProbability,0.75);assert.equal(snapshot.allocationTargetId,'leader');assert.equal(snapshot.outcomes,undefined);
 d.contextualAbilities.appliedRules.push('changed');assert.deepEqual(snapshot.context.appliedRules,['Shield']);
 assert.equal(getAttackReviewSnapshot(d,{id:'b',wounds:null}).destructionProbability,null);
});

test('resources distinguish spending, gains and corrections without inventing stratagem use',()=>{
 const s=seed();s.commandPoints={p1:2};s.history=[...[[1,'gain'],[-2,'spend'],[3,'adjustment']].map(([amount,reason])=>({type:'command_points.changed',payload:{playerId:'p1',amount,reason,round:2,note:'Table entry'}})),
 {type:'custodes.katah_expended',payload:{unitId:'a',playerId:'p1',katahName:'Dacatarai',round:2}},
 {type:'faction_ability.decision_recorded',payload:{playerId:'p1',decisionId:'shadow',choice:'use',choiceName:'Shadow in the Warp'}}];
 const c=getEndgameContext(s);assert.deepEqual(c.resourceTotals[0],{playerId:'p1',gained:1,spent:2,adjustments:3,recorded:3,balance:2});
 assert.equal(c.resources[3].reason,'Dacatarai');assert.equal(c.resources[4].note,'Shadow in the Warp');
 const html=renderEndgameReview(s);assert.match(html,/Resource utilization/);assert.match(html,/CP spending recorded/);
});

test('legacy saves render unknown context without replay; all added text is escaped',()=>{
 const s=seed();s.history=[{type:'objective.control_recorded',payload:{id:'<img>',controlState:'controlled',controllerId:'p1'}}];
 const before=JSON.stringify(s),c=getEndgameContext(s);assert.equal(c.objectives[0].round,null);assert.equal(c.snapshots.length,0);assert.equal(c.forecasts.length,0);
 assert.doesNotMatch(renderEndgameReview(s),/<img>/);assert.equal(JSON.stringify(s),before);
 const snapshot=getReviewContextSnapshot(s);s.units[0].position.x=23;assert.equal(snapshot.units[0].position.x,10);
 assert.deepEqual(getEndgameContext({}),{objectives:[],snapshots:[],positions:[],losses:[],resources:[],resourceTotals:[],forecasts:[]});
});
