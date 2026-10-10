import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseBattleStore } from "../../src/persistence/supabase-battle-store.js";
import { createGameState } from "../../src/state/game-state.js";

function fakeClient({ userId = "owner-1", response = { id: "battle-1", name: "Test", state_version: 1, created_at: "now", updated_at: "now" } } = {}) {
  const calls = [];
  const client = {
    auth: { async getUser() { calls.push(["auth.getUser"]); return { data: { user: userId ? { id: userId } : null }, error: null }; } },
    from(table) {
      const query = { table, action: null, filters: [], selected: null, payload: null };
      calls.push(["from", table, query]);
      const chain = {
        insert(payload) { query.action = "insert"; query.payload = payload; return chain; },
        update(payload) { query.action = "update"; query.payload = payload; return chain; },
        delete() { query.action = "delete"; return chain; },
        select(fields) { query.selected = fields; return chain; },
        eq(key, value) { query.filters.push([key, value]); return chain; },
        order(key, options) { query.order = [key, options]; return chain; },
        limit(value) { query.limit = value; return chain; },
        async single() { return { data: query.action === "select" ? { ...response, game_state: createGameState() } : response, error: null }; },
        then(resolve, reject) { return Promise.resolve({ data: [response], error: null }).then(resolve, reject); }
      };
      return chain;
    }
  };
  return { client, calls };
}

test("battle store saves a detached versioned snapshot with the authenticated owner", async () => {
  const { client, calls } = fakeClient();
  const store = createSupabaseBattleStore(client);
  const state = createGameState({ phase: "command", players: [{ id: "p1" }] });
  const result = await store.save({ name: "Test battle", state });
  const query = calls.find((call) => call[0] === "from")[2];
  assert.equal(result.id, "battle-1");
  assert.equal(query.table, "v2_battle_records");
  assert.equal(query.payload.user_id, "owner-1");
  assert.equal(query.payload.state_version, state.version);
  assert.notEqual(query.payload.game_state, state);
  assert.deepEqual(query.payload.game_state, state);
});

test("battle store requires a signed-in owner and a valid serializable state", async () => {
  const { client } = fakeClient({ userId: null });
  const store = createSupabaseBattleStore(client);
  await assert.rejects(store.list(), /Sign in/);
  const signedIn = createSupabaseBattleStore(fakeClient().client);
  await assert.rejects(signedIn.save({ name: "Bad", state: null }), /game state object/);
  await assert.rejects(signedIn.save({ name: "Bad", state: { version: 1, circular: (() => { const x = {}; x.self = x; return x; })() } }), /JSON-serializable/);
});

test("battle store bounds list limits and scopes mutations to authenticated owner", async () => {
  const { client, calls } = fakeClient();
  const store = createSupabaseBattleStore(client);
  const rows = await store.list({ limit: 999 });
  assert.equal(rows.length, 1);
  const query = calls.find((call) => call[0] === "from")[2];
  assert.equal(query.limit, 100);
  await store.remove("battle-1");
  const deleteQuery = calls.filter((call) => call[0] === "from").at(-1)[2];
  assert.equal(deleteQuery.action, "delete");
  assert.deepEqual(deleteQuery.filters, [["id", "battle-1"], ["user_id", "owner-1"]]);
});

test("battle store rejects unsupported game-state versions on load", async () => {
  const { client } = fakeClient({ response: { id: "battle-1", name: "Test", state_version: 99, game_state: { version: 99 } } });
  const store = createSupabaseBattleStore(client);
  await assert.rejects(store.load("battle-1"), /migration is required/);
});
