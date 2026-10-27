import test from "node:test";
import assert from "node:assert/strict";
import { getPrimaryStrategyContext, getPrimaryObjectiveStrategySignal } from "../../src/rules/tactical-primary-strategy.js";
import { getTargetStrategicContext } from "../../src/rules/tactical-target-context.js";

function objective(id, controllerId) {
  return {
    id,
    name:id,
    position:{x:10,y:10},
    control:controllerId == null
      ? {controlState:"uncontrolled",controllerId:null,contestingPlayerIds:[]}
      : {controlState:"controlled",controllerId,contestingPlayerIds:[]}
  };
}

function unit(id, ownerId, x = 10, y = 10) {
  return {
    id, ownerId, name:id, status:"deployed", position:{x,y}, wounds:6,
    startingStrength:1,currentStrength:1,startingWounds:6,
    metadata:{rosterUnitId:id,modelCount:1},
    profile:{characteristics:{toughness:5,save:3,wounds:6,objectiveControl:2}}
  };
}

function destroyed(turn, unitId, ownerId) {
  return {type:"unit.destroyed",payload:{turn,unitId,ownerId}};
}

function snapshot(turn, controls) {
  return {
    turn,
    round:3,
    playerId:"p1",
    objectives:Object.freeze(controls.map(([id,controllerId]) => Object.freeze({
      id,
      control:controllerId == null
        ? {controlState:"uncontrolled",controllerId:null,contestingPlayerIds:[]}
        : {controlState:"controlled",controllerId,contestingPlayerIds:[]}
    }))),
    units:Object.freeze([])
  };
}

function state() {
  return {
    phase:"shooting",turn:3,activePlayer:"p1",
    battle:{status:"active",round:3,activePlayerId:"p1"},
    players:[{id:"p1",name:"You"},{id:"p2",name:"Opponent"}],
    battlefieldMap:{missionSetup:{myDisposition:"Purge the Foe",opponentDisposition:"Priority Assets",layout:"A"}},
    victoryPoints:{p1:20,p2:20},commandPoints:{p1:2,p2:2},
    objectives:[
      objective("myHome","p1"),objective("myExpansion","p1"),objective("centerA","p1"),
      objective("opponentExpansion","p2"),objective("opponentHome","p2"),objective("centerB",null)
    ],
    units:[unit("friendly","p1",10,10),unit("target","p2",12,10)],
    history:[destroyed(2,"lost-prosecutors","p1"),destroyed(3,"enemy-one","p2")],
    scoring:{turnSnapshots:[],secondaryMissions:[],secondaryMissionModeByPlayer:{p1:"tactical",p2:"tactical"}},
    armyRosters:{}
  };
}

function unstoppableState() {
  const s=state();
  s.battlefieldMap.missionSetup.opponentDisposition="Take and Hold";
  s.scoring.turnSnapshots=[snapshot(3,[
    ["myHome","p1"],
    ["myExpansion","p2"],
    ["centerA","p1"],
    ["opponentExpansion","p2"],
    ["opponentHome","p2"],
    ["centerB",null]
  ])];
  return s;
}

test("Destroyer's Wrath reports objective majority and remaining comparison kill", () => {
  const context=getPrimaryStrategyContext(state(),{playerId:"p1"});
  assert.equal(context.active,true);
  assert.equal(context.missionName,"Destroyer's Wrath");
  assert.equal(context.controlledObjectives,3);
  assert.equal(context.opponentControlledObjectives,2);
  assert.equal(context.majoritySatisfied,true);
  assert.equal(context.nonHomeControlled,2);
  assert.equal(context.enemyKillsThisTurn,1);
  assert.equal(context.friendlyLossesLastTurn,1);
  assert.equal(context.basicKillNeeded,0);
  assert.equal(context.comparisonKillsNeeded,1);
  assert.equal(context.nextKillVpLeverage,4);
  assert.equal(context.cappedRecordedVp,13);
  assert.match(context.reason,/Finishing another unit has elevated Primary value/);
});

test("Destroyer's Wrath applies the 15 VP cap when all recorded conditions are met", () => {
  const s=state();
  s.history.push(destroyed(3,"enemy-two","p2"));
  const context=getPrimaryStrategyContext(s,{playerId:"p1"});
  assert.equal(context.comparisonKillsNeeded,0);
  assert.equal(context.nextKillVpLeverage,0);
  assert.equal(context.rawRecordedVp,17);
  assert.equal(context.cappedRecordedVp,15);
});

