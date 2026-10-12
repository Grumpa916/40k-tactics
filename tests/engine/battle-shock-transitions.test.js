import test from "node:test";
import assert from "node:assert/strict";
import { recordBattleShockTest } from "../../src/engine/battle-shock-transitions.js";

function activeCommandState(overrides = {}) {
  return {
    phase: "command",
    turn: 2,
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    units: [
      { id: "friendly", ownerId: "p1", name: "Friendly unit", status: "deployed", startingStrength: 10, currentStrength: 4 },
      { id: "enemy", ownerId: "p2", name: "Enemy unit", status: "deployed", startingStrength: 10, currentStrength: 2 }
    ],
    history: [],
    ...overrides
  };
}

test("failed Command-phase test records Battle-shocked state and a typed event", () => {
  const next = recordBattleShockTest(activeCommandState(), { unitId: "friendly", result: "failed" });
  const unit = next.units.find((item) => item.id === "friendly");
  assert.equal(unit.battleShocked, true);
  assert.deepEqual(unit.battleShockLastTest, {
    result: "failed", round: 1, turn: 2, phase: "command",
    eligibilityStatus: "test-required-below-half-strength"
  });
  assert.equal(next.history.at(-1).type, "battle_shock.test_recorded");
  assert.equal(next.history.at(-1).payload.battleShockedAfter, true);
});

test("passing a test clears an existing Battle-shocked condition", () => {
  const state = activeCommandState({
    units: [
      { id: "friendly", ownerId: "p1", name: "Friendly unit", status: "deployed", battleShocked: true, startingStrength: 10, currentStrength: 8 },
      { id: "enemy", ownerId: "p2", name: "Enemy unit", status: "deployed", startingStrength: 10, currentStrength: 2 }
    ]
  });
  const next = recordBattleShockTest(state, { unitId: "friendly", result: "passed" });
  assert.equal(next.units.find((item) => item.id === "friendly").battleShocked, false);
  assert.equal(next.history.at(-1).payload.battleShockedBefore, true);
  assert.equal(next.history.at(-1).payload.battleShockedAfter, false);
});

test("unknown strength requires explicit table-side eligibility confirmation", () => {
  const state = activeCommandState({
    units: [{ id: "friendly", ownerId: "p1", name: "Friendly unit", status: "deployed", metadata: { modelCount: 10 } }]
  });
  assert.throws(
    () => recordBattleShockTest(state, { unitId: "friendly", result: "failed" }),
    /Confirm at the table/
  );
  const next = recordBattleShockTest(state, { unitId: "friendly", result: "failed", eligibilityConfirmed: true });
  assert.equal(next.units[0].battleShocked, true);
});

test("Battle-shock test requires an eligible deployed unit in the active Command phase", () => {
  assert.throws(
    () => recordBattleShockTest(activeCommandState({ phase: "movement" }), { unitId: "friendly", result: "failed" }),
    /Command phase/
  );
  assert.throws(
    () => recordBattleShockTest(activeCommandState(), { unitId: "enemy", result: "passed" }),
    /active player's/
  );
  assert.throws(
    () => recordBattleShockTest(activeCommandState({
      units: [{ id: "friendly", ownerId: "p1", name: "Friendly unit", status: "destroyed", startingStrength: 10, currentStrength: 4 }]
    }), { unitId: "friendly", result: "passed" }),
    /on the battlefield/
  );
});

test("the same unit cannot have duplicate test results in the same turn", () => {
  const state = activeCommandState({
    history: [{ type: "battle_shock.test_recorded", payload: { unitId: "friendly", round: 1, turn: 2 } }]
  });
  assert.throws(
    () => recordBattleShockTest(state, { unitId: "friendly", result: "failed" }),
    /already been recorded/
  );
});
