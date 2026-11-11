import { getAdeptusCustodesDatasheetDetails } from '../data/adeptus-custodes-datasheet-details.js';
import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { buildManualWargearLoadout } from './wargear-loadout-validation.js';

// Only source-reviewed, non-selectable Custodes datasheets are automatic.
// Optional Vexilla, selectable arm/vehicle weapons, and optional add-ons still
// require an explicit choice: never guess what was built or put on the table.
export function isReviewedFixedCustodesLoadout(unit) {
  if (!unit?.datasheetId?.startsWith('adeptus-custodes:')) return false;
  const ruleSet = getTyranidWargearRuleSet(unit.datasheetId);
  return Boolean(ruleSet?.fixed?.length &&
    !ruleSet.slots?.length && !ruleSet.optional?.length && !ruleSet.constraints?.length);
}

export function hydrateReviewedFixedCustodesLoadout(unit) {
  if (!isReviewedFixedCustodesLoadout(unit)) return unit;
  if ((unit.equippedWargear?.length ?? 0) || (unit.equippedWeapons?.length ?? 0) ||
      (unit.unmatchedWargear?.length ?? 0) ||
      ['source-invalid','rules-invalid','unverified'].includes(unit.loadoutValidation?.status)) return unit;

  const ruleSet = getTyranidWargearRuleSet(unit.datasheetId);
  const sheet = unit.datasheet ?? getAdeptusCustodesDatasheetDetails(unit.datasheetId);
  const printedProfiles = new Set((sheet?.weapons ?? []).map(item => item.name));
  if (!printedProfiles.size || ruleSet.fixed.some(item =>
      (item.profiles ?? [item.name]).some(name => !printedProfiles.has(name)))) return unit;

  const count = Number(unit.modelCount);
  if (!Number.isInteger(count) || count < 1) return unit;
  const selections = ruleSet.fixed.map(item => ({
    name:item.name,
    quantity:(item.count ?? 0)+(item.perModel ?? 0)*count
  }));
  if (selections.some(item => !Number.isInteger(item.quantity) || item.quantity <= 0)) return unit;
  const built = buildManualWargearLoadout(unit, selections);
  if (built.loadoutValidation.status !== 'rules-reviewed-valid') return unit;
  return {
    ...unit, ...built,
    loadoutValidation:{...built.loadoutValidation,source:'reviewed-fixed-custodes'}
  };
}

export function hydrateReviewedFixedCustodesRoster(roster) {
  if (!roster || !Array.isArray(roster.units)) return roster;
  const units=roster.units.map(hydrateReviewedFixedCustodesLoadout);
  return units.every((unit,i)=>unit===roster.units[i]) ? roster : {...roster,units};
}
