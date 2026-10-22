import { getTyranidWargearRuleSet, getTyranidWargearSelections } from "../data/tyranid-wargear-rules.js";

export function normalizeWargearName(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function singularToken(token) {
  if (token.length < 4) return token;
  if (token.endsWith("ies")) return token.slice(0, -3) + "y";
  if (/(?:ches|shes|xes|zes|sses)$/.test(token)) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}
function pluralFlexibleKey(value) {
  return normalizeWargearName(value).split(" ").filter(Boolean).map(singularToken).join(" ");
}
function profileBaseName(value) {
  return normalizeWargearName(String(value ?? "").replace(/\s*\([^)]*\)\s*$/, ""));
}
function uniqueFlexibleMatch(items, sourceName, getName = (item) => item?.name) {
  const sourceKey = pluralFlexibleKey(sourceName);
  if (!sourceKey) return null;
  const matches = items.filter((item) => pluralFlexibleKey(getName(item)) === sourceKey);
  return matches.length === 1 ? matches[0] : null;
}

export function matchWargearSelection({ datasheetId, datasheet, sourceName } = {}) {
  const sourceKey = normalizeWargearName(sourceName);
  if (!sourceKey) return null;

  const reviewedSelections = getTyranidWargearSelections(datasheetId);
  const reviewed = reviewedSelections.find((item) => normalizeWargearName(item.name) === sourceKey)
    ?? uniqueFlexibleMatch(reviewedSelections, sourceName);
  if (reviewed) return { name: reviewed.name, profileNames: [...reviewed.profiles], match: "reviewed-rule" };

  const weapons = Array.isArray(datasheet?.weapons) ? datasheet.weapons : [];
  const exact = weapons.find((weapon) => normalizeWargearName(weapon?.name) === sourceKey);
  if (exact?.name) return { name: exact.name, profileNames: [exact.name], match: "exact-profile" };

  const flexible = uniqueFlexibleMatch(weapons, sourceName);
  if (flexible?.name) return { name: flexible.name, profileNames: [flexible.name], match: "singular-plural-profile" };

  const grouped = weapons.filter((weapon) => profileBaseName(weapon?.name) === sourceKey);
  if (grouped.length) return {
    name: String(sourceName).trim(), profileNames: grouped.map((weapon) => weapon.name), match: "profile-group"
  };
  return null;
}

function addError(errors, message) { if (!errors.includes(message)) errors.push(message); }
function selectionCounts(unit) {
  const counts = new Map();
  for (const item of unit?.equippedWargear ?? []) {
    const key = normalizeWargearName(item?.name);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + (Number.isInteger(item?.quantity) ? item.quantity : 1));
  }
  return counts;
}
function quantity(counts, name) { return counts.get(normalizeWargearName(name)) ?? 0; }

function canAssignToSlots(ruleSet, modelCount, counts) {
  const slots = (ruleSet.slots ?? []).map((slot) => ({
    id: slot.id,
    remaining: (slot.count ?? 0) + (slot.perModel ?? 0) * modelCount,
    choices: new Set((slot.choices ?? []).map((choice) => normalizeWargearName(choice.name)))
  }));
  if (!slots.length) return { ok: true };

  const slotNames = new Set(slots.flatMap((slot) => [...slot.choices]));
  const items = [...counts.entries()].filter(([name, count]) => slotNames.has(name) && count > 0);
  const totalCapacity = slots.reduce((sum, slot) => sum + slot.remaining, 0);
  const totalItems = items.reduce((sum, [, count]) => sum + count, 0);
  if (totalItems !== totalCapacity) return { ok: false, reason: `Selected slot weapons total ${totalItems}; expected ${totalCapacity}.` };

  const expanded = items.flatMap(([name, count]) => Array.from({ length: count }, () => name));
  expanded.sort((a, b) => slots.filter((slot) => slot.choices.has(a)).length - slots.filter((slot) => slot.choices.has(b)).length);
  function place(index) {
    if (index >= expanded.length) return slots.every((slot) => slot.remaining === 0);
    const name = expanded[index];
    for (const slot of slots) {
      if (slot.remaining <= 0 || !slot.choices.has(name)) continue;
      slot.remaining -= 1;
      if (place(index + 1)) return true;
      slot.remaining += 1;
    }
    return false;
  }
  return place(0) ? { ok: true } : { ok: false, reason: "Selected weapons cannot be assigned to the datasheet's legal replacement slots." };
}

