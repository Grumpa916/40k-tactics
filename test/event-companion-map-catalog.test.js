import test from "node:test";
import assert from "node:assert/strict";
import { EVENT_COMPANION_MAP_CATALOG } from "../src/data/event-companion-map-catalog.js";
import {
  getBattlePrimaryMissions,
  getEventCompanionMapForForceDispositions,
  getEventCompanionMapLayout,
  getLayoutOptionsForForceDispositions,
  getEventCompanionMissionLayoutOptions,
  getPrimaryMissionForForceDispositions,
  listEventCompanionMissionPairs,
  validateEventCompanionMapCatalog
} from "../src/rules/event-companion-map-catalog.js";

const OFFICIAL_FORCE_DISPOSITION_MATRIX = Object.freeze({
  "Take and Hold": Object.freeze({
    "Take and Hold": "Battlefield Dominance",
    "Disruption": "Determined Acquisition",
    "Purge the Foe": "Immovable Object",
    "Priority Assets": "Inescapable Dominion",
    "Reconnaissance": "Purge and Secure"
  }),
  "Disruption": Object.freeze({
    "Take and Hold": "Death Trap",
    "Disruption": "Outmanoeuvre",
    "Purge the Foe": "Delaying Action",
    "Priority Assets": "Locate and Deny",
    "Reconnaissance": "Smoke and Mirrors"
  }),
  "Purge the Foe": Object.freeze({
    "Take and Hold": "Unstoppable Force",
    "Disruption": "Punishment",
    "Purge the Foe": "Meatgrinder",
    "Priority Assets": "Destroyer's Wrath",
    "Reconnaissance": "Consecrate"
  }),
  "Priority Assets": Object.freeze({
    "Take and Hold": "Secure Asset",
    "Disruption": "Extract Relic",
    "Purge the Foe": "Vital Link",
    "Priority Assets": "Sabotage",
    "Reconnaissance": "Vanguard Operation"
  }),
  "Reconnaissance": Object.freeze({
    "Take and Hold": "Reconnaissance Sweep",
    "Disruption": "Surveil the Foe",
    "Purge the Foe": "Triangulation",
    "Priority Assets": "Search and Scour",
    "Reconnaissance": "Gather Intel"
  })
});

function pairKey(a, b) {
  return [a, b].sort((left, right) => left.localeCompare(right)).join(" ↔ ");
}

const OFFICIAL_LAYOUT_PAGE_TRIPLES = new Map([
  [["Battlefield Dominance", "Battlefield Dominance"], [9, 10, 11]],
  [["Immovable Object", "Unstoppable Force"], [12, 13, 14]],
  [["Determined Acquisition", "Death Trap"], [15, 16, 17]],
  [["Purge and Secure", "Reconnaissance Sweep"], [18, 19, 20]],
  [["Inescapable Dominion", "Secure Asset"], [21, 22, 23]],
  [["Meatgrinder", "Meatgrinder"], [24, 25, 26]],
  [["Punishment", "Delaying Action"], [27, 28, 29]],
  [["Consecrate", "Triangulation"], [30, 31, 32]],
  [["Destroyer's Wrath", "Vital Link"], [33, 34, 35]],
  [["Outmanoeuvre", "Outmanoeuvre"], [36, 37, 38]],
  [["Smoke and Mirrors", "Surveil the Foe"], [39, 40, 41]],
  [["Extract Relic", "Locate and Deny"], [42, 43, 44]],
  [["Gather Intel", "Gather Intel"], [45, 46, 47]],
  [["Vanguard Operation", "Search and Scour"], [48, 49, 50]],
  [["Sabotage", "Sabotage"], [51, 52, 53]]
].map(([pair, pages]) => [pairKey(pair[0], pair[1]), pages]));

const LAYOUTS = ["A", "B", "C"];

test("catalog contains 15 mission pairs and all 45 verified layouts", () => {
  assert.equal(listEventCompanionMissionPairs().length, 15);
  const validation = validateEventCompanionMapCatalog();
  assert.equal(validation.valid, true, validation.errors.join("\n"));
});

test("mission pair lookup is order independent and returns A/B/C with source pages", () => {
  const options = getEventCompanionMissionLayoutOptions("Unstoppable Force", "Immovable Object");
  assert.deepEqual(options.map((item) => item.layout), ["A", "B", "C"]);
  assert.deepEqual(options.map((item) => item.page), [12, 13, 14]);
  assert.equal(options[0].missionKey, "Immovable Object ↔ Unstoppable Force");
});

test("selected layout returns only verified geometry for the matching mission pair and indexed page", () => {
  const layout = getEventCompanionMapLayout("Battlefield Dominance", "Battlefield Dominance", "B");
  assert.equal(layout.page, 10);
  assert.equal(layout.verified, true);
  assert.equal(Object.keys(layout.objectivePositions).length, 5);
  assert.equal(Object.keys(layout.terrainGeometry).length, 16);
});

