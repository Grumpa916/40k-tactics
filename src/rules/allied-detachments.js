/**
 * Allied-detachment structure.
 * Deathwatch datasheets and points are not in this repo, so no catalog rows are added here.
 * pointsCap and detachmentCost stay null until a rules source in the repo records them.
 * warlordAllowed: false is the 22 Nov 2026 owner decision for Deathwatch allies.
 */
export const ALLIED_DETACHMENT_RULES = Object.freeze({
  deathwatch: Object.freeze({
    id: 'deathwatch',
    name: 'Deathwatch',
    confirmation: 'unconfirmed-needs-source',
    pointsCap: null,
    detachmentCost: null,
    warlordAllowed: false
  })
});

export function alliedRuleForTag(tag, rules = ALLIED_DETACHMENT_RULES) {
  const key = String(tag ?? '').trim().toLowerCase();
  if (!key) return null;
  return Object.values(rules).find(rule => rule.name.toLowerCase() === key) ?? null;
}

/**
 * A Deathwatch tag on a matched parent-catalog unit outside ALLIED UNITS stays the
 * chapter tag used by Space Marine imports. Unmatched units, and units pasted under
 * ALLIED UNITS, become allied units.
 */
export function classifyImportedAlliedUnit(unit, rosterFaction, rules = ALLIED_DETACHMENT_RULES) {
  const tag = String(unit?.factionTag ?? unit?.dataSource?.factionTag ?? '').trim();
  const rule = alliedRuleForTag(tag, rules);
  if (!rule) return unit;
  if (tag.toLowerCase() === String(rosterFaction ?? '').trim().toLowerCase()) return unit;
  if (unit?.datasheetId && !unit.importedFromAlliedSection) return unit;
  return {
    ...unit,
    alliedFaction: rule.name,
    dataSource: unit.dataSource ? { ...unit.dataSource, alliedFaction: rule.name } : unit.dataSource
  };
}

export function assessAlliedDetachments(roster, rules = ALLIED_DETACHMENT_RULES) {
  const groups = new Map();
  const issues = [];
  for (const unit of roster?.units ?? []) {
    const rule = alliedRuleForTag(unit?.alliedFaction, rules);
    if (!rule) continue;
    if (!groups.has(rule.name)) groups.set(rule.name, { rule, units: [], points: 0, warlords: [] });
    const group = groups.get(rule.name);
    group.units.push(unit);
    if (Number.isFinite(unit.points)) group.points += unit.points;
    if (unit.isWarlord === true || unit.warlord === true) group.warlords.push(unit);
  }
  for (const group of groups.values()) {
    const rule = group.rule;
    if (rule.warlordAllowed === false && group.warlords.length) {
      issues.push({
        code: 'allied-warlord',
        severity: 'error',
        message: rule.name + ' allied units cannot be the army Warlord.'
      });
    }
    if (rule.pointsCap != null && group.points > rule.pointsCap) {
      issues.push({
        code: 'allied-points-cap',
        severity: 'error',
        message: rule.name + ' allies total ' + group.points + ' points, above the ' + rule.pointsCap + ' point cap.'
      });
    }
    if (rule.confirmation !== 'confirmed' && (rule.pointsCap == null || rule.detachmentCost == null)) {
      issues.push({
        code: 'allied-rules-unconfirmed',
        severity: 'warning',
        message: rule.name + ' ally points cap and detachment cost are not confirmed from a rules source in this app, so those limits are not enforced.'
      });
    }
  }
  return {
    detachments: [...groups.values()].map(group => ({
      faction: group.rule.name,
      unitIds: group.units.map(unit => unit.id),
      points: group.points,
      pointsCap: group.rule.pointsCap,
      detachmentCost: group.rule.detachmentCost,
      rulesConfirmed: group.rule.confirmation === 'confirmed'
    })),
    issues
  };
}
