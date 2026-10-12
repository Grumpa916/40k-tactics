import test from "node:test";
import assert from "node:assert/strict";
import {
  getTyranidDecisionReminders,
  getTyranidShadowInTheWarpCarriers
} from "../../src/rules/tyranid-decision-reminders.js";

function activeState(overrides = {}) {
  return {
    phase: "command",
    turn: 1,
    activePlayer: "p2",
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    armyRosters: {
      p1: { id: "r1", faction: "Tyranids", detachment: "Invasion Fleet", units: [] },
      p2: { id: "r2", faction: "Space Marines", detachment: "Gladius Task Force", units: [] }
    },
    units: [
      { id: "p1:hive", ownerId: "p1", name: "Hive Tyrant", status: "deployed", metadata: { datasheetId: "tyranids:hive-tyrant" } },
      { id: "p1:guard", ownerId: "p1", name: "Tyrant Guard", status: "reserves", metadata: { datasheetId: "tyranids:tyrant-guard" } }
    ],
    history: [],
    ...overrides
  };
}

test("Invasion Fleet receives the first-round Hyper-adaptations selection", () => {
  const reminders = getTyranidDecisionReminders(activeState(), "p1");
  const hyper = reminders.find((item) => item.id === "tyranids.hyper-adaptations");
  assert.ok(hyper);
  assert.equal(hyper.required, true);
  assert.equal(hyper.options.length, 3);
  assert.deepEqual(hyper.options.map((item) => item.id), [
    "swarming-instincts", "hyper-aggression", "hive-predators"
  ]);
});

test("Hyper-adaptations does not appear for another detachment, a later round or a different faction", () => {
  assert.equal(getTyranidDecisionReminders(activeState({
    armyRosters: { p1: { faction: "Tyranids", detachment: "Warrior Bioform Onslaught" } }
  }), "p1").some((item) => item.id === "tyranids.hyper-adaptations"), false);
  assert.equal(getTyranidDecisionReminders(activeState({
    battle: { id: "b1", status: "active", round: 2, activePlayerId: "p2" }
  }), "p1").some((item) => item.id === "tyranids.hyper-adaptations"), false);
  assert.deepEqual(getTyranidDecisionReminders(activeState(), "p2"), []);
});

test("Shadow in the Warp can remind during either player's Command phase", () => {
  const reminders = getTyranidDecisionReminders(activeState(), "p1");
  const shadow = reminders.find((item) => item.id === "tyranids.shadow-in-the-warp");
  assert.ok(shadow);
  assert.equal(shadow.required, false);
  assert.deepEqual(shadow.carriers, ["Hive Tyrant"]);
});

test("Shadow reminder requires a deployed unit with the documented ability", () => {
  assert.equal(getTyranidShadowInTheWarpCarriers(activeState(), "p1").length, 1);
  assert.equal(getTyranidDecisionReminders(activeState({
    units: [{ id: "guard", ownerId: "p1", name: "Tyrant Guard", status: "deployed", metadata: { datasheetId: "tyranids:tyrant-guard" } }]
  }), "p1").some((item) => item.id === "tyranids.shadow-in-the-warp"), false);
  assert.equal(getTyranidDecisionReminders(activeState({
    phase: "movement"
  }), "p1").some((item) => item.id === "tyranids.shadow-in-the-warp"), false);
});

test("a recorded Hyper-adaptations selection suppresses a duplicate reminder", () => {
  const state = activeState({
    armyRosters: {
      p1: {
        faction: "Tyranids",
        detachment: "Invasion Fleet",
        battleAbilitySelections: { "tyranids.hyper-adaptations": "hyper-aggression" }
      }
    }
  });
  assert.equal(getTyranidDecisionReminders(state, "p1").some((item) => item.id === "tyranids.hyper-adaptations"), false);
});

test("a recorded Shadow in the Warp activation suppresses later reminders", () => {
  const state = activeState({
    armyRosters: {
      p1: {
        faction: "Tyranids", detachment: "Invasion Fleet",
        battleAbilityUses: { "tyranids.shadow-in-the-warp": true }
      }
    }
  });
  assert.equal(getTyranidDecisionReminders(state, "p1").some((item) => item.id === "tyranids.shadow-in-the-warp"), false);
});
