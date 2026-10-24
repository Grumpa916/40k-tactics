import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { createGameSession } from '../../src/application/game-session.js';
import { createLocalBattleRecovery, createRecoveryRecord, validateRecoveryRecord } from '../../src/application/local-battle-recovery.js';
import { startLiveApp } from '../../src/application/live-startup.js';
import { createLocalBattleStore } from '../../src/persistence/local-battle-store.js';

function session() {
  return createGameSession(createGameState({ players: [{id:'p1'}], phase:'shooting' }), {
    commandExecutor: (state, command) => {
      if (command.type === 'rejected') throw new Error('Rejected');
      return { ...state, turn: state.turn + 1 };
    }
  });
}
test('local app mounts synchronously while cloud initialization is unresolved or fails', async () => {
  const calls = []; let reject;
  const app = startLiveApp({ mount: () => { calls.push('mounted'); return {}; },
    loadCloud: () => new Promise((_, fail) => { reject = fail; }), onCloudError: () => calls.push('cloud failed') });
  assert.deepEqual(calls, ['mounted']);
  await Promise.resolve(); reject(new Error('No connection'));
  assert.equal(await app.cloudReady, null);
  assert.deepEqual(calls, ['mounted', 'cloud failed']);
});
test('successful delayed cloud connection attaches to the already mounted shell once', async () => {
  const client = {}, calls = [];
  const app = startLiveApp({ mount: () => ({connectCloud: c => calls.push(c)}), loadCloud: async () => client });
  assert.equal(await app.cloudReady, client); assert.deepEqual(calls, [client]);
});
test('unresponsive cloud times out and can be retried without mounting the app again', async () => {
  let mounts=0, attempts=0, attached=0;
  const app=startLiveApp({mount:()=>{mounts++;return {connectCloud:()=>attached++};},timeoutMs:2,
    loadCloud:()=>++attempts===1?new Promise(()=>{}):Promise.resolve({})});
  assert.equal(await app.cloudReady,null);
  await app.retryCloud();
  assert.equal(mounts,1);assert.equal(attached,1);
});
test('recovery waits for a resume choice and never overwrites an existing battle with fresh setup', async () => {
  const s = session(), saved = createRecoveryRecord({...s.getState(),turn:7}, 1000), writes=[];
  const recovery = createLocalBattleRecovery({session:s,store:{load:async()=>({latest:saved}),save:async r=>writes.push(r)}});
  await recovery.ready;
  s.dispatch({type:'advance'});
  assert.equal(writes.length,0);
  assert.equal(recovery.resume(),true);
  await recovery.flush();
  assert.equal(s.getState().turn,7); assert.equal(writes.at(-1).state.turn,7);
  recovery.destroy();
});
test('corrupt latest slot falls back to a valid previous snapshot; incompatible data stays preserved', async () => {
  const s=session(), writes=[], valid=createRecoveryRecord(s.getState(),1000);
  const fallback=createLocalBattleRecovery({session:s,store:{load:async()=>({latest:{bad:true},previous:valid}),save:async r=>writes.push(r)}});
  await fallback.ready; assert.equal(fallback.getStatus().mode,'resume'); fallback.destroy();
  const incompatible=createLocalBattleRecovery({session:s,store:{load:async()=>({latest:{...valid,state:{...valid.state,version:-1}}}),save:async r=>writes.push(r)}});
  await incompatible.ready; s.dispatch({type:'advance'});
  assert.equal(incompatible.getStatus().mode,'incompatible'); assert.equal(writes.length,0); incompatible.destroy();
  assert.equal(validateRecoveryRecord({...valid,state:{...valid.state,phase:'bogus'}}),false);
});
test('restored running clock is paused at its save time without modifying the live clock', () => {
  const state=createGameState({timers:{turnClock:{running:true,activePlayerId:'p1',startedAtMs:1000,elapsedMsByPlayer:{p1:2000}}}});
  const record=createRecoveryRecord(state,5000);
  assert.equal(record.state.timers.turnClock.elapsedMsByPlayer.p1,6000);
  assert.equal(record.state.timers.turnClock.running,false);
  assert.equal(state.timers.turnClock.running,true);
});
test('accepted actions save; rejected commands do not; storage failure remains visible and retries', async () => {
  const s=session(), writes=[]; let fail=true;
  const recovery=createLocalBattleRecovery({session:s,store:{load:async()=>({}),save:async record=>{if(fail)throw Error('Quota');writes.push(record);}}});
  await recovery.ready;
  assert.throws(()=>s.dispatch({type:'rejected'}));
  assert.equal(recovery.getStatus().mode,'ready');
  s.dispatch({type:'advance'}); await recovery.flush();
  assert.equal(recovery.getStatus().mode,'error');
  fail=false; s.dispatch({type:'advance'}); await recovery.flush();
  assert.equal(recovery.getStatus().mode,'saved'); assert.equal(writes.at(-1).state.turn,2);
  recovery.destroy();
});
test('queued writes serialize and coalesce to the latest accepted state', async () => {
  const s=session(), writes=[]; let release;
  const store={load:async()=>({}),save:async record=>{writes.push(record.state.turn);if(writes.length===1)await new Promise(resolve=>release=resolve);}};
  const recovery=createLocalBattleRecovery({session:s,store});await recovery.ready;
  s.dispatch({type:'advance'});s.dispatch({type:'advance'});s.dispatch({type:'advance'});
  release(); await recovery.flush();
  assert.deepEqual(writes,[1,3]); recovery.destroy();
});
test('unavailable IndexedDB reports a storage error instead of blocking local play', async () => {
  const s=session(), recovery=createLocalBattleRecovery({session:s,store:createLocalBattleStore(null)});
  await recovery.ready; assert.equal(recovery.getStatus().mode,'error');
  s.dispatch({type:'advance'}); await recovery.flush(); assert.equal(s.getState().turn,1); recovery.destroy();
});
test('an action during the initial empty recovery lookup is saved once the lookup completes', async () => {
  const s=session(),writes=[];let release;
  const recovery=createLocalBattleRecovery({session:s,store:{load:()=>new Promise(resolve=>release=resolve),save:async r=>writes.push(r)}});
  s.dispatch({type:'advance'});release({});
  await recovery.ready;await recovery.flush();
  assert.equal(writes.at(-1).state.turn,1);recovery.destroy();
});
test('an unserializable state reports save failure without throwing through an accepted action', async () => {
  const s=session(),recovery=createLocalBattleRecovery({session:s,store:{load:async()=>({}),save:async()=>{}}});
  await recovery.ready;
  s.getState().invalidFunction=()=>{};
  assert.doesNotThrow(()=>s.dispatch({type:'advance'}));
  assert.equal(s.getState().turn,1);assert.equal(recovery.getStatus().mode,'error');recovery.destroy();
});
