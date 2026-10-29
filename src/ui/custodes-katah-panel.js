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

function readinessLabel(state) {
  const playerId = state?.activePlayer ?? state?.battle?.activePlayerId;
  const roots = eligibleRoots(state, playerId);
  if (!roots.length) return '';
  const readied = roots.filter(unit => unitState(state, playerId, unit).readied);
  const summary = readied.length
    ? readied.map(unit => esc(unit.name ?? unit.id)).join(', ')
    : 'None yet';
  return '<p class="custodes-katah-panel__readiness"><strong>' + readied.length + ' of ' + roots.length +
    ' eligible units readied</strong>' + (summary ? ' · ' + summary : '') + '</p>';
}

export function renderCustodesKatahCommandPanel(state, { playerId = state?.activePlayer ?? state?.battle?.activePlayerId } = {}) {
  const roots = eligibleRoots(state, playerId);
  if (!roots.length) return '';
  const currentName = 'Conservai';
  const cards = ADEPTUS_CUSTODES_KATAH.map(definition => {
    const current = definition.name === currentName;
    return '<article class="custodes-katah-panel__option' + (current ? ' is-current' : '') + '">' +
      '<div class="custodes-katah-panel__option-heading"><strong>' + esc(definition.name) + '</strong>' +
      '<span>' + esc(definition.timing) + '</span></div><p>' + esc(definition.effect) + '</p></article>';
  }).join('');
  const unitRows = roots.map(unit => {
    const readiness = unitState(state, playerId, unit);
    const label = readiness.readied ? 'READIED' : readiness.lastKatah ? 'SPENT · ' + readiness.lastKatah : 'NOT READIED';
    const tone = readiness.readied ? 'is-readied' : readiness.lastKatah ? 'is-spent' : 'is-unavailable';
    return '<li><span>' + esc(unit.name ?? unit.id) + '</span><strong class="' + tone + '">' + esc(label) + '</strong></li>';
  }).join('');
  return styleLink + '<details class="custodes-katah-panel" open><summary>Martial Ka’tah · Command Phase</summary>' +
    readinessLabel(state) + '<ul class="custodes-katah-panel__units">' + unitRows + '</ul>' +
    '<div class="custodes-katah-panel__options">' + cards + '</div></details>';
}

export function renderCustodesKatahPhasePanel(state, { phase, unitId = null } = {}) {
  if (isRulesPhaseEndConfirmed(state)) return '';
  const playerId = state?.activePlayer ?? state?.battle?.activePlayerId;
  const names = PHASE_KATAH[phase];
  if (!names || state?.phase !== phase || !playerId) return '';
  const selected = (state?.units ?? []).find(unit => unit?.id === unitId);
  const roots = eligibleRoots(state, playerId);
  if (!roots.length) return '';
  if (!selected || selected.ownerId !== playerId || !isMartialKatahEligible(state, selected.id)) {
    const ready = roots.filter(unit => unitState(state, playerId, unit).readied);
    if (!ready.length) return '';
    return styleLink + '<section class="custodes-katah-phase" aria-label="Martial Ka’tah availability"><h2>Martial Ka’tah · ' +
      esc(phase) + '</h2><p>Select a readied Custodes unit to review its available Ka’tah.</p></section>';
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
  return styleLink + '<section class="custodes-katah-phase" aria-label="Available Martial Ka’tah"><h2>Available Ka’tah · ' +
    esc(selected.name ?? selected.id) + '</h2><p><strong class="is-readied">READIED</strong> · This unit can use one Martial Ka’tah.</p>' +
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
