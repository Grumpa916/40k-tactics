import test from "node:test";
import assert from "node:assert/strict";
import { ARMY_UNIT_CATALOG, findArmyUnitCandidates } from "../../src/data/army-unit-catalog.js";

test("catalog candidates are faction-filtered and search is case-insensitive", () => {
  const tyranids = findArmyUnitCandidates({ faction: "Tyranids" });
  assert.ok(tyranids.length > 0);
  assert.ok(tyranids.every((unit) => unit.faction === "Tyranids"));
  assert.ok(findArmyUnitCandidates({ faction: "Tyranids", query: "exoc" }).some((unit) => unit.name === "Exocrine"));
  assert.equal(findArmyUnitCandidates({ faction: "Unknown Faction" }).length, 0);
});

test("catalog entries declare source status and a source URL", () => {
  assert.ok(ARMY_UNIT_CATALOG.length > 0);
  assert.ok(ARMY_UNIT_CATALOG.every((unit) =>
    ["name-only-unverified", "source-reviewed"].includes(unit.verificationStatus) &&
    typeof unit.sourceUrl === "string" &&
    unit.sourceUrl.startsWith("https://")
  ));
  const reviewed = ARMY_UNIT_CATALOG.filter((unit) => unit.verificationStatus === "source-reviewed");
  assert.ok(reviewed.length > 0);
  assert.ok(reviewed.every((unit) => unit.datasheet && unit.reviewedAt));
});
