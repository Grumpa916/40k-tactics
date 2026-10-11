import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePreGameReadiness } from "../../src/rules/pre-game-readiness.js";

const readyState = () => ({
  players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
  battle: { id: "b1", status: "setup", missionId: "mission-1" },
  units: [
    { id: "u1", name: "Friendly unit", ownerId: "p1", status: "deployed" },
    { id: "u2", name: "Opponent unit", ownerId: "p2", status: "deployed" }
  ]
});

test("pre-game readiness passes when both armies, ownership, and mission are present", () => {
  const result = evaluatePreGameReadiness(readyState());
  assert.equal(result.ready, true);
  assert.deepEqual(result.missing, []);
  assert.ok(result.checks.every((check) => check.status === "complete"));
});

test("pre-game readiness identifies missing players, armies, and mission", () => {
  const result = evaluatePreGameReadiness({ players: [], units: [] });
  assert.equal(result.ready, false);
  assert.deepEqual(result.missing.map((check) => check.id), [
    "players", "armies", "unit-ownership", "mission"
  ]);
});

test("pre-game readiness rejects units owned by unconfigured players", () => {
  const state = readyState();
  state.units.push({ id: "u3", name: "Orphan unit", ownerId: "missing", status: "deployed" });
  const result = evaluatePreGameReadiness(state);
  assert.equal(result.ready, false);
  assert.match(result.missing.find((check) => check.id === "unit-ownership").detail, /Orphan unit/);
});

test("destroyed units do not make army readiness or ownership fail", () => {
  const state = readyState();
  state.units.push({ id: "dead", name: "Destroyed unit", ownerId: "missing", status: "destroyed" });
  assert.equal(evaluatePreGameReadiness(state).ready, true);
});

test("pre-game checks do not mutate the game state", () => {
  const state = readyState();
  const before = JSON.stringify(state);
  evaluatePreGameReadiness(state);
  assert.equal(JSON.stringify(state), before);
});


test("verified Event Companion missions and layout satisfy mission readiness without a separate mission id", () => {
  const state = readyState();
  delete state.battle.missionId;
  state.battlefieldMap = {
    missionSetup: {
      myDisposition: "Take and Hold",
      opponentDisposition: "Disruption",
      layout: "B"
    }
  };

  const result = evaluatePreGameReadiness(state);
  assert.equal(result.ready, true);
  assert.equal(result.missing.some((check) => check.id === "mission"), false);
  assert.match(result.checks.find((check) => check.id === "mission").detail, /verified Event Companion battlefield layout/);
});

test("unverified Event Companion setup does not satisfy mission readiness", () => {
  const state = readyState();
  delete state.battle.missionId;
  state.battlefieldMap = {
    missionSetup: {
      myDisposition: "Take and Hold",
      opponentDisposition: "Disruption",
      layout: "Z"
    }
  };

  const result = evaluatePreGameReadiness(state);
  assert.equal(result.ready, false);
  assert.equal(result.missing.some((check) => check.id === "mission"), true);
});
