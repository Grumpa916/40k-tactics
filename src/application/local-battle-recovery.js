import { GAME_STATE_VERSION } from '../state/version.js';
import { getTurnClockElapsedMs } from '../state/turn-clock.js';
import { TURN_STEPS } from '../state/turn.js';

export function validateRecoveryRecord(record) {
  const state = record?.state;
  return record?.schemaVersion === 1 && state?.version === GAME_STATE_VERSION &&
    Array.isArray(state.units) && Array.isArray(state.players) && Array.isArray(state.history) &&
    Array.isArray(state.objectives) && ['setup', 'deployment', 'end_battle_round', ...TURN_STEPS].includes(state.phase);
}

export function createRecoveryRecord(state, now = Date.now()) {
  const snapshot = structuredClone(state);
  const clock = snapshot.timers?.turnClock;
  if (clock?.running) {
    clock.elapsedMsByPlayer = { ...clock.elapsedMsByPlayer };
    if (clock.activePlayerId) clock.elapsedMsByPlayer[clock.activePlayerId] = getTurnClockElapsedMs(state, clock.activePlayerId, now);
    clock.running = false;
    clock.startedAtMs = null;
  }
  return { schemaVersion: 1, savedAt: new Date(now).toISOString(), state: snapshot };
}

// Subscribe independently of UI rendering. Coalesce changes while a write is in flight.
export function createLocalBattleRecovery({ session, store, onChange = () => {}, now = Date.now }) {
  let status = { mode: 'loading', message: 'Checking device recovery…' };
  let pending = null, writing = null, enabled = false, destroyed = false, dirtyBeforeReady = false;
  const publish = next => { status = { ...status, ...next }; if (!destroyed) onChange(status); };
  async function drain() {
    while (pending) {
      const record = pending; pending = null;
      try {
        await store.save(record);
        publish({ mode: pending ? 'saving' : 'saved', savedAt: record.savedAt, message: pending ? 'Saving on device…' : 'Saved on this device' });
      } catch (error) {
        publish({ mode: 'error', message: 'Device save failed: ' + error.message });
        // Retry the latest state on the next accepted action; never claim it was saved.
      }
    }
  }
  function save() {
    if (destroyed) return;
    if (!enabled) { if (status.mode === 'loading') dirtyBeforeReady = true; return; }
    try { pending = createRecoveryRecord(session.getState(), now()); }
    catch (error) { publish({ mode: 'error', message: 'Device save failed: ' + error.message }); return; }
    publish({ mode: 'saving', message: 'Saving on device…' });
    if (!writing) writing = drain().finally(() => { writing = null; });
  }
  const unsubscribe = session.subscribe(save);
  const ready = (async () => {
    try {
      const records = await store.load();
      const record = [records.latest, records.previous].find(validateRecoveryRecord);
      if (record) publish({ mode: 'resume', record, message: 'A saved battle is available on this device.' });
      else if (records.latest || records.previous) publish({ mode: 'incompatible', message: 'The saved recovery file cannot be loaded by this app version. It has been preserved. Use a compatible cloud save.' });
      else {
        enabled = true;
        publish({ mode: 'ready', message: 'Device recovery ready' });
        if (dirtyBeforeReady) save();
      }
    } catch (error) {
      publish({ mode: 'error', message: 'Device recovery unavailable: ' + error.message });
      // Allow subsequent writes to retry without preventing gameplay.
      enabled = true;
    }
    return status;
  })();
  return {
    ready,
    getStatus: () => status,
    save,
    async flush() { save(); while (writing) await writing; },
    resume() {
      if (status.mode !== 'resume' || !validateRecoveryRecord(status.record)) return false;
      // Enable only after replacement so no fresh setup can overwrite the recovery slot.
      session.replaceState(structuredClone(status.record.state));
      enabled = true; save(); return true;
    },
    startFresh() { enabled = true; publish({ mode: 'ready', record: null, message: 'New session · previous recovery retained until your next action' }); },
    destroy() { destroyed = true; unsubscribe(); }
  };
}
