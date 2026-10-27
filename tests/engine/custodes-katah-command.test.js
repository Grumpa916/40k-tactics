import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../../src/application/game-session.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { COMMAND_TYPES } from '../../src/commands/game-commands.js';
import { getCustodesKatahState } from '../../src/rules/custodes-tactical-advisor.js';

function state() {
  return {
    phase:'movement',
    turn:1,
    activePlayer:'p1',
    battle:{ id:'b', status:'active', round:1, activePlayerId:'p1', firstPlayerId:'p1' },
    players:[{id:'p1',name:'Custodes'},{id:'p2',name:'Opponent'}],
    units:[{
      id:'custodes', ownerId:'p1', name:'Custodian Guard', status:'deployed', position:{x:5,y:5},
      metadata:{ rosterUnitId:'r1' }
    }],
    armyRosters:{
      p1:{
        faction:'Adeptus Custodes',
        units:[{ id:'r1', datasheet:{ name:'Custodian Guard', keywords:['Infantry','Adeptus Custodes'], abilities:[{name:"Martial Ka'tah",description:'Readied each Command phase.'}], weapons:[] } }]
      }
    },
    history:[]
  };
}

test('registered Movement command expends Calistus for the selected readied unit', () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const game = createGameSession(state());
  assert.equal(getCustodesKatahState(game.getState(), {playerId:'p1',unitId:'custodes'}).readied, true);
  game.dispatch({
    type:COMMAND_TYPES.RECORD_CUSTODES_KATAH_USE,
    payload:{playerId:'p1',unitId:'custodes',katahName:'Calistus'}
  });
  const current = game.getState();
  assert.equal(current.history.at(-1).type, 'custodes.katah_expended');
  assert.equal(current.history.at(-1).payload.katahName, 'Calistus');
  assert.equal(getCustodesKatahState(current, {playerId:'p1',unitId:'custodes'}).readied, false);
});
