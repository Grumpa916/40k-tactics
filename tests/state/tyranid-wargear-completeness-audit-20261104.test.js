import test from "node:test";
import assert from "node:assert/strict";
import { findArmyUnitCandidates } from "../../src/data/army-unit-catalog.js";
import { getTyranidWargearRuleSet, getTyranidWargearSelections } from "../../src/data/tyranid-wargear-rules.js";
import { TYRANID_FIXED_WARGEAR_COVERAGE, TYRANID_COMPLEX_LOADOUT_REVIEW } from "../../src/data/tyranid-fixed-wargear-coverage.js";
import { auditArmyCatalogCompleteness } from "../../src/rules/army-catalog-completeness-audit.js";
import { buildManualWargearLoadout, validateWargearLoadout } from "../../src/rules/wargear-loadout-validation.js";
import { assessUnitLoadoutReadiness } from "../../src/rules/roster-loadout-readiness.js";

const catalog = () => findArmyUnitCandidates({ faction: "Tyranids" });

test("Tyranid audit accounts for all 57 entries without inventing ambiguous equipment", () => {
  const units = catalog();
  assert.equal(units.length, 57);
  const audit = auditArmyCatalogCompleteness("Tyranids");
  const unresolved = new Set(TYRANID_COMPLEX_LOADOUT_REVIEW);
  assert.equal(unresolved.size, 6);
  assert.equal(audit.counts.missingStructuredLoadoutRules, unresolved.size);
  assert.deepEqual(new Set(audit.loadoutCoverageGaps.map(g => g.datasheetId)), unresolved);
  assert.equal(audit.counts.withStructuredLoadoutRules, 51);
  for (const item of units) {
    assert.equal(Boolean(getTyranidWargearRuleSet(item.id)), !unresolved.has(item.id), item.name);
  }
});

test("fixed-only rules preserve explicit existing weapon names and do not imply GW certification", () => {
  for (const [id, rule] of Object.entries(TYRANID_FIXED_WARGEAR_COVERAGE)) {
    assert.equal(rule.officialWargearCertification, "pending", id);
    const unit = catalog().find(candidate => candidate.id === id);
    assert.ok(unit, id);
    assert.deepEqual(
      (rule.fixed ?? []).map(x => x.name),
      (unit.datasheet?.weapons ?? []).map(x => x.name),
      id + ": no extra or missing weapon profiles"
    );
  }
});

test("Exocrine, Norn Assimilator and Hormagaunts have quantities from fixed reviewed catalog profiles", () => {
  for (const [id, names, models] of [
    ["tyranids:exocrine", ["Bio-plasmic cannon", "Powerful limbs"], 1],
    ["tyranids:norn-assimilator", ["Toxinjector Harpoon (ranged)", "Monstrous scything talons", "Toxinjector Harpoon (melee)"], 1],
    ["tyranids:hormagaunts", ["Hormagaunt talons"], 10]
  ]) {
    const rule = getTyranidWargearRuleSet(id);
    assert.deepEqual(getTyranidWargearSelections(id).map(x => x.name), names);
    const selections = rule.fixed.map(item => ({ name: item.name, quantity: (item.count ?? 0) + (item.perModel ?? 0) * models }));
    const result = buildManualWargearLoadout({
      datasheetId: id,
      modelCount: models,
      datasheet: catalog().find(x => x.id === id).datasheet
    }, selections);
    assert.equal(result.loadoutValidation.status, "rules-reviewed-valid", id);
    assert.deepEqual(result.equippedWeapons.map(x => x.quantity),
      rule.fixed.map(x => (x.count ?? 0) + (x.perModel ?? 0) * models));
  }
});

test("Spore Mines and Mucolid Spores are explicitly weaponless instead of receiving invented attacks", () => {
  for (const id of ["tyranids:spore-mines", "tyranids:mucolid-spores"]) {
    const rule = getTyranidWargearRuleSet(id);
    assert.equal(rule.noEquipment, true);
    assert.equal(validateWargearLoadout({ datasheetId: id, equippedWargear: [] }).status, "rules-reviewed-valid");
    assert.equal(assessUnitLoadoutReadiness({ id, name: id, datasheetId: id, equippedWargear: [] }).status, "complete");
    assert.deepEqual(getTyranidWargearSelections(id), []);
  }
});

test("Alternative firing modes and mixed compositions are held for exact option review", () => {
  for (const id of TYRANID_COMPLEX_LOADOUT_REVIEW) {
    assert.equal(getTyranidWargearRuleSet(id), null);
  }
});
