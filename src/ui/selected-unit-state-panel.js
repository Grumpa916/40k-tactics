import { getCombatFormationMembers, getBattleUnitDatasheet } from '../rules/battle-unit-reference.js';
import { getEquippedWeaponReferences } from '../rules/saved-roster-combat-profile.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
import { renderLiveCasualtyStatus } from './live-casualty-panel.js';

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function objectiveControl(state, unit) {
  const sheet = getBattleUnitDatasheet(state, unit);
  const raw = sheet?.characteristics?.['Objective Control'] ?? sheet?.characteristics?.OC ??
    unit?.profile?.characteristics?.['Objective Control'] ?? unit?.characteristics?.['Objective Control'];
  const match = String(raw ?? '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

function renderMember(state, unit) {
  const vitals = getLiveUnitVitals(state, unit);
  const shocked = isUnitBattleShocked(unit);
  const casualty = renderLiveCasualtyStatus(state, unit, { compact: true, includeMapControls: false });
  const weapons = getEquippedWeaponReferences(state, unit);
  const weaponMarkup = weapons.length
    ? '<ul class="unit-state__weapons">' + weapons.map(({ weapon, activeQuantity, quantityUncertain }) =>
      '<li>' + esc(weapon.name) + ': <strong>' +
      (quantityUncertain || !Number.isFinite(activeQuantity) ? '—' : esc(activeQuantity)) +
      '</strong></li>').join('') + '</ul>'
    : '<p class="unit-state__unknown">Weapon counts unavailable</p>';
  const oc = objectiveControl(state, unit);
  const currentWoundCap = vitals.woundCap;
  return '<section class="unit-state__member" data-state-unit="' + esc(unit.id) + '">' +
    '<h4>' + esc(unit.name) + '</h4>' +
    '<div class="unit-state__summary"><span>' +
    (Number.isFinite(vitals.models) ? esc(vitals.models) : '—') + ' models</span><span>' +
    (Number.isFinite(vitals.wounds) ? esc(vitals.wounds) : '—') + ' / ' +
    (Number.isFinite(currentWoundCap) ? esc(currentWoundCap) : '—') +
    ' W</span><span>OC ' + (shocked ? '0 (Battle-shocked)' : oc == null || !Number.isFinite(vitals.models) ? '—' : esc(oc * vitals.models)) + '</span></div>' +
    casualty.controls + weaponMarkup + '</section>';
}

export function renderSelectedUnitStatePanel(state, unitId, { perspectivePlayerId = null } = {}) {
  const host = '<section class="unit-state" aria-label="Selected unit live state">';
  if (!unitId) return host + '<h3>Selected unit</h3><p>Select a unit on the map or in the phase list to adjust its live state.</p></section>';
  const unit = (state?.units ?? []).find(item => item.id === unitId);
  if (!unit || (perspectivePlayerId && unit.ownerId !== perspectivePlayerId)) {
    return host + '<h3>Selected unit</h3><p>Select one of your units to adjust live state.</p></section>';
  }
  const members = getCombatFormationMembers(state, unit).filter(member =>
    !perspectivePlayerId || member.ownerId === perspectivePlayerId
  );
  let totalOc = 0;
  for (const member of members) {
    if (isUnitBattleShocked(member)) continue;
    const oc = objectiveControl(state, member);
    const models = getLiveUnitVitals(state, member).models;
    if (oc == null || !Number.isFinite(models)) { totalOc = null; break; }
    totalOc += oc * models;
  }
  const ocText = totalOc == null ? 'unknown' : String(totalOc);
  return host + '<h3>Selected unit</h3><p class="unit-state__formation">' + esc(unit.name) +
    '</p><p class="unit-state__formation-oc">Formation OC: ' + esc(ocText) +
    ' <small>(Battle-shock applied; score manually.)</small></p>' +
    members.map(member => renderMember(state, member)).join('') + '</section>';
}