test("all 25 directed Force Disposition cells match the authoritative matrix", () => {
  for (const [ownDisposition, row] of Object.entries(OFFICIAL_FORCE_DISPOSITION_MATRIX)) {
    for (const [opponentDisposition, expectedMission] of Object.entries(row)) {
      assert.equal(
        getPrimaryMissionForForceDispositions(ownDisposition, opponentDisposition),
        expectedMission,
        `${ownDisposition} vs ${opponentDisposition} resolves the correct mission for the active army`
      );

      const expectedOpponentMission = OFFICIAL_FORCE_DISPOSITION_MATRIX[opponentDisposition][ownDisposition];
      assert.deepEqual(
        getBattlePrimaryMissions(ownDisposition, opponentDisposition),
        { myMission: expectedMission, opponentMission: expectedOpponentMission },
        `${ownDisposition} vs ${opponentDisposition} preserves row/column direction for both armies`
      );
    }
  }
});

test("every disposition pairing resolves the correct A/B/C Event Companion pages", () => {
  for (const [myDisposition, row] of Object.entries(OFFICIAL_FORCE_DISPOSITION_MATRIX)) {
    for (const opponentDisposition of Object.keys(row)) {
      const myMission = OFFICIAL_FORCE_DISPOSITION_MATRIX[myDisposition][opponentDisposition];
      const opponentMission = OFFICIAL_FORCE_DISPOSITION_MATRIX[opponentDisposition][myDisposition];
      const expectedPages = OFFICIAL_LAYOUT_PAGE_TRIPLES.get(pairKey(myMission, opponentMission));
      assert.ok(expectedPages, `official page triple exists for ${myMission} / ${opponentMission}`);

      const setup = getLayoutOptionsForForceDispositions(myDisposition, opponentDisposition);
      assert.ok(setup, `${myDisposition} vs ${opponentDisposition} has map options`);
      assert.deepEqual(
        setup.layouts.map((item) => item.page),
        expectedPages,
        `${myDisposition} vs ${opponentDisposition} returns the correct page triple`
      );

      LAYOUTS.forEach((layoutName, index) => {
        const geometry = getEventCompanionMapForForceDispositions(myDisposition, opponentDisposition, layoutName);
        assert.ok(geometry, `${myDisposition} vs ${opponentDisposition} layout ${layoutName} resolves verified geometry`);
        assert.equal(
          geometry.page,
          expectedPages[index],
          `${myDisposition} vs ${opponentDisposition} layout ${layoutName} calls the correct Event Companion map`
        );
        assert.equal(geometry.layout, layoutName);
      });
    }
  }
});

test("Take and Hold vs Reconnaissance stays locked to the Page 18-20 map block", () => {
  const setup = getLayoutOptionsForForceDispositions("Take and Hold", "Reconnaissance");
  assert.deepEqual(
    { myMission: setup.myMission, opponentMission: setup.opponentMission },
    { myMission: "Purge and Secure", opponentMission: "Reconnaissance Sweep" }
  );
  assert.deepEqual(setup.layouts.map((item) => item.page), [18, 19, 20]);
  assert.equal(getEventCompanionMapForForceDispositions("Take and Hold", "Reconnaissance", "A").page, 18);
  assert.equal(getEventCompanionMapForForceDispositions("Reconnaissance", "Take and Hold", "C").page, 20);
});

test("catalog validation rejects an index-to-geometry page mismatch", () => {
  const corrupted = {
    ...EVENT_COMPANION_MAP_CATALOG,
    layouts: EVENT_COMPANION_MAP_CATALOG.layouts.map((layout, index) =>
      index === 0 ? { ...layout, page: 999 } : layout)
  };
  const validation = validateEventCompanionMapCatalog(corrupted);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("Layout index page does not match geometry page")));
});

test("unknown Force Dispositions do not invent a Primary Mission or map", () => {
  assert.equal(getBattlePrimaryMissions("Unknown", "Disruption"), null);
  assert.equal(getLayoutOptionsForForceDispositions("Unknown", "Disruption"), null);
  assert.equal(getEventCompanionMapForForceDispositions("Unknown", "Disruption", "A"), null);
});

test("unknown mission pairs and invalid layout labels fail closed", () => {
  assert.equal(getEventCompanionMissionLayoutOptions("Unknown", "Mission"), null);
  assert.equal(getEventCompanionMapLayout("Battlefield Dominance", "Battlefield Dominance", "D"), null);
  assert.equal(getEventCompanionMapLayout("Unknown", "Mission", "A"), null);
  assert.equal(getEventCompanionMapForForceDispositions("Take and Hold", "Take and Hold", "D"), null);
});