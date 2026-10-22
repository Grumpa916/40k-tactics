import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { getBattleRosterUnit } from './battle-unit-reference.js';
import { getLiveUnitVitals } from './live-unit-vitals.js';

export function normalizeCasualtySelectionName(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function startingSelectionQuantities(rosterUnit) {
  const source = Array.isArray(rosterUnit?.equippedWargear) && rosterUnit.equippedWargear.length
    ? rosterUnit.equippedWargear
    : Array.isArray(rosterUnit?.equippedWeapons) ? rosterUnit.equippedWeapons : [];
  const values = {};
  const names = {};
  for (const item of source) {
    const name = item?.selectionName ?? item?.sourceName ?? item?.name;
    const key = normalizeCasualtySelectionName(name);
    if (!key) continue;
    const quantity = Number.isInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 1;
    // Multiple combat profiles may come from one selected wargear item. Keep
    // the selected quantity once rather than summing strike/sweep profiles.
    values[key] = Math.max(values[key] ?? 0, quantity);
    names[key] = name;
  }
  return { values, names };
}

function liveSelectionQuantities(unit, rosterUnit) {
  const starting = startingSelectionQuantities(rosterUnit);
  const stored = unit?.liveWargear?.activeSelections;
  if (!stored || typeof stored !== 'object') return starting;
  const values = { ...starting.values };
  const names = { ...starting.names };
  for (const [name, quantity] of Object.entries(stored)) {
    const key = normalizeCasualtySelectionName(name);
    if (!key || !Number.isInteger(quantity) || quantity < 0) continue;
    values[key] = quantity;
    names[key] = names[key] ?? name;
  }
  return { values, names };
}

function quantityFor(values, name) {
  return values[normalizeCasualtySelectionName(name)] ?? 0;
}

function activeChoices(values, choices = []) {
  return choices.map((choice) => ({
    name: choice.name,
    quantity: quantityFor(values, choice.name)
  })).filter((choice) => choice.quantity > 0);
}

export function getLiveSelectionQuantity(state, unit, selectionName) {
  if (!unit || !selectionName) return null;
  const rosterUnit = getBattleRosterUnit(state, unit);
  if (!unit?.liveWargear?.activeSelections) return null;
  const { values } = liveSelectionQuantities(unit, rosterUnit);
  const key = normalizeCasualtySelectionName(selectionName);
  return Object.hasOwn(values, key) ? values[key] : null;
}

export function getCasualtyLoadoutState(state, unit) {
  if (!unit) return null;
  const rosterUnit = getBattleRosterUnit(state, unit);
  const ruleSet = getTyranidWargearRuleSet(rosterUnit?.datasheetId);
  const vitals = getLiveUnitVitals(state, unit);
  const startingModels = Number.isInteger(vitals.startingModels) ? vitals.startingModels : null;
  const currentModels = Number.isInteger(unit.currentStrength)
    ? unit.currentStrength
    : Number.isInteger(unit?.liveWargear?.modelsRemaining)
      ? unit.liveWargear.modelsRemaining
      : Number.isInteger(vitals.models)
        ? vitals.models
        : startingModels;
  const { values, names } = liveSelectionQuantities(unit, rosterUnit);

  const slotChoices = [];
  for (const slot of ruleSet?.slots ?? []) {
    if (!slot?.perModel) continue;
    const choices = activeChoices(values, slot.choices);
    if (choices.length > 1) slotChoices.push({
      id: slot.id,
      perModel: slot.perModel,
      choices
    });
  }

  const optionalChoices = [];
  for (const item of ruleSet?.optional ?? []) {
    if (!item?.perModel || item.allOrNone) continue;
    const quantity = quantityFor(values, item.name);
    if (!quantity || !Number.isInteger(currentModels) || currentModels <= 0) continue;
    const maxForRemaining = currentModels * item.perModel;
    if (quantity > 0 && quantity < maxForRemaining) optionalChoices.push({
      name: item.name,
      perModel: item.perModel,
      quantity
    });
  }

  return Object.freeze({
    unitId: unit.id,
    startingModels,
    currentModels,
    canRecordCasualty: unit.status !== 'destroyed' && Number.isInteger(currentModels) && currentModels > 1,
    canUndo: Boolean(unit?.liveWargear?.undoSnapshot),
    activeSelections: Object.freeze({ ...values }),
    selectionNames: Object.freeze({ ...names }),
    slotChoices: Object.freeze(slotChoices.map((slot) => Object.freeze({
      ...slot,
      choices: Object.freeze(slot.choices.map(Object.freeze))
    }))),
    optionalChoices: Object.freeze(optionalChoices.map(Object.freeze)),
    requiresIdentity: slotChoices.length > 0 || optionalChoices.length > 0,
    complexIdentity: slotChoices.length > 1 || optionalChoices.length > 0
  });
}
