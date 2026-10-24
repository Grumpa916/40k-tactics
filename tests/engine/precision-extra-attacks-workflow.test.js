import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveUnitAttack } from '../../src/engine/combat-transitions.js';
import { getPrecisionAllocationOptions } from '../../src/rules/precision-allocation.js';
import { getUnitDestructionsForTurn } from '../../src/rules/scoring-evidence-state.js';

const precisionClaws = {
  id:'precision-claws', name:'Precision claws', type:'melee',
  sourceUnitId:'attacker',
  characteristics:{ attacks:4, skill:3, strength:6, ap:-2, damage:2, precision:true, extraAttacks:true }
};

function attachedFightState() {
  return {
    phase:'fight', turn:1, activePlayer:'p1',
    battle:{id:'b',status:'active',round:1,activePlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    armyRosters:{
      p2:{units:[
        {id:'bg-roster',attachedLeaderIds:['leader-roster'],datasheet:{characteristics:{Toughness:5,Save:'3+',Wounds:10},weapons:[]}},
        {id:'leader-roster',attachedToBodyguardId:'bg-roster',datasheet:{characteristics:{Toughness:4,Save:'2+',Wounds:5},weapons:[]}}
      ]}
    },
    units:[
      {id:'attacker',name:'Attacker',ownerId:'p1',status:'deployed',wounds:10,position:{x:0,y:0},characteristics:{weaponSkill:3,toughness:5,save:3}},
      {id:'bodyguard',name:'Bodyguard',ownerId:'p2',status:'deployed',wounds:10,position:{x:1,y:0},metadata:{rosterUnitId:'bg-roster'}},
      {id:'leader',name:'Leader',ownerId:'p2',status:'deployed',wounds:5,position:{x:1,y:0},metadata:{rosterUnitId:'leader-roster'}}
    ],
    history:[{type:'fight.unit_activated',payload:{unitId:'attacker',actionType:'fight',round:1,turn:1}}]
  };
}

test('Precision allocation options expose attached Leaders without making them normal targets',()=>{
  const state=attachedFightState();
  assert.deepEqual(getPrecisionAllocationOptions(state,'bodyguard'),[
    {unitId:'leader',name:'Leader',ownerId:'p2'}
  ]);
  assert.deepEqual(getPrecisionAllocationOptions(state,'leader'),[]);
});

test('Precision keeps the formation root as target while applying actual damage to the selected Leader',()=>{
  const state=attachedFightState();
  const result=resolveUnitAttack(state,{attackerId:'attacker',targetId:'bodyguard',allocationTargetId:'leader',weapon:precisionClaws,actualDamage:2});
  assert.equal(result.units.find(unit=>unit.id==='bodyguard').wounds,10);
  assert.equal(result.units.find(unit=>unit.id==='leader').wounds,3);
  const event=result.history.at(-1);
  assert.equal(event.type,'combat.attack_resolved');
  assert.equal(event.payload.targetId,'bodyguard');
  assert.equal(event.payload.allocationTargetId,'leader');
  assert.equal(event.payload.allocationTargetName,'Leader');
  assert.equal(event.payload.stateDelta.target.unitId,'leader');
});

test('Precision Leader destruction is credited to the Leader for scoring evidence',()=>{
  const state=attachedFightState();
  const result=resolveUnitAttack(state,{attackerId:'attacker',targetId:'bodyguard',allocationTargetId:'leader',weapon:precisionClaws,actualDamage:5});
  assert.equal(result.units.find(unit=>unit.id==='bodyguard').status,'deployed');
  assert.equal(result.units.find(unit=>unit.id==='leader').status,'destroyed');
  assert.deepEqual(getUnitDestructionsForTurn(result,1),[
    {unitId:'leader',ownerId:'p2',source:'combat.attack_resolved',attackerId:'attacker',phase:'fight'}
  ]);
});

test('non-Precision weapons cannot allocate damage directly to an attached Leader',()=>{
  const state=attachedFightState();
  assert.throws(()=>resolveUnitAttack(state,{
    attackerId:'attacker',targetId:'bodyguard',allocationTargetId:'leader',
    weapon:{...precisionClaws,characteristics:{...precisionClaws.characteristics,precision:false}},actualDamage:1
  }),/Precision weapon/);
});

test('Extra Attacks remains a supplemental weapon flag alongside Precision',()=>{
  assert.equal(precisionClaws.characteristics.extraAttacks,true);
  assert.equal(precisionClaws.characteristics.precision,true);
});

test('Shooting and Fight UIs keep Precision allocation conditional and pass it through attacks',()=>{
  const shooting=fs.readFileSync(new URL('../../src/ui/shooting-screen.js',import.meta.url),'utf8');
  const fight=fs.readFileSync(new URL('../../src/ui/fight-tabletop-screen.js',import.meta.url),'utf8');
  assert.match(shooting,/getPrecisionAllocationOptions/);
  assert.match(shooting,/data-shoot-precision/);
  assert.match(shooting,/allocationTargetId: precisionAllocationId/);
  assert.match(fight,/data-fight-precision/);
  assert.match(fight,/allocationTargetId: precisionAllocationId/);
  assert.match(fight,/Extra Attacks:/);
});
