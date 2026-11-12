import test from 'node:test';
import assert from 'node:assert/strict';
import {findArmyUnitCandidates} from '../../src/data/army-unit-catalog.js';
import {recordSpaceMarineStratagemUse,getSpaceMarineStratagemOpportunities,getSpaceMarineStratagemUses} from '../../src/engine/space-marine-stratagem-transitions.js';
import {SPACE_MARINES_STRATAGEM_CATALOG} from '../../src/data/space-marines-stratagems.js';
import {getCommandPointBalance} from '../../src/engine/command-points-ledger.js';
import {getActiveSpaceMarineUnitDoctrines} from '../../src/rules/space-marine-doctrines.js';

const byName=new Map(findArmyUnitCandidates({faction:'Space Marines'}).map(c=>[c.name,c]));
function state(name='Captain',detachment='Gladius Task Force',phase='shooting',cp=3){
 const candidate=byName.get(name);
 assert.ok(candidate,name);
 const saved={id:'roster-a',name,datasheetId:candidate.id,datasheet:candidate.datasheet,modelCount:candidate.defaultModelCount};
 const live={id:'a',name,ownerId:'p1',status:'deployed',metadata:{rosterUnitId:'roster-a',modelCount:candidate.defaultModelCount},
  position:{x:5,y:8}};
 return {battle:{status:'active',round:1,activePlayerId:'p1'},activePlayer:'p1',turn:1,phase,
 players:[{id:'p1'},{id:'p2'}],units:[live],commandPoints:{p1:cp,p2:3},history:[],
 armyRosters:{p1:{faction:'Space Marines',detachment,detachments:[detachment],units:[saved]},p2:{faction:'Tyranids',units:[]}}};
}
const get=(d,n)=>SPACE_MARINES_STRATAGEM_CATALOG.find(x=>x.detachment===d&&x.name===n);

test('legal Gladius Stratagem in shooting costs 1 CP and records a durable phase event',()=>{
 let s=state();
 const def=get('Gladius Task Force','Storm of Devastation');
 assert.ok(getSpaceMarineStratagemOpportunities(s,{playerId:'p1',unitId:'a'}).some(x=>x.id===def.id&&x.available));
 s=recordSpaceMarineStratagemUse(s,{playerId:'p1',unitId:'a',stratagemId:def.id,
    timingConfirmed:true,targetConfirmed:true});
 assert.equal(getCommandPointBalance(s,'p1'),2);
 assert.equal(getSpaceMarineStratagemUses(s,'p1').length,1);
 assert.equal(s.history.filter(e=>e.type==='command_points.changed').length,1);
 assert.throws(()=>recordSpaceMarineStratagemUse(s,{playerId:'p1',unitId:'a',stratagemId:def.id,
    timingConfirmed:true,targetConfirmed:true}),/Already used|already received/);
});

test('No CP is deducted for unconfirmed trigger, wrong phase, wrong owner or insufficient CP',()=>{
 const s=state();
 const def=get('Gladius Task Force','Storm of Devastation');
 assert.throws(()=>recordSpaceMarineStratagemUse(s,{playerId:'p1',unitId:'a',stratagemId:def.id}),/Confirm/);
 assert.equal(getCommandPointBalance(s,'p1'),3);
 assert.throws(()=>recordSpaceMarineStratagemUse({...s,phase:'fight'},{playerId:'p1',unitId:'a',
  stratagemId:def.id,timingConfirmed:true,targetConfirmed:true}),/unavailable/);
 assert.throws(()=>recordSpaceMarineStratagemUse(s,{playerId:'p2',unitId:'a',
  stratagemId:def.id,timingConfirmed:true,targetConfirmed:true}),/unavailable/);
 assert.throws(()=>recordSpaceMarineStratagemUse({...s,commandPoints:{p1:0,p2:3}},{playerId:'p1',unitId:'a',
  stratagemId:def.id,timingConfirmed:true,targetConfirmed:true}),/Not enough CP/);
});

test('Adaptive Strategy spends CP and records a unit-specific Doctrine in Command',()=>{
 let s=state('Captain','Gladius Task Force','command');
 const def=get('Gladius Task Force','Adaptive Strategy');
 s=recordSpaceMarineStratagemUse(s,{playerId:'p1',unitId:'a',stratagemId:def.id,
  timingConfirmed:true,targetConfirmed:true,doctrine:'tactical'});
 assert.equal(getCommandPointBalance(s,'p1'),2);
 assert.deepEqual(getActiveSpaceMarineUnitDoctrines(s,'a'),['tactical']);
 assert.equal(s.history.filter(e=>e.type==='space_marines.doctrine_selected').length,1);
 assert.equal(s.history.filter(e=>e.type==='space_marines.stratagem_used').length,1);
});

test('Opponent turn defensive stratagem belongs to defender and must be confirmed',()=>{
 let s=state('Captain','Gladius Task Force','shooting',2);
 s.activePlayer='p2';s.battle.activePlayerId='p2';
 const def=get('Gladius Task Force','Armour of Contempt');
 const available=getSpaceMarineStratagemOpportunities(s,{playerId:'p1',unitId:'a'}).find(x=>x.id===def.id);
 assert.ok(available.available);
 s=recordSpaceMarineStratagemUse(s,{playerId:'p1',unitId:'a',stratagemId:def.id,
    timingConfirmed:true,targetConfirmed:true});
 assert.equal(getCommandPointBalance(s,'p1'),1);
});

test('Detachment and unit keyword filtering prevent unavailable stratagem choices',()=>{
 const s=state('Intercessor Squad','Terminator Storm Force','shooting');
 const def=get('Terminator Storm Force','Merciless Veterans');
 const chosen=getSpaceMarineStratagemOpportunities(s,{playerId:'p1',unitId:'a'}).find(x=>x.id===def.id);
 assert.equal(chosen.available,false);
 assert.match(chosen.reason,/keywords/);
 const different=get('Gladius Task Force','Storm of Devastation');
 assert.equal(getSpaceMarineStratagemOpportunities(s,{playerId:'p1',unitId:'a'}).some(x=>x.id===different.id),false);
});

test('2CP Terminator defensive stratagem correctly enforces cost',()=>{
 let s=state('Terminator Squad','Terminator Storm Force','fight',2);
 s.activePlayer='p2';s.battle.activePlayerId='p2';
 const def=get('Terminator Storm Force','Tactical Dreadnought Fortitude');
 s=recordSpaceMarineStratagemUse(s,{playerId:'p1',unitId:'a',stratagemId:def.id,timingConfirmed:true,targetConfirmed:true});
 assert.equal(getCommandPointBalance(s,'p1'),0);
 assert.equal(getSpaceMarineStratagemUses(s,'p1')[0].cpSpent,2);
});
