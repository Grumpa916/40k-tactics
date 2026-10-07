import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";
import {
  startBattle,
  deployUnit,
  startFirstTurn,
  changePhase,
  endTurn,
  advanceBattleRound,
  changeActivePlayer,
  completeBattle
} from "../../src/engine/state-transitions.js";

function advanceToEndOfTurn(state) {
  for (const phase of ["command", "movement", "shooting", "charge", "fight", "end_turn"]) {
    state = changePhase(state, { phase });
  }
  return state;
}

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
  assert.equal(state.phase, "start_turn");
  assert.equal(state.battle.status, "active");
  assert.equal(state.battle.firstPlayerId, "p1");
  assert.deepEqual(state.history.slice(-2).map((event) => event.type), [
    "battle.round_started",
    "turn.started"
  ]);

  state = changePhase(state, { phase: "command" });
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

test("turns resolve in order and both player turns advance the battle round", () => {
  let state = createGameState({ players: [{ id: "p1" }, { id: "p2" }] });
  state = startBattle(state, { battleId: "b1" });
  state = startFirstTurn(state, { activePlayerId: "p1" });

  assert.throws(() => changePhase(state, { phase: "movement" }), /resolve in order/);
  assert.throws(() => endTurn(state, { nextActivePlayerId: "p2" }), /reach its end step/);
  assert.throws(() => advanceBattleRound(state), /Both players must finish/);

  state = advanceToEndOfTurn(state);
  state = endTurn(state, { nextActivePlayerId: "p2" });
  assert.equal(state.phase, "start_turn");
  assert.equal(state.turn, 2);
  assert.equal(state.battle.round, 1);
  assert.equal(state.activePlayer, "p2");

  state = advanceToEndOfTurn(state);
  state = endTurn(state, { nextActivePlayerId: "p1" });
  assert.equal(state.phase, "end_battle_round");
  assert.equal(state.turn, 2);
  assert.equal(state.battle.round, 1);
  assert.equal(state.activePlayer, null);
  assert.equal(state.history.at(-1).type, "battle.round_ended");

  state = advanceBattleRound(state);
  assert.equal(state.phase, "start_turn");
  assert.equal(state.turn, 3);
  assert.equal(state.battle.round, 2);
  assert.equal(state.activePlayer, "p1");
  assert.equal(state.history.at(-1).type, "turn.started");
});

test("transitions reject invalid phase and missing battle state", () => {
  const state = createGameState();
  assert.throws(() => changePhase(state, { phase: "invalid" }), /Unknown turn step or phase/);
  assert.throws(() => completeBattle(state), /Battle must be active/);
});
