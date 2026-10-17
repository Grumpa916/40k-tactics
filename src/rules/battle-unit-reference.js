import { ARMY_UNIT_CATALOG } from "../data/army-unit-catalog.js";

// Saved battle roster data can fill missing live profiles, including older saves.
// Older in-progress battles can lack the embedded roster snapshot, so fall back to
// the reviewed unit catalog using the battle unit's stable datasheet ID or name.
export function getBattleUnitDatasheet(state, unit) {
  const rosterUnit = state?.armyRosters?.[unit?.ownerId]?.units?.find(item => item.id === unit?.metadata?.rosterUnitId);
  if (rosterUnit?.datasheet) return rosterUnit.datasheet;

  const datasheetId = unit?.metadata?.datasheetId;
  if (datasheetId) {
    const catalogUnit = ARMY_UNIT_CATALOG.find(item => item?.id === datasheetId);
    if (catalogUnit?.datasheet) return catalogUnit.datasheet;
  }

  const unitName = String(unit?.name ?? "").trim().toLowerCase();
  if (!unitName) return null;
  const rosterFaction = String(state?.armyRosters?.[unit?.ownerId]?.faction ?? "").trim().toLowerCase();
  const catalogUnit = ARMY_UNIT_CATALOG.find(item =>
    String(item?.name ?? "").trim().toLowerCase() === unitName &&
    (!rosterFaction || String(item?.faction ?? "").trim().toLowerCase() === rosterFaction)
  );
  return catalogUnit?.datasheet ?? null;
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
