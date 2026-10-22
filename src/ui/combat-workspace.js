import { createLiveMapView } from './live-map-view.js';

export const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

// Shared map presentation keeps every live phase on the same layout and controls.
export function renderCombatMapPanel({ state, phase, perspectivePlayerId, selectedUnitId, interactivePlayerId = null, mapView = createLiveMapView(), mapExtra = '' }) {
  const styles = new URL('./styles/combat-workspace.css', import.meta.url).href;
  return `<link rel="stylesheet" href="${escapeHtml(styles)}"><section class="combat-workspace__map"><header><strong>Battlefield · ${phase.charAt(0).toUpperCase() + phase.slice(1)}</strong><span>APPROXIMATE</span></header>
      <p>${phase === 'movement' ? 'Drag an active unit to adjust its approximate position.' : 'Tap an acting unit, then an enemy target.'} Tabletop measurements and eligibility take priority.</p>
      ${mapView.render(state, { mode: 'live', perspectivePlayerId, interactivePlayerId, selectedUnitId, showZoomControls: phase !== 'charge' && phase !== 'fight' })}
      ${mapExtra}
    </section>`;
}

// Each phase owns its selection and command handling.
export function renderCombatWorkspace({ state, phase, perspectivePlayerId, selectedUnitId, interactivePlayerId = null, controls, footer, mapExtra = '', mapView = createLiveMapView() }) {
  return `<main class="combat-workspace" data-combat-phase="${phase}">
    ${renderCombatMapPanel({ state, phase, perspectivePlayerId, selectedUnitId, interactivePlayerId, mapView, mapExtra })}
    <section class="combat-workspace__panel" aria-label="${phase.charAt(0).toUpperCase() + phase.slice(1)} controls and Tactical Advisor">
      <div class="combat-workspace__scroll">${controls}</div><footer>${footer}</footer>
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
