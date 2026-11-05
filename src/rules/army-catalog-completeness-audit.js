import { findArmyUnitCandidates } from "../data/army-unit-catalog.js";
import { getTyranidWargearRuleSet } from "../data/tyranid-wargear-rules.js";

/**
 * Diagnostic inventory of the local Army Builder's evidence coverage.
 *
 * A profile or points option being present does not certify a current official
 * Codex/MFM match. Keep those separate from completeness of imported data.
 * This report never edits a roster, restricts battle play or guesses weapons.
 */
export function auditArmyCatalogCompleteness(faction) {
  const candidates = findArmyUnitCandidates({ faction });
  const inventory = {
    units: candidates.length,
    withCharacteristics: 0,
    withCombatWeapons: 0,
    withPointsOptions: 0,
    withReviewedSelectableWargear: 0,
    withStructuredLoadoutRules: 0,
    withSelectableLoadoutRules: 0,
    withFixedOnlyLoadoutRules: 0,
    withNoEquipmentRule: 0,
    missingStructuredLoadoutRules: 0,
    withOfficialCrossCheckPending: 0
  };
  const gaps = [];
  const loadoutCoverageGaps = [];
  for (const candidate of candidates) {
    const characteristics = candidate.datasheet?.characteristics;
    const hasStats = characteristics != null && Object.keys(characteristics).length > 0;
    const weapons = candidate.datasheet?.weapons;
    const hasWeapons = Array.isArray(weapons) && weapons.length > 0;
    const hasPoints = Array.isArray(candidate.pointsOptions) && candidate.pointsOptions.some(option =>
      Number.isInteger(Number(option.models)) && Number(option.models) > 0 &&
      Number.isFinite(Number(option.points)) && Number(option.points) >= 0);
    const loadoutRules = getTyranidWargearRuleSet(candidate.id);
    const hasStructuredRules = Boolean(loadoutRules);
    const hasSelectableRules = Boolean((loadoutRules?.slots ?? []).length || (loadoutRules?.optional ?? []).length);
    const hasNoEquipmentRule = loadoutRules?.noEquipment === true;
    const hasFixedOnlyRules = hasStructuredRules && !hasSelectableRules && !hasNoEquipmentRule;
    const crossCheck = candidate.officialRulesCrossCheck === "verified" ||
      candidate.datasheet?.dataSource?.officialRulesCrossCheck === "verified";
    if (hasStats) inventory.withCharacteristics++;
    if (hasWeapons) inventory.withCombatWeapons++;
    if (hasPoints) inventory.withPointsOptions++;
    // Retain the legacy metric for consumers while reporting its actual meaning
    // separately: a fixed-only profile is NOT a selectable equipment rule.
    if (hasStructuredRules) inventory.withReviewedSelectableWargear++;
    if (hasStructuredRules) inventory.withStructuredLoadoutRules++;
    if (hasSelectableRules) inventory.withSelectableLoadoutRules++;
    if (hasFixedOnlyRules) inventory.withFixedOnlyLoadoutRules++;
    if (hasNoEquipmentRule) inventory.withNoEquipmentRule++;
    if (!hasStructuredRules) {
      inventory.missingStructuredLoadoutRules++;
      loadoutCoverageGaps.push({ datasheetId: candidate.id, name: candidate.name,
        reason: "No structured loadout rules; determine whether wargear is fixed, selectable, or absent from an authoritative datasheet." });
    }
    if (!crossCheck) inventory.withOfficialCrossCheckPending++;
    const missing = [
      ...(!hasStats ? ["characteristics"] : []),
      ...(!hasWeapons ? ["combat-weapons"] : []),
      ...(!hasPoints ? ["points-options"] : [])
    ];
    if (missing.length) gaps.push({ datasheetId: candidate.id, name: candidate.name, missing });
  }
  return Object.freeze({
    faction,
    counts: Object.freeze(inventory),
    incompleteUnits: Object.freeze(gaps.map(item => Object.freeze({ ...item,
      missing: Object.freeze(item.missing) }))),
    loadoutCoverageGaps: Object.freeze(loadoutCoverageGaps.map(item => Object.freeze(item))),
    officialRulesCertification: "pending-per-unit-review",
    note: "Structured loadout rules are not proof of official Codex certification. Fixed-only, selectable, no-equipment and unreviewed entries are counted separately; compare unresolved records with current official sources."
  });
}
