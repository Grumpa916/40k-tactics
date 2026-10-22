import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { escapeHtml as e } from './army-builder-html.js';

function modelCount(unit) {
  return Number.isInteger(unit?.modelCount) && unit.modelCount > 0 ? unit.modelCount : 1;
}
function capacity(slot, unit) {
  return (slot.count ?? 0) + (slot.perModel ?? 0) * modelCount(unit);
}
function countMap(unit) {
  const counts = new Map();
  for (const item of unit?.equippedWargear ?? []) {
    const name = String(item?.name ?? '').trim();
    if (!name) continue;
    counts.set(name.toLowerCase(), (counts.get(name.toLowerCase()) ?? 0) + (Number.isInteger(item?.quantity) ? item.quantity : 1));
  }
  return counts;
}
function countOf(counts, name) { return counts.get(String(name).toLowerCase()) ?? 0; }
function maxForChoice(ruleSet, name, unit, fallback) {
  const specific = (ruleSet.constraints ?? []).find((constraint) => constraint.type === 'max-per-models' && constraint.selection === name);
  if (specific) return Math.floor(modelCount(unit) / specific.models) * (specific.maxEach ?? 1);
  const hardMax = (ruleSet.constraints ?? []).find((constraint) => constraint.type === 'max' && constraint.selection === name);
  return hardMax ? Math.min(fallback, hardMax.max) : fallback;
}
function input(name, value, max, attr = 'data-wargear-quantity') {
  return `<label>${e(name)}<input type="number" inputmode="numeric" min="0" max="${e(max)}" step="1" ${attr}="${e(name)}" value="${e(value)}"></label>`;
}
function defaultCountsForSlots(slots, unit) {
  const counts = new Map();
  for (const slot of slots) {
    const first = slot.choices?.[0]?.name;
    if (!first) continue;
    counts.set(first, (counts.get(first) ?? 0) + capacity(slot, unit));
  }
  return counts;
}

export function renderWargearEditor(unit) {
  const ruleSet = getTyranidWargearRuleSet(unit?.datasheetId);
  if (!ruleSet) return '<h4>Selected wargear</h4><p class="ab-muted">Structured wargear selection is not reviewed for this datasheet yet. Keep the loadout in notes and verify it against the current published datasheet.</p>';

  const counts = countMap(unit);
  const hasExplicit = Array.isArray(unit?.equippedWargear) && unit.equippedWargear.length > 0;
  const fixed = ruleSet.fixed ?? [];
  const slots = ruleSet.slots ?? [];
  const singleSlots = slots.filter((slot) => capacity(slot, unit) === 1);
  const multiSlots = slots.filter((slot) => capacity(slot, unit) > 1);
  const defaultMulti = defaultCountsForSlots(multiSlots, unit);
  const status = unit?.loadoutValidation?.status ?? 'manual-selection-required';
  const statusText = status === 'rules-reviewed-valid'
    ? 'Reviewed legal loadout.'
    : 'Choose the actual wargear carried by this unit, then save. Combat advice stays unresolved until a reviewed loadout is saved.';

  let html = `<section class="ab-wargear" data-wargear-editor="${e(unit.id)}"><h4>Selected wargear</h4><p class="ab-muted">${e(statusText)}</p>`;
  if (fixed.length) {
    html += `<p><strong>Always equipped:</strong> ${fixed.map((item) => `${e((item.count ?? 0) + (item.perModel ?? 0) * modelCount(unit))} × ${e(item.name)}`).join(' · ')}</p>`;
  }

  for (const slot of singleSlots) {
    const selected = slot.choices.find((choice) => countOf(counts, choice.name) > 0)?.name ?? slot.choices?.[0]?.name ?? '';
    html += `<label>${e(slot.id.replaceAll('-', ' '))}<select data-wargear-single="${e(slot.id)}">${(slot.choices ?? []).map((choice) => `<option value="${e(choice.name)}" ${choice.name === selected ? 'selected' : ''}>${e(choice.name)}</option>`).join('')}</select></label>`;
  }

  if (multiSlots.length === 1) {
    const slot = multiSlots[0];
    const total = capacity(slot, unit);
    const sameBaseline = (ruleSet.constraints ?? []).find((constraint) => constraint.type === 'same-baseline' && constraint.selections.some((name) => slot.choices.some((choice) => choice.name === name)));
    if (sameBaseline) {
      const baselineChoices = slot.choices.filter((choice) => sameBaseline.selections.includes(choice.name));
      const specials = slot.choices.filter((choice) => !sameBaseline.selections.includes(choice.name));
      const baseline = baselineChoices.find((choice) => countOf(counts, choice.name) > 0)?.name ?? baselineChoices[0]?.name ?? '';
      html += `<fieldset><legend>${e(slot.id.replaceAll('-', ' '))}</legend><label>Baseline weapon<select data-wargear-baseline="${e(slot.id)}">${baselineChoices.map((choice) => `<option value="${e(choice.name)}" ${choice.name === baseline ? 'selected' : ''}>${e(choice.name)}</option>`).join('')}</select></label><p class="ab-muted">Special weapons replace baseline weapons; the remaining models use the selected baseline.</p><div class="ab-fields">`;
      for (const choice of specials) {
        html += input(choice.name, hasExplicit ? countOf(counts, choice.name) : 0, maxForChoice(ruleSet, choice.name, unit, total), 'data-wargear-special');
      }
      html += '</div></fieldset>';
    } else {
      html += `<fieldset><legend>${e(slot.id.replaceAll('-', ' '))}</legend><p class="ab-muted">Select ${e(total)} weapon${total === 1 ? '' : 's'} total.</p><div class="ab-fields">`;
      for (const choice of slot.choices ?? []) {
        const value = hasExplicit ? countOf(counts, choice.name) : (defaultMulti.get(choice.name) ?? 0);
        html += input(choice.name, value, maxForChoice(ruleSet, choice.name, unit, total));
      }
      html += '</div></fieldset>';
    }
  } else if (multiSlots.length > 1) {
    const total = multiSlots.reduce((sum, slot) => sum + capacity(slot, unit), 0);
    const choices = [];
    const seen = new Set();
    for (const slot of multiSlots) for (const choice of slot.choices ?? []) {
      if (seen.has(choice.name)) continue;
      seen.add(choice.name); choices.push(choice);
    }
    html += `<fieldset><legend>Replacement weapon slots</legend><p class="ab-muted">Select ${e(total)} weapons total. The saved loadout is checked against the legal slot combinations.</p><div class="ab-fields">`;
    for (const choice of choices) {
      const value = hasExplicit ? countOf(counts, choice.name) : (defaultMulti.get(choice.name) ?? 0);
      html += input(choice.name, value, maxForChoice(ruleSet, choice.name, unit, total));
    }
    html += '</div></fieldset>';
  }

  if (ruleSet.optional?.length) {
    html += '<fieldset><legend>Optional wargear</legend><div class="ab-fields">';
    for (const item of ruleSet.optional) {
      const max = (item.perModel ?? 1) * modelCount(unit);
      if (item.allOrNone) {
        const checked = countOf(counts, item.name) === max ? 'checked' : '';
        html += `<label><input type="checkbox" data-wargear-toggle="${e(item.name)}" ${checked}> ${e(item.name)} · all ${e(max)} model${max === 1 ? '' : 's'}</label>`;
      } else {
        html += input(item.name, hasExplicit ? countOf(counts, item.name) : 0, max, 'data-wargear-optional');
      }
    }
    html += '</div></fieldset>';
  }
  return html + '</section>';
}

