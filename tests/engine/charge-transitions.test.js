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

test("records successful charge targets without changing positions", () => {
  const state = chargeState();
  const next = recordChargeOutcome(state, {
    unitId: "charger",
    succeeded: true,
    targetIds: ["enemy"]
  });

  assert.equal(next.history.at(-1).type, "charge.outcome_recorded");
  assert.deepEqual(next.history.at(-1).payload, {
    unitId: "charger",
    playerId: "p1",
    outcome: "successful",
    targetIds: ["enemy"],
    round: 1,
    turn: 1
  });
  assert.deepEqual(next.units, state.units);
});

test("records a failed attempt without targets", () => {
  const next = recordChargeOutcome(chargeState(), {
    unitId: "charger",
    succeeded: false
  });
  assert.equal(next.history.at(-1).payload.outcome, "failed");
  assert.deepEqual(next.history.at(-1).payload.targetIds, []);
});

test("requires valid enemy targets only for successful outcomes", () => {
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true
  }), /at least one target/);
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: false, targetIds: ["enemy"]
  }), /cannot record targets/);
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true, targetIds: ["charger"]
  }), /deployed enemy units/);
  assert.throws(() => recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: true, targetIds: ["enemy", "enemy"]
  }), /unique valid/);
});

test("requires active player and Charge phase and prevents repeat attempts", () => {
  assert.throws(() => recordChargeOutcome(chargeState({ phase: "fight" }), {
    unitId: "charger", succeeded: false
  }), /Charge phase/);
  assert.throws(() => recordChargeOutcome(chargeState({ activePlayer: "p2" }), {
    unitId: "charger", succeeded: false
  }), /active player's/);

  const first = recordChargeOutcome(chargeState(), {
    unitId: "charger", succeeded: false
  });
  assert.throws(() => recordChargeOutcome(first, {
    unitId: "charger", succeeded: false
  }), /one charge per turn/);
});