export function validateWargearLoadout(unit) {
  const ruleSet = getTyranidWargearRuleSet(unit?.datasheetId);
  if (!ruleSet) return { status: "profile-matched", reviewedRules: false, errors: [] };
  const modelCount = Number.isInteger(unit?.modelCount) && unit.modelCount > 0 ? unit.modelCount : 1;
  const counts = selectionCounts(unit);
  const errors = [];

  for (const item of ruleSet.fixed ?? []) {
    const expected = (item.count ?? 0) + (item.perModel ?? 0) * modelCount;
    const actual = quantity(counts, item.name);
    if (actual !== expected) addError(errors, `${item.name}: selected ${actual}, expected ${expected}.`);
  }
  for (const item of ruleSet.optional ?? []) {
    const actual = quantity(counts, item.name);
    const maximum = (item.perModel ?? 1) * modelCount;
    if (actual > maximum) addError(errors, `${item.name}: selected ${actual}, maximum ${maximum}.`);
    if (item.allOrNone && actual !== 0 && actual !== maximum) addError(errors, `${item.name}: must be equipped by all models or none.`);
  }

  const slotResult = canAssignToSlots(ruleSet, modelCount, counts);
  if (!slotResult.ok) addError(errors, slotResult.reason);

  for (const constraint of ruleSet.constraints ?? []) {
    if (constraint.type === "max") {
      const actual = quantity(counts, constraint.selection);
      if (actual > constraint.max) addError(errors, `${constraint.selection}: selected ${actual}, maximum ${constraint.max}.`);
    } else if (constraint.type === "max-per-models") {
      const actual = quantity(counts, constraint.selection);
      const max = Math.floor(modelCount / constraint.models) * (constraint.maxEach ?? 1);
      if (actual > max) addError(errors, `${constraint.selection}: selected ${actual}, maximum ${max} for ${modelCount} models.`);
    } else if (constraint.type === "same-baseline") {
      const used = constraint.selections.filter((name) => quantity(counts, name) > 0);
      if (used.length > 1) addError(errors, `Baseline ranged weapons must use one unit-wide choice; found ${used.join(", ")}.`);
    } else if (constraint.type === "mutually-exclusive") {
      const used = constraint.selections.filter((name) => quantity(counts, name) > 0);
      if (used.length > 1) addError(errors, `${used.join(" and ")} cannot be equipped together.`);
    }
  }

  const known = new Set([
    ...(ruleSet.fixed ?? []).map((item) => normalizeWargearName(item.name)),
    ...(ruleSet.optional ?? []).map((item) => normalizeWargearName(item.name)),
    ...(ruleSet.slots ?? []).flatMap((slot) => slot.choices.map((item) => normalizeWargearName(item.name)))
  ]);
  for (const item of unit?.equippedWargear ?? []) {
    if (!known.has(normalizeWargearName(item?.name))) addError(errors, `${item?.name ?? "Unknown wargear"}: not represented in the reviewed loadout rules.`);
  }

  return {
    status: errors.length ? "rules-invalid" : "rules-reviewed-valid",
    reviewedRules: true,
    sourceName: ruleSet.sourceName,
    sourceUrl: ruleSet.sourceUrl,
    reviewedAt: ruleSet.reviewedAt,
    errors
  };
}

export function buildManualWargearLoadout(unit, selections = []) {
  const equippedWargear = [];
  const equippedWeapons = [];
  for (const raw of selections) {
    const quantity = Number(raw?.quantity ?? 0);
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error(`${raw?.name ?? "Wargear"}: quantity must be a non-negative whole number.`);
    if (!quantity) continue;
    const resolved = matchWargearSelection({ datasheetId: unit?.datasheetId, datasheet: unit?.datasheet, sourceName: raw?.name });
    if (!resolved) throw new Error(`${raw?.name ?? "Wargear"}: no reviewed combat profile matched this selection.`);
    equippedWargear.push({ name: resolved.name, quantity, sourceName: 'Army Builder', profileNames: resolved.profileNames.slice(), match: resolved.match });
    for (const profileName of resolved.profileNames) {
      const existing = equippedWeapons.find((item) => normalizeWargearName(item.name) === normalizeWargearName(profileName));
      if (existing) existing.quantity += quantity;
      else equippedWeapons.push({ name: profileName, quantity, sourceName: 'Army Builder', selectionName: resolved.name });
    }
  }
  const draft = { ...unit, equippedWargear, equippedWeapons, unmatchedWargear: [] };
  const loadoutValidation = { ...validateWargearLoadout(draft), source: 'manual-army-builder' };
  return { equippedWargear, equippedWeapons, loadoutValidation };
}

export function summarizeWargearAudit(roster) {
  const units = (roster?.units ?? []).map((unit) => ({
    unitId: unit.id,
    name: unit.name,
    status: unit.loadoutValidation?.status ?? (unit.equippedWargear?.length ? "profile-matched" : "no-weapon-data"),
    matchedSelections: unit.equippedWargear?.length ?? 0,
    matchedProfiles: unit.equippedWeapons?.length ?? 0,
    unmatchedSelections: unit.unmatchedWargear?.length ?? 0,
    sourceErrors: unit.sourceValidationErrors?.length ?? 0
  }));
  return {
    units,
    totals: units.reduce((totals, item) => {
      totals.units += 1;
      totals[item.status] = (totals[item.status] ?? 0) + 1;
      totals.matchedSelections += item.matchedSelections;
      totals.matchedProfiles += item.matchedProfiles;
      totals.unmatchedSelections += item.unmatchedSelections;
      return totals;
    }, { units: 0, matchedSelections: 0, matchedProfiles: 0, unmatchedSelections: 0 })
  };
}
