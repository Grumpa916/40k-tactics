import test from "node:test";
import assert from "node:assert/strict";
import { setPreGameRoles, setBattleSize } from "./battle-setup-transitions.js";

test("records attacker and derives defender while recording first player", () => {
  const state = { players: [{ id: "p1" }, { id: "p2" }], history: [] };
  const next = setPreGameRoles(state, { attackerPlayerId: "p2", firstPlayerId: "p1" });
  assert.deepEqual(next.preGameSetup, {
    attackerPlayerId: "p2", defenderPlayerId: "p1", firstPlayerId: "p1"
  });
  assert.equal(next.history.at(-1).type, "battle.pre_game_roles_set");
  assert.equal(state.preGameSetup, undefined);
});

test("allows either setup choice to be recorded before the other", () => {
  const state = { players: [{ id: "p1" }, { id: "p2" }], history: [] };
  const next = setPreGameRoles(state, { attackerPlayerId: "p1" });
  assert.deepEqual(next.preGameSetup, {
    attackerPlayerId: "p1", defenderPlayerId: "p2", firstPlayerId: null
  });
});

test("rejects role IDs outside the configured two players", () => {
  const state = { players: [{ id: "p1" }, { id: "p2" }] };
  assert.throws(() => setPreGameRoles(state, { attackerPlayerId: "p3" }), /configured players/);
  assert.throws(() => setPreGameRoles(state, { firstPlayerId: "p3" }), /configured players/);
});

test("roles are locked once deployment begins", () => {
  const state = { players: [{ id: "p1" }, { id: "p2" }], battle: { status: "deployment" } };
  assert.throws(() => setPreGameRoles(state, { attackerPlayerId: "p1" }), /locked/);
});

test("persists a supported battle size independently of saved rosters", () => {
  const state = { players: [{ id: "p1" }, { id: "p2" }], armyRosters: {
    p1: { pointsLimit: 1500 }, p2: { pointsLimit: 1750 }
  }, history: [] };
  const next = setBattleSize(state, { battleSize: "incursion" });
  assert.equal(next.battleSetup.battleSize, "incursion");
  assert.equal(next.history.at(-1).type, "battle.size_set");
  assert.equal(next.history.at(-1).payload.rules.pointsLimit, 1000);
  assert.equal(state.battleSetup, undefined);
});

test("rejects unsupported battle sizes and locks size after deployment", () => {
  const state = { history: [] };
  assert.throws(() => setBattleSize(state, { battleSize: "onslaught" }), /supported battle size/);
  assert.throws(() => setBattleSize({ battle: { status: "deployment" } }, { battleSize: "strike_force" }), /locked/);
});
