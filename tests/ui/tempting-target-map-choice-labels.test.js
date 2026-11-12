import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommandScreen } from '../../src/ui/command-screen.js';
import { renderMovementAdvisor } from '../../src/ui/movement-advisor.js';
import { SECONDARY_MISSION_CATALOG } from '../../src/data/secondary-mission-catalog.js';
import { getEventCompanionMapForForceDispositions } from '../../src/rules/event-companion-map-catalog.js';
import { objectiveMapDisplayName, objectivePickerLabel } from '../../src/rules/objective-display-labels.js';
import { getSecondaryObjectivePlanningSignal } from '../../src/rules/secondary-mission-intelligence.js';

function setup(){
  const geo=getEventCompanionMapForForceDispositions('Purge the Foe','Reconnaissance','A');
  assert.ok(geo,'Full-game verification layout A exists');
  const objectives=Object.entries(geo.objectivePositions).map(([name,position])=>({
    id:'event-companion:'+name,name,layoutObjective:name,position,
    control:{controlState:'uncontrolled',controllerId:null,contestingPlayerIds:[]}
  }));
  const definition=SECONDARY_MISSION_CATALOG.find(card=>card.id==='secondary-a-tempting-target');
  const state={
    phase:'command',turn:1,activePlayer:'p1',
    battle:{id:'verification',status:'active',round:1,activePlayerId:'p1',firstPlayerId:'p1'},
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    preGameSetup:{attackerPlayerId:'p1',defenderPlayerId:'p2'},
    battlefieldMap:{missionSetup:{myDisposition:'Purge the Foe',opponentDisposition:'Reconnaissance',layout:'A'}},
    objectives,units:[],history:[],armyRosters:{},
    scoring:{
      turnSnapshots:[],secondaryMissionModeByPlayer:{p1:'tactical',p2:'tactical'},
      secondaryMissions:[{
        instanceId:'tempting-one',definitionId:definition.id,definition,status:'active',
        playerId:'p1',drawnRound:1,drawnTurn:1,cardState:{},scoringHistory:[]
      }]
    }
  };
  const c2=objectives.find(item=>objectiveMapDisplayName(state,item.id,'p1')==='Center 2');
  const myExpansion=objectives.find(item=>objectiveMapDisplayName(state,item.id,'p1')==='My Expansion');
  assert.ok(c2,'on-map C2 marker');
  assert.ok(myExpansion,'on-map mE marker');
  assert.notEqual(c2.id,myExpansion.id);
  return {state,definition,c2,myExpansion};
}

test('Command Tempting Target choices use the actual map C2 and mE names, not raw Event Companion IDs',()=>{
  const {state,definition,c2,myExpansion}=setup();
  assert.equal(objectivePickerLabel(state,c2.id,'p1'),'Center 2 (C2)');
  assert.equal(objectivePickerLabel(state,myExpansion.id,'p1'),'My Expansion (mE)');

  const container={innerHTML:'',replaceChildren(){},addEventListener(){},removeEventListener(){},
    querySelector(){return null;},querySelectorAll(){return [];}};
  const screen=createCommandScreen(container,{
    session:{getState:()=>state,subscribe:()=>()=>{}},
    perspectivePlayerId:'p1',missionDefinitions:[],secondaryMissionCatalog:[definition],layoutMode:'classic'
  });
  assert.match(container.innerHTML,new RegExp('<option value="'+c2.id+'">Center 2 \\(C2\\)</option>'));
  assert.match(container.innerHTML,new RegExp('<option value="'+myExpansion.id+'">My Expansion \\(mE\\)</option>'));
  assert.doesNotMatch(container.innerHTML,new RegExp('<option value="'+myExpansion.id+'">Center 2'));
  state.scoring.secondaryMissions[0].cardState.temptingTargetObjectiveId=c2.id;
  screen.render();
  assert.match(container.innerHTML,/Opponent selected target:<\/strong> Center 2 \(C2\) \(locked for this card\)/);
  screen.destroy();
});

test('selecting C2 gives the Tempting Target bonus only to the real C2 map objective',()=>{
  const {state,c2,myExpansion}=setup();
  state.scoring.secondaryMissions[0].cardState.temptingTargetObjectiveId=c2.id;
  state.phase='movement';
  const c2Signal=getSecondaryObjectivePlanningSignal(state,{playerId:'p1',objectiveId:c2.id});
  const expansionSignal=getSecondaryObjectivePlanningSignal(state,{playerId:'p1',objectiveId:myExpansion.id});
  assert.ok(c2Signal.score>=0.34);
  assert.equal(expansionSignal.score,0);
  assert.deepEqual(c2Signal.missions,['A Tempting Target']);
  assert.match(c2Signal.reason,/opponent-designated Tempting Target/);
});

test('Movement Mission context explicitly displays the saved on-map target; no automatic correction is made',()=>{
  const {state,definition,c2,myExpansion}=setup();
  state.phase='movement';
  state.units=[{
    id:'mover',ownerId:'p1',name:'Contemptor-Galatus Dreadnought',status:'deployed',
    position:{x:35,y:11},startingStrength:1,currentStrength:1,
    profile:{characteristics:{movement:9,objectiveControl:3,toughness:10,save:2,wounds:12}}
  }];
  const htmlFor=id=>{
    state.scoring.secondaryMissions[0].cardState.temptingTargetObjectiveId=id;
    return renderMovementAdvisor(state,{playerId:'p1',selectedUnitId:'mover',perspectivePlayerId:'p1'});
  };
  assert.match(htmlFor(myExpansion.id),/Recorded target: My Expansion \(mE\)/);
  assert.match(htmlFor(c2.id),/Recorded target: Center 2 \(C2\)/);
  assert.equal(state.scoring.secondaryMissions[0].definitionId,definition.id);
});
