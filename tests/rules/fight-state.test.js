import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { getFightState } from "../../src/rules/fight-state.js";

function fightState(overrides = {}) {
  return createGameState({
    phase: "fight",
    turn: 4,
    activePlayer: "p2",
    battle: { id: "b1", status: "active", round: 2 },
    units: [
      createUnit({ id: "u1", ownerId: "p1", name: "Unit 1", status: "deployed" }),
      createUnit({ id: "u2", ownerId: "p2", name: "Unit 2", status: "deployed" })
    ],
    ...overrides
  });
}

test("returns Fight context, candidates, and completion availability", () => {
  const state = fightState({
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "u1",
        outcome: "successful",
        round: 2,
        turn: 4
      }
    }]
  });

  assert.deepEqual(getFightState(state), {
    phase: "fight",
    round: 2,
    turn: 4,
    activePlayerId: "p2",
    candidates: {
      fightsFirst: ["u1"],
      normal: ["u2"],
      activated: []
    },
    canComplete: false
  });
});

test("reports completion available after all candidates are activated", () => {
  const state = fightState({
    history: [
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u1",
          round: 2,
          turn: 4,
          fightsFirst: false
        }
      },
      {
        type: "fight.unit_activated",
        payload: {
          unitId: "u2",
          round: 2,
          turn: 4,
          fightsFirst: false
        }
      }
    ]
  });

  assert.deepEqual(getFightState(state), {
    phase: "fight",
    round: 2,
    turn: 4,
    activePlayerId: "p2",
    candidates: {
      fightsFirst: [],
      normal: [],
      activated: ["u1", "u2"]
    },
    canComplete: true
  });
});

test("does not report completion available outside an active Fight phase", () => {
  assert.equal(
    getFightState(fightState({ phase: "charge" })).canComplete,
    false
  );
  assert.equal(
    getFightState(fightState({
      battle: { id: "b1", status: "complete", round: 2 }
    })).canComplete,
    false
  );
});

test("handles missing optional state collections without mutating state", () => {
  const state = createGameState({
    phase: "fight",
    turn: 1,
    activePlayer: null,
    battle: { id: "b1", status: "active", round: 1 },
    units: undefined,
    history: undefined
  });

  const before = structuredClone(state);
  const result = getFightState(state);

  assert.deepEqual(result, {
    phase: "fight",
    round: 1,
    turn: 1,
    activePlayerId: null,
    candidates: {
      fightsFirst: [],
      normal: [],
      activated: []
    },
    canComplete: true
  });
  assert.deepEqual(state, before);
});
