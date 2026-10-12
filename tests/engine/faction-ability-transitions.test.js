import test from "node:test";
import assert from "node:assert/strict";
import { recordFactionAbilityDecision } from "../../src/engine/faction-ability-transitions.js";

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
      { id: "p1:hive", ownerId: "p1", name: "Hive Tyrant", status: "deployed", metadata: { datasheetId: "tyranids:hive-tyrant" } }
    ],
    history: [],
    ...overrides
  };
}

test("Hyper-adaptations selection updates the battle roster and appends a typed event", () => {
  const next = recordFactionAbilityDecision(activeState(), {
    playerId: "p1", decisionId: "tyranids.hyper-adaptations", choice: "hyper-aggression"
  });
  assert.equal(next.armyRosters.p1.battleAbilitySelections["tyranids.hyper-adaptations"], "hyper-aggression");
  assert.equal(next.history.at(-1).type, "faction_ability.decision_recorded");
  assert.equal(next.history.at(-1).payload.choiceName, "Hyper-aggression");
});

test("Hyper-adaptations rejects wrong detachment, invalid choices and later rounds", () => {
  assert.throws(() => recordFactionAbilityDecision(activeState({
    armyRosters: { p1: { faction: "Tyranids", detachment: "Warrior Bioform Onslaught" } }
  }), { playerId: "p1", decisionId: "tyranids.hyper-adaptations", choice: "swarming-instincts" }), /Invasion Fleet/);
  assert.throws(() => recordFactionAbilityDecision(activeState(), {
    playerId: "p1", decisionId: "tyranids.hyper-adaptations", choice: "unknown"
  }), /Choose one/);
  assert.throws(() => recordFactionAbilityDecision(activeState({
    battle: { id: "b1", status: "active", round: 2, activePlayerId: "p2" }
  }), { playerId: "p1", decisionId: "tyranids.hyper-adaptations", choice: "swarming-instincts" }), /first battle round/);
  assert.throws(() => recordFactionAbilityDecision(activeState({
    phase: "movement"
  }), { playerId: "p1", decisionId: "tyranids.hyper-adaptations", choice: "swarming-instincts" }), /before later phases/);
});

test("Shadow in the Warp records an optional activation during the opponent's Command phase", () => {
  const next = recordFactionAbilityDecision(activeState(), {
    playerId: "p1", decisionId: "tyranids.shadow-in-the-warp", choice: "use"
  });
  assert.equal(next.armyRosters.p1.battleAbilityUses["tyranids.shadow-in-the-warp"], true);
  assert.equal(next.history.at(-1).type, "faction_ability.decision_recorded");
  assert.equal(next.history.at(-1).payload.playerId, "p1");
  assert.match(next.history.at(-1).payload.reminder, /does not roll or resolve/i);
});

test("Shadow in the Warp requires a deployed ability carrier and the Command phase", () => {
  assert.throws(() => recordFactionAbilityDecision(activeState({
    phase: "movement"
  }), { playerId: "p1", decisionId: "tyranids.shadow-in-the-warp", choice: "use" }), /Command phase/);
  assert.throws(() => recordFactionAbilityDecision(activeState({
    units: [{ id: "p1:guard", ownerId: "p1", name: "Tyrant Guard", status: "deployed", metadata: { datasheetId: "tyranids:tyrant-guard" } }]
  }), { playerId: "p1", decisionId: "tyranids.shadow-in-the-warp", choice: "use" }), /deployed unit/);
});

test("each faction decision can only be recorded once per battle", () => {
  const first = recordFactionAbilityDecision(activeState(), {
    playerId: "p1", decisionId: "tyranids.hyper-adaptations", choice: "swarming-instincts"
  });
  assert.throws(() => recordFactionAbilityDecision(first, {
    playerId: "p1", decisionId: "tyranids.hyper-adaptations", choice: "hive-predators"
  }), /already been recorded/);
  const used = recordFactionAbilityDecision(activeState(), {
    playerId: "p1", decisionId: "tyranids.shadow-in-the-warp", choice: "use"
  });
  assert.throws(() => recordFactionAbilityDecision(used, {
    playerId: "p1", decisionId: "tyranids.shadow-in-the-warp", choice: "use"
  }), /already been recorded/);
});
