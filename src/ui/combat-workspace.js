import { renderUnitRulesReminders } from './rules-reminder-panel.js';
import { renderPhaseArmyRoster } from './phase-army-roster.js';
import { createLiveMapView } from './live-map-view.js';
import { getSelectedUnitActiveStatuses } from '../rules/unit-active-statuses.js';
export { getSelectedUnitActiveStatuses } from '../rules/unit-active-statuses.js';

export const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

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

// Each phase owns its selection and command handling. Use the shared reference
// roster unless the phase supplies its own selection rail.
export function renderCombatWorkspace({ state, phase, perspectivePlayerId, selectedUnitId, interactivePlayerId = null, controls, footer = '', mapExtra = '', leftRail = '', mapView = createLiveMapView() }) {
  leftRail = leftRail || renderPhaseArmyRoster(state, perspectivePlayerId);
  const hasLeftRail = Boolean(String(leftRail ?? '').trim());
  return `<main class="combat-workspace${hasLeftRail ? ' has-left-rail' : ''}" data-combat-phase="${phase}">
    ${hasLeftRail ? `<aside class="combat-workspace__rail" aria-label="${phase.charAt(0).toUpperCase() + phase.slice(1)} unit list">${leftRail}</aside>` : ''}
    ${renderCombatMapPanel({ state, phase, perspectivePlayerId, selectedUnitId, interactivePlayerId, mapView, mapExtra })}
    <section class="combat-workspace__panel" aria-label="${phase.charAt(0).toUpperCase() + phase.slice(1)} controls and Tactical Advisor">
      <div class="combat-workspace__scroll">${renderSelectedUnitActiveStatus(state, selectedUnitId)}${controls}${state.phase === phase ? renderUnitRulesReminders(state, {perspectivePlayerId, selectedUnitId}) : ''}</div>${footer ? `<footer>${footer}</footer>` : ''}
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
