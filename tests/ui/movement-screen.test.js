import test from "node:test";
import assert from "node:assert/strict";
import { createMovementScreen } from "../../src/ui/movement-screen.js";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";

function setup() {
  const state = createGameState({
    phase: "movement",
    turn: 1,
    activePlayer: "p1",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", status: "active", round: 1 },
    units: [
      createUnit({
        id: "friendly",
        ownerId: "p1",
        name: "Intercessors",
        status: UNIT_STATUS.DEPLOYED,
        position: { x: 1, y: 2 },
        profile: { characteristics: { movement: 6 } }
      }),
      createUnit({
        id: "enemy",
        ownerId: "p2",
        name: "Enemy",
        status: UNIT_STATUS.DEPLOYED,
        position: { x: 5, y: 5 },
        profile: { characteristics: { movement: 6 } }
      })
    ]
  });
  const commands = [];
  const listeners = new Set();
  const root = {
    innerHTML: "",
    handlers: {},
    replaceChildren() { this.innerHTML = ""; },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    removeEventListener(type) { delete this.handlers[type]; },
    querySelector(selector) {
      if (selector.includes("data-move-x")) return { value: "4" };
      if (selector.includes("data-move-y")) return { value: "2" };
      return null;
    }
  };
  const session = {
    getState: () => state,
    dispatch: (command) => commands.push(command),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
  return { root, session, commands };
}

test("Movement screen shows only active-player deployed units and Movement limits", () => {
  const { root, session } = setup();
  const screen = createMovementScreen(root, { session, perspectivePlayerId: "p1" });
  assert.match(root.innerHTML, /Movement Phase/);
  assert.match(root.innerHTML, /Intercessors/);
  assert.match(root.innerHTML, /data-map-unit-id="enemy"/);
  assert.doesNotMatch(root.innerHTML, /data-move-unit="enemy"/);
  assert.match(root.innerHTML, /Move up to 6/);
  screen.destroy();
});

test("Movement screen records Fall Back through the core command", () => {
  const { root, session, commands } = setup();
  const screen = createMovementScreen(root, { session, perspectivePlayerId: "p1" });
  root.handlers.click({
    target: {
      closest: () => ({
        dataset: { moveFallback: "" },
        hasAttribute: (name) => name === "data-move-fallback"
      })
    }
  });
  assert.deepEqual(commands, [{
    type: "unit.record_fall_back",
    payload: { unitId: "friendly" }
  }]);
  screen.destroy();
});
