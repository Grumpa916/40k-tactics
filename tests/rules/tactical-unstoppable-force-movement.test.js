import test from "node:test";
import assert from "node:assert/strict";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";
import { renderMovementAdvisor } from "../../src/ui/movement-advisor.js";

function unit(id, ownerId, x, y, { oc = 2, move = 6, rosterUnitId = id } = {}) {
  return {
    id, ownerId, name:id, status:"deployed", position:{x,y}, wounds:5,
    startingStrength:1,currentStrength:1,startingWounds:5,
    metadata:{rosterUnitId,modelCount:1},
    profile:{characteristics:{movement:move,objectiveControl:oc,toughness:5,save:3,wounds:5}}
  };
}

function rosterUnit(id, { move = 6, oc = 2 } = {}) {
  return {
    id,
    loadoutValidation:{status:"valid"},
    datasheet:{characteristics:{Move:`${move}\"`,OC:oc,Wounds:5,Toughness:5,Save:"3+"},weapons:[]}
  };
}

function control(controllerId) {
  return controllerId == null
    ? {controlState:"uncontrolled",controllerId:null,contestingPlayerIds:[]}
    : {controlState:"controlled",controllerId,contestingPlayerIds:[]};
}

function state() {
  return {
    phase:"movement",turn:3,activePlayer:"p1",
    battle:{status:"active",round:3,activePlayerId:"p1"},
    players:[{id:"p1",name:"You"},{id:"p2",name:"Opponent"}],
    battlefieldMap:{missionSetup:{myDisposition:"Purge the Foe",opponentDisposition:"Take and Hold",layout:"A"}},
    victoryPoints:{p1:18,p2:18},commandPoints:{p1:2,p2:2},history:[],
    objectives:[
      {id:"myHome",name:"myHome",position:{x:8,y:8},control:control("p1")},
      {id:"myExpansion",name:"myExpansion",position:{x:16,y:22},control:control("p1")},
      {id:"centerA",name:"centerA",position:{x:24,y:22},control:control("p2")}
    ],
    units:[
      unit("scorer","p1",18,22,{oc:4,move:6,rosterUnitId:"r-scorer"}),
      unit("holder","p1",16,22,{oc:3,move:6,rosterUnitId:"r-holder"}),
      unit("enemy","p2",29,22,{oc:2,move:6,rosterUnitId:"r-enemy"})
    ],
    scoring:{
      turnSnapshots:[{
        turn:3,round:3,playerId:"p1",
        objectives:[
          {id:"myHome",control:control("p1")},
          {id:"myExpansion",control:control("p1")},
          {id:"centerA",control:control("p2")}
        ],
        units:[]
      }],
      secondaryMissions:[],secondaryMissionModeByPlayer:{p1:"tactical",p2:"tactical"}
    },
    armyRosters:{
      p1:{units:[rosterUnit("r-scorer",{move:6,oc:4}),rosterUnit("r-holder",{move:6,oc:3})]},
      p2:{units:[rosterUnit("r-enemy",{move:6,oc:2})]}
    }
  };
}

test("Unstoppable Force movement ranking elevates a reachable new non-home capture", () => {
  const result=getMovementStrategicRecommendations(state(),{playerId:"p1"});
  assert.equal(result.primaryStrategy.active,true);
  assert.equal(result.primaryStrategy.missionName,"Unstoppable Force");
  const scorer=result.recommendations.find((item)=>item.unitId==="scorer");
  assert.equal(scorer.objectiveId,"centerA");
  assert.equal(scorer.purpose,"contest-objective");
  assert.equal(scorer.primaryStrategySignal.active,true);
  assert.equal(scorer.primaryStrategySignal.newlyEligible,true);
  assert.ok(scorer.primaryStrategySignal.vpLeverage>=7);
  assert.match(scorer.reason,/Unstoppable Force|3 VP new-control condition|4 VP-per-objective/);
});

test("Unstoppable Force movement UI shows the live primary outlook without adding input", () => {
  const html=renderMovementAdvisor(state(),{playerId:"p1",selectedUnitId:"scorer"});
  assert.match(html,/Primary strategy · Unstoppable Force/);
  assert.match(html,/non-home objective/i);
  assert.match(html,/Need 1 enemy unit kill for the 3 VP destroy condition/);
  assert.match(html,/5 VP end-of-battle condition/);
});
