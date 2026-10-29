import { getSelectedUnitActiveStatuses } from '../rules/unit-active-statuses.js';
import { getCustodesKatahState } from '../rules/custodes-tactical-advisor.js';
import { getCombatFormationRoot } from '../rules/battle-unit-reference.js';

const escapeHtml = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const ACTIVATION_LABELS = new Set(['Activation in progress', 'Activated / Resolved']);
const KATAH_PHASE = { Conservai:'command', Calistus:'movement', Salvus:'shooting', Dacatarai:'fight', Kaptaris:'fight', Rendax:'fight' };

function statusClass(label) {
  if (label === 'Battle-shocked') return 'is-battle-shocked';
  if (label === 'Engaged') return 'is-engaged';
  if (label === 'Charged this turn') return 'is-charged';
  if (label === 'Fights First') return 'is-fights-first';
  if (label === 'Action / Mission Action') return 'is-mission-action';
  if (label === 'Destroyed' || label === 'Reserves / Off battlefield') return 'is-off-battlefield';
  return 'is-other';
}

function katahBadge(state, unit) {
  const root = getCombatFormationRoot(state, unit) ?? unit;
  const katah = getCustodesKatahState(state, { playerId: unit.ownerId, unitId: root.id });
  if (!katah.eligible || katah.cycleRound < 1) return null;
  if (katah.readied) {
    const rereadied = Boolean(katah.lastKatah);
    return { icon: rereadied ? '↻' : 'R', label: rereadied ? 'Martial Ka\'tah re-readied' : 'Martial Ka\'tah readied', className: rereadied ? 'is-katah-rereadied' : 'is-katah-readied' };
  }
  if (!katah.lastKatah) return { icon: 'K', label: 'Martial Ka\'tah spent', className: 'is-katah-spent' };
  const active = KATAH_PHASE[katah.lastKatah] === state.phase && (state.activePlayer ?? state.battle?.activePlayerId) === unit.ownerId;
  return active
    ? { icon: 'K', label: `Martial Ka'tah ${katah.lastKatah} active`, className: 'is-katah-active' }
    : { icon: 'K', label: `Martial Ka'tah ${katah.lastKatah} spent`, className: 'is-katah-spent' };
}

export function getLiveMapStatusBadges(state, unitId) {
  const unit = (state?.units ?? []).find(item => item.id === unitId);
  if (!unit) return [];
  const statuses = getSelectedUnitActiveStatuses(state, unitId)
    .filter(status => !ACTIVATION_LABELS.has(status.label))
    .map(status => ({ ...status, className: statusClass(status.label) }));
  const katah = katahBadge(state, unit);
  if (katah) statuses.push(katah);
  return statuses;
}

export function applyLiveMapStatusBadges(mapHtml, state = {}) {
  let html = String(mapHtml ?? '');
  for (const unit of Array.isArray(state.units) ? state.units : []) {
    const badges = getLiveMapStatusBadges(state, unit.id);
    if (!badges.length) continue;
    const token = `data-map-unit-id="${escapeHtml(unit.id)}"`;
    const markerAt = html.indexOf(token);
    if (markerAt < 0) continue;
    const openingAt = html.lastIndexOf('<div', markerAt);
    const openingEnd = html.indexOf('>', markerAt);
    const closingAt = html.indexOf('</div>', openingEnd + 1);
    if (openingAt < 0 || openingEnd < 0 || closingAt < 0) continue;
    const labels = badges.map(status => status.label);
    const visibleBadges = badges.map(status =>
      `<span class="unit-map-status-badge ${escapeHtml(status.className)}" title="${escapeHtml(status.label)}">${escapeHtml(status.icon)}</span>`
    ).join('');
    const badgeMarkup = `<span class="unit-map-status-badges" aria-hidden="true">${visibleBadges}</span>`;
    const markerOpening = html.slice(openingAt, openingEnd + 1);
    const title = markerOpening.match(/\stitle="([^"]*)"/);
    const accessibleLabels = labels.filter(label => !title || !title[1].includes(escapeHtml(label)));
    const updatedOpening = title && accessibleLabels.length
      ? markerOpening.replace(title[0], ` title="${title[1]} · ${escapeHtml(accessibleLabels.join(' · '))}"`)
      : markerOpening;
    html = html.slice(0, openingAt) + updatedOpening + html.slice(openingEnd + 1, closingAt) + badgeMarkup + html.slice(closingAt);
  }
  return html;
}
