import { getCombatFormationMembers, getBattleUnitDatasheet } from '../rules/battle-unit-reference.js';
import { getEquippedWeaponReferences } from '../rules/saved-roster-combat-profile.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { getArmyUnitReference } from './army-unit-summary.js';
import { mapUnitUpgradeNames, unitDisplayLabels } from './map-unit-labels.js';
import { ADEPTUS_CUSTODES_DETACHMENTS } from '../data/adeptus-custodes-faction-rules.js';
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
  const ref = getArmyUnitReference(state,unit);
  const characteristics=ref.profile?.characteristics??{};
  const value=(...keys)=>keys.map(key=>characteristics[key]).find(item=>item!=null && item!=='')??'—';
  const stats=[['M',value('movement','Move')],['T',value('toughness','Toughness')],['Sv',value('save','Save')],['W',value('wounds','Wounds')],['Ld',value('leadership','Leadership')],['OC',value('objectiveControl','Objective Control','oc')]];
  const upgrades=mapUnitUpgradeNames(unit,state);
  const enhancementRules=ADEPTUS_CUSTODES_DETACHMENTS.flatMap(detachment=>detachment.enhancements??[]);
  const upgradeMarkup=upgrades.length?'<ul class="unit-state__upgrades">'+upgrades.map(name=>{
    const rule=enhancementRules.find(item=>item.name===name);
    return '<li><strong>'+esc(name)+'</strong>'+(rule?.description?' · '+esc(rule.description):'')+'</li>';
  }).join('')+'</ul>':'';
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
    '<h4>' + esc(unitDisplayLabels(state.units??[],state).get(unit.id)??unit.name) + '</h4>' +
    '<div class="unit-state__profile">'+stats.map(([label,val])=>'<span><small>'+label+'</small><strong>'+esc(val)+'</strong></span>').join('')+'</div>' +
    upgradeMarkup +
    '<div class="unit-state__summary"><span>' +
    (Number.isFinite(vitals.models) ? esc(vitals.models) : '—') + ' models</span><span>' +
    (Number.isFinite(vitals.wounds) ? esc(vitals.wounds) : '—') + ' / ' +
    (Number.isFinite(currentWoundCap) ? esc(currentWoundCap) : '—') +
    ' W</span><span>OC ' + (shocked ? '0 (Battle-shocked)' : oc == null || !Number.isFinite(vitals.models) ? '—' : esc(oc * vitals.models)) + '</span></div>' +
    casualty.controls + weaponMarkup + '</section>';
}

export function renderSelectedUnitStatePanel(state, unitId, { perspectivePlayerId = null } = {}) {
  const host = '<style>.unit-state__profile{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;margin:8px 0}.unit-state__profile span{display:grid;text-align:center;border:1px solid #52606b;border-radius:6px;padding:4px 1px}.unit-state__profile small{opacity:.72}.unit-state__upgrades{padding-left:20px;margin:8px 0;color:#d9e7b5}</style><section class="unit-state" aria-label="Selected unit live state">';
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
