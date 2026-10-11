import test from "node:test";
import assert from "node:assert/strict";
import { createCommandScreen } from "../../src/ui/command-screen.js";
import { createCommand } from "../../src/commands/command.js";
import { COMMAND_TYPES } from "../../src/commands/game-commands.js";
import { clearCommandHandlers, executeCommand } from "../../src/engine/command-engine.js";
import { registerCoreCommandHandlers } from "../../src/engine/register-core-commands.js";
import { createGameState } from "../../src/state/game-state.js";

test("Command screen exposes and executes safe undo for the latest VP award", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  let state = createGameState({
    phase: "command",
    turn: 1,
    activePlayer: "p1",
    players: [{ id: "p1", name: "Player One" }, { id: "p2", name: "Player Two" }],
    battle: { id: "b1", status: "active", round: 1 }
  });
  state = executeCommand(state, createCommand(COMMAND_TYPES.RECORD_VICTORY_POINTS, {
    playerId: "p1", amount: 3, reason: "Test award"
  }));

  const listeners = {};
  let subscriber = null;
  const container = {
    innerHTML: "",
    addEventListener(type, handler) { listeners[type] = handler; },
    removeEventListener(type) { delete listeners[type]; },
    contains() { return true; },
    replaceChildren() { this.innerHTML = ""; },
    querySelector() { return null; }
  };
  const session = {
    getState() { return state; },
    subscribe(callback) { subscriber = callback; return () => { subscriber = null; }; },
    dispatch(command) {
      state = executeCommand(state, command);
      subscriber?.(state);
      return state;
    }
  };
  const screen = createCommandScreen(container, {
    session,
    perspectivePlayerId: "p1",
    missionDefinitions: [],
    secondaryMissionCatalog: []
  });

  assert.match(container.innerHTML, /Undo latest VP entry/);
  const undoButton = {
    closest(selector) { return selector.includes("[data-vp-undo]") ? this : null; },
    hasAttribute(name) { return name === "data-vp-undo"; }
  };
  listeners.click({ target: undoButton });

  assert.equal(state.victoryPoints.p1, 0);
  assert.equal(state.history.at(-1).type, "victory_points.award_undone");
  assert.doesNotMatch(container.innerHTML, /Undo latest VP entry/);
  assert.match(container.innerHTML, /Undid latest VP entry \(\+3 VP\) for Player One/);
  screen.destroy();
  clearCommandHandlers();
});


test("Command screen exposes add and subtract choices for manual VP adjustments", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  const state = createGameState({
    phase: "command", turn: 1, activePlayer: "p1",
    players: [{ id: "p1", name: "Player One" }, { id: "p2", name: "Player Two" }],
    battle: { id: "b1", status: "active", round: 1 }
  });
  const container = {
    innerHTML: "",
    addEventListener() {},
    removeEventListener() {},
    contains() { return true; },
    replaceChildren() { this.innerHTML = ""; },
    querySelector() { return null; }
  };
  const session = { getState: () => state, subscribe() { return () => {}; }, dispatch() {} };
  const screen = createCommandScreen(container, {
    session, perspectivePlayerId: "p1", missionDefinitions: [], secondaryMissionCatalog: []
  });
  assert.match(container.innerHTML, /value="add" selected>Add VP/);
  assert.match(container.innerHTML, /value="deduct">Subtract VP/);
  assert.match(container.innerHTML, /deductions cannot reduce a score below zero/);
  screen.destroy();
  clearCommandHandlers();
});


test("Command screen records objective control and reflects it on the live map", () => {
  clearCommandHandlers();
  registerCoreCommandHandlers();
  let state = createGameState({
    phase: "command",
    turn: 1,
    activePlayer: "p1",
    players: [{ id: "p1", name: "Player One" }, { id: "p2", name: "Player Two" }],
    battle: { id: "b1", status: "active", round: 1 },
    objectives: [{ id: "obj-1", name: "Central Objective", position: { x: 30, y: 22 } }]
  });
  const listeners = {};
  let subscriber = null;
  const container = {
    innerHTML: "",
    addEventListener(type, handler) { listeners[type] = handler; },
    removeEventListener(type) { delete listeners[type]; },
    contains() { return true; },
    replaceChildren() { this.innerHTML = ""; },
    querySelector() { return null; }
  };
  const session = {
    getState() { return state; },
    subscribe(callback) { subscriber = callback; return () => { subscriber = null; }; },
    dispatch(command) {
      state = executeCommand(state, command);
      subscriber?.(state);
      return state;
    }
  };
  const screen = createCommandScreen(container, {
    session, perspectivePlayerId: "p1", missionDefinitions: [], secondaryMissionCatalog: []
  });
  assert.match(container.innerHTML, /data-objective-control-set="controlled"/);
  assert.match(container.innerHTML, /Live battlefield map/);

  const controlButton = {
    closest(selector) { return selector.includes("[data-objective-control-set]") ? this : null; },
    hasAttribute(name) { return name === "data-objective-control-set"; },
    getAttribute(name) {
      return name === "data-objective-id" ? "obj-1" :
        name === "data-objective-control-set" ? "controlled" : null;
    }
  };
  listeners.click({ target: controlButton });

  assert.equal(state.objectives[0].control.controlState, "controlled");
  assert.equal(state.objectives[0].control.controllerId, "p1");
  assert.match(container.innerHTML, /Central Objective: control recorded for you/);
  assert.match(container.innerHTML, /data-objective-control="Controlled by Player One"/);
  assert.equal(state.history.at(-1).type, "objective.control_recorded");
  screen.destroy();
  clearCommandHandlers();
});
