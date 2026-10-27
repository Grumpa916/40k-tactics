import test from 'node:test';
import assert from 'node:assert/strict';
import {getEndgameReview} from '../../src/rules/endgame-review.js';
import {getEndgameEvidence} from '../../src/rules/endgame-evidence.js';
import {recordChargeOutcome} from '../../src/engine/charge-transitions.js';
import {ADEPTUS_CUSTODES_DATASHEET_DETAILS as catalog} from '../../src/data/adeptus-custodes-datasheet-details.js';
const seed=()=>({phase:'charge',activePlayer:'p1',turn:3,battle:{status:'active',round:2,activePlayerId:'p1'},
 players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],victoryPoints:{p1:0,p2:0},history:[],
 units:[{id:'a',name:'Guard',ownerId:'p1',status:'deployed'},{id:'b',name:'Enemy',ownerId:'p2',status:'deployed'},
 {id:'leader',name:'Leader',ownerId:'p1',status:'deployed'},{id:'enemy-leader',name:'Enemy leader',ownerId:'p2',status:'deployed'}]});
const attack=(p={})=>({type:'combat.attack_resolved',payload:{round:2,turn:3,phase:'fight',attackerId:'a',targetId:'b',actualDamage:4,expectedDamage:5,...p}});
const charge=(p={})=>({type:'charge.outcome_recorded',payload:{unitId:'a',round:2,turn:3,outcome:'successful',targetIds:['b'],measuredDistances:{b:9},...p}});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('charge records farthest-target probability without changing inputs or spending resources',()=>{
 const s=seed();s.commandPoints={p1:3};const before=JSON.stringify(s);
 const next=recordChargeOutcome(s,{unitId:'a',succeeded:false,targetIds:['b','enemy-leader'],measuredDistances:{b:6,'enemy-leader':9}});
 const snapshot=next.history.at(-1).payload.reviewSnapshot;
 close(snapshot.baseProbability,10/36);close(snapshot.successProbability,10/36);
 assert.equal(snapshot.measuredDistance,9);assert.equal(snapshot.rerollAvailable,false);
 assert.equal(JSON.stringify(s),before);assert.deepEqual(next.commandPoints,s.commandPoints);
 const lesson=getEndgameReview(next).lessons.find(l=>l.kind==='Charge planning');assert.ok(lesson);assert.deepEqual(lesson.eventIndices,[0]);
});

test('saved Swift Onslaught probability survives final roster changes and JSON persistence',()=>{
 const s=seed(),id='adeptus-custodes:blade-champion';
 s.units[0].metadata={rosterUnitId:'r1'};s.armyRosters={p1:{faction:'Adeptus Custodes',units:[{id:'r1',datasheetId:id,datasheet:catalog[id],modelCount:1}]}};
 const next=recordChargeOutcome(s,{unitId:'a',succeeded:true,targetIds:['b'],measuredDistances:{b:8}});
 const snapshot=next.history.at(-1).payload.reviewSnapshot;
 assert.equal(snapshot.rerollRule,'Swift Onslaught');close(snapshot.successProbability,1-(21/36)**2);
 delete next.armyRosters;next.units[0].status='destroyed';
 const c=getEndgameEvidence(JSON.parse(JSON.stringify(next))).charges[0];
 close(c.probability,snapshot.successProbability);assert.equal(c.rerollAvailable,true);
 assert.equal(getEndgameReview(next).lessons.some(l=>l.kind==='Charge planning'),false);
});

test('legacy and malformed charge snapshots never invent odds or failure from a decline',()=>{
 const s=seed();s.history=[charge(),charge({outcome:'declined'}),charge({reviewSnapshot:{version:1,successProbability:2,baseProbability:0.5,measuredDistance:9}})];
 const e=getEndgameEvidence(s);assert.equal(e.charges.length,2);assert.equal(e.charges[0].measuredDistance,9);
 assert.ok(e.charges.every(c=>c.probability===null));assert.equal(getEndgameReview(s).lessons.length,0);
});

