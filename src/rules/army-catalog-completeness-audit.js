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
    withOfficialCrossCheckPending: 0
  };
  const gaps = [];
  for (const candidate of candidates) {
    const characteristics = candidate.datasheet?.characteristics;
    const hasStats = characteristics != null && Object.keys(characteristics).length > 0;
    const weapons = candidate.datasheet?.weapons;
    const hasWeapons = Array.isArray(weapons) && weapons.length > 0;
    const hasPoints = Array.isArray(candidate.pointsOptions) && candidate.pointsOptions.some(option =>
      Number.isInteger(Number(option.models)) && Number(option.models) > 0 &&
      Number.isFinite(Number(option.points)) && Number(option.points) >= 0);
    const hasSelectableRules = Boolean(getTyranidWargearRuleSet(candidate.id));
    const crossCheck = candidate.officialRulesCrossCheck === "verified" ||
      candidate.datasheet?.dataSource?.officialRulesCrossCheck === "verified";
    if (hasStats) inventory.withCharacteristics++;
    if (hasWeapons) inventory.withCombatWeapons++;
    if (hasPoints) inventory.withPointsOptions++;
    if (hasSelectableRules) inventory.withReviewedSelectableWargear++;
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
    officialRulesCertification: "pending-per-unit-review",
    note: "Local profiles, points, and loadout rules may be incomplete; compare every unresolved record with the current official MFM/Codex before certifying."
  });
}
