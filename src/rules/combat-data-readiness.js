import { getDatasheetWeaponOptions, getProbabilisticUnitProfile } from './saved-roster-combat-profile.js';
import { assessRosterRulesData } from './roster-rules-data-validation.js';

export function getCombatDataReadiness(state) {
  const issues = [];
  for (const unit of state.units ?? []) {
    if (unit.status === 'destroyed') continue;
    const profile = getProbabilisticUnitProfile(state, unit);
    const c = profile?.characteristics ?? {};
    const missing = ['toughness', 'save'].filter(key => !Number.isFinite(c[key]) || c[key] <= 0);
    if (!Number.isFinite(profile?.wounds)) missing.push('wounds');
    const weapons = getDatasheetWeaponOptions(state, unit);
    if (!weapons.length) missing.push('reviewed weapon loadout');
    if (weapons.some(w => ['attacks', 'strength', 'ap', 'damage'].some(key => w.characteristics?.[key] == null))) missing.push('weapon combat characteristics');
    if (weapons.some(w => w.quantityUncertain)) missing.push('surviving weapon models');
    if (missing.length) issues.push({ unitId: unit.id, playerId: unit.ownerId, name: unit.name, detail: missing.join(', ') });
  }
  for (const [playerId, roster] of Object.entries(state.armyRosters ?? {})) {
    const review = assessRosterRulesData(roster);
    if (review.status === 'review-required') issues.push({ playerId, name: roster.name ?? roster.faction, detail: 'Saved rules data needs review' });
    if (roster.rulesDataRevision?.points?.revisionLabel?.includes('cross-check pending')) {
      issues.push({ playerId, name: roster.faction, detail: 'Points reference still awaits official cross-check' });
    }
  }
  return { ready: !issues.length, issues };
}
