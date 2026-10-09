import test from "node:test";
import assert from "node:assert/strict";
import { createBattleShell } from "../../src/ui/battle-shell.js";

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

test("shared battle shell reserves Command and Movement without inventing navigation", () => {
  const session = sessionFor({
    phase: "command",
    turn: 1,
    battle: { round: 1 }
  });
  const root = container();
  const shell = createBattleShell(root, { session, screenFactories: {} });

  assert.match(root.html, /data-battle-phase="command"/);
  assert.match(root._screen.innerHTML, /reserved in the shared battle flow/);

  shell.destroy();
});
