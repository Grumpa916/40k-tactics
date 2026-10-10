import test from "node:test";
import assert from "node:assert/strict";
import { createBattleSetupScreen } from "../../src/ui/battle-setup-screen.js";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit, UNIT_STATUS } from "../../src/state/unit.js";

function setup() {
  const state = createGameState({
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    units: [
      createUnit({ id: "friendly", ownerId: "p1", name: "Friendly Unit", status: UNIT_STATUS.RESERVES }),
      createUnit({ id: "enemy", ownerId: "p2", name: "Enemy Unit", status: UNIT_STATUS.RESERVES })
    ]
  });
  const commands = [];
  const listeners = {};
  const root = {
    innerHTML: "",
    addEventListener(type, listener) { listeners[type] = listener; },
    removeEventListener(type) { delete listeners[type]; },
    replaceChildren() { this.innerHTML = ""; },
    querySelector() { return null; }
  };
  const session = {
    getState: () => state,
    dispatch: (command) => commands.push(command),
    subscribe() { return () => {}; }
  };
  return { root, session, commands, listeners };
}

test("setup planning map offers only the perspective player's units", () => {
  const { root, session } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  assert.match(root.innerHTML, /Deployment Planning Map/);
  assert.match(root.innerHTML, /Friendly Unit/);
  assert.doesNotMatch(root.innerHTML, /<option value="enemy"/);
  assert.match(root.innerHTML, /data-battlefield-map/);
  screen.destroy();
});

test("selecting a unit and tapping the planning map records a bounded coordinate command", () => {
  const { root, session, commands, listeners } = setup();
  const screen = createBattleSetupScreen(root, { session, perspectivePlayerId: "p1" });
  listeners.click({
    target: {
      closest(selector) {
        return selector === "[data-planning-unit-select]" ? { value: "friendly" } : null;
      }
    }
  });
  const board = {
    closest(selector) { return selector === '[data-map-mode="planning"]' ? {} : null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 440 }; }
  };
  listeners.click({
    clientX: 300,
    clientY: 220,
    target: { closest(selector) { return selector === "[data-battlefield-map-board]" ? board : null; } }
  });
  assert.deepEqual(commands, [{
    type: "battlefield_map.set_deployment_plan_position",
    payload: { unitId: "friendly", playerId: "p1", position: { x: 30, y: 22 } }
  }]);
  screen.destroy();
});
