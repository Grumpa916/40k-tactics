import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../state/game-state.js";
import { BATTLE_STATUS } from "../state/battle.js";
import { changePhase } from "./state-transitions.js";
import {
  drawSecondaryMission,
  getSecondaryMissionHistory,
  setSecondaryMissionMode
} from "../rules/secondary-mission-lifecycle.js";
import { getCommandPointBalance } from "./command-points-ledger.js";
import { useSecondaryMissionRedraw } from "./secondary-mission-redraw.js";

function setup({ mode = "tactical", cp = 1 } = {}) {
  let state = createGameState({
    phase: "command", turn: 1, activePlayer: "p1",
    battle: { round: 1, activePlayerId: "p1" },
    commandPoints: { p1: cp }
  });
  state = setSecondaryMissionMode(state, { mode });
  const draw = (id) => {
    state = drawSecondaryMission(state, {
      playerId: "p1", round: 1, turn: 1,
      definition: {
        id, name: id, category: "secondary",
        availableModes: ["tactical"], timing: "end-of-turn", conditions: []
      }
    });
  };
  if (mode === "tactical") {
    draw("tactical-a");
    draw("tactical-b");
  }
  return state;
}

test("New Orders spends 1 CP, discards one active card, and tracks a pending replacement", () => {
  let state = setup();
  const [first, second] = getSecondaryMissionHistory(state, "p1");
  state = useSecondaryMissionRedraw(state, {
    playerId: "p1", instanceId: first.instanceId, round: 1, turn: 1
  });
  assert.equal(getCommandPointBalance(state, "p1"), 0);
  assert.equal(getSecondaryMissionHistory(state, "p1")[0].status, "discarded");
  assert.equal(getSecondaryMissionHistory(state, "p1")[1].status, "active");
  assert.deepEqual(state.scoring.secondaryMissionRedrawPendingByPlayer.p1, { round: 1, turn: 1 });
  assert.equal(state.scoring.secondaryMissionRedrawUsedByPlayer.p1, true);
  assert.equal(state.history.at(-1).type, "secondary_mission.redraw_used");
  const activeBattle = { ...state, battle: { ...state.battle, status: BATTLE_STATUS.ACTIVE } };
  assert.throws(() => changePhase(activeBattle, { phase: "movement" }),
    /Record the New Orders replacement card before leaving the Command phase/);
  assert.throws(() => drawSecondaryMission(state, {
    playerId: "p1", round: 1, turn: 1, definition: first.definition
  }), /already been drawn/);

  state = drawSecondaryMission(state, {
    playerId: "p1", round: 1, turn: 1,
    definition: {
      id: "replacement-card", name: "Replacement", category: "secondary",
      availableModes: ["tactical"], timing: "end-of-turn", conditions: []
    }
  });
  const history = getSecondaryMissionHistory(state, "p1");
  assert.equal(history.length, 3);
  assert.equal(history[2].isRedrawReplacement, true);
  assert.equal(state.scoring.secondaryMissionRedrawPendingByPlayer.p1, undefined);
  assert.equal(history.find((item) => item.instanceId === second.instanceId).status, "active");
});

test("New Orders can only be used once per player per battle", () => {
  let state = setup();
  const card = getSecondaryMissionHistory(state, "p1")[0];
  state = useSecondaryMissionRedraw(state, {
    playerId: "p1", instanceId: card.instanceId, round: 1, turn: 1
  });
  assert.throws(() => useSecondaryMissionRedraw(state, {
    playerId: "p1", instanceId: getSecondaryMissionHistory(state, "p1")[1].instanceId,
    round: 1, turn: 1
  }), /already been used/);
});

test("New Orders rejects missing CP, Fixed mode, non-Command phase, and opponent cards", () => {
  let state = setup({ cp: 0 });
  let card = getSecondaryMissionHistory(state, "p1")[0];
  assert.throws(() => useSecondaryMissionRedraw(state, {
    playerId: "p1", instanceId: card.instanceId
  }), /does not have enough Command Points/);

  state = setup({ mode: "fixed", cp: 1 });
  assert.throws(() => useSecondaryMissionRedraw(state, {
    playerId: "p1", instanceId: "missing"
  }), /only when using Tactical/);

  state = setup();
  card = getSecondaryMissionHistory(state, "p1")[0];
  assert.throws(() => useSecondaryMissionRedraw({ ...state, phase: "shooting" }, {
    playerId: "p1", instanceId: card.instanceId
  }), /only be used during the Command phase/);
  assert.throws(() => useSecondaryMissionRedraw(state, {
    playerId: "p2", instanceId: card.instanceId
  }), /Only the active player/);
});
