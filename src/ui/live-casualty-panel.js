import { getCasualtyLoadoutState } from '../rules/live-casualty-loadout.js';

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function renderLiveCasualtyStatus(state, unit) {
  const casualty = getCasualtyLoadoutState(state, unit);
  if (!casualty || !Number.isInteger(casualty.startingModels) || casualty.startingModels <= 1) {
    return { meta: '', controls: '' };
  }
  const current = Number.isInteger(casualty.currentModels) ? casualty.currentModels : casualty.startingModels;
  const meta = `<span>${esc(current)} / ${esc(casualty.startingModels)} models</span>`;
  const undo = casualty.canUndo
    ? `<button type="button" data-undo-casualty data-unit-id="${esc(unit.id)}">Undo casualty</button>`
    : '';
  if (!casualty.canRecordCasualty) {
    return { meta, controls: undo ? `<div class="battle-context__test-controls" data-casualty-controls><div>${undo}</div><span data-casualty-message></span></div>` : '' };
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
    controls: `<details class="battle-context__test-controls" data-casualty-controls><summary>Record casualty</summary>${body}</details>`
  };
}
