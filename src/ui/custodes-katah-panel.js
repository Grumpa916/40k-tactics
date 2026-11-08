import { ADEPTUS_CUSTODES_KATAH } from '../data/adeptus-custodes-faction-rules.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';
import { isRulesPhaseOpening, isRulesPhaseEndConfirmed } from '../rules/rules-phase-window.js';
import { getCombatFormationRoot } from '../rules/battle-unit-reference.js';
import {
  isMartialKatahEligible,
  getCustodesKatahState,
  isCustodesKatahTimingAvailable
} from '../rules/custodes-tactical-advisor.js';

const PHASE_KATAH = Object.freeze({
  movement: ['Calistus'],
  shooting: ['Salvus'],
  fight: ['Dacatarai', 'Kaptaris', 'Rendax']
});
const stylesheetHref = new URL('./styles/custodes-katah-panel.css', import.meta.url).href;
const styleLink = '<link rel="stylesheet" href="' + stylesheetHref + '">';
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function eligibleRoots(state, playerId) {
  return (state?.units ?? []).filter(unit => unit?.ownerId === playerId &&
    unit?.status === 'deployed' && (getCombatFormationRoot(state, unit)?.id ?? unit.id) === unit.id &&
    isMartialKatahEligible(state, unit.id));
}

function unitState(state, playerId, unit) {
  return getCustodesKatahState(state, {
    playerId,
    unitId: (getCombatFormationRoot(state, unit)?.id ?? unit.id)
  });
}

// Rendering-only status: the readiness lifecycle is owned by
// getCustodesKatahState and the existing Katah transitions.
function lastReReadySource(state, playerId, unitId, cycleRound) {
  const history = Array.isArray(state?.history) ? state.history : [];
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry?.type === 'custodes.katah_readied' &&
      entry.payload?.playerId === playerId &&
      entry.payload?.unitId === unitId &&
      entry.payload?.cycleRound === cycleRound) {
      return entry.payload?.source ?? null;
    }
  }
  return null;
}

function statusFor(state, playerId, unit) {
  const readiness = unitState(state, playerId, unit);
  if (readiness.readied && !readiness.lastKatah) return null; // The expected automatic state.
  if (!readiness.readied) return {
    label: readiness.lastKatah ? 'SPENT · ' + readiness.lastKatah : 'NOT READIED',
    tone: readiness.lastKatah ? 'is-spent' : 'is-unavailable',
    rereadied: false
  };
  const source = lastReReadySource(state, playerId, unit.id, readiness.cycleRound);
  return {
    label: 'RE-READIED' + (source ? ' · ' + source : ''),
    tone: 'is-readied',
    rereadied: true
  };
}

export function renderCustodesKatahCommandPanel(state, { playerId = state?.activePlayer ?? state?.battle?.activePlayerId } = {}) {
  const roots = eligibleRoots(state, playerId);
  if (!roots.length) return '';
  const readiedCount = roots.filter(unit => unitState(state, playerId, unit).readied).length;
  const exceptional = roots.map(unit => ({ unit, status: statusFor(state, playerId, unit) }))
    .filter(entry => entry.status);
  const exceptionRows = exceptional.length
    ? '<ul class="custodes-katah-panel__units" aria-label="Ka’tah exceptions">' +
      exceptional.map(({ unit, status }) =>
        '<li' + (status.rereadied ? ' role="status"' : '') + '><span>' + esc(unit.name ?? unit.id) +
        '</span><strong class="' + status.tone + '">' + esc(status.label) + '</strong></li>'
      ).join('') + '</ul>'
    : '';
  const conservai = ADEPTUS_CUSTODES_KATAH.find(definition => definition.name === 'Conservai');
  const reminder = conservai
    ? '<article class="custodes-katah-panel__option is-current">' +
      '<div class="custodes-katah-panel__option-heading"><strong>Conservai</strong><span>Command phase</span></div>' +
      '<p>' + esc(conservai.effect) + '</p></article>'
    : '';
  return styleLink + '<details class="custodes-katah-panel is-compact" data-view-key="command-katah" open>' +
    '<summary>Martial Ka’tah · Command Phase</summary>' +
    '<p class="custodes-katah-panel__readiness"><strong>' + readiedCount + '/' + roots.length + ' ready</strong>' +
    '<span>Automatic at the start of your Command phase</span></p>' +
    exceptionRows + reminder +
    '<p class="custodes-katah-panel__later">Movement, Shooting and Fight Ka’tahs appear when applicable.</p>' +
    '</details>';
}

