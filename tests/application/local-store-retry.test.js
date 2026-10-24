import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalBattleStore } from '../../src/persistence/local-battle-store.js';

function database(firstFailure) {
  const requests=[];let closes=0;
  const db={close(){closes++;},transaction(){
    const tx={objectStore:()=>({get:()=>({result:null})})};
    queueMicrotask(()=>tx.oncomplete());return tx;
  }};
  return {
    requests,db,get closes(){return closes;},
    open() {
      const request={result:db,error:Error('Temporary failure')};requests.push(request);
      queueMicrotask(()=>{
        if(requests.length===1)request[firstFailure]();
        else request.onsuccess();
      });
      return request;
    }
  };
}
for(const failure of ['onerror','onblocked']) {
  test('device storage retries after '+failure+' and closes abandoned late successes',async()=>{
    const api=database(failure),store=createLocalBattleStore(api);
    await assert.rejects(store.load());
    assert.deepEqual(await store.load(),{latest:null,previous:null});
    assert.equal(api.requests.length,2);
    api.requests[0].onsuccess();
    assert.equal(api.closes,1);
    api.db.onversionchange();
    await store.load();
    assert.equal(api.requests.length,3);
  });
}
