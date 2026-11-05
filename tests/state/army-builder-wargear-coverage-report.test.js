import test from "node:test";
import assert from "node:assert/strict";
import { auditArmyCatalogCompleteness } from "../../src/rules/army-catalog-completeness-audit.js";
import { getTyranidWargearRuleSet } from "../../src/data/tyranid-wargear-rules.js";

for (const faction of ["Space Marines", "Adeptus Custodes", "Tyranids"]) {
  test(`${faction}: completeness separates selectable, fixed, and missing rules`, () => {
    const audit = auditArmyCatalogCompleteness(faction);
    const counts = audit.counts;
    assert.equal(counts.withStructuredLoadoutRules,
      counts.withSelectableLoadoutRules + counts.withFixedOnlyLoadoutRules + counts.withNoEquipmentRule,
      "Every structured rule falls into exactly one kind");
    assert.equal(counts.units,
      counts.withStructuredLoadoutRules + counts.missingStructuredLoadoutRules);
    assert.equal(counts.loadoutCoverageGaps, undefined, "Gap details belong at report level");
    assert.equal(audit.loadoutCoverageGaps.length, counts.missingStructuredLoadoutRules);
    for (const gap of audit.loadoutCoverageGaps) {
      assert.equal(getTyranidWargearRuleSet(gap.datasheetId), null);
      assert.ok(gap.name);
    }
    assert.equal(counts.withReviewedSelectableWargear, counts.withStructuredLoadoutRules,
      "Legacy field remains available but is not treated as selectable-only");
    assert.equal(audit.officialRulesCertification, "pending-per-unit-review");
  });
}

test("Fixed-only datasheets are not mistakenly counted as selectable wargear", () => {
  const marines = auditArmyCatalogCompleteness("Space Marines");
  assert.ok(marines.counts.withFixedOnlyLoadoutRules > 0);
  assert.ok(marines.counts.withSelectableLoadoutRules > 0);
});