export function renderCustodesKatahPhasePanel(state, { phase, unitId = null, playerId = state?.activePlayer ?? state?.battle?.activePlayerId } = {}) {
  if (isRulesPhaseEndConfirmed(state)) return '';
  const ownTurn = (state?.activePlayer ?? state?.battle?.activePlayerId) === playerId;
  if (!ownTurn && phase !== 'fight') return '';
  const selected = (state?.units ?? []).find(unit => unit?.id === unitId);
  const selectedFriendly = selected?.ownerId === playerId;
  // Fight is a shared phase: our readied units may still fight on the enemy
  // turn. Defensive Kaptaris is shown at phase start even before selection.
  const names = ownTurn ? PHASE_KATAH[phase]
    : isRulesPhaseOpening(state) ? ['Dacatarai', 'Kaptaris']
      : selectedFriendly ? ['Rendax'] : [];
  if (!names?.length || state?.phase !== phase || !playerId) return '';
  const roots = eligibleRoots(state, playerId);
  if (!roots.length) return '';
  if (!selected || selected.ownerId !== playerId || !isMartialKatahEligible(state, selected.id)) {
    const ready = roots.filter(unit => unitState(state, playerId, unit).readied);
    if (!ready.length) return '';
    const rereadied = roots.filter(unit => {
      const status = statusFor(state, playerId, unit);
      return status?.rereadied;
    });
    const alert = rereadied.length
      ? '<p class="custodes-katah-phase__rereadied" role="status"><strong>RE-READIED</strong> · ' +
        rereadied.map(unit => esc(unit.name ?? unit.id)).join(', ') +
        ' available again. Select the unit to review its Ka’tah.</p>'
      : '';
    return styleLink + '<section class="custodes-katah-phase" aria-label="Martial Ka’tah availability"><h2>Martial Ka’tah · ' +
      esc(phase) + '</h2><p>Select a readied Custodes unit to review its available Ka’tah.</p>' + alert + '</section>';
  }
  const root = getCombatFormationRoot(state, selected) ?? selected;
  const readiness = getCustodesKatahState(state, { playerId, unitId: root.id });
  if (!readiness.readied) {
    return styleLink + '<section class="custodes-katah-phase" aria-label="Martial Ka’tah availability"><h2>Martial Ka’tah</h2>' +
      '<p><strong class="is-spent">SPENT</strong>' +
      (readiness.lastKatah ? ' · ' + esc(readiness.lastKatah) + ' used this readiness cycle.' : ' · This unit is not readied.') +
      '</p></section>';
  }
  const choices = ADEPTUS_CUSTODES_KATAH.filter(definition =>
    names.includes(definition.name) && isCustodesKatahTimingAvailable(state, definition.name, playerId) &&
    (!['Dacatarai','Kaptaris'].includes(definition.name) || isRulesPhaseOpening(state))
  );
  if (!choices.length) return '';
  const buttons = choices.map(definition =>
    '<article class="custodes-katah-phase__option"><div><strong>' + esc(definition.name) + '</strong>' +
    '<small>' + esc(definition.timing) + '</small></div><p>' + esc(definition.effect) + '</p>' +
    '<button type="button" data-custodes-katah-use="' + esc(definition.name) + '" data-custodes-katah-unit="' +
    esc(root.id) + '" data-custodes-katah-player="' + esc(playerId) + '">Use ' + esc(definition.name) + '</button></article>'
  ).join('');
  const rereadied = Boolean(readiness.lastKatah);
  const source = rereadied ? lastReReadySource(state, playerId, root.id, readiness.cycleRound) : null;
  const readinessText = rereadied
    ? '<p class="custodes-katah-phase__rereadied" role="status"><strong class="is-readied">RE-READIED</strong> · ' +
      (source ? 'Available again via ' + esc(source) + '. ' : 'Available again. ') +
      'This unit can use another Martial Ka’tah.</p>'
    : '<p><strong class="is-readied">READIED</strong> · This unit can use one Martial Ka’tah.</p>';
  return styleLink + '<section class="custodes-katah-phase" aria-label="Available Martial Ka’tah"><h2>Available Ka’tah · ' +
    esc(selected.name ?? selected.id) + '</h2>' + readinessText +
    '<div class="custodes-katah-phase__options">' + buttons + '</div></section>';
}

export function bindCustodesKatahActions(container, session, onError = () => {}, rerender = () => {}) {
  container.querySelectorAll?.('[data-custodes-katah-use]').forEach(button => {
    button.addEventListener('click', () => {
      try {
        session.dispatch({
          type: COMMAND_TYPES.RECORD_CUSTODES_KATAH_USE,
          payload: {
            playerId: button.getAttribute('data-custodes-katah-player'),
            unitId: button.getAttribute('data-custodes-katah-unit'),
            katahName: button.getAttribute('data-custodes-katah-use')
          }
        });
      } catch (error) {
        onError(error?.message ?? String(error));
        rerender();
      }
    });
  });
}
