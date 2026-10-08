import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import {
  getFightEngagementState,
  getFightStepStartEngagementState
} from "../../src/rules/fight-engagement-state.js";

function stateWithHistory(history) {
  return createGameState({
    phase: "fight",
    turn: 2,
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({ id: "a", ownerId: "p1", name: "A", status: "deployed" }),
      createUnit({ id: "b", ownerId: "p2", name: "B", status: "deployed" }),
      createUnit({ id: "c", ownerId: "p2", name: "C", status: "deployed" })
    ],
    history
  });
}

test("derives engagement from a successful charge", () => {
  const state = stateWithHistory([{
    type: "charge.outcome_recorded",
    payload: {
      unitId: "a",
      outcome: "successful",
      targetIds: ["b"],
      round: 1,
      turn: 2
    }
  }]);

  const result = getFightEngagementState(state);

  assert.deepEqual(result.engagedUnitIds.sort(), ["a", "b"]);
  assert.deepEqual(result.relationships, [{
    unitIds: ["a", "b"],
    source: "charge",
    eventIndex: 0
  }]);
});

test("a Fight attack establishes an engagement relationship", () => {
  const state = stateWithHistory([{
    type: "combat.attack_resolved",
    payload: {
      phase: "fight",
      attackerId: "a",
      targetId: "b",
      round: 1,
      turn: 1
    }
  }]);

  assert.deepEqual(getFightEngagementState(state).engagedUnitIds.sort(), ["a", "b"]);
});

test("Fall Back removes a prior engagement relationship", () => {
  const state = stateWithHistory([
    {
      type: "combat.attack_resolved",
      payload: { phase: "fight", attackerId: "a", targetId: "b", round: 1, turn: 1 }
    },
    {
      type: "unit.fell_back",
      payload: { unitId: "a", round: 1, turn: 2 }
    }
  ]);

  const result = getFightEngagementState(state);

  assert.deepEqual(result.engagedUnitIds, []);
  assert.deepEqual(result.relationships, []);
  assert.deepEqual(result.fellBackThisHistory, ["a"]);
});

test("a later successful charge can re-establish engagement after a Fall Back", () => {
  const state = stateWithHistory([
    {
      type: "combat.attack_resolved",
      payload: { phase: "fight", attackerId: "a", targetId: "b", round: 1, turn: 1 }
    },
    {
      type: "unit.fell_back",
      payload: { unitId: "a", round: 1, turn: 2 }
    },
    {
      type: "charge.outcome_recorded",
      payload: {
        unitId: "a",
        outcome: "successful",
        targetIds: ["b"],
        round: 1,
        turn: 2
      }
    }
  ]);

  const result = getFightEngagementState(state);

  assert.deepEqual(result.engagedUnitIds.sort(), ["a", "b"]);
  assert.equal(result.relationships[0].source, "charge");
});

test("Fight-step-start snapshot excludes engagement created later in the Fight phase", () => {
  const state = stateWithHistory([
    {
      type: "turn.phase_changed",
      payload: { phase: "fight", round: 1, turn: 2 }
    },
    {
      type: "combat.attack_resolved",
      payload: { phase: "fight", attackerId: "a", targetId: "c", round: 1, turn: 2 }
    }
  ]);

  const result = getFightStepStartEngagementState(state);

  assert.equal(result.known, true);
  assert.deepEqual(result.engagedUnitIds, []);
  assert.deepEqual(result.relationships, []);
});

test("does not mutate state", () => {
  const state = stateWithHistory([{
    type: "charge.outcome_recorded",
    payload: {
      unitId: "a",
      outcome: "successful",
      targetIds: ["b"],
      round: 1,
      turn: 2
    }
  }]);
  const before = structuredClone(state);

  getFightEngagementState(state);

  assert.deepEqual(state, before);
});
