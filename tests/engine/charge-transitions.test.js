import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import { recordChargeOutcome } from "../../src/engine/charge-transitions.js";

function chargeState(overrides = {}) {
  return createGameState({
    phase: "charge",
    turn: 1,
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({ id: "charger", ownerId: "p1", name: "Charger", status: "deployed" }),
      createUnit({ id: "enemy", ownerId: "p2", name: "Enemy", status: "deployed" })
    ],
    ...overrides
  });
}

test("records successful charge targets and measured distance without changing positions", () => {
  const state = chargeState();
  const next = recordChargeOutcome(state, {
    unitId: "charger",
    succeeded: true,
    targetIds: ["enemy"],
    measuredDistances: { enemy: 9.5 }
  });

  assert.equal(next.history.at(-1).type, "charge.outcome_recorded");
  assert.deepEqual(next.history.at(-1).payload, {
    unitId: "charger",
    playerId: "p1",
    outcome: "successful",
    targetIds: ["enemy"],
    measuredDistances: { enemy: 9.5 },
    round: 1,
    turn: 1
  });
  assert.deepEqual(next.units, state.units);
});

test("records a failed attempt with its declared target and measured distance", () => {
  const next = recordChargeOutcome(chargeState(), {
    unitId: "charger",
    succeeded: false,
    targetIds: ["enemy"],
    measuredDistances: { enemy: 13 }
  });
  assert.equal(next.history.at(-1).payload.outcome, "failed");
  assert.deepEqual(next.history.at(-1).payload.targetIds, ["enemy"]);
  assert.deepEqual(next.history.at(-1).payload.measuredDistances, { enemy: 13 });
});

test("requires measured distance for every declared target", () => {
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true, targetIds: ["enemy"]
  }), /measured Charge distance is required/);

  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true, targetIds: ["enemy"], measuredDistances: { enemy: -1 }
  }), /non-negative number/);

  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true, targetIds: ["enemy"], measuredDistances: { other: 9 }
  }), /match declared targets/);
});

test("requires declared targets for every Charge attempt", () => {
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true
  }), /at least one declared target/);
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: false
  }), /at least one declared target/);
});

test("requires valid enemy targets only", () => {
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true, targetIds: ["charger"], measuredDistances: { charger: 2 }
  }), /deployed enemy units/);
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true, targetIds: ["enemy", "enemy"], measuredDistances: { enemy: 9 }
  }), /unique valid/);
});

test("requires active player and Charge phase and prevents repeat attempts", () => {
  const measured = { targetIds: ["enemy"], measuredDistances: { enemy: 10 } };
  assert.throws(() => recordChargeOutcome(chargeState({ phase: "fight" }), {
    unitId: "charger", succeeded: false, ...measured
  }), /Charge phase/);
  assert.throws(() => recordChargeOutcome(chargeState({ activePlayer: "p2" }), {
    unitId: "charger", succeeded: false, ...measured
  }), /active player's/);

  const first = recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: false, ...measured
  });
  assert.throws(() => recordChargeOutcome(first, {
    unitId: "charger", succeeded: false, ...measured
  }), /one charge per turn/);
});

test("Charge cannot be declared after Fall Back in the same turn", () => {
  const fallenBack = {
    ...chargeState(),
    history: [{
      type: "unit.fell_back",
      payload: { unitId: "charger", playerId: "p1", phase: "movement", round: 1, turn: 1 }
    }]
  };
  assert.throws(
    () => recordChargeOutcome(fallenBack, {
      unitId: "charger", succeeded: false, targetIds: ["enemy"], measuredDistances: { enemy: 8 }
    }),
    /Fell Back cannot declare a charge/
  );
});

test("records an opponent successful Charge against my unit with measured distance", () => {
  const state = chargeState({
    turn: 2,
    activePlayer: "p2",
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p2" },
    units: [
      createUnit({ id: "my-unit", ownerId: "p1", name: "My Unit", status: "deployed" }),
      createUnit({ id: "opponent-charger", ownerId: "p2", name: "Opponent Charger", status: "deployed" })
    ]
  });

  const next = recordChargeOutcome(state, {
    unitId: "opponent-charger",
    succeeded: true,
    targetIds: ["my-unit"],
    measuredDistances: { "my-unit": 7.25 }
  });

  assert.deepEqual(next.history.at(-1).payload, {
    unitId: "opponent-charger",
    playerId: "p2",
    outcome: "successful",
    targetIds: ["my-unit"],
    measuredDistances: { "my-unit": 7.25 },
    round: 1,
    turn: 2
  });
  assert.deepEqual(next.units, state.units);
});
