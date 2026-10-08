import test from "node:test";
import assert from "node:assert/strict";
import { createTurnSnapshot } from "./scoring-evidence-state.js";
import {
  evaluateObjectiveControl,
  evaluateUnitStatus,
  evaluateUnitOwnership,
  evaluateUnitDestruction,
  evaluateTurnSnapshot
} from "./scoring-eligibility.js";

function state() {
  const base = {
    turn: 2,
    activePlayer: "p1",
    battle: { round: 1, activePlayerId: "p1" },
    units: [
      { id: "u1", ownerId: "p1", status: "deployed" },
      { id: "u2", ownerId: "p2", status: "destroyed" }
    ],
    objectives: [
      {
        id: "obj-1",
        control: {
          id: "obj-1",
          controllerId: "p1",
          contestingPlayerIds: [],
          controlState: "controlled"
        }
      }
    ],
    history: [{
      type: "combat.attack_resolved",
      payload: {
        turn: 1,
        targetId: "u2",
        targetOwnerId: "p2",
        stateDelta: {
          target: { statusBefore: "deployed", statusAfter: "destroyed" }
        }
      }
    }]
  };

  return {
    ...base,
    scoring: {
      turnSnapshots: [
        createTurnSnapshot(base, { turn: 1, round: 1, playerId: "p2" }),
        createTurnSnapshot(base, { turn: 2, round: 1, playerId: "p1" })
      ]
    }
  };
}

test("evaluates authoritative current objective control", () => {
  assert.equal(
    evaluateObjectiveControl(state(), {
      objectiveId: "obj-1",
      playerId: "p1"
    }).eligible,
    true
  );

  assert.equal(
    evaluateObjectiveControl(state(), {
      objectiveId: "obj-1",
      playerId: "p2",
      expected: "enemy-controlled"
    }).eligible,
    true
  );
});

test("evaluates objective control from a turn-start snapshot", () => {
  assert.equal(
    evaluateObjectiveControl(state(), {
      objectiveId: "obj-1",
      playerId: "p1",
      turn: 1
    }).actual,
    "controlled"
  );
});

test("evaluates unit status and ownership without spatial inference", () => {
  assert.equal(
    evaluateUnitStatus(state(), { unitId: "u1", expected: "deployed" }).eligible,
    true
  );
  assert.equal(
    evaluateUnitOwnership(state(), { unitId: "u1", playerId: "p1" }).eligible,
    true
  );
  assert.equal(
    evaluateUnitOwnership(state(), { unitId: "u1", playerId: "p2" }).eligible,
    false
  );
});

test("evaluates destruction from combat history", () => {
  assert.equal(
    evaluateUnitDestruction(state(), { unitId: "u2", turn: 1 }).eligible,
    true
  );
  assert.equal(
    evaluateUnitDestruction(state(), { unitId: "u1", turn: 1 }).eligible,
    false
  );
});

test("reports whether a turn snapshot exists", () => {
  assert.equal(evaluateTurnSnapshot(state(), { turn: 1 }).eligible, true);
  assert.equal(evaluateTurnSnapshot(state(), { turn: 3 }).eligible, false);
});
