import { createLiveMapView } from './live-map-view.js';
import { UNIT_STATUS } from '../state/unit.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
import { getUnitActivationPresentation } from '../rules/unit-activation-presentation.js';
import { getFightEngagementState } from '../rules/fight-engagement-state.js';
import { getFightCandidates } from '../rules/fight-candidates.js';

export const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function currentTurnEvent(state, unitId, type, predicate = () => true) {
  const round = state?.battle?.round;
  const turn = state?.turn;
  return (state?.history ?? []).some(event =>
    event?.type === type &&
    event?.payload?.unitId === unitId &&
    (round == null || event?.payload?.round == null || event.payload.round === round) &&
    (turn == null || event?.payload?.turn == null || event.payload.turn === turn) &&
    predicate(event)
  );
}

function hasActiveMissionAction(state, unitId) {
  const action = [...(state?.history ?? [])].reverse().find(event =>
    event?.type === 'shooting.unit_activated' &&
    event?.payload?.unitId === unitId &&
    event?.payload?.missionInstanceId
  );
  if (!action) return false;
  const key = [action.payload?.round, action.payload?.turn, unitId].join(':');
  return !(state?.history ?? []).some(event =>
    event?.type === 'mission_action.reviewed' && event?.payload?.actionKey === key
  );
}

export function getSelectedUnitActiveStatuses(state = {}, unitId = null) {
  const unit = (state.units ?? []).find(item => item.id === unitId);
  if (!unit) return [];

  const statuses = [];
  if (unit.status === UNIT_STATUS.DESTROYED) statuses.push({ icon: '×', label: 'Destroyed' });
  if (unit.status === UNIT_STATUS.RESERVES) statuses.push({ icon: 'R', label: 'Reserves / Off battlefield' });
  if (isUnitBattleShocked(unit)) statuses.push({ icon: '!', label: 'Battle-shocked' });

  const engaged = getFightEngagementState(state).engagedUnitIds.includes(unit.id);
  if (engaged) statuses.push({ icon: '⚔', label: 'Engaged' });

  const chargedThisTurn = currentTurnEvent(state, unit.id, 'charge.outcome_recorded', event => event?.payload?.outcome === 'successful');
  if (chargedThisTurn) statuses.push({ icon: '↟', label: 'Charged this turn' });

  const fightCandidates = getFightCandidates(state);
  if (fightCandidates.fightsFirst.includes(unit.id)) statuses.push({ icon: 'FF', label: 'Fights First' });

  if (hasActiveMissionAction(state, unit.id)) statuses.push({ icon: '⌛', label: 'Action / Mission Action' });

  const activation = getUnitActivationPresentation(state, unit.id);
  if (activation === 'active') statuses.push({ icon: '…', label: 'Activation in progress' });
  if (activation === 'resolved') statuses.push({ icon: '✓', label: 'Activated / Resolved' });
  return statuses;
}

export function renderSelectedUnitActiveStatus(state, selectedUnitId) {
  const unit = (state?.units ?? []).find(item => item.id === selectedUnitId);
  const statuses = getSelectedUnitActiveStatuses(state, selectedUnitId);
  if (!unit || statuses.length === 0) return '';
  return `<section class="combat-workspace__active-status" data-selected-unit-active-status aria-label="Active status for ${escapeHtml(unit.name ?? unit.id)}">
    <strong>Active Status</strong>
    <ul>${statuses.map(status => `<li><span class="combat-workspace__status-icon" aria-hidden="true">${escapeHtml(status.icon)}</span><span>${escapeHtml(status.label)}</span></li>`).join('')}</ul>
  </section>`;
}

// Tabletop mode keeps the battlefield as the dominant surface. Phase-specific
// guidance belongs in the context panel instead of consuming map height.
export function renderCombatMapPanel({ state, phase, perspectivePlayerId, selectedUnitId, interactivePlayerId = null, mapView = createLiveMapView(), mapExtra = '' }) {
  const styles = new URL('./styles/combat-workspace.css', import.meta.url).href;
  return `<link rel="stylesheet" href="${escapeHtml(styles)}"><section class="combat-workspace__map" data-tabletop-map-phase="${escapeHtml(phase)}">
      ${mapView.render(state, { mode: 'live', perspectivePlayerId, interactivePlayerId, selectedUnitId, showZoomControls: false })}
      ${mapExtra}
    </section>`;
}

// Each phase owns its selection and command handling. A phase may provide a
// compact left rail without forcing other phases into a three-column layout.
export function renderCombatWorkspace({ state, phase, perspectivePlayerId, selectedUnitId, interactivePlayerId = null, controls, footer = '', mapExtra = '', leftRail = '', mapView = createLiveMapView() }) {
  const hasLeftRail = Boolean(String(leftRail ?? '').trim());
  return `<main class="combat-workspace${hasLeftRail ? ' has-left-rail' : ''}" data-combat-phase="${phase}">
    ${hasLeftRail ? `<aside class="combat-workspace__rail" aria-label="${phase.charAt(0).toUpperCase() + phase.slice(1)} unit list">${leftRail}</aside>` : ''}
    ${renderCombatMapPanel({ state, phase, perspectivePlayerId, selectedUnitId, interactivePlayerId, mapView, mapExtra })}
    <section class="combat-workspace__panel" aria-label="${phase.charAt(0).toUpperCase() + phase.slice(1)} controls and Tactical Advisor">
      <div class="combat-workspace__scroll">${renderSelectedUnitActiveStatus(state, selectedUnitId)}${controls}</div>${footer ? `<footer>${footer}</footer>` : ''}
    </section></main>`;
}

export function bindCombatMap(container, { selectedUnitId, targetIds = [], selectableIds = [], onSelect }) {
  const targets = new Set(targetIds), selectable = new Set(selectableIds);
  container.querySelectorAll?.('[data-map-unit-id]').forEach(marker => {
    const id = marker.getAttribute('data-map-unit-id');
    const selected = id === selectedUnitId || targets.has(id);
    if (targets.has(id)) marker.classList?.add?.('is-targeted');
    marker.setAttribute?.('role', 'button');
    marker.setAttribute?.('tabindex', '0');
    marker.setAttribute?.('aria-pressed', String(selected));
    marker.setAttribute?.('aria-label', (marker.getAttribute('title') ?? id) + (targets.has(id) ? ' · selected target' : selectable.has(id) ? ' · available' : ''));
    const select = () => onSelect(id);
    marker.addEventListener('click', select);
    marker.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault?.(); select(); }
    });
  });
}