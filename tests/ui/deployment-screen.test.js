import test from "node:test";
import assert from "node:assert/strict";
import { createDeploymentScreen } from "../../src/ui/deployment-screen.js";
import { createGameState } from "../../src/state/game-state.js";
import { createUnit } from "../../src/state/unit.js";

function rootContainer() {
  return {
    innerHTML: "",
    listeners: new Map(),
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      this.listeners.get(type)?.delete(listener);
    },
    replaceChildren() { this.innerHTML = ""; }
  };
}

function sessionFor(state) {
  const listeners = new Set();
  return {
    getState: () => state,
    dispatch() { throw new Error("Unexpected dispatch in render-only test"); },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

test("deployment screen shows both armies and distinguishes deployed, declared reserve, and unaccounted units", () => {
  const state = createGameState({
    activePlayer: "p1",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", status: "deployment" },
    units: [
      createUnit({ id: "friendly", ownerId: "p1", name: "Friendly Squad", status: "deployed", position: { x: 10, y: 8 } }),
      createUnit({ id: "reserve", ownerId: "p1", name: "Reserve Squad" }),
      createUnit({ id: "enemy", ownerId: "p2", name: "Opponent Squad", status: "deployed", position: { x: 45, y: 30 } })
    ],
    battlefieldMap: {
      actualDeployment: {
        friendly: { x: 10, y: 8 },
        enemy: { x: 45, y: 30 }
      },
      declaredReserves: { reserve: true }
    }
  });
  const root = rootContainer();
  const screen = createDeploymentScreen(root, {
    session: sessionFor(state),
    perspectivePlayerId: "p1"
  });

  assert.match(root.innerHTML, /Actual Deployment/);
  assert.match(root.innerHTML, /Friendly Squad/);
  assert.match(root.innerHTML, /Opponent Squad/);
  assert.match(root.innerHTML, /1 deployed · 1 declared in reserves · 0 not yet accounted for/);
  assert.match(root.innerHTML, /All non-destroyed units for this player are accounted for/);
  assert.match(root.innerHTML, /data-declare-reserve/);
  assert.match(root.innerHTML, /data-start-first-turn/);
  assert.doesNotMatch(root.innerHTML, /data-start-first-turn disabled/);
  assert.match(root.innerHTML, /Both armies/);

  screen.destroy();
});


test("deployment completion blocks the first turn until both armies are accounted for", () => {
  const state = createGameState({
    activePlayer: "p1",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "b1", status: "deployment" },
    units: [
      createUnit({ id: "friendly", ownerId: "p1", name: "Friendly Squad", status: "deployed", position: { x: 10, y: 8 } }),
      createUnit({ id: "enemy", ownerId: "p2", name: "Opponent Squad" })
    ],
    battlefieldMap: {
      actualDeployment: { friendly: { x: 10, y: 8 } },
      declaredReserves: {}
    }
  });
  const root = rootContainer();
  const screen = createDeploymentScreen(root, {
    session: sessionFor(state),
    perspectivePlayerId: "p1"
  });

  assert.match(root.innerHTML, /Opponent:.*1 unaccounted/s);
  assert.match(root.innerHTML, /data-start-first-turn disabled/);
  assert.match(root.innerHTML, /Both armies must account for every non-destroyed unit/);

  screen.destroy();
});
