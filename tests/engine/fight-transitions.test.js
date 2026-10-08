import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import {
  recordFightActivation,
  completeFightPhase
} from "../../src/engine/fight-transitions.js";

function fightState(overrides = {}) {
  return createGameState({
    phase: "fight",
    turn: 2,
    activePlayer: "p1",
    players: [{ id: "p1" }, { id: "p2" }],
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({ id: "friendly", ownerId: "p1", name: "Friendly", status: "deployed" }),
      createUnit({ id: "enemy", ownerId: "p2", name: "Enemy", status: "deployed" })
    ],
    ...overrides
  });
}

test("records one Fight activation for either player's deployed unit", () => {
  const state = fightState();
  const next = recordFightActivation(state, { unitId: "enemy" });

  assert.equal(next.history.at(-1).type, "fight.unit_activated");
  assert.deepEqual(next.history.at(-1).payload, {
    unitId: "enemy",
    playerId: "p2",
    round: 1,
    turn: 2,
    fightsFirst: false
  });
  assert.deepEqual(next.units, state.units);
});

test("marks a successful charge this turn as Fights First", () => {
  const state = fightState({
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "friendly",
        outcome: "successful",
        round: 1,
        turn: 2
      }
    }]
  });
  const next = recordFightActivation(state, { unitId: "friendly" });

  assert.equal(next.history.at(-1).payload.fightsFirst, true);
});

test("does not mark an earlier turn's charge as Fights First", () => {
  const state = fightState({
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "friendly",
        outcome: "successful",
        round: 1,
        turn: 1
      }
    }]
  });
  const next = recordFightActivation(state, { unitId: "friendly" });

  assert.equal(next.history.at(-1).payload.fightsFirst, false);
});

test("requires Fight phase, an active battle, and a deployed unit", () => {
  assert.throws(() => recordFightActivation(fightState({ phase: "charge" }), {
    unitId: "friendly"
  }), /Fight phase/);
  assert.throws(() => recordFightActivation(fightState({
    battle: { id: "b1", status: "complete", round: 1 }
  }), { unitId: "friendly" }), /Battle must be active/);
  assert.throws(() => recordFightActivation(fightState({
    units: [createUnit({ id: "friendly", ownerId: "p1", name: "Friendly", status: "reserves" })]
  }), { unitId: "friendly" }), /must be deployed/);
});

test("rejects an already-activated unit through the Fight candidate gate", () => {
  const first = recordFightActivation(fightState(), { unitId: "friendly" });
  assert.throws(
    () => recordFightActivation(first, { unitId: "friendly" }),
    /available Fight candidate/
  );
});

test("enforces Fights First priority before normal candidates", () => {
  const state = fightState({
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "friendly",
        outcome: "successful",
        round: 1,
        turn: 2
      }
    }]
  });

  assert.throws(
    () => recordFightActivation(state, { unitId: "enemy" }),
    /Fights First candidates must be activated before normal/
  );

  const first = recordFightActivation(state, { unitId: "friendly" });
  const next = recordFightActivation(first, { unitId: "enemy" });

  assert.deepEqual(
    next.history.slice(-2).map((event) => event.type),
    ["fight.unit_activated", "fight.unit_activated"]
  );
  assert.equal(next.history.at(-2).payload.fightsFirst, true);
  assert.equal(next.history.at(-1).payload.fightsFirst, false);
});

test("rejects reserves even if they have a successful charge event", () => {
  const state = fightState({
    units: [
      createUnit({ id: "reserve", ownerId: "p1", name: "Reserve", status: "reserves" })
    ],
    history: [{
      type: "charge.outcome_recorded",
      payload: { unitId: "reserve", outcome: "successful", round: 1, turn: 2 }
    }]
  });
  assert.throws(() => recordFightActivation(state, { unitId: "reserve" }), /must be deployed/);
});

test("does not complete Fight while available candidates remain", () => {
  assert.throws(
    () => completeFightPhase(fightState()),
    /Fight candidates remain/
  );
});

test("completes Fight after all candidates are activated", () => {
  let state = fightState();
  state = recordFightActivation(state, { unitId: "friendly" });
  state = recordFightActivation(state, { unitId: "enemy" });

  const next = completeFightPhase(state);

  assert.equal(next.phase, "end_turn");
  assert.deepEqual(next.history.slice(-2).map((event) => event.type), [
    "fight.phase_completed",
    "turn.phase_changed"
  ]);
  assert.deepEqual(next.history.at(-2).payload, {
    round: 1,
    turn: 2
  });
  assert.equal(next.history.at(-1).payload.phase, "end_turn");
});


test("records an opponent Fight activation as Fights First", () => {
  const state = fightState({
    activePlayer: "p2",
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p2" },
    history: [{ type: "charge.outcome_recorded", payload: {
      unitId: "enemy", playerId: "p2", outcome: "successful", targetIds: ["friendly"], round: 1, turn: 2
    }}]
  });
  const next = recordFightActivation(state, { unitId: "enemy" });
  assert.deepEqual(next.history.at(-1).payload, {
    unitId: "enemy", playerId: "p2", round: 1, turn: 2, fightsFirst: true
  });
});