function findControl(container, attr, value) {
  return [...container.querySelectorAll(`[${attr}]`)].find((element) => element.getAttribute(attr) === value) ?? null;
}
function readQuantity(container, attr, name) {
  const raw = findControl(container, attr, name)?.value ?? '0';
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name}: quantity must be a non-negative whole number.`);
  return value;
}
function addSelection(result, name, quantity) {
  if (!name || !quantity) return;
  const existing = result.find((item) => item.name === name);
  if (existing) existing.quantity += quantity;
  else result.push({ name, quantity });
}

export function readWargearSelections(container, unit) {
  const ruleSet = getTyranidWargearRuleSet(unit?.datasheetId);
  if (!ruleSet) return null;
  const result = [];
  const models = modelCount(unit);

  for (const item of ruleSet.fixed ?? []) addSelection(result, item.name, (item.count ?? 0) + (item.perModel ?? 0) * models);

  const slots = ruleSet.slots ?? [];
  const singleSlots = slots.filter((slot) => capacity(slot, unit) === 1);
  const multiSlots = slots.filter((slot) => capacity(slot, unit) > 1);
  for (const slot of singleSlots) {
    const value = findControl(container, 'data-wargear-single', slot.id)?.value;
    addSelection(result, value, 1);
  }

  if (multiSlots.length === 1) {
    const slot = multiSlots[0];
    const total = capacity(slot, unit);
    const sameBaseline = (ruleSet.constraints ?? []).find((constraint) => constraint.type === 'same-baseline' && constraint.selections.some((name) => slot.choices.some((choice) => choice.name === name)));
    if (sameBaseline) {
      let specials = 0;
      for (const choice of slot.choices.filter((choice) => !sameBaseline.selections.includes(choice.name))) {
        const quantity = readQuantity(container, 'data-wargear-special', choice.name);
        specials += quantity; addSelection(result, choice.name, quantity);
      }
      if (specials > total) throw new Error(`Special weapons total ${specials}; maximum ${total}.`);
      const baseline = findControl(container, 'data-wargear-baseline', slot.id)?.value;
      addSelection(result, baseline, total - specials);
    } else {
      for (const choice of slot.choices ?? []) addSelection(result, choice.name, readQuantity(container, 'data-wargear-quantity', choice.name));
    }
  } else if (multiSlots.length > 1) {
    const names = [...new Set(multiSlots.flatMap((slot) => (slot.choices ?? []).map((choice) => choice.name)))];
    for (const name of names) addSelection(result, name, readQuantity(container, 'data-wargear-quantity', name));
  }

  for (const item of ruleSet.optional ?? []) {
    const max = (item.perModel ?? 1) * models;
    if (item.allOrNone) addSelection(result, item.name, findControl(container, 'data-wargear-toggle', item.name)?.checked ? max : 0);
    else addSelection(result, item.name, readQuantity(container, 'data-wargear-optional', item.name));
  }
  return result;
}
