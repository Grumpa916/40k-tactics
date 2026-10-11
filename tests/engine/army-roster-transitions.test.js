import test from "node:test";
import assert from "node:assert/strict";
import { createGameState } from "../../src/state/game-state.js";
import { applyArmyRosterToBattle } from "../../src/engine/army-roster-transitions.js";

const roster = {
  id: "tyranids-list", name: "Tyranids", faction: "Tyranids", pointsLimit: 2000,
  units: [{ id: "exocrine-1", name: "Exocrine", modelCount: 1, datasheetId: "exocrine" }]
};

function state() {
  return createGameState({
    phase: "setup",
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battle: { id: "battle-1", status: "setup" },
    units: [
      { id: "old-friendly", ownerId: "p1", name: "Demo friendly", status: "deployed" },
      { id: "opponent-unit", ownerId: "p2", name: "Opponent unit", status: "deployed" }
    ]
  });
}

test("assigns a battle-specific roster snapshot and replaces only that player's units", () => {
  const initial = state();
  const next = applyArmyRosterToBattle(initial, {
    roster, playerId: "p1", snapshotId: "snapshot-1", selectedAt: "2026-10-11T00:00:00Z"
  });
  assert.deepEqual(next.units.map((unit) => unit.id), ["opponent-unit", "p1:exocrine-1"]);
  const unit = next.units[1];
  assert.equal(unit.ownerId, "p1");
  assert.equal(unit.status, "reserves");
  assert.equal(unit.metadata.modelCount, 1);
  assert.equal(unit.metadata.datasheetId, "exocrine");
  assert.equal(next.armyRosters.p1.sourceRosterId, "tyranids-list");
  assert.equal(next.armyRosters.p1.id, "snapshot-1");
  assert.equal(initial.units.length, 2);
  assert.equal(next.history.at(-1).type, "battle.army_roster_assigned");
});

test("rejects roster assignment outside setup or for an unknown player", () => {
  assert.throws(() => applyArmyRosterToBattle({ ...state(), phase: "deployment" }, {
    roster, playerId: "p1"
  }), /only be assigned while battle setup is active/);
  assert.throws(() => applyArmyRosterToBattle(state(), { roster, playerId: "missing" }), /Choose a player/);
});
