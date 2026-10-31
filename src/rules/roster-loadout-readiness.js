import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { validateWargearLoadout } from './wargear-loadout-validation.js';

const INVALID_STATUSES = new Set(['source-invalid', 'rules-invalid', 'unverified']);

function issueText(unit, fallback) {
  const errors = unit?.loadoutValidation?.errors;
  return Array.isArray(errors) && errors.length ? errors.join(' ') : fallback;
}

export function assessUnitLoadoutReadiness(unit) {
  const ruleSet = getTyranidWargearRuleSet(unit?.datasheetId);
  const recordedStatus = unit?.loadoutValidation?.status ?? null;

  if (!ruleSet) {
    if (INVALID_STATUSES.has(recordedStatus)) {
      return Object.freeze({
        unitId: unit?.id ?? null,
        name: unit?.name ?? 'Unit',
        status: 'invalid',
        blocking: true,
        reviewedRules: false,
        reason: issueText(unit, 'Imported equipment is unresolved or invalid and must be corrected before battle use.')
      });
    }
    if (recordedStatus === 'manual-selection-required') {
      return Object.freeze({
        unitId: unit?.id ?? null,
        name: unit?.name ?? 'Unit',
        status: 'needs-confirmation',
        blocking: true,
        reviewedRules: false,
        reason: issueText(unit, 'Confirm this unit’s combat-relevant loadout before battle use.')
      });
    }
    return Object.freeze({
      unitId: unit?.id ?? null,
      name: unit?.name ?? 'Unit',
      status: 'not-assessed',
      blocking: false,
      reviewedRules: false,
      reason: 'Reviewed selectable loadout rules are not available for this datasheet yet.'
    });
  }

  if (recordedStatus === 'source-invalid') {
    return Object.freeze({
      unitId: unit?.id ?? null,
      name: unit?.name ?? 'Unit',
      status: 'invalid',
      blocking: true,
      reviewedRules: true,
      reason: issueText(unit, 'The imported loadout could not be matched safely to the reviewed datasheet rules.')
    });
  }

  if (recordedStatus === 'manual-selection-required' || !Array.isArray(unit?.equippedWargear) || !unit.equippedWargear.length) {
    return Object.freeze({
      unitId: unit?.id ?? null,
      name: unit?.name ?? 'Unit',
      status: 'needs-confirmation',
      blocking: true,
      reviewedRules: true,
      reason: 'Choose and save this unit’s actual combat-relevant wargear before battle use.'
    });
  }

  const validation = validateWargearLoadout(unit);
  if (validation.status !== 'rules-reviewed-valid') {
    return Object.freeze({
      unitId: unit?.id ?? null,
      name: unit?.name ?? 'Unit',
      status: 'invalid',
      blocking: true,
      reviewedRules: true,
      reason: validation.errors?.join(' ') || 'The selected loadout does not match the reviewed datasheet rules.'
    });
  }

  return Object.freeze({
    unitId: unit?.id ?? null,
    name: unit?.name ?? 'Unit',
    status: 'complete',
    blocking: false,
    reviewedRules: true,
    reason: 'Combat-relevant loadout is complete and legal.'
  });
}

export function assessRosterLoadoutReadiness(roster) {
  const units = Object.freeze((roster?.units ?? []).map(assessUnitLoadoutReadiness));
  const totals = units.reduce((summary, unit) => {
    summary[unit.status] = (summary[unit.status] ?? 0) + 1;
    if (unit.blocking) summary.blocking += 1;
    if (unit.reviewedRules) summary.reviewed += 1;
    return summary;
  }, { complete: 0, 'needs-confirmation': 0, invalid: 0, 'not-assessed': 0, blocking: 0, reviewed: 0 });
  return Object.freeze({
    status: totals.blocking ? 'needs-attention' : 'ready',
    battleReady: totals.blocking === 0,
    units,
    totals: Object.freeze(totals)
  });
}

export function loadoutReadinessLabel(unit) {
  const assessment = assessUnitLoadoutReadiness(unit);
  if (assessment.status === 'complete') return 'Loadout ready';
  if (assessment.status === 'needs-confirmation') return 'Loadout needs confirmation';
  if (assessment.status === 'invalid') return 'Loadout invalid';
  return 'Loadout rules coverage pending';
}
