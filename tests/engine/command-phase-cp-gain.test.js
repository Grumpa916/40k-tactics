import test from 'node:test';
import assert from 'node:assert/strict';
import { changePhase } from '../../src/engine/state-transitions.js';
import { getCommandPointBalance, getCommandPointHistory } from '../../src/engine/command-points-ledger.js';

test('starting Command phase automatically grants 1 CP to both players', () => {
  const state = {
    players:[{id:'p1',name:'You'},{id:'p2',name:'Opponent'}],
    battle:{status:'active',round:1,activePlayerId:'p1'},
    activePlayer:'p1', phase:'start_turn', turn:1, history:[],
    commandPoints:{p1:0,p2:2}, units:[], objectives:[]
  };
  const next = changePhase(state,{phase:'command'});
  assert.equal(next.phase,'command');
  assert.equal(getCommandPointBalance(next,'p1'),1);
  assert.equal(getCommandPointBalance(next,'p2'),3);
  assert.equal(getCommandPointHistory(next).filter(x=>x.note==='Automatic Command phase gain').length,2);
});
