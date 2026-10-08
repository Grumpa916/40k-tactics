import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { getShootingCandidates } from "../../src/rules/shooting-candidates.js";
import { recordShootingActivation, completeShootingPhase } from "../../src/engine/shooting-transitions.js";

function state() {
  return createGameState({
    phase: "shooting",
    turn: 2,
    activePlayer: "p1",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p1" },
    units: [
      { id: "p1-a", ownerId: "p1", name: "Shooter A", status: "deployed" },
      { id: "p1-b", ownerId: "p1", name: "Shooter B", status: "deployed" },
      { id: "p2-a", ownerId: "p2", name: "Opponent", status: "deployed" }
    ]
  });
}

test("Shooting candidates contain only deployed units owned by the active player", () => {
  assert.deepEqual(getShootingCandidates(state()).available, ["p1-a", "p1-b"]);
});

test("Shooting activation records the unit and removes it from candidates", () => {
  const next = recordShootingActivation(state(), { unitId: "p1-a", actionType: "shoot" });
  assert.deepEqual(getShootingCandidates(next).available, ["p1-b"]);
  assert.equal(next.history.at(-1).type, "shooting.unit_activated");
  assert.equal(next.history.at(-1).payload.playerId, "p1");
  assert.equal(next.history.at(-1).payload.actionType, "shoot");
  assert.equal(next.history.at(-1).payload.actionId, null);
});

test("Shooting cannot activate the opponent's unit during your turn", () => {
  assert.throws(
    () => recordShootingActivation(state(), { unitId: "p2-a" }),
    /Only the active player's units/
  );
});

test("Shooting cannot complete while eligible units remain", () => {
  assert.throws(
    () => completeShootingPhase(state()),
    /eligible units remain/
  );
});

test("Shooting completion advances to Charge after all candidates are recorded", () => {
  let current = state();
  current = recordShootingActivation(current, { unitId: "p1-a" });
  current = recordShootingActivation(current, { unitId: "p1-b" });
  current = completeShootingPhase(current);
  assert.equal(current.phase, "charge");
  assert.deepEqual(
    current.history.slice(-2).map((event) => event.type),
    ["shooting.phase_completed", "turn.phase_changed"]
  );
});

test("Shooting mission actions consume the activation without a combat event", () => {
  const next = recordShootingActivation(state(), {
    unitId: "p1-a",
    actionType: "mission_action",
    actionId: "cleanse"
  });
  assert.deepEqual(getShootingCandidates(next).available, ["p1-b"]);
  assert.deepEqual(next.history.at(-1).payload, {
    unitId: "p1-a",
    playerId: "p1",
    round: 1,
    turn: 2,
    actionType: "mission_action",
    actionId: "cleanse"
  });
  assert.equal(next.history.some((event) => event.type === "combat.attack_resolved"), false);
});

test("Non-shoot Shooting activations require an action id", () => {
  assert.throws(
    () => recordShootingActivation(state(), {
      unitId: "p1-a",
      actionType: "mission_action"
    }),
    /action id is required/
  );
});

test("Shooting cannot record a Shoot activation after Fall Back", () => {
  const fallenBack = {
    ...state(),
    history: [{
      type: "unit.fell_back",
      payload: { unitId: "p1-a", playerId: "p1", phase: "movement", round: 1, turn: 2 }
    }]
  };
  assert.throws(
    () => recordShootingActivation(fallenBack, { unitId: "p1-a", actionType: "shoot" }),
    /Fell Back cannot shoot/
  );
});

test("Shooting supports the opponent when the active turn belongs to the opponent", () => {
  const opponentTurn = createGameState({
    ...state(),
    activePlayer: "p2",
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p2" },
    units: [
      { id: "p1-target", ownerId: "p1", name: "Your Unit", status: "deployed" },
      { id: "p2-shooter", ownerId: "p2", name: "Opponent Shooter", status: "deployed" }
    ]
  });

  assert.deepEqual(getShootingCandidates(opponentTurn).available, ["p2-shooter"]);

  const next = recordShootingActivation(opponentTurn, {
    unitId: "p2-shooter",
    actionType: "shoot"
  });

  assert.deepEqual(getShootingCandidates(next).available, []);
  assert.deepEqual(next.history.at(-1).payload, {
    unitId: "p2-shooter",
    playerId: "p2",
    round: 1,
    turn: 2,
    actionType: "shoot",
    actionId: null
  });
});
