// Saved battle roster data can fill missing live profiles, including older saves.
export function getBattleUnitDatasheet(state, unit) {
  const rosterUnit = state?.armyRosters?.[unit?.ownerId]?.units?.find(item => item.id === unit?.metadata?.rosterUnitId);
  return rosterUnit?.datasheet ?? null;
}

export function getBattleUnitMovement(state, unit, model = {}) {
  const raw = model.profile?.characteristics?.movement ?? model.characteristics?.movement ?? model.movement ??
    unit.profile?.characteristics?.movement ?? unit.characteristics?.movement ?? unit.movement ??
    getBattleUnitDatasheet(state, unit)?.characteristics?.movement ?? getBattleUnitDatasheet(state, unit)?.characteristics?.Move;
  const match = typeof raw === 'string' ? raw.match(/^\s*(\d+(?:\.\d+)?)\s*(?:["″]|in)?\s*$/i) : null;
  const value = typeof raw === 'number' ? raw : match ? Number(match[1]) : NaN;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

// Missing/unresolved weapon data remains unknown; it never means no ranged weapons.
export function hasConfirmedNoRangedWeapons(state, unit) {
  const weapons = unit?.profile?.weapons ?? unit?.weapons ?? getBattleUnitDatasheet(state, unit)?.weapons;
  if (!Array.isArray(weapons) || weapons.length === 0) return false;
  return weapons.every(weapon => weapon?.type === 'melee' || String(weapon?.range ?? weapon?.characteristics?.range ?? '').trim().toLowerCase() === 'melee');
}
