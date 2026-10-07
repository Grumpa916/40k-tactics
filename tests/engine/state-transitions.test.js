import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import {
  startBattle,
  deployUnit,
  startFirstTurn,
  changePhase,
  changeActivePlayer,
  completeBattle
} from "../../src/engine/state-transitions.js";

test("state transitions progress a battle and record events", () => {
  let state = createGameState({
    units: [createUnit({ id: "u1", ownerId: "p1", name: "Unit 1" })]
  });

  state = startBattle(state, { battleId: "b1", missionId: "m1" });
  assert.equal(state.battle.status, "deployment");
  assert.equal(state.history.at(-1).type, "battle.started");

  state = deployUnit(state, { unitId: "u1", position: { x: 10, y: 20 } });
  assert.equal(state.units[0].status, "deployed");
  assert.equal(state.history.at(-1).type, "unit.deployed");

  state = startFirstTurn(state, { activePlayerId: "p1" });
  assert.equal(state.turn, 1);
  assert.equal(state.phase, "command");
  assert.equal(state.battle.status, "active");

  state = changePhase(state, { phase: "movement" });
  assert.equal(state.phase, "movement");

  state = changeActivePlayer(state, { activePlayerId: "p2" });
  assert.equal(state.activePlayer, "p2");
  assert.equal(state.battle.activePlayerId, "p2");

  state = completeBattle(state);
  assert.equal(state.battle.status, "complete");
  assert.equal(state.phase, "complete");
  assert.equal(state.history.at(-1).type, "battle.completed");
});

test("transitions reject invalid phase and missing battle state", () => {
  const state = createGameState();
  assert.throws(() => changePhase(state, { phase: "invalid" }), /Unknown phase/);
  assert.throws(() => completeBattle(state), /Battle must be active/);
});
