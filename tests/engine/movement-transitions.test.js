import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";
import { resolveNormalMove, recordFallBack } from "../../src/engine/movement-transitions.js";

function movementState(overrides = {}) {
  return createGameState({
    phase: "movement",
    turn: 1,
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

test("resolves one move to each model's destination and records the state change", () => {
  const state = movementState();
  const next = resolveNormalMove(state, {
    unitId: "u1",
    moves: [
      { modelId: "m1", position: { x: 3, y: 4 } },
      { modelId: "m2", position: { x: 1, y: 4 } }
    ]
  });

  assert.deepEqual(next.units[0].models.map((model) => model.position), [
    { x: 3, y: 4 },
    { x: 1, y: 4 }
  ]);
  assert.deepEqual(state.units[0].models[0].position, { x: 0, y: 0 });
  assert.equal(next.history.at(-1).type, "unit.normal_move_resolved");
  assert.deepEqual(next.history.at(-1).payload.moves[0], {
    modelId: "m1",
    from: { x: 0, y: 0 },
    to: { x: 3, y: 4 },
    distance: 5,
    movement: 6
  });
});

test("rejects a destination beyond Movement", () => {
  assert.throws(() => resolveNormalMove(movementState(), {
    unitId: "u1",
    moves: [
      { modelId: "m1", position: { x: 7, y: 0 } },
      { modelId: "m2", position: { x: 1, y: 1 } }
    ]
  }), /cannot move farther/);
});

test("rejects incomplete, duplicate, or malformed model destinations", () => {
  assert.throws(() => resolveNormalMove(movementState(), {
    unitId: "u1",
    moves: [{ modelId: "m1", position: { x: 1, y: 0 } }]
  }), /every model/);
  assert.throws(() => resolveNormalMove(movementState(), {
    unitId: "u1",
    moves: [
      { modelId: "m1", position: { x: 1, y: 0 } },
      { modelId: "m1", position: { x: 2, y: 0 } }
    ]
  }), /exactly one/);
  assert.throws(() => resolveNormalMove(movementState(), {
    unitId: "u1",
    moves: [
      { modelId: "m1", position: { x: 1, y: 0 } },
      { modelId: "m2", position: { x: NaN, y: 0 } }
    ]
  }), /valid battlefield position/);
});

test("enforces active player, deployed status, and Movement phase", () => {
  const moves = [
    { modelId: "m1", position: { x: 1, y: 0 } },
    { modelId: "m2", position: { x: 2, y: 0 } }
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

test("uses each model's own Movement characteristic when it differs", () => {
  const state = movementState({
    units: [createUnit({
      id: "attached",
      ownerId: "p1",
      name: "Bodyguard and Leader",
      status: UNIT_STATUS.DEPLOYED,
      profile: { characteristics: { movement: 4 } },
      models: [
        { id: "bodyguard", position: { x: 0, y: 0 } },
        {
          id: "leader",
          position: { x: 0, y: 1 },
          profile: { characteristics: { movement: "6\"" } }
        }
      ]
    })]
  });
  const next = resolveNormalMove(state, {
    unitId: "attached",
    moves: [
      { modelId: "bodyguard", position: { x: 4, y: 0 } },
      { modelId: "leader", position: { x: 6, y: 1 } }
    ]
  });
  assert.equal(next.history.at(-1).payload.moves[0].movement, 4);
  assert.equal(next.history.at(-1).payload.moves[1].movement, 6);
});

test("a unit cannot make a second Normal Move in the same turn", () => {
  const state = movementState();
  const first = resolveNormalMove(state, {
    unitId: "u1",
    moves: [
      { modelId: "m1", position: { x: 1, y: 0 } },
      { modelId: "m2", position: { x: 2, y: 0 } }
    ]
  });
  assert.throws(() => resolveNormalMove(first, {
    unitId: "u1",
    moves: [
      { modelId: "m1", position: { x: 2, y: 0 } },
      { modelId: "m2", position: { x: 3, y: 0 } }
    ]
  }), /one Normal Move per turn/);
});

test("supports legacy single-position units as one-model units", () => {
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
    moves: [{ modelId: "solo", position: { x: 6, y: 0 } }]
  });
  assert.deepEqual(next.units[0].position, { x: 6, y: 0 });
});


test("records a Fall Back as an authoritative movement event without changing position", () => {
  const state = movementState();
  const next = recordFallBack(state, { unitId: "u1" });

  assert.deepEqual(next.units[0].models.map((model) => model.position), [
    { x: 0, y: 0 },
    { x: 1, y: 0 }
  ]);
  assert.deepEqual(next.history.at(-1).payload, {
    unitId: "u1",
    playerId: "p1",
    phase: "movement",
    round: 1,
    turn: 1
  });
  assert.equal(next.history.at(-1).type, "unit.fell_back");
});

test("enforces active player, deployed status, Movement phase, and one Fall Back per turn", () => {
  assert.throws(() => recordFallBack(movementState({ phase: "shooting" }), { unitId: "u1" }), /Movement phase/);
  assert.throws(() => recordFallBack(movementState({ activePlayer: "p2" }), { unitId: "u1" }), /active player's/);
  const undeployed = movementState();
  undeployed.units[0] = { ...undeployed.units[0], status: UNIT_STATUS.RESERVES };
  assert.throws(() => recordFallBack(undeployed, { unitId: "u1" }), /deployed/);
  const first = recordFallBack(movementState(), { unitId: "u1" });
  assert.throws(() => recordFallBack(first, { unitId: "u1" }), /only once per turn/);
});
