import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import {
  setActualDeploymentPosition,
  declareUnitReserve
} from "../../src/engine/battlefield-map-transitions.js";

function deploymentState() {
  return createGameState({
    battle: { id: "b1", status: "deployment" },
    players: [{ id: "p1" }, { id: "p2" }],
    units: [
      createUnit({ id: "u1", ownerId: "p1", name: "Friendly" }),
      createUnit({ id: "u2", ownerId: "p2", name: "Opponent" })
    ]
  });
}

test("actual deployment records and corrects positions separately from the plan", () => {
  let state = deploymentState();
  state = {
    ...state,
    battlefieldMap: { deploymentPlan: { u1: { x: 5, y: 6 } } }
  };
  state = setActualDeploymentPosition(state, {
    unitId: "u1", playerId: "p1", position: { x: 12.34, y: 8.76 }
  });

  assert.deepEqual(state.battlefieldMap.deploymentPlan.u1, { x: 5, y: 6 });
  assert.deepEqual(state.battlefieldMap.actualDeployment.u1, { x: 12.3, y: 8.8 });
  assert.deepEqual(state.units.find((unit) => unit.id === "u1").position, { x: 12.3, y: 8.8 });
  assert.equal(state.units.find((unit) => unit.id === "u1").status, "deployed");
  assert.equal(state.history.at(-1).type, "battlefield_map.actual_deployment_position_set");

  state = setActualDeploymentPosition(state, {
    unitId: "u1", playerId: "p1", position: { x: 18, y: 21 }
  });
  assert.deepEqual(state.battlefieldMap.actualDeployment.u1, { x: 18, y: 21 });
  assert.deepEqual(state.history.at(-1).payload.previousPosition, { x: 12.3, y: 8.8 });
});

test("a unit must be explicitly declared in reserves and can be moved back onto the map", () => {
  let state = deploymentState();
  state = declareUnitReserve(state, { unitId: "u1", playerId: "p1" });
  assert.equal(state.battlefieldMap.declaredReserves.u1, true);
  assert.equal(state.battlefieldMap.actualDeployment.u1, undefined);
  assert.equal(state.units.find((unit) => unit.id === "u1").status, "reserves");

  state = setActualDeploymentPosition(state, {
    unitId: "u1", playerId: "p1", position: { x: 9, y: 11 }
  });
  assert.equal(state.battlefieldMap.declaredReserves.u1, undefined);
  assert.deepEqual(state.battlefieldMap.actualDeployment.u1, { x: 9, y: 11 });
});

test("actual deployment rejects wrong owners, destroyed units, invalid positions, and non-deployment phases", () => {
  const state = deploymentState();
  assert.throws(() => setActualDeploymentPosition(state, {
    unitId: "u1", playerId: "p2", position: { x: 1, y: 1 }
  }), /owning player/);
  assert.throws(() => setActualDeploymentPosition(state, {
    unitId: "u1", playerId: "p1", position: { x: 61, y: 1 }
  }), /60 by 44/);
  assert.throws(() => declareUnitReserve(state, {
    unitId: "u1", playerId: "p2"
  }), /owning player/);
  assert.throws(() => setActualDeploymentPosition({
    ...state, battle: { id: "b1", status: "active" }
  }, { unitId: "u1", playerId: "p1", position: { x: 1, y: 1 } }), /only be recorded during deployment/);
});
