import test from "node:test";
import assert from "node:assert/strict";
import {
  getEventCompanionMapLayout,
  getEventCompanionMissionLayoutOptions,
  listEventCompanionMissionPairs,
  validateEventCompanionMapCatalog
} from "../src/rules/event-companion-map-catalog.js";

test("catalog contains 15 mission pairs and all 45 verified layouts", () => {
  assert.equal(listEventCompanionMissionPairs().length, 15);
  assert.equal(validateEventCompanionMapCatalog().valid, true);
});

test("mission pair lookup is order independent and returns A/B/C with source pages", () => {
  const options = getEventCompanionMissionLayoutOptions("Unstoppable Force", "Immovable Object");
  assert.deepEqual(options.map((item) => item.layout), ["A", "B", "C"]);
  assert.deepEqual(options.map((item) => item.page), [12, 13, 14]);
  assert.equal(options[0].missionKey, "Immovable Object ↔ Unstoppable Force");
});

test("selected layout returns only verified geometry for the matching mission pair", () => {
  const layout = getEventCompanionMapLayout("Battlefield Dominance", "Battlefield Dominance", "B");
  assert.equal(layout.page, 10);
  assert.equal(layout.verified, true);
  assert.equal(Object.keys(layout.objectivePositions).length, 5);
  assert.equal(Object.keys(layout.terrainGeometry).length, 16);
});

test("unknown mission pairs and invalid layout labels fail closed", () => {
  assert.equal(getEventCompanionMissionLayoutOptions("Unknown", "Mission"), null);
  assert.equal(getEventCompanionMapLayout("Battlefield Dominance", "Battlefield Dominance", "D"), null);
  assert.equal(getEventCompanionMapLayout("Unknown", "Mission", "A"), null);
});
