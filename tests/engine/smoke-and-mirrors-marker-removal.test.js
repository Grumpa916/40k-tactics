import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { COMMAND_TYPES } from '../../src/commands/game-commands.js';
import { getEventCompanionMapForForceDispositions } from '../../src/rules/event-companion-map-catalog.js';
import { getSmokeAndMirrorsState } from '../../src/rules/smoke-and-mirrors-state.js';
import { getSmokeAndMirrorsMarkerRemovalOptions } from '../../src/rules/smoke-and-mirrors-removal.js';
import { renderSmokeAndMirrorsRemovalControls } from '../../src/ui/smoke-and-mirrors-removal-controls.js';

function completedDecoy(objectiveId) {
  return [
    {
      type:'shooting.unit_activated',
      payload:{
        unitId:'decoy-maker', playerId:'p1', round:1, turn:1,
        actionType:'mission_action', actionId:'primary-smoke-and-mirrors',
        missionInstanceId:'primary:p1:primary-smoke-and-mirrors',
        missionDefinitionId:'primary-smoke-and-mirrors', objectiveId, rulesConfirmed:true
      }
    },
    {
      type:'mission_action.reviewed',
      payload:{
        actionKey:'1:1:decoy-maker', playerId:'p1', checkpoint:'end-of-turn', outcome:'completed',
        missionInstanceId:'primary:p1:primary-smoke-and-mirrors', round:1, turn:1
      }
    }
  ];
}

function state() {
  const map = getEventCompanionMapForForceDispositions('Disruption','Reconnaissance','A');
  assert.ok(map);
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id:`event-companion:${label}`,
    name:label,
    layoutObjective:label,
    position:{...position},
    control:{controlState:'uncontrolled',controllerId:null,contestingPlayerIds:[]}
  }));
  const central = objectives.find((objective) => /central/i.test(objective.layoutObjective));
  assert.ok(central);
  return {
    phase:'movement',
    turn:2,
    activePlayer:'p2',
    battle:{id:'b',status:'active',round:2,activePlayerId:'p2',firstPlayerId:'p1'},
    preGameSetup:{attackerPlayerId:'p1',defenderPlayerId:'p2'},
    players:[{id:'p1',name:'Smoke player'},{id:'p2',name:'Surveil player'}],
    battlefieldMap:{missionSetup:{myDisposition:'Disruption',opponentDisposition:'Reconnaissance',layout:'A'}},
    objectives,
    units:[
      {id:'surveyor',ownerId:'p2',name:'Surveyor',status:'deployed',position:{...central.position}},
      {id:'decoy-maker',ownerId:'p1',name:'Decoy Maker',status:'deployed',position:{x:4,y:4}}
    ],
    history:completedDecoy(central.id)
  };
}

test('registered Surveil the Foe command requires tabletop confirmation and removes the Decoy status', () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const game = createGameSession(state());
  const before = getSmokeAndMirrorsState(game.getState(), {playerId:'p1',perspectivePlayerId:'p1'});
  assert.equal(before.decoyCount,1);
  assert.equal(getSmokeAndMirrorsMarkerRemovalOptions(game.getState(), {playerId:'p2',perspectivePlayerId:'p1'}).length,1);

  assert.throws(() => game.dispatch({
    type:COMMAND_TYPES.RECORD_SMOKE_AND_MIRRORS_MARKER_REMOVAL,
    payload:{
      playerId:'p2',unitId:'surveyor',objectiveId:before.decoyObjectiveIds[0],markerOwnerPlayerId:'p1',tabletopConfirmed:false
    }
  }), /physical tabletop/i);

  game.dispatch({
    type:COMMAND_TYPES.RECORD_SMOKE_AND_MIRRORS_MARKER_REMOVAL,
    payload:{
      playerId:'p2',unitId:'surveyor',objectiveId:before.decoyObjectiveIds[0],markerOwnerPlayerId:'p1',tabletopConfirmed:true
    }
  });
  const current = game.getState();
  const event = current.history.at(-1);
  assert.equal(event.type,'mission_marker.removed');
  assert.equal(event.payload.unitId,'surveyor');
  assert.equal(event.payload.ownerPlayerId,'p1');
  assert.equal(event.payload.tabletopConfirmed,true);
  assert.equal(getSmokeAndMirrorsState(current, {playerId:'p1',perspectivePlayerId:'p1'}).decoyCount,0);
  assert.equal(getSmokeAndMirrorsMarkerRemovalOptions(current, {playerId:'p2',perspectivePlayerId:'p1'}).length,0);
});

test('Movement control appears only after a move and states that map distance is advisory', () => {
  const current = state();
  assert.equal(renderSmokeAndMirrorsRemovalControls(current, {
    playerId:'p2',unitId:'surveyor',perspectivePlayerId:'p1',movementCompleted:false
  }), '');
  const html = renderSmokeAndMirrorsRemovalControls(current, {
    playerId:'p2',unitId:'surveyor',perspectivePlayerId:'p1',movementCompleted:true
  });
  assert.match(html,/Surveil the Foe/);
  assert.match(html,/Confirm &amp; remove/);
  assert.match(html,/physical tabletop/);
  assert.match(html,/Map distance is advisory/);
  assert.match(html,/data-remove-smoke-decoy/);
});