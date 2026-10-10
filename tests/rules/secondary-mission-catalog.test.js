import test from "node:test";
import assert from "node:assert/strict";
import {
  SECONDARY_MISSION_CATALOG,
  SECONDARY_MISSION_CATALOG_SOURCE
} from "../../src/data/secondary-mission-catalog.js";

function cardNamed(name) {
  const card = SECONDARY_MISSION_CATALOG.find((entry) => entry.name === name);
  assert.ok(card, `expected catalog entry for ${name}`);
  return card;
}

test("GDM correction is reflected without assigning a false per-tier cap", () => {
  for (const [name, targetText] of [
    ["A Grievous Blow", "Starting Strength 13+"],
    ["Bring it Down", "10+ Wounds"]
  ]) {
    const card = cardNamed(name);
    assert.equal(card.rulesVerified, false, `${name} must await official-card verification`);

    const fixed = card.scoringWindows.filter((window) => window.modes.includes("fixed"));
    const tactical = card.scoringWindows.filter((window) => window.modes.includes("tactical"));
    assert.ok(fixed.length > 0, `${name} needs Fixed scoring windows`);
    assert.ok(tactical.length > 0, `${name} needs Tactical scoring windows`);

    for (const window of [...fixed, ...tactical]) {
      for (const tier of window.tiers) {
        assert.equal(
          Object.hasOwn(tier, "maxVP"),
          false,
          `${name} should not encode the disputed obsolete MAX 5 VP marker as a tier cap`
        );
      }
    }
    assert.ok(
      tactical.every((window) => window.tiers.some((tier) =>
        tier.vp === 5 &&
        tier.summary.includes("One or more") &&
        tier.summary.includes(targetText)
      )),
      `${name} Tactical tier should award the flat 5 VP trigger for one or more qualifying targets`
    );
  }
});

test("third-party cross-checking never promotes the full catalog to official verification", () => {
  assert.ok(SECONDARY_MISSION_CATALOG_SOURCE.crossCheckSources.includes(
    "https://gdmissions.app/11th/secondary-missions"
  ));
  assert.ok(SECONDARY_MISSION_CATALOG_SOURCE.crossCheckSources.includes(
    "https://gdmissions.app/version-history"
  ));
  assert.equal(SECONDARY_MISSION_CATALOG_SOURCE.rulesVerified, false);

  const verified = SECONDARY_MISSION_CATALOG.filter((entry) => entry.rulesVerified);
  assert.deepEqual(verified.map((entry) => entry.name).sort(), ["Assassination", "Centre Ground"]);
  assert.ok(SECONDARY_MISSION_CATALOG.every((entry) =>
    entry.rulesVerified === true || entry.name === "Assassination" || entry.name === "Centre Ground"
  ));
});
