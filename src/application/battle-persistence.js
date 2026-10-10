/**
 * Application-layer bridge between a live game session and a persistence adapter.
 * Supabase and other storage providers stay outside the game engine.
 */
export async function saveCurrentBattle(store, session, { id = null, name = null } = {}) {
  if (!store || typeof store.save !== "function") {
    throw new TypeError("A battle persistence store is required.");
  }
  if (!session || typeof session.getState !== "function") {
    throw new TypeError("A game session is required.");
  }
  const state = session.getState();
  const battleName = String(name ?? state.battle?.name ?? "").trim() ||
    [state.players?.[0]?.name ?? "Player 1", "vs", state.players?.[1]?.name ?? "Player 2",
      state.battle?.round ? "— Round " + state.battle.round : ""].filter(Boolean).join(" ");
  let snapshot;
  try {
    snapshot = JSON.parse(JSON.stringify(state));
  } catch {
    throw new TypeError("The current game state must be JSON-serializable before saving.");
  }
  return store.save({ id, name: battleName, state: snapshot });
}

export async function restoreSavedBattle(store, session, id) {
  if (!store || typeof store.load !== "function") {
    throw new TypeError("A battle persistence store is required.");
  }
  if (!session || typeof session.replaceState !== "function") {
    throw new TypeError("A restorable game session is required.");
  }
  const saved = await store.load(id);
  if (!saved?.game_state || typeof saved.game_state !== "object") {
    throw new Error("The persistence store returned no usable battle snapshot.");
  }
  // replaceState validates the version, detaches the object, and notifies the UI.
  session.replaceState(saved.game_state);
  return { id: saved.id, name: saved.name, updated_at: saved.updated_at };
}
