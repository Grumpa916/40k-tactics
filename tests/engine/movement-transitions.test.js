import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";
import { resolveNormalMove } from "../../src/engine/movement-transitions.js";

function movementState(overrides = {}) {
  return createGameState({
    phase: "movement",
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1 },
    units: [createUnit({
      id: "u1",
      ownerId: "p1",
      name: "Unit 1",
      status: UNIT_STATUS.DEPLOYED,
      profile: { characteristics: { movement: "6\"" } },
      models: [
        { id: "m1", position: { x: 0, y: 0 } },
        { id: "m2", position: { x: 1, y: 0 } }
      ]
    })],
    ...overrides
  });
}

test("resolves a Normal Move for every model and records the move", () => {
  const state = movementState();
  const next = resolveNormalMove(state, {
    unitId: "u1",
    moves: [
      { modelId: "m1", path: [{ x: 3, y: 0 }, { x: 3, y: 2 }] },
      { modelId: "m2", path: [{ x: 1, y: 4 }] }
    ]
  });

  assert.deepEqual(next.units[0].models, [
    { id: "m1", position: { x: 3, y: 2 } },
    { id: "m2", position: { x: 1, y: 4 } }
  ]);
  assert.deepEqual(state.units[0].models[0].position, { x: 0, y: 0 });
  assert.equal(next.history.at(-1).type, "unit.normal_move_resolved");
  assert.equal(next.history.at(-1).payload.movement, 6);
});

test("rejects a model path that exceeds Movement even when its endpoint is close", () => {
  assert.throws(() => resolveNormalMove(movementState(), {
    unitId: "u1",
    moves: [
      { modelId: "m1", path: [{ x: 4, y: 0 }, { x: 0, y: 0 }] },
      { modelId: "m2", path: [{ x: 1, y: 1 }] }
    ]
  }), /cannot move farther/);
});

test("rejects incomplete, duplicate, or malformed model paths", () => {
  assert.throws(() => resolveNormalMove(movementState(), {
    unitId: "u1",
    moves: [{ modelId: "m1", path: [{ x: 1, y: 0 }] }]
  }), /every model/);
  assert.throws(() => resolveNormalMove(movementState(), {
    unitId: "u1",
    moves: [
      { modelId: "m1", path: [{ x: 1, y: 0 }] },
      { modelId: "m1", path: [{ x: 2, y: 0 }] }
    ]
  }), /exactly one/);
});

test("enforces active player, deployed status, and Movement phase", () => {
  const moves = [
    { modelId: "m1", path: [{ x: 1, y: 0 }] },
    { modelId: "m2", path: [{ x: 2, y: 0 }] }
  ];
  assert.throws(() => resolveNormalMove(movementState({ phase: "shooting" }), {
    unitId: "u1", moves
  }), /Movement phase/);
  assert.throws(() => resolveNormalMove(movementState({ activePlayer: "p2" }), {
    unitId: "u1", moves
  }), /active player's/);
  const undeployed = movementState();
  undeployed.units[0] = { ...undeployed.units[0], status: UNIT_STATUS.RESERVES };
  assert.throws(() => resolveNormalMove(undeployed, { unitId: "u1", moves }), /deployed/);
});


test("a unit cannot make a second Normal Move in the same turn", () => {
  const state = movementState({ turn: 4 });
  const first = resolveNormalMove(state, {
    unitId: "u1",
    moves: [
      { modelId: "m1", path: [{ x: 1, y: 0 }] },
      { modelId: "m2", path: [{ x: 2, y: 0 }] }
    ]
  });
  assert.throws(() => resolveNormalMove(first, {
    unitId: "u1",
    moves: [
      { modelId: "m1", path: [{ x: 2, y: 0 }] },
      { modelId: "m2", path: [{ x: 3, y: 0 }] }
    ]
  }), /one Normal Move per turn/);
});
\ntest("supports legacy single-position units as one-model units", () => {
  const state = movementState({
    units: [createUnit({
      id: "solo",
      ownerId: "p1",
      name: "Solo",
      status: UNIT_STATUS.DEPLOYED,
      position: { x: 0, y: 0 },
      profile: { characteristics: { movement: 6 } }
    })]
  });
  const next = resolveNormalMove(state, {
    unitId: "solo",
    moves: [{ modelId: "solo", path: [{ x: 6, y: 0 }] }]
  });
  assert.deepEqual(next.units[0].position, { x: 6, y: 0 });
});
