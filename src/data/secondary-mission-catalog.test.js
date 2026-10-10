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

test("catalog distinguishes official sample-card verification from draft cross-checks", () => {
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.rulesVerified, false);
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.catalogScope, "partial-rules-reference");
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.crossCheckStatus,
    "unofficial-cross-check-review-logged-official-card-check-pending");
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.crossCheckSources.length, 4);
  assert.ok(SECONDARY_MISSION_CATALOG_SOURCE.crossCheckSources.includes(
    "https://gdmissions.app/11th/secondary-missions"
  ));

  const verified = SECONDARY_MISSION_CATALOG.filter((card) => card.rulesVerified);
  assert.deepEqual(verified.map((card) => card.name).sort(), ["Assassination", "Centre Ground"]);
  assert.ok(verified.every((card) => card.scoringWindows.length > 0));

  const unverified = SECONDARY_MISSION_CATALOG.filter((card) => !card.rulesVerified);
  assert.equal(unverified.length, 16);
  assert.ok(unverified.every((card) => card.scoringWindows.length > 0));
  assert.ok(unverified.every((card) => card.referenceNotes.length >= 0));
  assert.ok(unverified.every((card) => card.scoringWindows.every((window) =>
    window.source === "community-transcription-pending-official-card-check")));
  assert.ok(SECONDARY_MISSION_CATALOG.every((card) => card.conditions.length === 0));
});

test("draft windows preserve distinct modes, timing, tier relationships, and review-only provenance", () => {
  const grievous = SECONDARY_MISSION_CATALOG.find((card) => card.name === "A Grievous Blow");
  assert.equal(grievous.rulesVerified, false);
  assert.deepEqual(grievous.scoringWindows.map((window) => [window.timing, window.modes[0]]), [
    ["end-of-turn", "fixed"],
    ["end-of-opponent-turn", "fixed"],
    ["end-of-turn", "tactical"],
    ["end-of-opponent-turn", "tactical"]
  ]);
  const tactical = grievous.scoringWindows.find((window) => window.modes[0] === "tactical");
  assert.equal(tactical.tiers[0].vp, 5);
  assert.equal(Object.hasOwn(tactical.tiers[0], "maxVP"), false);
  const bringItDown = SECONDARY_MISSION_CATALOG.find((card) => card.name === "Bring it Down");
  assert.equal(bringItDown.rulesVerified, false);
  const bringItDownTactical = bringItDown.scoringWindows.find((window) => window.modes[0] === "tactical");
  assert.equal(bringItDownTactical.tiers[0].vp, 5);
  assert.equal(Object.hasOwn(bringItDownTactical.tiers[0], "maxVP"), false);
  assert.match(bringItDownTactical.tiers[0].summary, /One or more/);
  assert.match(tactical.tiers[0].summary, /One or more/);

  const defend = SECONDARY_MISSION_CATALOG.find((card) => card.name === "Defend Stronghold");
  assert.equal(defend.scoringWindows[0].minRound, 2);
  assert.equal(defend.scoringWindows[0].tiers[1].relationship, "cumulative");

  const beacon = SECONDARY_MISSION_CATALOG.find((card) => card.name === "Beacon");
  assert.equal(beacon.scoringWindows[0].timing, "end-of-opponent-turn");
  assert.equal(beacon.scoringWindows[0].tiers[0].relationship, "or");
  assert.equal(beacon.scoringWindows[0].tiers[1].relationship, "or");
});
