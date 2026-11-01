import test from 'node:test';
import assert from 'node:assert/strict';
import { getChargeSuccessProbability, getChargeOpportunity, getChargeTargetPriorities } from '../../src/rules/tactical-charge-opportunity.js';
import { getTacticalCombatRecommendations } from '../../src/rules/tactical-combat-recommendations.js';
import { getFightOpportunityRecommendations } from '../../src/rules/tactical-fight-opportunities.js';

function unit(id, ownerId, x, y, rosterUnitId, objectiveControl) {
  return {
    id,
    name:id,
    ownerId,
    status:'deployed',
    wounds:10,
    maxWounds:10,
    position:{x,y},
    characteristics:{ objectiveControl, toughness:5, save:3, weaponSkill:3 },
    metadata:{ rosterUnitId }
  };
}

function datasheet(name, objectiveControl, damage = 2) {
  return {
    name,
    characteristics:{ Toughness:'5', Save:'3+', Wounds:'10', 'Objective Control':String(objectiveControl) },
    weapons:[{
      name:name + ' melee',
      type:'melee',
      range:'Melee',
      attacks:4,
      skill:'3+',
      strength:6,
      ap:-2,
      damage
    }]
  };
}

function strategicState(phase = 'charge') {
  const attacker=unit('attacker','p1',0,0,'ra',2);
  const support=unit('support','p1',7,0,'rs',3);
  const key=unit('key','p2',7,0,'rk',4);
  const low=unit('low','p2',7,12,'rl',1);
  return {
    phase,
    turn:1,
    activePlayer:'p1',
    battle:{ id:'b', status:'active', round:4, activePlayerId:'p1', firstPlayerId:'p1' },
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    victoryPoints:{p1:18,p2:28},
    commandPoints:{p1:2,p2:2},
    units:[attacker,support,key,low],
    objectives:[{
      id:'center',
      position:{x:7,y:0},
      control:{ controlState:'controlled', controllerId:'p2', contestingPlayerIds:[] }
    }],
    armyRosters:{
      p1:{ faction:'Test', units:[
        {id:'ra',datasheet:datasheet('Attacker',2,2),equippedWeapons:[{name:'Attacker melee',quantity:1}]},
        {id:'rs',datasheet:datasheet('Support',3,1),equippedWeapons:[{name:'Support melee',quantity:1}]}
      ]},
      p2:{ faction:'Test', units:[
        {id:'rk',datasheet:datasheet('Key',4,2),equippedWeapons:[{name:'Key melee',quantity:1}]},
        {id:'rl',datasheet:datasheet('Low',1,2),equippedWeapons:[{name:'Low melee',quantity:1}]}
      ]}
    },
    history:[]
  };
}

test('measured charge distance converts to exact unmodified 2D6 probability',()=>{
  assert.equal(getChargeSuccessProbability(2),1);
  assert.ok(Math.abs(getChargeSuccessProbability(7)-21/36)<1e-12);
  assert.ok(Math.abs(getChargeSuccessProbability(9)-10/36)<1e-12);
  assert.ok(Math.abs(getChargeSuccessProbability(12)-1/36)<1e-12);
  assert.equal(getChargeSuccessProbability(13),0);
});

test('Charge Advisor combines measured chance, saved melee projection and strategic target value',()=>{
  const state=strategicState('charge');
  const advice=getChargeOpportunity(state,{
    playerId:'p1',attackerId:'attacker',targetUnitId:'key',measuredDistance:7,mapDistance:6
  });
  assert.ok(Math.abs(advice.successProbability-21/36)<1e-12);
  assert.equal(advice.probabilityBasis,'measured');
  assert.equal(advice.projectedFight.available,true);
  assert.ok(advice.projectedFight.expectedDamage>0);
  assert.ok(advice.strategicContext.score>0);
  assert.equal(advice.strategicContext.objectiveSwing.objectiveId,'center');
  assert.match(advice.recommendation,/charge|Fight|objective/i);

  const candidates=getTacticalCombatRecommendations(state,{playerId:'p1'}).charge;
  const key=candidates.find(item=>item.unitId==='attacker'&&item.targetUnitId==='key');
  assert.ok(key);
  assert.ok(key.projectedFight?.available);
  assert.ok(key.strategicContext?.score>0);
  assert.ok(Number.isFinite(key.decisionScore));
});

test('Charge Advisor ranks the top target priorities for a selected charger',()=>{
  const state=strategicState('charge');
  const priorities=getChargeTargetPriorities(state,{
    playerId:'p1',
    attackerId:'attacker',
    targets:[
      {targetUnitId:'low',name:'Low target',targetDistance:7},
      {targetUnitId:'key',name:'Key target',targetDistance:7}
    ],
    limit:3
  });
  assert.equal(priorities.length,2);
  assert.equal(priorities[0].rank,1);
  assert.equal(priorities[0].advice.targetUnitId,'key');
  assert.ok(priorities[0].advice.decisionScore>priorities[1].advice.decisionScore);
  assert.ok(Number.isFinite(priorities[0].advice.mapSuccessProbability));

  const measured=getChargeTargetPriorities(state,{
    playerId:'p1',
    attackerId:'attacker',
    targets:[
      {targetUnitId:'low',name:'Low target',targetDistance:7},
      {targetUnitId:'key',name:'Key target',targetDistance:7}
    ],
    measuredDistances:{key:9},
    limit:1
  });
  assert.equal(measured.length,1);
  assert.equal(measured[0].advice.measuredDistance,9);
  assert.equal(measured[0].advice.probabilityBasis,'measured');
});

test('Fight Advisor ranks strategic scoring target above equal raw combat target',()=>{
  const state=strategicState('fight');
  const weapon={id:'test-blade',name:'Test blade',type:'melee',characteristics:{attacks:4,skill:3,strength:6,ap:-2,damage:2}};
  const recommendations=getFightOpportunityRecommendations(state,{
    playerId:'p1',
    options:[
      {unitId:'attacker',targetUnitId:'low',weapon,expectedDamage:3,retaliationExpectedDamage:1},
      {unitId:'attacker',targetUnitId:'key',weapon,expectedDamage:3,retaliationExpectedDamage:1}
    ]
  });
  assert.equal(recommendations.length,2);
  assert.equal(recommendations[0].targetUnitId,'key');
  assert.ok(recommendations[0].strategicScore>recommendations[1].strategicScore);
  assert.ok(recommendations[0].decisionScore>recommendations[1].decisionScore);
  assert.match(recommendations[0].recommendation,/mission|objective|Priority Fight/i);
});
