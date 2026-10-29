import test from "node:test";
import assert from "node:assert/strict";
import { createTurnSnapshot } from "../../src/rules/scoring-evidence-state.js";

test("turn-start scoring evidence captures live model positions after movement instead of stale unit.position", () => {
  const state = {
    turn: 2,
    activePlayer: "p1",
    battle: { round: 2, activePlayerId: "p1" },
    battlefieldMap: {
      actualDeployment: {
        enemy: { position: { x: 5, y: 5 } }
      }
    },
    objectives: [],
    units: [{
      id: "enemy",
      ownerId: "p2",
      status: "deployed",
      wounds: 6,
      position: { x: 5, y: 5 },
      models: [
        { id: "m1", position: { x: 20, y: 20 } },
        { id: "m2", position: { x: 22, y: 20 } }
      ]
    }],
    history: [{
      type: "unit.normal_move_resolved",
      payload: {
        unitId: "enemy",
        round: 1,
        turn: 1,
        moves: [{ modelId: "m1", to: { x: 20, y: 20 } }, { modelId: "m2", to: { x: 22, y: 20 } }]
      }
    }]
  };

  const snapshot = createTurnSnapshot(state, { turn: 2, round: 2, playerId: "p1" });
  assert.deepEqual(snapshot.units[0].position, { x: 21, y: 20 });
  assert.notDeepEqual(snapshot.units[0].position, state.units[0].position);
});
