import assert from "node:assert/strict";
import test from "node:test";
import { COMPLETE_SECONDARY_MISSION_CATALOG } from "../../src/data/secondary-mission-complete-catalog.js";
import { renderSecondaryPlanner, secondaryWhen } from "../../src/ui/secondary-planner-panel.js";

test("secondary planner lists all 18 cards with scoring and timing", () => {
  assert.equal(COMPLETE_SECONDARY_MISSION_CATALOG.length, 18);
  const html = renderSecondaryPlanner({ open: true, filter: "all", query: "", held: [], view: "list" });
  for (const mission of COMPLETE_SECONDARY_MISSION_CATALOG) {
    assert.match(html, new RegExp(mission.name.replaceAll("'", "&#039;")));
    assert.ok(mission.scoringWindows.length > 0, mission.name);
    assert.ok(["your-turn", "opponent", "either"].includes(secondaryWhen(mission)), mission.name);
  }
  assert.match(html, /End of your turn/);
  assert.match(html, /opponent/);
});

test("secondary planner can filter to action cards", () => {
  const html = renderSecondaryPlanner({ open: true, filter: "action", query: "", held: ["secondary-cleanse"], view: "list" });
  assert.match(html, /Cleanse/);
  assert.match(html, /Plunder/);
  assert.doesNotMatch(html, /Assassination/);
  assert.match(html, /In hand/);
});

test("secondary map places every card in a zone or as location-free", () => {
  const html = renderSecondaryPlanner({ open: true, filter: "all", query: "", held: [], view: "map" });
  for (const name of [
    "Behind Enemy Lines", "Forward Position", "Cleanse", "Beacon", "Plunder 5VP", "Outflank",
    "Display of Might", "Secure No Man", "A Tempting Target", "Centre Ground",
    "Defend Stronghold", "Assassination", "Bring it Down", "A Grievous Blow", "No Prisoners",
    "Overwhelming Force", "Burden of Trust", "Engage on All Fronts"
  ]) {
    assert.ok(html.includes(name), name);
  }
  assert.match(html, /His deployment zone/);
  assert.match(html, /Place does not matter/);
});

test("selected secondaries sort above the alphabetical list", () => {
  const html = renderSecondaryPlanner({
    open: true, filter: "all", query: "", view: "list",
    held: ["secondary-cleanse", "secondary-assassination"]
  });
  const names = [...html.matchAll(/<h3>(.*?)<\/h3>/g)].map((match) => match[1]);
  assert.deepEqual(names.slice(0, 2), ["Assassination", "Cleanse"]);
  const rest = names.slice(2);
  assert.deepEqual(rest.toSorted((left, right) => left.localeCompare(right)), rest);
});

test("active map missions are marked for the light blue style", () => {
  const html = renderSecondaryPlanner({
    open: true, filter: "all", query: "", view: "map",
    held: ["secondary-cleanse", "secondary-engage-on-all-fronts"]
  });
  assert.match(html, /class="is-active"><strong>Cleanse/);
  assert.match(html, /secondary-map__quarters is-active/);
});
