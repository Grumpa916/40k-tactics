import test from "node:test";
import assert from "node:assert/strict";
import { SECONDARY_MISSION_CATALOG } from "../../src/data/secondary-mission-catalog.js";
import { getTargetObjectiveSwing, getFormationObjectiveContribution } from "../../src/rules/tactical-objective-swing.js";
import { getTargetSecondaryMissionImpact } from "../../src/rules/tactical-secondary-target-impact.js";
import { getFireCoordinationContext } from "../../src/rules/tactical-fire-coordination.js";
import { getGameStrategyContext } from "../../src/rules/tactical-game-strategy.js";
import { getStratagemResourceContext } from "../../src/rules/tactical-stratagem-context.js";
import { getTargetStrategicContext } from "../../src/rules/tactical-target-context.js";

function unit(id, ownerId, x, y, { oc = 1, wounds = 10, battleShocked = false, rosterUnitId = null } = {}) {
  return {
    id, ownerId, name:id, status:"deployed", position:{x,y}, wounds,
    startingStrength:1, currentStrength:1, startingWounds:wounds, battleShocked,
    metadata:{ rosterUnitId:rosterUnitId ?? id, modelCount:1 },
    profile:{ characteristics:{ toughness:5, save:3, wounds, objectiveControl:oc } }
  };
}

function objectiveState() {
  return {
    phase:"shooting", turn:3, activePlayer:"p1",
    battle:{status:"active",round:4,activePlayerId:"p1"},
    players:[{id:"p1",name:"You"},{id:"p2",name:"Opponent"}],
    victoryPoints:{p1:20,p2:29}, commandPoints:{p1:2,p2:2}, history:[],
    objectives:[{id:"mid",position:{x:30,y:22},control:{controlState:"controlled",controllerId:"p2",contestingPlayerIds:[]}}],
    units:[
      unit("friendly","p1",29,22,{oc:4}),
      unit("holder","p2",30,22,{oc:4}),
      unit("support","p2",31,22,{oc:1})
    ],
    scoring:{turnSnapshots:[],secondaryMissions:[],secondaryMissionModeByPlayer:{p1:"tactical",p2:"tactical"}},
    armyRosters:{}
  };
}

test("objective swing identifies a kill that can flip recorded local OC", () => {
  const state=objectiveState();
  const swing=getTargetObjectiveSwing(state,{playerId:"p1",targetUnitId:"holder"});
  assert.equal(swing.targetOc,4);
  assert.equal(swing.friendlyOc,4);
  assert.equal(swing.opponentOcBefore,5);
  assert.equal(swing.opponentOcAfter,1);
  assert.equal(swing.potentialFlip,true);
  assert.ok(swing.score >= 0.7);
});

test("Battle-shock suppresses target OC and prevents double-counting an objective flip", () => {
  const state=objectiveState();
  state.units.find(item=>item.id==="holder").battleShocked=true;
  const contribution=getFormationObjectiveContribution(state,"holder");
  const swing=getTargetObjectiveSwing(state,{playerId:"p1",targetUnitId:"holder"});
  const strategic=getTargetStrategicContext(state,{playerId:"p1",targetUnitId:"holder"});
  assert.equal(contribution.totalOc,4);
  assert.equal(contribution.effectiveOc,0);
  assert.equal(swing.potentialFlip,false);
  assert.equal(strategic.battleShock.active,true);
  assert.ok(strategic.battleShock.marginalKillPenalty > 0);
});

test("verified Tactical Assassination exposes five VP of target leverage", () => {
  const state=objectiveState();
  const target=state.units.find(item=>item.id==="holder");
  target.profile.keywords=["Character"];
  const assassination=SECONDARY_MISSION_CATALOG.find(card=>card.id==="secondary-assassination");
  state.scoring.secondaryMissions=[{
    instanceId:"p1:assassination", definitionId:assassination.id, definition:{...assassination,missionMode:"tactical"},
    playerId:"p1", status:"active", drawnRound:4, drawnTurn:3, scoringHistory:[]
  }];
  const impact=getTargetSecondaryMissionImpact(state,{playerId:"p1",targetUnitId:"holder"});
  assert.equal(impact.potentialVp,5);
  assert.equal(impact.scoringSignals[0].vpAtStake,5);
});

