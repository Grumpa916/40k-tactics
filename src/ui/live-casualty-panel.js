import { getCasualtyLoadoutState } from '../rules/live-casualty-loadout.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function renderGlobalStateControls(state, unit) {
  if (state?.battle?.status !== 'active') return '';
  const vitals = getLiveUnitVitals(state, unit);
  const controls = [];

  if (Number.isFinite(vitals.wounds)) {
    const atMaximum = Number.isFinite(vitals.startingWounds) && vitals.wounds >= vitals.startingWounds;
    controls.push(`<div><span><strong>${esc(vitals.wounds)}</strong>${Number.isFinite(vitals.startingWounds) ? ` / ${esc(vitals.startingWounds)}` : ''} W</span>` +
      `<button type="button" data-adjust-unit-wounds="-1" data-unit-id="${esc(unit.id)}"${vitals.wounds <= 0 ? ' disabled' : ''}>−1 W</button>` +
      `<button type="button" data-adjust-unit-wounds="1" data-unit-id="${esc(unit.id)}"${atMaximum ? ' disabled' : ''}>+1 W</button></div>`);
  }

  if (['deployed','reserves'].includes(unit.status)) {
    controls.push(`<div><button type="button" data-toggle-live-battle-shock data-unit-id="${esc(unit.id)}" aria-pressed="${String(isUnitBattleShocked(unit))}">` +
      `Battle-shock: ${isUnitBattleShocked(unit) ? 'On' : 'Off'}</button></div>`);
  }

  if (unit.status === 'deployed') {
    controls.push(`<div><button type="button" data-live-reserve-transfer="reserves" data-unit-id="${esc(unit.id)}">Move to reserves</button></div>`);
  } else if (unit.status === 'reserves') {
    controls.push(`<div><button type="button" data-live-reserve-transfer="battlefield" data-unit-id="${esc(unit.id)}">Place on battlefield</button></div>`);
  }

  if (!controls.length) return '';
  return `<details class="battle-context__test-controls" data-global-state-controls><summary>Adjust live state</summary>` +
    `${controls.join('')}<span data-global-state-message></span></details>`;
}

export function renderLiveCasualtyStatus(state, unit) {
  const globalControls = renderGlobalStateControls(state, unit);
  const casualty = getCasualtyLoadoutState(state, unit);
  if (!casualty || !Number.isInteger(casualty.startingModels) || casualty.startingModels <= 1) {
    return { meta: '', controls: globalControls };
  }
  const current = Number.isInteger(casualty.currentModels) ? casualty.currentModels : casualty.startingModels;
  const meta = `<span>${esc(current)} / ${esc(casualty.startingModels)} models</span>`;
  const undo = casualty.canUndo
    ? `<button type="button" data-undo-casualty data-unit-id="${esc(unit.id)}">Undo casualty</button>`
    : '';
  if (!casualty.canRecordCasualty) {
    const casualtyControls = undo ? `<div class="battle-context__test-controls" data-casualty-controls><div>${undo}</div><span data-casualty-message></span></div>` : '';
    return { meta, controls: globalControls + casualtyControls };
  }

  let body = '';
  if (!casualty.requiresIdentity) {
    body = `<div><button type="button" data-record-casualty data-unit-id="${esc(unit.id)}">−1 model</button>${undo}</div>`;
  } else if (!casualty.complexIdentity && casualty.slotChoices.length === 1) {
    const slot = casualty.slotChoices[0];
    body = `<span>Which model was removed?</span><div>${slot.choices.map((choice) =>
      `<button type="button" data-record-casualty data-unit-id="${esc(unit.id)}" data-casualty-slot-id="${esc(slot.id)}" data-casualty-selection="${esc(choice.name)}">− ${esc(choice.name)}</button>`
    ).join('')}</div>${undo ? `<div>${undo}</div>` : ''}`;
  } else {
    const slots = casualty.slotChoices.map((slot) =>
      `<label>${esc(slot.id)}<select data-casualty-slot="${esc(slot.id)}">${slot.choices.map((choice) =>
        `<option value="${esc(choice.name)}">${esc(choice.name)} · ${esc(choice.quantity)} remaining</option>`
      ).join('')}</select></label>`
    ).join('');
    const optional = casualty.optionalChoices.map((item) =>
      `<label><input type="checkbox" data-casualty-optional="${esc(item.name)}"> Removed model had ${esc(item.name)}</label>`
    ).join('');
    body = `<div data-casualty-editor="${esc(unit.id)}"><span>Identify only the loadout on the removed model.</span>${slots}${optional}<div><button type="button" data-submit-casualty>Remove model</button>${undo}</div><span data-casualty-message></span></div>`;
  }
  if (!casualty.complexIdentity) body += '<span data-casualty-message></span>';
  return {
    meta,
    controls: globalControls + `<details class="battle-context__test-controls" data-casualty-controls><summary>Record casualty</summary>${body}</details>`
  };
}