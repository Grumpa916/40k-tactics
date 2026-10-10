import test from "node:test";
import assert from "node:assert/strict";
import {
  SECONDARY_MISSION_CATALOG,
  SECONDARY_MISSION_CATALOG_SOURCE
} from "./secondary-mission-catalog.js";

test("secondary catalog contains the 18 Chapter Approved 2026–27 card names", () => {
  assert.equal(SECONDARY_MISSION_CATALOG.length, 18);
  assert.equal(new Set(SECONDARY_MISSION_CATALOG.map((card) => card.id)).size, 18);
  assert.equal(new Set(SECONDARY_MISSION_CATALOG.map((card) => card.name)).size, 18);
  assert.ok(SECONDARY_MISSION_CATALOG.every((card) => card.category === "secondary"));
});

test("catalog only exposes fixed availability where the card set marks a Fixed option", () => {
  const fixedNames = SECONDARY_MISSION_CATALOG
    .filter((card) => card.fixedAvailable)
    .map((card) => card.name);
  assert.deepEqual(fixedNames, [
    "A Grievous Blow",
    "Assassination",
    "Bring it Down",
    "Engage on All Fronts"
  ]);
});

test("catalog explicitly avoids claiming unverified scoring rules", () => {
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.rulesVerified, false);
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.catalogScope, "partial-rules-reference");
  const verified = SECONDARY_MISSION_CATALOG.filter((card) => card.rulesVerified);
  assert.deepEqual(verified.map((card) => card.name).sort(), ["Assassination", "Centre Ground"]);
  assert.ok(verified.every((card) => card.scoringWindows.length > 0));
  assert.ok(SECONDARY_MISSION_CATALOG.filter((card) => !card.rulesVerified)
    .every((card) => card.scoringWindows.length === 0));
  assert.ok(SECONDARY_MISSION_CATALOG.every((card) => card.conditions.length === 0));
  assert.ok(SECONDARY_MISSION_CATALOG_SOURCE.officialSampleCardImages.length === 2);
});
