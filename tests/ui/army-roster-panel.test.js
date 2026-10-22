import test from "node:test";
import assert from "node:assert/strict";
import { createArmyRosterPanel } from "../../src/ui/army-roster-panel.js";

function makeContainer() {
  const listeners = new Map();
  const detachmentSelect = { innerHTML: "" };
  const rosterSelect = { value: "" };
  const playerSelect = { value: "" };
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
      if (selector === "[data-roster-detachment-select]") return detachmentSelect;
      if (selector === "[data-roster-select]") return rosterSelect;
      if (selector === "[data-roster-player]") return playerSelect;
      return null;
    },
    replaceChildren() { this.innerHTML = ""; },
    detachmentSelect,
    rosterSelect,
    playerSelect,
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

  const newButton={matches:selector=>selector==='[data-builder-page]',getAttribute:()=>"new"};
  root.emit("click",{target:{closest:()=>newButton}});
  assert.match(root.innerHTML, /data-roster-create-faction/);
  assert.match(root.innerHTML, /data-roster-detachment-select/);
  assert.match(root.innerHTML, /data-roster-custom-detachment/);

  root.emit("change", {
    target: {
      value: "Tyranids",
      matches(selector) { return selector === "[data-roster-create-faction]"; }
    }
  });
  const tyranidDetachments = [
    ["Ambush Predators", "Disruption", "1 DP"],
    ["Assimilation Swarm", "Priority Assets", "2 DP"],
    ["Crusher Stampede", "Purge the Foe", "2 DP"],
    ["Invasion Fleet", "Take and Hold", "3 DP"],
    ["Subterranean Assault", "Disruption", "3 DP"],
    ["Synaptic Nexus", "Disruption", "2 DP"],
    ["Talons of the Norn Queen", "Take and Hold", "1 DP"],
    ["Unending Swarm", "Take and Hold", "2 DP"],
    ["Vanguard Onslaught", "Reconnaissance", "2 DP"],
    ["Warrior Bioform Onslaught", "Take and Hold", "1 DP"]
  ];
  for (const [name, disposition, cost] of tyranidDetachments) {
    assert.ok(root.detachmentSelect.innerHTML.includes(name), `missing detachment ${name}`);
    assert.ok(root.detachmentSelect.innerHTML.includes(disposition), `missing Force Disposition for ${name}`);
    assert.ok(root.detachmentSelect.innerHTML.includes(cost), `missing Detachment Point cost for ${name}`);
  }
  assert.equal((root.detachmentSelect.innerHTML.match(/<option value="/g) ?? []).length, 12);
  assert.match(root.detachmentSelect.innerHTML, /Other \/ enter manually/);
  panel.destroy();
});


test("roster assignment preserves the selected opponent target across rerenders", async () => {
  const root = makeContainer();
  const roster = {
    id: "roster-opponent",
    name: "Opponent Orks",
    faction: "Orks",
    pointsLimit: 2000,
    units: [{ id: "orks-unit", name: "Boyz", ownerId: null, modelCount: 10, points: 80 }],
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z"
  };
  const applied = [];
  const store = {
    async list() { return [{ id: roster.id, name: roster.name, faction: roster.faction, pointsLimit: roster.pointsLimit }]; },
    async save() {},
    async load(id) {
      assert.equal(id, roster.id);
      return { roster: structuredClone(roster) };
    },
    async remove() {}
  };
  const panel = createArmyRosterPanel(root, {
    store,
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    onApplyRoster: async (selectedRoster, playerId) => applied.push({ selectedRoster, playerId })
  });
  await new Promise((resolve) => setImmediate(resolve));

  root.rosterSelect.value = roster.id;
  const loadButton = {
    getAttribute() { return roster.id; },
    matches(selector) { return selector.includes("[data-roster-load]"); }
  };
  root.emit("click", { target: { closest(selector) {
    return selector.includes("[data-roster-load]") ? loadButton : null;
  } } });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.match(root.innerHTML, /Assign this roster to a player/);
  root.playerSelect.value = "p2";
  const applyButton = {
    matches(selector) { return selector.includes("[data-roster-apply]"); }
  };
  root.emit("click", { target: { closest(selector) {
    return selector.includes("[data-roster-apply]") ? applyButton : null;
  } } });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(applied.length, 1);
  assert.equal(applied[0].playerId, "p2");
  assert.equal(applied[0].selectedRoster.id, roster.id);
  assert.equal(applied[0].selectedRoster.units[0].name, "Boyz");
  assert.match(root.innerHTML, /Roster assigned to the selected side/);
  panel.destroy();
});
