import test from 'node:test';
import assert from 'node:assert/strict';
import { getEndgameReview } from '../../src/rules/endgame-review.js';
import { recordVictoryPointsAward, adjustVictoryPoints, undoLatestVictoryPointsAward } from '../../src/engine/victory-points-ledger.js';
const seed=()=>({battle:{round:2,status:'active'},turn:3,players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],victoryPoints:{p1:0,p2:0},units:[{id:'a',ownerId:'p1',name:'Attacker'},{id:'leader',ownerId:'p1',name:'Leader'},{id:'b',ownerId:'p2',name:'Bodyguard'},{id:'target-leader',ownerId:'p2',name:'Enemy leader'}],history:[]});
const attack=(extra={})=>({type:'combat.attack_resolved',payload:{attackerId:'a',targetId:'b',phase:'shooting',round:2,turn:3,actualDamage:4,expectedDamage:5,...extra}});

test('effective scoring excludes awards and adjustments undone by ID or index, with unallocated VP explicit',()=>{
 let state=recordVictoryPointsAward(seed(),{playerId:'p1',amount:5,category:'primary',reason:'Objective'});
 state=adjustVictoryPoints(state,{playerId:'p1',amount:2,reason:'Correction'});
 state=undoLatestVictoryPointsAward(state,{playerId:'p1'});
 state=recordVictoryPointsAward(state,{playerId:'p2',amount:8,category:'primary',reason:'Opponent objective'});
 const before=JSON.stringify(state), review=getEndgameReview(state);
 assert.equal(review.players[0].ledgerTotal,5);assert.equal(review.players[0].unallocated,0);
 assert.equal(review.scores.length,2);assert.equal(review.largestSwing.margin,-3);
 assert.equal(review.lessons[0].kind,'Possible improvement');assert.equal(JSON.stringify(state),before);
 const legacy=seed();legacy.victoryPoints.p1=12;legacy.history=[{type:'victory_points.awarded',payload:{playerId:'p1',amount:5,round:1}},{type:'victory_points.award_undone',payload:{originalAwardEventIndex:0}}];
 assert.equal(getEndgameReview(legacy).players[0].unallocated,12);
 assert.equal(getEndgameReview(legacy).lessons.length,0);
});

test('setup, missing rounds and manual negative adjustments remain separate from Primary and Secondary',()=>{
 const s=seed();s.history=[{type:'victory_points.awarded',payload:{playerId:'p1',amount:10,round:0,reason:'Battle ready'}},{type:'victory_points.adjusted',payload:{playerId:'p1',amount:-2,round:2}},{type:'victory_points.awarded',payload:{playerId:'p1',amount:3,category:'secondary'}}];s.victoryPoints.p1=11;
 const r=getEndgameReview(s);assert.equal(r.players[0].categories.other,10);assert.equal(r.players[0].categories.adjustment,-2);assert.equal(r.players[0].categories.secondary,3);assert.deepEqual(r.rounds.map(x=>x.round),[0,2,null]);assert.equal(r.largestSwing,null);
});

test('leader source, Precision recipient, Fight damage, kills and raw overkill are attributed accurately',()=>{
 const s=seed();s.history=[attack({sourceAttackerId:'leader',allocationTargetId:'target-leader',actualDamage:9,phase:'fight',stateDelta:{target:{unitId:'target-leader',woundsBefore:3,woundsAfter:0,statusBefore:'deployed',statusAfter:'destroyed'}}})];
 const r=getEndgameReview(s),leader=r.units.find(u=>u.id==='leader'),target=r.units.find(u=>u.id==='target-leader');
 assert.equal(leader.recordedDamage,9);assert.equal(leader.woundsRemoved,3);assert.equal(leader.kills,1);assert.equal(target.damageReceived,9);assert.equal(r.units.find(u=>u.id==='b').damageReceived,0);assert.match(r.moments[0].text,/Enemy leader.*Leader.*fight/);
});

test('missing expected or actual values do not become zero; comparisons use matched attacks only',()=>{
 const s=seed();s.history=[attack(),attack({actualDamage:10,expectedDamage:null}),attack({actualDamage:null}),attack({actualDamage:0,expectedDamage:0})];
 const r=getEndgameReview(s),u=r.units[0];assert.equal(r.coverage.attacks,4);assert.equal(r.coverage.comparisons,2);assert.equal(u.comparableDamage,4);assert.equal(u.expectedDamage,5);assert.equal(u.recordedDamage,14);
 assert.ok(r.evidenceGaps.some(g=>g.includes('2 of 4')));
});

test('declines are not failed charges and completed actions are not inferred from attempts',()=>{
 const s=seed();s.history=[...['declined','successful','failed'].map(outcome=>({type:'charge.outcome_recorded',payload:{unitId:'a',outcome}})),{type:'shooting.unit_activated',payload:{unitId:'a',missionInstanceId:'card',round:2,turn:3}},{type:'shooting.unit_activated',payload:{unitId:'leader',missionInstanceId:'card',round:2,turn:3}},{type:'mission_action.reviewed',payload:{actionKey:'2:3:a',outcome:'completed'}}];
 const r=getEndgameReview(s),u=r.units[0];assert.equal(u.charges,2);assert.equal(u.failedCharges,1);assert.equal(u.actions,1);assert.equal(u.completedActions,1);assert.equal(r.units[1].completedActions,0);
 assert.ok(r.lessons.some(l=>l.kind==='Contribution to recognise'));
});

test('old sparse saves stay honest, serializable, and reviews recompute after corrections',()=>{
 const r=getEndgameReview({players:[{id:'p1'}]});assert.equal(r.players[0].total,null);assert.equal(r.lessons.length,0);assert.equal(r.complete,false);
 const s=seed();s.history=[attack({actualDamage:1,expectedDamage:10})];assert.equal(getEndgameReview(s).lessons.length,1);
 s.history=[];assert.equal(getEndgameReview(s).lessons.length,0);assert.deepEqual(getEndgameReview(JSON.parse(JSON.stringify(s))),getEndgameReview(s));
});
