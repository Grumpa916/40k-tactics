import test from "node:test";
import assert from "node:assert/strict";
import {
  addUnitToRoster,
  createArmyRoster,
  deleteArmyRoster,
  duplicateArmyRoster,
  renameArmyRoster,
  removeUnitFromRoster,
  selectRosterForBattle,
  updateRosterUnit
} from "../../src/state/army-roster-library.js";

const sampleRoster = () => createArmyRoster({
  id: "roster-tyranids",
  name: "Tyranids — Test List",
  faction: "Tyranids",
  pointsLimit: 2000,
  units: [{ id: "unit-1", datasheetId: "exocrine", name: "Exocrine", modelCount: 1 }]
});

test("creates a named reusable roster with independent unit data", () => {
  const roster = sampleRoster();
  assert.equal(roster.name, "Tyranids — Test List");
  assert.equal(roster.pointsLimit, 2000);
  assert.equal(roster.units.length, 1);
  roster.units[0].name = "Local mutation";
  assert.equal(sampleRoster().units[0].name, "Exocrine");
});

test("adds, updates, and removes roster units immutably", () => {
  const roster = sampleRoster();
  const added = addUnitToRoster(roster, { id: "unit-2", datasheetId: "termagants", name: "Termagants", modelCount: 10 });
  assert.equal(roster.units.length, 1);
  assert.equal(added.units.length, 2);
  const updated = updateRosterUnit(added, "unit-2", { modelCount: 20 });
  assert.equal(updated.units[1].modelCount, 20);
  assert.equal(added.units[1].modelCount, 10);
  const removed = removeUnitFromRoster(updated, "unit-1");
  assert.deepEqual(removed.units.map((unit) => unit.id), ["unit-2"]);
});

test("prevents duplicate unit ids and rejects unknown unit edits", () => {
  const roster = sampleRoster();
  assert.throws(() => addUnitToRoster(roster, { id: "unit-1", name: "Duplicate" }), /already exists/);
  assert.throws(() => updateRosterUnit(roster, "missing", { name: "Nope" }), /not found/);
  assert.throws(() => removeUnitFromRoster(roster, "missing"), /not found/);
});

test("renaming and duplicating a roster preserve independent copies", () => {
  const roster = sampleRoster();
  const renamed = renameArmyRoster(roster, "Tournament Tyranids");
  const copy = duplicateArmyRoster(renamed, { id: "roster-copy", name: "Tyranids Practice" });
  assert.equal(roster.name, "Tyranids — Test List");
  assert.equal(copy.name, "Tyranids Practice");
  assert.equal(copy.units[0].id, "unit-1");
  const changedCopy = updateRosterUnit(copy, "unit-1", { modelCount: 2 });
  assert.equal(roster.units[0].modelCount, 1);
  assert.equal(changedCopy.units[0].modelCount, 2);
});

test("deleting a roster only removes the selected library entry", () => {
  const rosters = [sampleRoster(), createArmyRoster({ id: "other", name: "Opponent List" })];
  const remaining = deleteArmyRoster(rosters, "roster-tyranids");
  assert.deepEqual(remaining.map((roster) => roster.id), ["other"]);
  assert.equal(rosters.length, 2);
  assert.throws(() => deleteArmyRoster(rosters, "missing"), /not found/);
});

test("battle selection snapshots the roster so later edits cannot change the battle copy", () => {
  const roster = sampleRoster();
  const snapshot = selectRosterForBattle(roster, {
    playerId: "p1",
    snapshotId: "battle-roster-1",
    battleId: "battle-1",
    selectedAt: "2026-10-10T00:00:00Z"
  });
  const edited = updateRosterUnit(roster, "unit-1", { modelCount: 3 });
  assert.equal(snapshot.sourceRosterId, roster.id);
  assert.equal(snapshot.sourceRosterName, roster.name);
  assert.equal(snapshot.playerId, "p1");
  assert.equal(snapshot.isBattleSnapshot, true);
  assert.equal(snapshot.units[0].modelCount, 1);
  assert.equal(edited.units[0].modelCount, 3);
});