test("Destroyer's Wrath highlights the first kill when none is recorded", () => {
  const s=state();
  s.history=s.history.filter((event)=>event.payload.turn!==3);
  const context=getPrimaryStrategyContext(s,{playerId:"p1"});
  assert.equal(context.basicKillNeeded,1);
  assert.equal(context.comparisonKillsNeeded,2);
  assert.equal(context.nextKillVpLeverage,3);
  assert.ok(context.targetingScore>=0.85);
});

test("shared target strategy includes Destroyer's Wrath kill urgency", () => {
  const strategic=getTargetStrategicContext(state(),{playerId:"p1",targetUnitId:"target"});
  assert.equal(strategic.primaryStrategy.active,true);
  assert.equal(strategic.primaryStrategy.nextKillVpLeverage,4);
  assert.match(strategic.reason,/Destroyer's Wrath|Finishing another unit/);
});

test("Unstoppable Force tracks non-home control, new capture and first kill separately", () => {
  const context=getPrimaryStrategyContext(unstoppableState(),{playerId:"p1"});
  assert.equal(context.active,true);
  assert.equal(context.missionName,"Unstoppable Force");
  assert.equal(context.nonHomeControlled,2);
  assert.equal(context.enemyKillsThisTurn,1);
  assert.equal(context.basicKillNeeded,0);
  assert.equal(context.turnStartControlKnown,true);
  assert.deepEqual(context.newlyControlledNonHomeObjectiveIds,["myExpansion"]);
  assert.equal(context.newControlSatisfied,true);
  assert.equal(context.centralEndBattleSatisfied,true);
  assert.equal(context.rawRecordedVp,14);
  assert.equal(context.cappedRecordedVp,14);
  assert.equal(context.protectCheapUnits,false);
});

test("Unstoppable Force applies the 15 VP round cap when three non-home objectives are controlled", () => {
  const s=unstoppableState();
  const centerB=s.objectives.find((item)=>item.id==="centerB");
  centerB.control={controlState:"controlled",controllerId:"p1",contestingPlayerIds:[]};
  const context=getPrimaryStrategyContext(s,{playerId:"p1"});
  assert.equal(context.nonHomeControlled,3);
  assert.deepEqual(context.newlyControlledNonHomeObjectiveIds,["myExpansion","centerB"]);
  assert.equal(context.rawRecordedVp,18);
  assert.equal(context.cappedRecordedVp,15);
});

test("Unstoppable Force gives the first kill three VP of target leverage", () => {
  const s=unstoppableState();
  s.history=s.history.filter((event)=>event.payload.turn!==3);
  const context=getPrimaryStrategyContext(s,{playerId:"p1"});
  assert.equal(context.basicKillNeeded,1);
  assert.equal(context.nextKillVpLeverage,3);
  assert.ok(context.targetingScore>=0.8);
  const strategic=getTargetStrategicContext(s,{playerId:"p1",targetUnitId:"target"});
  assert.equal(strategic.primaryStrategy.missionName,"Unstoppable Force");
  assert.equal(strategic.primaryStrategy.nextKillVpLeverage,3);
});

test("Unstoppable Force does not invent the new-control condition without a turn-start snapshot", () => {
  const s=unstoppableState();
  s.scoring.turnSnapshots=[];
  const context=getPrimaryStrategyContext(s,{playerId:"p1"});
  assert.equal(context.turnStartControlKnown,false);
  assert.equal(context.newControlSatisfied,null);
  assert.match(context.summary.join(" "),/Turn-start objective control is unavailable/);
});

test("Unstoppable Force objective signal values an eligible new non-home capture", () => {
  const s=unstoppableState();
  const context=getPrimaryStrategyContext(s,{playerId:"p1"});
  const signal=getPrimaryObjectiveStrategySignal(s,{
    playerId:"p1",
    objectiveId:"opponentExpansion",
    control:"enemy-controlled",
    purpose:"contest-objective",
    primaryStrategy:context
  });
  assert.equal(signal.active,true);
  assert.equal(signal.newlyEligible,true);
  assert.equal(signal.vpLeverage,7);
  assert.ok(signal.score>=0.5);
  assert.match(signal.reason,/3 VP new-control condition/);
});

test("other Primary missions remain unchanged until their strategy model is added", () => {
  const s=state();
  s.battlefieldMap.missionSetup.opponentDisposition="Purge the Foe";
  const context=getPrimaryStrategyContext(s,{playerId:"p1"});
  assert.equal(context.active,false);
  assert.equal(context.missionName,"Meatgrinder");
  assert.match(context.reason,/not yet enabled/);
});
