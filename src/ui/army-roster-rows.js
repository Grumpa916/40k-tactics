import { escapeHtml as e } from './army-builder-html.js';
import { unitStats } from './army-unit-details.js';
import { findArmyUnitCandidates } from '../data/army-unit-catalog.js';
import { loadoutReadinessLabel } from '../rules/roster-loadout-readiness.js';

function resolveRosterUnit(unit, faction = null) {
 if (unit?.datasheet || !faction) return unit;
 return findArmyUnitCandidates({ faction }).find(candidate => candidate.id === unit.datasheetId || candidate.name === unit.name) ?? unit;
}

/** Group saved attachment IDs for display without changing the roster or stat lines. */
export function renderRosterRows(units, selectedId, faction = null) {
 const byId = new Map(units.map(unit => [unit.id, unit]));
 const leadersByBodyguard = new Map();
 for (const unit of units) {
  const bodyguard = byId.get(unit.attachedToBodyguardId);
  if (!bodyguard || bodyguard.id === unit.id || bodyguard.attachedToBodyguardId) continue;
  if (!leadersByBodyguard.has(bodyguard.id)) leadersByBodyguard.set(bodyguard.id, []);
  leadersByBodyguard.get(bodyguard.id).push(unit);
 }
 const rendered = new Set();
 let groupNumber = 0;
 function row(rawUnit, role = '') {
  const unit = resolveRosterUnit(rawUnit, faction);
  const models = unit.modelCount ?? 1;
  const loadoutLabel = loadoutReadinessLabel(unit);
  return `<button type="button" class="ab-roster-row ${unit.id === selectedId ? 'is-selected' : ''}" data-view-unit-detail="${e(unit.id)}">${role ? `<span class="ab-unit-role">${e(role)}</span>` : ''}<strong>${e(unit.name)}</strong><small>${e(models)} ${models === 1 ? 'model' : 'models'} · ${e(unit.points ?? 'Unknown')} pts${unit.attachedToBodyguardId && !role ? ' · Attachment needs review' : ''} · ${e(loadoutLabel)}</small>${unitStats(unit)}</button>`;
 }
 return units.map(unit => {
  if (rendered.has(unit.id)) return '';
  const bodyguard = byId.get(unit.attachedToBodyguardId) ?? unit;
  const leaders = leadersByBodyguard.get(bodyguard.id);
  if (!leaders?.length) { rendered.add(unit.id); return row(unit); }
  const members = [...leaders, bodyguard];
  members.forEach(member => rendered.add(member.id));
  const models = members.every(member => Number.isFinite(member.modelCount)) ? members.reduce((sum, member) => sum + member.modelCount, 0) : 'Unknown';
  const points = members.every(member => Number.isFinite(member.points)) ? members.reduce((sum, member) => sum + member.points, 0) : 'Unknown';
  return `<section class="ab-attached-unit" aria-label="Attached unit ${++groupNumber}"><header><strong>Attached unit ${groupNumber}</strong><small>${e(models)} models · ${e(points)} pts combined</small></header>${leaders.map(leader => row(leader, 'Leader')).join('')}${row(bodyguard, 'Bodyguard')}</section>`;
 }).join('') || '<p>Your list is empty. Add units from the browser.</p>';
}
