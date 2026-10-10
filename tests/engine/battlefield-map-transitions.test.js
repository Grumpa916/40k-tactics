import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";
import {
  setDeploymentPlanPosition,
  clearDeploymentPlanPosition,
  clearDeploymentPlan
} from "../../src/engine/battlefield-map-transitions.js";

function stateForTest() {
  return createGameState({
    players: [{ id: "p1" }, { id: "p2" }],
    units: [
      createUnit({ id: "u1", ownerId: "p1", name: "Friendly", status: UNIT_STATUS.RESERVES }),
      createUnit({ id: "u2", ownerId: "p2", name: "Opponent", status: UNIT_STATUS.RESERVES })
    ]
  });
}

test("deployment plan positions are bounded and normalized to tenths of an inch", () => {
  const next = setDeploymentPlanPosition(stateForTest(), {
    unitId: "u1", playerId: "p1", position: { x: 10.26, y: 21.14 }
  });
  assert.deepEqual(next.battlefieldMap.deploymentPlan.u1, { x: 10.3, y: 21.1 });
  assert.equal(next.history.at(-1).type, "battlefield_map.deployment_plan_position_set");
  assert.throws(() => setDeploymentPlanPosition(stateForTest(), {
    unitId: "u1", playerId: "p1", position: { x: 60.1, y: 2 }
  }), /within the 60 by 44 inch battlefield/);
});

test("deployment planning cannot position opponent units", () => {
  assert.throws(() => setDeploymentPlanPosition(stateForTest(), {
    unitId: "u2", playerId: "p1", position: { x: 10, y: 10 }
  }), /Only your own units/);
});

test("clearing one planned position preserves other planned positions", () => {
  const state = {
    ...stateForTest(),
    battlefieldMap: { deploymentPlan: { u1: { x: 2, y: 3 }, u2: { x: 4, y: 5 } } }
  };
  const next = clearDeploymentPlanPosition(state, { unitId: "u1", playerId: "p1" });
  assert.deepEqual(next.battlefieldMap.deploymentPlan, { u2: { x: 4, y: 5 } });
  assert.equal(next.history.at(-1).type, "battlefield_map.deployment_plan_position_cleared");
});

test("clearing a player's plan does not remove another player's entries", () => {
  const state = {
    ...stateForTest(),
    battlefieldMap: { deploymentPlan: { u1: { x: 2, y: 3 }, u2: { x: 4, y: 5 } } }
  };
  const next = clearDeploymentPlan(state, { playerId: "p1" });
  assert.deepEqual(next.battlefieldMap.deploymentPlan, { u2: { x: 4, y: 5 } });
});

test("deployment plan cannot be changed after deployment begins", () => {
  const state = { ...stateForTest(), battle: { status: "deployment" } };
  assert.throws(() => setDeploymentPlanPosition(state, {
    unitId: "u1", playerId: "p1", position: { x: 2, y: 3 }
  }), /locked after deployment begins/);
});
