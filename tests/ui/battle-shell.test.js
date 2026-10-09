import test from "node:test";
import assert from "node:assert/strict";
import { createBattleShell } from "../../src/ui/battle-shell.js";
import { createCommandScreen } from "../../src/ui/command-screen.js";

function sessionFor(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState(nextState) {
      state = nextState;
      for (const listener of listeners) listener(state);
    }
  };
}

function container() {
  const screens = new Map();
  return {
    children: [],
    html: "",
    replaceChildren(...children) {
      this.children = children;
      this.html = "";
    },
    set innerHTML(value) {
      this.html = value;
      const screen = {
        innerHTML: "",
        querySelector: () => null
      };
      screens.set("screen", screen);
      this._screen = screen;
    },
    get innerHTML() {
      return this.html;
    },
    querySelector(selector) {
      if (selector === "[data-battle-screen]") return this._screen;
      if (selector === ".battle-shell__header h1") {
        return {
          set textContent(value) {
            this._heading = value;
          },
          get textContent() {
            return this._heading;
          }
        };
      }
      return null;
    }
  };
}

test("shared battle shell mounts the current implemented phase", () => {
  const session = sessionFor({
    phase: "shooting",
    turn: 1,
    battle: { round: 1 }
  });
  const mounted = [];
  const factories = {
    shooting: (target, options) => {
      mounted.push({ phase: "shooting", target, options });
      return { destroy() { mounted.push({ destroyed: "shooting" }); } };
    }
  };
  const root = container();

  const shell = createBattleShell(root, {
    session,
    perspectivePlayerId: "p1",
    screenFactories: factories
  });

  assert.equal(mounted.length, 1);
  assert.equal(mounted[0].phase, "shooting");
  assert.equal(mounted[0].options.session, session);
  assert.equal(mounted[0].options.perspectivePlayerId, "p1");
  assert.match(root.html, /data-battle-phase="shooting"/);
  assert.doesNotMatch(root.html, /battle-shell__header/);

  shell.destroy();
});

test("shared battle shell swaps screens when the same session advances phases", () => {
  const session = sessionFor({
    phase: "shooting",
    turn: 1,
    battle: { round: 1 }
  });
  const mounted = [];
  const factories = {
    shooting: () => ({
      destroy() { mounted.push("destroy-shooting"); }
    }),
    charge: () => {
      mounted.push("charge");
      return { destroy() { mounted.push("destroy-charge"); } };
    },
    fight: () => {
      mounted.push("fight");
      return { destroy() { mounted.push("destroy-fight"); } };
    }
  };
  const root = container();
  const shell = createBattleShell(root, { session, screenFactories: factories });

  session.setState({ phase: "charge", turn: 1, battle: { round: 1 } });
  session.setState({ phase: "fight", turn: 1, battle: { round: 1 } });

  assert.deepEqual(mounted, [
    "destroy-shooting",
    "charge",
    "destroy-charge",
    "fight"
  ]);

  shell.destroy();
  assert.deepEqual(mounted, [
    "destroy-shooting",
    "charge",
    "destroy-charge",
    "fight",
    "destroy-fight"
  ]);
});

test("shared battle shell mounts the implemented Command phase", () => {
  const session = sessionFor({
    phase: "command",
    turn: 1,
    battle: { round: 1 }
  });
  const root = container();
  const shell = createBattleShell(root, { session });

  assert.match(root.html, /data-battle-phase="command"/);
  assert.match(root._screen.innerHTML, /Command Phase/);
  assert.match(root._screen.innerHTML, /Objective control/);

  shell.destroy();
});

test("Command screen shows objective control and makes no unsupported scoring claims", () => {
  const root = { innerHTML: "", replaceChildren() { this.innerHTML = ""; } };
  const state = {
    phase: "command", turn: 1, activePlayer: "p1",
    battle: { round: 1 },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    commandPoints: { p1: 1 },
    objectives: [{ id: "obj-1", name: "Home Objective", control: { controllerId: "p1", controlState: "controlled", contestingPlayerIds: [] } }],
    units: [], history: [], scoring: { turnSnapshots: [] }
  };
  const listeners = new Set();
  const session = { getState: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
  const screen = createCommandScreen(root, { session });
  assert.match(root.innerHTML, /Command Points/);
  assert.match(root.innerHTML, /Home Objective/);
  assert.match(root.innerHTML, /Controlled by you/);
  assert.match(root.innerHTML, /No mission scoring definitions were supplied/);
  screen.destroy();
});
