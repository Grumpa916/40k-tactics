import test from "node:test";
import assert from "node:assert/strict";
import {
  createTurnSnapshot,
  getTurnSnapshot,
  getPreviousTurnSnapshot,
  getScoringEventsForTurn,
  getUnitDestructionsForTurn,
  getFriendlyUnitDestructionsForTurn,
  getEnemyUnitDestructionsForTurn,
  getUnitStateAtTurnStart,
  getObjectiveStateAtTurnStart
} from "./scoring-evidence-state.js";

function state() {
  return {
    turn: 2,
    battle: { round: 1, activePlayerId: "p1" },
    activePlayer: "p1",
    units: [
      { id: "u1", ownerId: "p1", status: "deployed", wounds: 5, position: { x: 10, y: 20 } },
      { id: "u2", ownerId: "p2", status: "destroyed", wounds: 0, position: null }
    ],
    objectives: [
      { id: "obj-1", control: { controllerId: "p1", controlState: "controlled" } }
    ],
    history: [
      {
        type: "combat.attack_resolved",
        payload: {
          turn: 1, targetId: "u2", attackerId: "u1", targetOwnerId: "p2", phase: "shooting",
          stateDelta: { target: { statusBefore: "deployed", statusAfter: "destroyed" } }
        }
      },
      {
        type: "combat.attack_resolved",
        payload: {
          turn: 2, targetId: "u1", attackerId: "u2", targetOwnerId: "p1",
          stateDelta: { target: { statusBefore: "deployed", statusAfter: "deployed" } }
        }
      }
    ]
  };
}

test("captures authoritative turn-start facts", () => {
  const snapshot = createTurnSnapshot(state(), { turn: 2, round: 1, playerId: "p1" });
  assert.equal(snapshot.turn, 2);
  assert.equal(snapshot.playerId, "p1");
  assert.equal(snapshot.objectives[0].control.controllerId, "p1");
  assert.equal(snapshot.units[0].wounds, 5);
});

test("retrieves current and previous turn snapshots", () => {
  const base = state();
  const withSnapshots = {
    ...base,
    scoring: {
      turnSnapshots: [
        createTurnSnapshot(base, { turn: 1, round: 1, playerId: "p2" }),
        createTurnSnapshot(base, { turn: 2, round: 1, playerId: "p1" })
      ]
    }
  };
  assert.equal(getTurnSnapshot(withSnapshots, 1).playerId, "p2");
  assert.equal(getPreviousTurnSnapshot(withSnapshots).turn, 1);
});

test("filters scoring events by turn", () => {
  assert.equal(getScoringEventsForTurn(state(), 1).length, 1);
  assert.equal(getScoringEventsForTurn(state(), 2).length, 1);
});

test("derives destroyed units from combat history", () => {
  const destroyed = getUnitDestructionsForTurn(state(), 1);
  assert.deepEqual(destroyed, [{
    unitId: "u2", ownerId: "p2", source: "combat.attack_resolved", attackerId: "u1", phase: "shooting"
  }]);
  assert.equal(getFriendlyUnitDestructionsForTurn(state(), "p2", 1).length, 1);
  assert.equal(getEnemyUnitDestructionsForTurn(state(), "p1", 1).length, 1);
});

test("returns start-of-turn unit and objective state", () => {
  const base = state();
  const withSnapshots = {
    ...base,
    scoring: { turnSnapshots: [createTurnSnapshot(base, { turn: 1, round: 1, playerId: "p2" })] }
  };
  assert.equal(getUnitStateAtTurnStart(withSnapshots, "u1", 1).status, "deployed");
  assert.equal(getObjectiveStateAtTurnStart(withSnapshots, "obj-1", 1).control.controllerId, "p1");
});