function coordinationState() {
  const weak=unit("weak","p1",10,10,{rosterUnitId:"r-weak"});
  const strong=unit("strong","p1",12,10,{rosterUnitId:"r-strong"});
  const target=unit("target","p2",20,10,{wounds:10,rosterUnitId:"r-target"});
  return {
    phase:"shooting",turn:1,activePlayer:"p1",battle:{status:"active",round:2,activePlayerId:"p1"},
    players:[{id:"p1"},{id:"p2"}],victoryPoints:{p1:5,p2:5},commandPoints:{p1:1,p2:1},objectives:[],
    units:[weak,strong,target],
    history:[{type:"shooting.unit_activated",payload:{unitId:"weak",playerId:"p1",round:2,turn:1,actionType:"shoot"}}],
    scoring:{turnSnapshots:[],secondaryMissions:[]},
    armyRosters:{
      p1:{units:[
        {id:"r-weak",loadoutValidation:{status:"valid"},datasheet:{characteristics:{Toughness:5,Save:3,Wounds:10},weapons:[{name:"Weak gun",range:24,attacks:2,strength:4,ap:0,damage:1}]}},
        {id:"r-strong",loadoutValidation:{status:"valid"},datasheet:{characteristics:{Toughness:5,Save:3,Wounds:10},weapons:[{name:"Heavy gun",range:24,attacks:20,strength:12,ap:-4,damage:4}]}}
      ]},
      p2:{units:[{id:"r-target",loadoutValidation:{status:"valid"},datasheet:{characteristics:{Toughness:5,Save:3,Wounds:10},weapons:[]}}]}
    }
  };
}

test("fire coordination identifies a substantially better remaining shooter", () => {
  const state=coordinationState();
  const context=getFireCoordinationContext(state,{
    playerId:"p1",attackerId:"weak",targetUnitId:"target",
    currentExpectedDamage:0.1,currentDestructionProbability:0
  });
  assert.equal(context.betterMatch,true);
  assert.equal(context.bestAlternative.unitId,"strong");
  assert.ok(context.bestAlternative.expectedDamage > context.currentExpectedDamage);
});

test("late-game score deficit increases mission urgency", () => {
  const state=objectiveState();
  state.battle.round=5;
  state.victoryPoints={p1:15,p2:31};
  const strategy=getGameStrategyContext(state,{playerId:"p1"});
  assert.equal(strategy.posture,"catch-up");
  assert.ok(strategy.weights.objectiveSwing > 1.5);
  assert.ok(strategy.weights.primary > 1.4);
});

test("CP and selected detachment expose affordable phase stratagem opportunities", () => {
  const state=objectiveState();
  state.armyRosters={
    p1:{detachment:"Test Detachment",rulesDataRevision:{factionRules:{detachments:[{
      name:"Test Detachment",stratagemCatalogStatus:"complete",stratagems:[
        {name:"Focused Fire",cpCost:1,phases:["shooting"],timing:"Your Shooting phase",description:"Improve attacks and wound rolls."},
        {name:"Fight Trick",cpCost:1,phases:["fight"],timing:"Fight phase",description:"Improve melee attacks."}
      ]
    }]}}},
    p2:{detachment:"Enemy Detachment",rulesDataRevision:{factionRules:{detachments:[{
      name:"Enemy Detachment",stratagemCatalogStatus:"complete",stratagems:[
        {name:"Defensive Shell",cpCost:1,phases:["shooting"],timing:"When targeted in the Shooting phase",description:"Improve saving throws when targeted."}
      ]
    }]}}}
  };
  state.units.find(item=>item.id==="holder").battleShocked=true;
  const context=getStratagemResourceContext(state,{playerId:"p1",targetUnitId:"holder"});
  assert.equal(context.own.combat.length,1);
  assert.equal(context.own.combat[0].name,"Focused Fire");
  assert.equal(context.targetBattleShocked,true);
  assert.equal(context.opponentCanAffectTarget,false);
});
