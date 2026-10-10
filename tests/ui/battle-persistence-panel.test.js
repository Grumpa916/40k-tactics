import test from "node:test";
import assert from "node:assert/strict";
import { createBattlePersistencePanel } from "../../src/ui/battle-persistence-panel.js";

function makeContainer() {
  const listeners = new Map();
  let html = "";
  return {
    listeners,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    contains() { return true; },
    replaceChildren() { html = ""; },
    set innerHTML(value) { html = value; },
    get innerHTML() { return html; },
    querySelector(selector) {
      if (selector === "#battle-save-name") return { value: "Test battle" };
      return null;
    },
    emit(type, event) {
      for (const listener of listeners.get(type) ?? []) listener(event);
    }
  };
}

function targetFor(selector, extras = {}) {
  return {
    ...extras,
    matches(value) { return value === selector; },
    closest(value) { return value.split(", ").includes(selector) ? this : null }
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("persistence panel renders save, resume, delete, and refresh controls", async () => {
  const container = makeContainer();
  const session = {
    getState: () => ({ version: 1, phase: "fight", players: [{ name: "You" }, { name: "Opponent" }] }),
    replaceState() {}
  };
  const store = {
    async list() { return [{ id: "save-1", name: "Round 2", updated_at: "2026-10-10T12:00:00Z" }]; },
    async save() { return { id: "save-1", name: "Round 2" }; },
    async load() { return { id: "save-1", name: "Round 2", game_state: { version: 1 } }; },
    async remove() { return true; }
  };
  const panel = createBattlePersistencePanel(container, { session, store });
  await settle();

  assert.match(container.innerHTML, /Cloud battle saves/);
  assert.match(container.innerHTML, /Save current battle/);
  assert.match(container.innerHTML, /Load and resume/);
  assert.match(container.innerHTML, /Delete save/);
  assert.match(container.innerHTML, /Refresh list/);
  assert.match(container.innerHTML, /Round 2/);
  panel.destroy();
});

test("saving uses the selected record id to update and refreshes the list", async () => {
  const container = makeContainer();
  const state = { version: 1, phase: "fight", players: [{ name: "You" }, { name: "Opponent" }] };
  const saved = [];
  const session = { getState: () => state, replaceState() {} };
  const store = {
    async list() { return [{ id: "existing", name: "Test battle", updated_at: "2026-10-10T12:00:00Z" }]; },
    async save(payload) { saved.push(payload); return { id: "existing", name: payload.name }; },
    async load() { throw new Error("unused"); },
    async remove() {}
  };
  const panel = createBattlePersistencePanel(container, { session, store });
  await settle();

  container.emit("submit", {
    target: {
      closest(selector) { return selector === "[data-battle-save-form]" ? this : null; },
      querySelector() { return { value: "Test battle" }; }
    },
    preventDefault() {}
  });
  await settle();

  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, "existing");
  assert.equal(saved[0].name, "Test battle");
  assert.deepEqual(saved[0].state, state);
  assert.match(container.innerHTML, /Battle save updated/);
  panel.destroy();
});

test("loading replaces the session state and deleting requires a second confirmation click", async () => {
  const container = makeContainer();
  let restored = null;
  const removed = [];
  const session = {
    getState: () => ({ version: 1 }),
    replaceState(state) { restored = state; }
  };
  const store = {
    async list() { return [{ id: "save-1", name: "Round 2", updated_at: "2026-10-10T12:00:00Z" }]; },
    async save() { throw new Error("unused"); },
    async load() { return { id: "save-1", name: "Round 2", updated_at: "now", game_state: { version: 1, phase: "shooting" } }; },
    async remove(id) { removed.push(id); }
  };
  const panel = createBattlePersistencePanel(container, { session, store });
  await settle();

  container.emit("change", { target: targetFor("[data-battle-saved-select]", { value: "save-1" }) });
  container.emit("click", { target: targetFor("[data-battle-load]") });
  await settle();
  assert.deepEqual(restored, { version: 1, phase: "shooting" });
  assert.match(container.innerHTML, /Battle loaded/);

  container.emit("click", { target: targetFor("[data-battle-delete]") });
  assert.match(container.innerHTML, /Select Delete save again/);
  container.emit("click", { target: targetFor("[data-battle-delete]") });
  await settle();
  assert.deepEqual(removed, ["save-1"]);
  assert.match(container.innerHTML, /Saved battle deleted/);
  panel.destroy();
});
