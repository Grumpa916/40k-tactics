import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createGameSession } from "../../src/application/game-session.js";
import { saveCurrentBattle, restoreSavedBattle } from "../../src/application/battle-persistence.js";

test("application persistence bridge saves the current session snapshot without coupling to Supabase", async () => {
  const state = createGameState({
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", round: 2 }
  });
  const session = createGameSession(state);
  let request;
  const store = { async save(value) { request = value; return { id: "saved-1" }; } };
  const result = await saveCurrentBattle(store, session);
  assert.equal(result.id, "saved-1");
  assert.equal(request.name, "You vs Opponent — Round 2");
  assert.deepEqual(request.state, state);
  assert.notEqual(request.state, state);
});

test("application persistence bridge restores into the session and notifies subscribers", async () => {
  const session = createGameSession(createGameState({ phase: "setup" }));
  let observed = null;
  session.subscribe((state) => { observed = state; });
  const savedState = createGameState({
    phase: "shooting",
    turn: 3,
    players: [{ id: "p1" }, { id: "p2" }],
    history: [{ type: "test.event" }]
  });
  const store = {
    async load(id) {
      assert.equal(id, "saved-1");
      return { id, name: "Saved test", updated_at: "now", game_state: savedState };
    }
  };
  const result = await restoreSavedBattle(store, session, "saved-1");
  assert.deepEqual(result, { id: "saved-1", name: "Saved test", updated_at: "now" });
  assert.equal(session.getState().phase, "shooting");
  assert.equal(session.getState().history[0].type, "test.event");
  assert.equal(observed, session.getState());
});

test("restore leaves the current session untouched when store loading fails", async () => {
  const session = createGameSession(createGameState({ phase: "fight" }));
  const original = session.getState();
  await assert.rejects(restoreSavedBattle({ async load() { throw new Error("offline"); } }, session, "missing"), /offline/);
  assert.equal(session.getState(), original);
});