test('charge follow-through matches later attacks by formation into declared targets in the same turn',()=>{
 const s=seed();s.history=[attack(),charge(),attack({sourceAttackerId:'leader',allocationTargetId:'enemy-leader',actualDamage:3}),
 attack({turn:4}),attack({round:3}),attack({phase:'shooting'}),attack({targetId:'other'}),attack({attackerId:'other'})];
 const c=getEndgameEvidence(s).charges[0];assert.equal(c.followUpAttacks,1);assert.equal(c.followUpDamage,3);
 s.history=[charge({round:undefined,turn:undefined}),attack({round:undefined,turn:undefined})];
 assert.equal(getEndgameEvidence(s).charges[0].followUpAttacks,0);
});

test('round comparisons use matched values and preserve unknown damage and unrecorded scores',()=>{
 const s=seed();s.history=[attack({actualDamage:null}),attack({actualDamage:8,expectedDamage:null}),attack(),
 attack({round:3,attackerId:'b',targetId:'a',stateDelta:{target:{unitId:'a',woundsBefore:4,woundsAfter:0,statusBefore:'deployed',statusAfter:'destroyed'}}})];
 const e=getEndgameEvidence(s),p=e.rounds[0].players[0];
 assert.equal(p.damage,12);assert.equal(p.comparisons,1);assert.equal(p.actual,4);assert.equal(p.expected,5);assert.equal(p.score,null);
 assert.deepEqual(e.rounds[1].players[0].lost,['Guard']);assert.equal(e.rounds[1].players[0].damage,null);
 assert.equal(e.rounds[1].players[1].damage,4);
});

test('excess-damage coaching requires known enemy ownership and saved remaining wounds',()=>{
 const s=seed();const delta={target:{unitId:'b',woundsBefore:2,woundsAfter:0,statusBefore:'deployed',statusAfter:'destroyed'}};
 s.history=[attack({actualDamage:7,stateDelta:delta})];
 assert.equal(getEndgameReview(s).evidence.attacks[0].excess,5);
 assert.match(getEndgameReview(s).lessons[0].evidence,/5 entered damage/);
 assert.equal(getEndgameReview(s,{playerId:'p2'}).lessons.length,0);
 s.units[1].ownerId=null;assert.equal(getEndgameReview(s).lessons.some(l=>l.kind==='Attack allocation'),false);
 s.history=[attack({actualDamage:7})];assert.equal(getEndgameReview(s).evidence.attacks[0].excess,0);
});

test('only explicit failed mission actions generate coaching; unreviewed remains unknown',()=>{
 const s=seed();s.history=[{type:'shooting.unit_activated',payload:{unitId:'a',round:2,turn:3,missionInstanceId:'m',missionName:'Cleanse'}}];
 assert.equal(getEndgameReview(s).lessons.length,0);assert.equal(getEndgameEvidence(s).actions[0].outcome,'unreviewed');
 s.history.push({type:'mission_action.reviewed',payload:{actionKey:'2:3:a',outcome:'failed'}});
 assert.equal(getEndgameReview(s).lessons[0].kind,'Mission action follow-through');assert.equal(getEndgameEvidence(s).actions[0].mission,'Cleanse');
 assert.equal(getEndgameReview(s).players[0].total,0);
});

test('corrected awards flow into deeper round summaries and final map cannot change evidence',()=>{
 const s=seed();s.history=[{id:'award',type:'victory_points.awarded',payload:{playerId:'p1',round:2,amount:5,category:'primary'}},
 {type:'victory_points.award_undone',payload:{originalAwardEventId:'award'}},attack()];
 const before=JSON.stringify(s),r=getEndgameReview(s);
 assert.equal(r.evidence.rounds[0].players[0].score,null);assert.equal(JSON.stringify(s),before);
 s.units[0].position={x:100,y:100};s.units[1].wounds=0;
 assert.deepEqual(getEndgameReview(s).evidence,r.evidence);
 assert.deepEqual(getEndgameReview({}).evidence,{attacks:[],charges:[],actions:[],rounds:[]});
});
