import { COMMAND_TYPES } from '../commands/game-commands.js';
import { getOverwatchOffer } from '../rules/overwatch-interrupt.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const PROMPTS = {
  'set-up': 'was just set up',
  'starts-move': 'is starting a move',
  'ends-move': 'has finished a move'
};

export function renderOverwatchInterrupt(state, { selectedUnitId = null } = {}) {
  const offer = getOverwatchOffer(state, { selectedUnitId });
  if (!offer) return '';
  const units = (state.units ?? []).filter(unit => unit.ownerId === offer.playerId && unit.status === 'deployed');
  return '<section class="overwatch-interrupt" data-overwatch-interrupt data-overwatch-key="' + esc(offer.triggerKey) + '" data-overwatch-moment="' + esc(offer.moment) + '">' +
    '<strong>Fire Overwatch</strong><p>' + esc(offer.enemyName) + ' ' + PROMPTS[offer.moment] + '. This interrupt is available now, not at the end of the phase.</p>' +
    '<label>Your unit<select data-overwatch-unit>' + units.map(unit => '<option value="' + esc(unit.id) + '">' + esc(unit.name ?? unit.id) + '</option>').join('') + '</select></label>' +
    '<label><input type="checkbox" data-overwatch-range> This enemy is within range on the table</label>' +
    '<button type="button" data-overwatch-use>Record Overwatch</button>' +
    '<button type="button" data-overwatch-decline>Not now</button>' +
    '<small>Usage is recorded only. Command points are not changed here.</small></section>';
}

export function overwatchInterruptCommand(event) {
  const use = event.target?.closest?.('[data-overwatch-use]');
  const decline = event.target?.closest?.('[data-overwatch-decline]');
  const root = (use ?? decline)?.closest?.('[data-overwatch-interrupt]');
  if (!root) return null;
  const triggerKey = root.getAttribute('data-overwatch-key');
  if (decline) return { type: COMMAND_TYPES.DECLINE_OVERWATCH, payload: { triggerKey } };
  return { type: COMMAND_TYPES.RECORD_OVERWATCH, payload: {
    triggerKey,
    firingUnitId: root.querySelector('[data-overwatch-unit]')?.value,
    inRangeConfirmed: root.querySelector('[data-overwatch-range]')?.checked === true
  } };
}
