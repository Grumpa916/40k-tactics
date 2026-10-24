// One device-local recovery slot plus the preceding valid snapshot.
export function createLocalBattleStore(database) {
  let opened;
  function open() {
    try { if (database === undefined) database = globalThis.indexedDB; }
    catch (error) { return Promise.reject(error); }
    if (!database) return Promise.reject(new Error('Device storage is unavailable. Use cloud saves before closing.'));
    return opened ??= new Promise((resolve, reject) => {
      const request = database.open('40k-tactics-recovery', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('snapshots');
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Device storage is busy in another app window.'));
    });
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
    async save(record) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('snapshots', 'readwrite');
        const store = tx.objectStore('snapshots');
        const old = store.get('latest');
        old.onsuccess = () => {
          if (old.result) store.put(old.result, 'previous');
          store.put(record, 'latest');
        };
        tx.oncomplete = () => resolve(record);
        tx.onabort = () => reject(tx.error ?? new Error('Recovery save failed.'));
      });
    }
  };
}
