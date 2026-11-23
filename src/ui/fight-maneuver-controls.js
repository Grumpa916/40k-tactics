import { COMMAND_TYPES } from '../commands/game-commands.js';
import { consolidateOffer, heroicInterventionOffer, pileInOffer } from '../rules/fight-maneuvers.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function notes(items) {
  return items.length ? '<ul>' + items.map(item => '<li>' + esc(item) + '</li>').join('') + '</ul>' : '<p>No stored distance modifier. Confirm the current-rules distance on the table.</p>';
}

export function renderFightManeuvers(state, unitId) {
  const pile = pileInOffer(state, unitId);
  const consolidate = consolidateOffer(state, unitId);
  if (!pile && !consolidate) return '';
  const pileCard = pile ? '<section data-fight-pile-in><strong>Pile In</strong>' + notes(pile.pileIn) +
    (pile.recorded ? '<p>Pile In recorded. The map was not moved.</p>' : '<button type="button" data-fight-pile-in="' + esc(unitId) + '">Record Pile In</button>') + '</section>' : '';
  const consolidateCard = consolidate ? '<section data-fight-consolidate><strong>Consolidate</strong>' + notes(consolidate.consolidate) +
    (consolidate.recorded ? '<p>Consolidate recorded. The map was not moved.</p>' : '<button type="button" data-fight-consolidate="' + esc(unitId) + '">Record Consolidate</button>') + '</section>' : '';
  return pileCard + consolidateCard;
}

export function renderHeroicIntervention(state) {
  const offer = heroicInterventionOffer(state);
  if (!offer) return '';
  const units = (state.units ?? []).filter(unit => unit.ownerId === offer.playerId && unit.status === 'deployed');
  return '<section data-heroic-intervention data-heroic-key="' + esc(offer.triggerKey) + '"><strong>Heroic Intervention</strong><p>A charge just succeeded. Confirm eligibility on the table. Command points are not changed here.</p><label>Your unit<select data-heroic-unit>' +
    units.map(unit => '<option value="' + esc(unit.id) + '">' + esc(unit.name ?? unit.id) + '</option>').join('') +
    '</select></label><label><input type="checkbox" data-heroic-eligible> Eligibility and distance checked on the table</label><button type="button" data-heroic-record>Record Heroic Intervention</button></section>';
}

export function fightManeuverCommand(event) {
  const pile = event.target?.closest?.('[data-fight-pile-in]');
  if (pile) return { type: COMMAND_TYPES.RECORD_PILE_IN, payload: { unitId: pile.getAttribute('data-fight-pile-in') } };
  const consolidate = event.target?.closest?.('[data-fight-consolidate]');
  if (consolidate) return { type: COMMAND_TYPES.RECORD_CONSOLIDATE, payload: { unitId: consolidate.getAttribute('data-fight-consolidate') } };
  const heroic = event.target?.closest?.('[data-heroic-record]');
  if (!heroic) return null;
  const root = heroic.closest('[data-heroic-intervention]');
  return { type: COMMAND_TYPES.RECORD_HEROIC_INTERVENTION, payload: {
    triggerKey: root?.getAttribute('data-heroic-key'),
    unitId: root?.querySelector('[data-heroic-unit]')?.value,
    eligibleConfirmed: root?.querySelector('[data-heroic-eligible]')?.checked === true
  } };
}
