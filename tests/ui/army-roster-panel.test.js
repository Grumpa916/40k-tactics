import test from "node:test";
import assert from "node:assert/strict";
import { createArmyRosterPanel } from "../../src/ui/army-roster-panel.js";

function makeContainer() {
  const listeners = new Map();
  const detachmentSelect = { innerHTML: "" };
  return {
    innerHTML: "",
    listeners,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    contains() { return true; },
    querySelector(selector) {
      return selector === "[data-roster-detachment-select]" ? detachmentSelect : null;
    },
    replaceChildren() { this.innerHTML = ""; },
    detachmentSelect,
    emit(type, event) {
      for (const listener of listeners.get(type) ?? []) listener(event);
    }
  };
}

test("Army Builder offers a reviewed Tyranid detachment and supports custom printed names", async () => {
  const root = makeContainer();
  const store = {
    async list() { return []; },
    async save() {},
    async load() { return { roster: null }; },
    async remove() {}
  };
  const panel = createArmyRosterPanel(root, { store });
  await new Promise((resolve) => setImmediate(resolve));

  assert.match(root.innerHTML, /data-roster-create-faction/);
  assert.match(root.innerHTML, /data-roster-detachment-select/);
  assert.match(root.innerHTML, /data-roster-custom-detachment/);

  root.emit("change", {
    target: {
      value: "Tyranids",
      matches(selector) { return selector === "[data-roster-create-faction]"; }
    }
  });
  assert.match(root.detachmentSelect.innerHTML, /Invasion Fleet \(Tyranids\)/);
  assert.match(root.detachmentSelect.innerHTML, /Other \/ enter manually/);
  panel.destroy();
});
