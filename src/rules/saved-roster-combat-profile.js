import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { getLiveUnitVitals } from './live-unit-vitals.js';
import { getLiveSelectionQuantity } from './live-casualty-loadout.js';
import {
  getBattleRosterUnit,
  getBattleUnitDatasheet,
  getCombatFormationMembers,
  getCombatFormationRoot
} from "./battle-unit-reference.js";

export function parseCombatCharacteristic(value) {
  if (Number.isFinite(value)) return Number(value);
  const match = String(value ?? "").trim().match(/^(\d+(?:\.\d+)?)\s*(?:[+"″]|in)?$/i);
  return match ? Number(match[1]) : null;
}

function normalizeWeaponName(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isInvalidLoadout(rosterUnit) {
  return ["source-invalid", "rules-invalid", "manual-selection-required", "unverified"].includes(rosterUnit?.loadoutValidation?.status);
}

function explicitWeaponLoadout(state, unit) {
  const rosterUnit = getBattleRosterUnit(state, unit);
  if (isInvalidLoadout(rosterUnit)) return null;
  const equipped = rosterUnit?.equippedWeapons;
  if (!Array.isArray(equipped) || !equipped.length) return null;
  const loadout = new Map();
  for (const item of equipped) {
    const key = normalizeWeaponName(item?.name);
    if (!key) continue;
    const quantity = Number.isInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 1;
    const current = loadout.get(key);
    loadout.set(key, { ...item, quantity: (current?.quantity ?? 0) + quantity });
  }
  return loadout.size ? loadout : null;
}

function scaleAttackCount(attacks, quantity) {
  if (!Number.isInteger(quantity)) return attacks;
  if (quantity === 0) return 0;
  if (quantity === 1) return attacks;
  if (Number.isInteger(attacks) && attacks >= 0) return attacks * quantity;
  const text = String(attacks ?? "").trim();
  if (/^\d+$/.test(text)) return Number(text) * quantity;
  const dice = text.match(/^(\d*)D([36])(?:\+(\d+))?$/i);
  if (!dice) return attacks;
  const count = Number(dice[1] || 1) * quantity;
  const modifier = Number(dice[3] || 0) * quantity;
  return `${count}D${dice[2]}${modifier ? `+${modifier}` : ""}`;
}

function profileIsSelection(profileName, selection) {
  return (selection?.profiles ?? [selection?.name]).some((name) => normalizeWeaponName(name) === normalizeWeaponName(profileName));
}

function reviewedQuantityContext(rosterUnit, profileName, loadoutEntry) {
  const ruleSet = getTyranidWargearRuleSet(rosterUnit?.datasheetId);
  if (!ruleSet) return null;
  const selectionName = loadoutEntry?.selectionName ?? loadoutEntry?.name ?? profileName;
  const selectionKey = normalizeWeaponName(selectionName);

  const fixed = (ruleSet.fixed ?? []).find((item) =>
    normalizeWeaponName(item.name) === selectionKey || profileIsSelection(profileName, item)
  );
  if (fixed?.perModel) return { exactPerModel: true, perModel: fixed.perModel, kind: 'fixed-per-model' };

  const optional = (ruleSet.optional ?? []).find((item) =>
    normalizeWeaponName(item.name) === selectionKey || profileIsSelection(profileName, item)
  );
  if (optional?.perModel) {
    return {
      exactPerModel: optional.allOrNone === true,
      perModel: optional.perModel,
      kind: optional.allOrNone ? 'all-or-none-per-model' : 'optional-per-model'
    };
  }

  const slot = (ruleSet.slots ?? []).find((candidate) =>
    (candidate.choices ?? []).some((choice) =>
      normalizeWeaponName(choice.name) === selectionKey || profileIsSelection(profileName, choice)
    )
  );
  if (!slot?.perModel) return null;

  const equippedSelections = new Set((rosterUnit?.equippedWeapons ?? [])
    .map((item) => item?.selectionName ?? item?.name)
    .filter(Boolean)
    .map(normalizeWeaponName)
    .filter((name) => (slot.choices ?? []).some((choice) => normalizeWeaponName(choice.name) === name)));
  const homogeneous = equippedSelections.size === 1;
  return {
    exactPerModel: homogeneous,
    perModel: slot.perModel,
    kind: homogeneous ? 'homogeneous-slot' : 'mixed-slot'
  };
}

function inferReviewedLegacyQuantity(rosterUnit, profileName, startingModels) {
  if (!rosterUnit || !Number.isInteger(startingModels) || startingModels < 1) return null;
  const ruleSet = getTyranidWargearRuleSet(rosterUnit.datasheetId);
  const fixed = (ruleSet?.fixed ?? []).find((item) => profileIsSelection(profileName, item));
  if (!fixed?.perModel) return null;
  return fixed.perModel * startingModels;
}

function resolveEquippedQuantity(state, unit, profileName, loadoutEntry) {
  const rosterUnit = getBattleRosterUnit(state, unit);
  const vitals = getLiveUnitVitals(state, unit);
  const startingModels = Number.isInteger(vitals.startingModels) ? vitals.startingModels : null;
  const currentModels = Number.isInteger(vitals.models) ? vitals.models : null;
  const explicit = loadoutEntry?.quantity ?? null;
  const inferred = explicit == null ? inferReviewedLegacyQuantity(rosterUnit, profileName, startingModels) : null;
  const startingQuantity = explicit ?? inferred ?? 1;
  const context = reviewedQuantityContext(rosterUnit, profileName, loadoutEntry);
  const selectionName = loadoutEntry?.selectionName ?? loadoutEntry?.name ?? profileName;
  const trackedQuantity = context?.perModel ? getLiveSelectionQuantity(state, unit, selectionName) : null;

  if (currentModels === 0) {
    return { startingQuantity, activeQuantity: 0, quantityBasis: context?.kind ?? (explicit != null ? 'explicit' : inferred != null ? 'reviewed-fixed' : 'unit-profile'), quantityUncertain: false };
  }
  if (Number.isInteger(trackedQuantity) && trackedQuantity >= 0) {
    return {
      startingQuantity,
      activeQuantity: trackedQuantity,
      quantityBasis: `tracked-${context?.kind ?? 'per-model'}`,
      quantityUncertain: false
    };
  }
  if (currentModels == null || startingModels == null || currentModels >= startingModels || !context?.perModel) {
    return { startingQuantity, activeQuantity: startingQuantity, quantityBasis: context?.kind ?? (explicit != null ? 'explicit' : inferred != null ? 'reviewed-fixed' : 'unit-profile'), quantityUncertain: false };
  }
  if (context.exactPerModel) {
    return {
      startingQuantity,
      activeQuantity: Math.min(startingQuantity, currentModels * context.perModel),
      quantityBasis: context.kind,
      quantityUncertain: false
    };
  }
  return {
    startingQuantity,
    activeQuantity: startingQuantity,
    quantityBasis: context.kind,
    quantityUncertain: true
  };
}

function weaponAbilityCharacteristics(abilities) {
  const text = String(abilities ?? "");
  const sustained = text.match(/Sustained Hits\s+(\d+)/i);
  return {
    ...(/\bTorrent\b/i.test(text) ? { torrent: true } : {}),
    ...(/\bIgnores Cover\b/i.test(text) ? { ignoresCover: true } : {}),
    ...(sustained ? { sustainedHits: Number(sustained[1]) } : {}),
    ...(/\bLethal Hits\b/i.test(text) ? { lethalHits: true } : {}),
    ...(/\bDevastating Wounds\b/i.test(text) ? { devastatingWounds: true } : {})
  };
}

export function getDatasheetWeaponOptions(state, unit, { type = null } = {}) {
  const rosterUnit = getBattleRosterUnit(state, unit);
  if (isInvalidLoadout(rosterUnit)) return [];

  const weapons = getBattleUnitDatasheet(state, unit)?.weapons;
  if (!Array.isArray(weapons)) return [];
  const loadout = explicitWeaponLoadout(state, unit);

  return weapons.flatMap((weapon, index) => {
    const loadoutEntry = loadout?.get(normalizeWeaponName(weapon?.name)) ?? null;
    if (loadout && !loadoutEntry) return [];

    const rawRange = weapon?.range ?? weapon?.characteristics?.range;
    const isMelee = String(rawRange ?? "").trim().toLowerCase() === "melee";
    const weaponType = isMelee ? "melee" : "ranged";
    if (type && weaponType !== type) return [];

    const range = isMelee ? null : parseCombatCharacteristic(rawRange);
    if (!isMelee && range == null) return [];

    const skill = parseCombatCharacteristic(weapon?.skill ?? weapon?.characteristics?.skill);
    const name = weapon?.name ?? `${weaponType === "melee" ? "Melee" : "Ranged"} weapon ${index + 1}`;
    const quantity = resolveEquippedQuantity(state, unit, name, loadoutEntry);
    if (quantity.activeQuantity === 0) return [];
    const attacks = weapon?.attacks ?? weapon?.characteristics?.attacks;
    return [{
      id: `datasheet:${unit.id}:${index}`,
      name,
      type: weaponType,
      equippedQuantity: quantity.startingQuantity,
      activeQuantity: quantity.activeQuantity,
      quantityBasis: quantity.quantityBasis,
      quantityUncertain: quantity.quantityUncertain,
      characteristics: {
        ...(range == null ? {} : { range }),
        ...(!quantity.quantityUncertain ? { attacks: scaleAttackCount(attacks, quantity.activeQuantity) } : {}),
        strength: weapon?.strength ?? weapon?.characteristics?.strength,
        ap: weapon?.ap ?? weapon?.characteristics?.ap ?? 0,
        damage: weapon?.damage ?? weapon?.characteristics?.damage,
        ...(skill == null ? {} : { skill }),
        ...weaponAbilityCharacteristics(weapon?.abilities ?? weapon?.characteristics?.abilities)
      }
    }];
  });
}

export function getCombatFormationWeaponOptions(state, unit, { type = null } = {}) {
  const root = getCombatFormationRoot(state, unit);
  if (!root) return [];
  const members = getCombatFormationMembers(state, root);
  const combined = members.length > 1;
  return members.flatMap((member) => getDatasheetWeaponOptions(state, member, { type }).map((weapon) => {
    const profileName = weapon.name;
    const sourceUnitName = member.name ?? member.id;
    const displayName = combined ? `${sourceUnitName} · ${profileName}` : profileName;
    return {
      ...weapon,
      name: displayName,
      profileName,
      formationUnitId: root.id,
      sourceUnitId: member.id,
      sourceUnitName,
      displayName
    };
  }));
}

function firstCombatValue(unit, datasheet, liveKey, datasheetKeys) {
  const live = unit?.characteristics?.[liveKey] ?? unit?.profile?.characteristics?.[liveKey];
  if (live !== undefined && live !== null) return live;
  for (const key of datasheetKeys) {
    const value = datasheet?.characteristics?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

export function getProbabilisticUnitProfile(state, unit) {
  if (!unit) return null;
  const datasheet = getBattleUnitDatasheet(state, unit);
  const toughness = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "toughness", ["Toughness", "toughness"]));
  const save = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "save", ["Save", "save"]));
  const invulnerableSave = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "invulnerableSave", ["Invulnerable save", "Invulnerable Save", "invulnerableSave"]));
  const ballisticSkill = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "ballisticSkill", ["Ballistic Skill", "ballisticSkill"]));
  const weaponSkill = parseCombatCharacteristic(firstCombatValue(unit, datasheet, "weaponSkill", ["Weapon Skill", "weaponSkill"]));

  return {
    ...unit,
    wounds: getLiveUnitVitals(state, unit).wounds,
    characteristics: {
      ...(unit?.profile?.characteristics ?? {}),
      ...(unit?.characteristics ?? {}),
      ...(toughness == null ? {} : { toughness }),
      ...(save == null ? {} : { save }),
      ...(invulnerableSave == null ? {} : { invulnerableSave }),
      ...(ballisticSkill == null ? {} : { ballisticSkill }),
      ...(weaponSkill == null ? {} : { weaponSkill })
    }
  };
}
