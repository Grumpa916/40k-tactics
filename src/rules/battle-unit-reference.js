import { ARMY_UNIT_CATALOG } from "../data/army-unit-catalog.js";

function normalizeWeaponName(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getBattleRosterUnit(state, unit) {
  return state?.armyRosters?.[unit?.ownerId]?.units?.find(item => item.id === unit?.metadata?.rosterUnitId) ?? null;
}

export function hasSourceInvalidWargear(state, unit) {
  return getBattleRosterUnit(state, unit)?.loadoutValidation?.status === "source-invalid";
}

export function hasInvalidWargear(state, unit) {
  return ["source-invalid", "rules-invalid", "manual-selection-required", "unverified"].includes(getBattleRosterUnit(state, unit)?.loadoutValidation?.status);
}

// Saved battle roster data can fill missing live profiles, including older saves.
// Older in-progress battles can lack the embedded roster snapshot, so fall back to
// the reviewed unit catalog using the battle unit's stable datasheet ID or name.
export function getBattleUnitDatasheet(state, unit) {
  const rosterUnit = getBattleRosterUnit(state, unit);
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
// A valid explicit loadout is authoritative for candidate eligibility. Unresolved,
// invalid, or unverified loadouts cannot be used to infer Shooting eligibility.
export function hasConfirmedNoRangedWeapons(state, unit) {
  const datasheetWeapons = unit?.profile?.weapons ?? unit?.weapons ?? getBattleUnitDatasheet(state, unit)?.weapons;
  if (!Array.isArray(datasheetWeapons) || datasheetWeapons.length === 0) return false;

  const rosterUnit = getBattleRosterUnit(state, unit);
  if (["source-invalid", "rules-invalid", "manual-selection-required", "unverified"].includes(rosterUnit?.loadoutValidation?.status)) return false;

  const equipped = Array.isArray(rosterUnit?.equippedWeapons) ? rosterUnit.equippedWeapons : null;
  let weapons = datasheetWeapons;
  if (equipped?.length) {
    const selected = new Set(equipped.map(item => normalizeWeaponName(item?.name)).filter(Boolean));
    const matched = datasheetWeapons.filter(weapon => selected.has(normalizeWeaponName(weapon?.name)));
    if (!matched.length) return false;
    weapons = matched;
  }

  return weapons.every(weapon => weapon?.type === 'melee' || String(weapon?.range ?? weapon?.characteristics?.range ?? '').trim().toLowerCase() === 'melee');
}
