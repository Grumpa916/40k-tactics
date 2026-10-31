// One device-local recovery slot plus the preceding valid snapshot.
export function createLocalBattleStore(database, { databaseName = '40k-tactics-recovery' } = {}) {
  let opened;
  function open() {
    try { if (database === undefined) database = globalThis.indexedDB; }
    catch (error) { return Promise.reject(error); }
    if (!database) return Promise.reject(new Error('Device storage is unavailable. Use cloud saves before closing.'));
    if (opened) return opened;
    let abandoned = false;
    const attempt = new Promise((resolve, reject) => {
      const request = database.open(databaseName, 1);
      request.onupgradeneeded = () => {
        if (abandoned) { request.transaction?.abort(); return; }
        request.result.createObjectStore('snapshots');
      };
      request.onsuccess = () => {
        if (abandoned) { request.result.close(); return; }
        request.result.onversionchange = () => { request.result.close(); if (opened === attempt) opened = null; };
        resolve(request.result);
      };
      request.onerror = () => { abandoned = true; reject(request.error); };
      request.onblocked = () => { abandoned = true; reject(new Error('Device storage is busy in another app window.')); };
    }).catch(error => {
      if (opened === attempt) opened = null;
      throw error;
    });
    opened = attempt;
    return attempt;
  }
  return {
    async load() {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readonly');
        const store = tx.objectStore('snapshots');
        const latest = store.get('latest'), previous = store.get('previous');
        tx.oncomplete = () => resolve({ latest: latest.result ?? null, previous: previous.result ?? null });
        tx.onabort = () => reject(tx.error ?? new Error('Recovery read failed.'));
      });
    },
    async save(record, { expectedRevision = null } = {}) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readwrite');
        let failure = null;
        const store = tx.objectStore('snapshots');
        const old = store.get('latest');
        old.onsuccess = () => {
          if ((old.result?.revision ?? old.result?.savedAt ?? null) !== expectedRevision) {
            failure = Object.assign(new Error('Another window updated device recovery. Choose which window should save this battle.'), { code: 'RECOVERY_CONFLICT' });
            tx.abort(); return;
          }
          if (old.result) store.put(old.result, 'previous');
          store.put(record, 'latest');
        };
        tx.oncomplete = () => resolve(record);
        tx.onabort = () => reject(failure ?? tx.error ?? new Error('Recovery save failed.'));
      });
    }
  };
}
