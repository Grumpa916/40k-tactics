import test from "node:test";
import assert from "node:assert/strict";
import { createArmySelectionPanel } from "../../src/ui/army-selection-panel.js";

function fakeContainer() {
  const listeners = new Map();
  let html = "";
  let selectValue = "";
  return {
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    contains() { return true; },
    querySelector(selector) {
      if (selector === '[data-army-selection-roster="p1"]') return { value: selectValue };
      return null;
    },
    chooseRoster(value) { selectValue = value; },
    clickApply(playerId) {
      const button = { getAttribute(name) { return name === "data-army-selection-apply" ? playerId : null; } };
      const event = { target: { closest(selector) {
        return selector === "[data-army-selection-apply]" ? button : null;
      }}};
      for (const listener of listeners.get("click") ?? []) listener(event);
    }
  };
}

test("army selection hydrates saved roster metadata, shows detachments, and applies only to the chosen side", async () => {
  const roster = {
    id: "tyranids-2000", name: "Tyranid Test List", faction: "Tyranids",
    detachment: "Invasion Fleet", detachments: ["Invasion Fleet", "Crusher Stampede"], pointsLimit: 2000,
    units: [{ id: "hive-tyrant", name: "Hive Tyrant", points: 195 }]
  };
  let state = {
    phase: "setup",
    battle: { status: "setup" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    armyRosters: { p2: { id: "opponent-roster", name: "Opponent List", faction: "Orks", detachment: "War Horde", units: [] } }
  };
  const dispatched = [];
  const listeners = new Set();
  const session = {
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispatch(command) {
      dispatched.push(command);
      state = { ...state, armyRosters: { ...state.armyRosters, [command.payload.playerId]: command.payload.roster } };
      for (const listener of listeners) listener();
      return state;
    }
  };
  const store = {
    async list() {
      return [{ id: roster.id, name: roster.name, schema_version: 1, updated_at: "2026-10-24T00:00:00Z" }];
    },
    async load(id) { return id === roster.id ? { id, roster } : null; }
  };
  const root = fakeContainer();
  const panel = createArmySelectionPanel(root, { store, session });
  await panel.refresh();

  assert.doesNotMatch(root.innerHTML, /Select Armies for This Battle/);
  assert.match(root.innerHTML, /Your Army/);
  assert.match(root.innerHTML, /Opponent Army/);
  assert.match(root.innerHTML, /Opponent List/);
  assert.match(root.innerHTML, /Tyranids/);
  assert.match(root.innerHTML, /Invasion Fleet \+ Crusher Stampede/);
  assert.doesNotMatch(root.innerHTML, /Tyranid Test List · Faction not set · Detachment not set/);

  root.chooseRoster(roster.id);
  root.clickApply("p1");
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0].type, "battle.apply_army_roster");
  assert.equal(dispatched[0].payload.playerId, "p1");
  assert.equal(state.armyRosters.p1.id, roster.id);
  assert.equal(state.armyRosters.p2.id, "opponent-roster");
  assert.match(root.innerHTML, /Tyranid Test List/);
  assert.match(root.innerHTML, /Invasion Fleet \+ Crusher Stampede/);
  panel.destroy();
});
