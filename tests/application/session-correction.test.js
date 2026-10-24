import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { registerCoreCommandHandlers } from '../../src/engine/register-core-commands.js';
import { clearCommandHandlers } from '../../src/engine/command-engine.js';
import { activateShootingUnit, resolveShootingAttack } from '../../src/application/shooting-workflow.js';
clearCommandHandlers(); registerCoreCommandHandlers();
function session() {
  return createGameSession(createGameState({phase:'shooting',turn:1,activePlayer:'p1',battle:{status:'active',round:1},
    players:[{id:'p1'},{id:'p2'}],units:[
      {id:'a',ownerId:'p1',name:'Shooter',status:'deployed',wounds:10,position:{x:0,y:0},profile:{characteristics:{ballisticSkill:3,toughness:4,save:3}}},
      {id:'b',ownerId:'p2',name:'Target',status:'deployed',wounds:10,position:{x:4,y:0},profile:{characteristics:{toughness:4,save:3}}}
    ]}));
}
test('one correction restores actual attack damage and history together, then permits recording again', () => {
  const s=session(),weapon={id:'gun',name:'Gun',type:'ranged',characteristics:{attacks:2,strength:4,ap:0,damage:1}};
  activateShootingUnit(s,{unitId:'a',actionType:'shoot'});const before=s.getState();
  resolveShootingAttack(s,{attackerId:'a',targetId:'b',weapon,actualDamage:3});
  assert.equal(s.getState().units[1].wounds,7);
  assert.match(s.getLastCorrection().detail,/Shooter → Target.*Gun.*3 damage/);
  assert.equal(s.undoLastAction(),true);assert.equal(s.getState().units[1].wounds,10);
  assert.deepEqual(s.getState().history,before.history);
  assert.equal(s.undoLastAction(),false);
  resolveShootingAttack(s,{attackerId:'a',targetId:'b',weapon,actualDamage:2});
  assert.equal(s.getState().units[1].wounds,8);
});
test('a rejected command retains correction; an accepted non-correctable action or restore clears it', () => {
  const s=session();
  s.dispatch({type:'command_points.record_change',payload:{playerId:'p1',amount:1,reason:'adjustment'}});
  assert.ok(s.getLastCorrection()); assert.throws(()=>s.dispatch({type:'nonexistent'}));
  assert.ok(s.getLastCorrection());
  activateShootingUnit(s,{unitId:'a',actionType:'shoot'});assert.equal(s.getLastCorrection(),null);
  s.dispatch({type:'command_points.record_change',payload:{playerId:'p1',amount:1,reason:'adjustment'}});
  s.replaceState(s.getState());assert.equal(s.getLastCorrection(),null);
});
