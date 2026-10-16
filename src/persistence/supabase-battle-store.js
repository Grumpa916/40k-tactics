import { GAME_STATE_VERSION } from "../state/version.js";

const DEFAULT_TABLE = "v2_battle_records";
const BATTLE_FIELDS = "id,name,state_version,game_state,created_at,updated_at";

function requiredId(value, label) {
  const id = String(value ?? "").trim();
  if (!id) throw new TypeError(label + " is required.");
  return id;
}

function throwIfError(error) {
  if (error) {
    const message = error.message || String(error);
    throw new Error("Supabase battle persistence failed: " + message);
  }
}

function validateState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new TypeError("A game state object is required.");
  }
  if (!Number.isInteger(state.version)) {
    throw new TypeError("The game state must include an integer version.");
  }
  // Ensure snapshots are JSON-serializable and detach them from live mutable state.
  let snapshot;
  try {
    snapshot = JSON.parse(JSON.stringify(state));
  } catch {
    throw new TypeError("The game state must be JSON-serializable before saving.");
  }
  // Save the live clock's elapsed interval into the detached snapshot and
  // rebase its start timestamp so offline time is not counted after restoration.
  const clock = snapshot?.timers?.turnClock;
  const nowMs = Date.now();
  if (clock?.running === true && clock.activePlayerId && Number.isFinite(clock.startedAtMs)) {
    clock.elapsedMsByPlayer = { ...(clock.elapsedMsByPlayer ?? {}) };
    const prior = Number.isFinite(clock.elapsedMsByPlayer[clock.activePlayerId])
      ? clock.elapsedMsByPlayer[clock.activePlayerId]
      : 0;
    clock.elapsedMsByPlayer[clock.activePlayerId] = prior + Math.max(0, nowMs - clock.startedAtMs);
    clock.startedAtMs = nowMs;
  }
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("The serialized game state must be an object.");
  }
  return snapshot;
}

export function createSupabaseBattleStore(client, { table = DEFAULT_TABLE } = {}) {
  if (!client?.auth || typeof client.auth.getUser !== "function" ||
      typeof client.from !== "function") {
    throw new TypeError("A Supabase client with auth and database access is required.");
  }
  const tableName = requiredId(table, "Table name");

  async function ownerId() {
    const { data, error } = await client.auth.getUser();
    throwIfError(error);
    const id = data?.user?.id;
    if (!id) throw new Error("Sign in to the single-owner app account before using cloud saves.");
    return id;
  }

  return Object.freeze({
    async save({ id = null, name, state } = {}) {
      const userId = await ownerId();
      const snapshot = validateState(state);
      const payload = {
        user_id: userId,
        name: String(name ?? "").trim() || "Untitled battle",
        state_version: snapshot.version,
        game_state: snapshot
      };
      let query;
      if (id) {
        query = client.from(tableName).update(payload)
          .eq("id", requiredId(id, "Battle id"))
          .eq("user_id", userId)
          .select("id,name,state_version,created_at,updated_at")
          .single();
      } else {
        query = client.from(tableName).insert(payload)
          .select("id,name,state_version,created_at,updated_at")
          .single();
      }
      const { data, error } = await query;
      throwIfError(error);
      if (!data?.id) throw new Error("Supabase did not return the saved battle record.");
      return data;
    },

    async list({ limit = 50 } = {}) {
      const userId = await ownerId();
      const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 50)));
      const { data, error } = await client.from(tableName)
        .select("id,name,state_version,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(safeLimit);
      throwIfError(error);
      return Array.isArray(data) ? data : [];
    },

    async load(id) {
      const userId = await ownerId();
      const { data, error } = await client.from(tableName)
        .select(BATTLE_FIELDS)
        .eq("id", requiredId(id, "Battle id"))
        .eq("user_id", userId)
        .single();
      throwIfError(error);
      if (!data?.game_state || typeof data.game_state !== "object") {
        throw new Error("The saved battle has no usable game-state snapshot.");
      }
      if (data.state_version !== data.game_state.version) {
        throw new Error("The saved battle's version metadata does not match its snapshot.");
      }
      if (data.state_version !== GAME_STATE_VERSION) {
        throw new Error("This battle uses game-state version " + data.state_version +
          "; this app supports version " + GAME_STATE_VERSION + ". A migration is required before loading it.");
      }
      const restoredState = JSON.parse(JSON.stringify(data.game_state));
      const restoredClock = restoredState?.timers?.turnClock;
      if (restoredClock?.running === true) {
        // A saved clock resumes at load time; time spent away from the app is
        // not charged to either player.
        restoredClock.startedAtMs = Date.now();
      }
      return { ...data, game_state: restoredState };
    },

    async remove(id) {
      const userId = await ownerId();
      const { error } = await client.from(tableName)
        .delete()
        .eq("id", requiredId(id, "Battle id"))
        .eq("user_id", userId);
      throwIfError(error);
      return true;
    }
  });
}
