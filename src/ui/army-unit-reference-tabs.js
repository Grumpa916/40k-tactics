import { getArmyUnitReference } from './army-unit-summary.js';
import { getBattleRosterUnit, getBattleUnitDatasheet, hasInvalidWargear } from '../rules/battle-unit-reference.js';
import { getEquippedWeaponReferences } from '../rules/saved-roster-combat-profile.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { getArmyUnitDisplayGroup, armyUnitMemberRole } from './army-unit-display-groups.js';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function displayLabel(key) {
  return String(key ?? "").replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderCharacteristics(characteristics, { singleLine = false, weapon = false } = {}) {
  if (!characteristics || typeof characteristics !== "object" || Array.isArray(characteristics)) {
    return '<p class="battle-context__empty">Characteristics are not loaded for this unit.</p>';
  }
  const entries = Object.entries(characteristics).filter(([, value]) =>
    value !== null && value !== undefined && value !== "");
  if (!entries.length) return '<p class="battle-context__empty">Characteristics are not loaded for this unit.</p>';
  if (weapon) {
    const order = { range: 0, attacks: 1, a: 1, skill: 2, ballisticskill: 2, weaponskill: 2,
      bs: 2, ws: 2, strength: 3, s: 3, ap: 4, armourpenetration: 4, armorpenetration: 4, damage: 5, d: 5 };
    const rank = key => order[String(key).replace(/[^a-z]/gi, '').toLowerCase()] ?? 6;
    entries.sort(([left], [right]) => rank(left) - rank(right));
  }
  const layout = singleLine || weapon
    ? ` class="battle-shell__army-characteristics prototype-unit-stat-row ${weapon ? 'prototype-unit-weapon-characteristics' : 'prototype-unit-profile-characteristics'}" style="--unit-stat-count:${entries.length}"`
    : ' class="battle-shell__army-characteristics"';
  return '<dl' + layout + '>' + entries.map(([key, value]) =>
    '<div><dt>' + escapeHtml(displayLabel(key)) + '</dt><dd>' + escapeHtml(value) + '</dd></div>'
  ).join("") + '</dl>';
}

function weaponProfilesForUnit(unit, gameData) {
  const catalog = [
    ...(Array.isArray(gameData?.weapons) ? gameData.weapons : []),
    ...(Array.isArray(gameData?.weaponProfiles) ? gameData.weaponProfiles : [])
  ];
  const embedded = Array.isArray(unit.profile?.weapons) ? unit.profile.weapons : [];
  const ids = Array.isArray(unit.profile?.weaponIds) ? unit.profile.weaponIds : [];
  return [
    ...embedded,
    ...ids.map((id) => catalog.find((weapon) => weapon?.id === id)).filter(Boolean)
  ];
}

function weaponKeywordsFromValue(value) {
  if (Array.isArray(value)) return value.flatMap(weaponKeywordsFromValue);
  if (typeof value === "string") return value.split(/[,;·]/).map((item) => item.trim()).filter(Boolean);
  if (value && typeof value === "object") {
    return weaponKeywordsFromValue(value.name ?? value.keyword ?? value.label ?? value.value ?? "");
  }
  return [];
}

function weaponKeywords(weapon) {
  const values = [
    weapon?.keywords, weapon?.keyword, weapon?.abilities,
    weapon?.weaponKeywords,
    weapon?.characteristics?.keywords, weapon?.characteristics?.keyword,
    weapon?.characteristics?.abilities
  ];
  const seen = new Set();
  return values.flatMap(weaponKeywordsFromValue).filter((keyword) => {
    const key = keyword.toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function weaponCharacteristics(weapon) {
  const raw = weapon?.characteristics && typeof weapon.characteristics === "object"
    ? weapon.characteristics
    : Object.fromEntries(Object.entries(weapon ?? {}).filter(([key]) =>
      ["range", "attacks", "skill", "strength", "ap", "damage"].includes(String(key).toLowerCase())
    ));
  return Object.fromEntries(Object.entries(raw).filter(([key]) =>
    !["abilities", "keywords", "keyword", "weaponkeywords"].includes(String(key).replace(/[^a-z]/gi, "").toLowerCase())
  ));
}

function renderWeaponEntries(entries) {
  if (!entries.length) {
    return '<p class="battle-context__empty">Weapon reference data is not loaded for this unit.</p>';
  }
  return '<ul class="battle-shell__army-weapons">' + entries.map(({ weapon, activeQuantity, equippedQuantity, quantityUncertain, confirmed }) => {
    const chars = weaponCharacteristics(weapon);
    const detail = renderCharacteristics(chars, { weapon: true });
    const keywords = weaponKeywords(weapon);
    const keywordLine = keywords.length
      ? '<p class="prototype-unit-weapon-keywords">[' + escapeHtml(keywords.join(", ")) + ']</p>'
      : "";
    const type = weapon?.type
      ? '<span class="battle-context__badge">' + escapeHtml(weapon.type) + '</span>'
      : "";
    const activeLabel = quantityUncertain || !Number.isFinite(activeQuantity)
      ? 'Active count unknown' : activeQuantity + ' active';
    const quantity = confirmed
      ? '<span class="prototype-unit-weapon-count">' + escapeHtml(activeLabel) + ' · ' +
        escapeHtml(equippedQuantity) + ' equipped</span>'
      : '<span class="prototype-unit-weapon-count">Reference profile</span>';
    return '<li><div class="battle-shell__army-weapon-heading"><strong>' +
      escapeHtml(weapon?.name ?? weapon?.id ?? "Unnamed weapon") + '</strong>' + type + quantity + '</div>' +
      (weapon?.description ? '<p>' + escapeHtml(weapon.description) + '</p>' : '') + detail + keywordLine + '</li>';
  }).join("") + '</ul>';
}


function renderUnitWeapons(state, unit, rosterUnit, gameData) {
  const profiles = weaponProfilesForUnit(unit, gameData);
  const selections = (Array.isArray(rosterUnit?.equippedWeapons) ? rosterUnit.equippedWeapons : [])
    .filter((item) => item && Number(item.quantity ?? 1) > 0);
  const needsReview = hasInvalidWargear(state, unit);

  if (selections.length && !needsReview) {
    const selectedEntries = getEquippedWeaponReferences(state, unit, profiles)
      .map(entry => ({ ...entry, confirmed: true }));
    if (selectedEntries.length) {
      const uncertain = selectedEntries.some(entry => entry.quantityUncertain);
      const review = uncertain
        ? ' Active counts need casualty review where surviving weapon identities are unknown.' : '';
      return '<p class="prototype-unit-loadout-note"' + (uncertain ? ' data-tone="warning"' : '') +
        '>Equipped weapon profiles from the saved army loadout.' + review + '</p>' +
        renderWeaponEntries(selectedEntries);
    }
  }

  if (!profiles.length) return renderWeaponEntries([]);
  const message = needsReview
    ? "The saved loadout needs review. These are datasheet reference profiles, not confirmed equipped weapons."
    : selections.length
      ? "The saved weapon choices could not be matched to the current profiles. Review the roster loadout before relying on these."
      : "No confirmed equipped weapon selection is saved for this unit. These are datasheet reference profiles.";
  return '<p class="prototype-unit-loadout-note" data-tone="warning">' + escapeHtml(message) + '</p>' +
    renderWeaponEntries(profiles.map((weapon) => ({ weapon, confirmed: false })));
}

function renderUnitAbilities(unit) {
  const abilities = Array.isArray(unit.profile?.abilities) ? unit.profile.abilities
    : Array.isArray(unit.abilities) ? unit.abilities
    : Array.isArray(unit.metadata?.abilities) ? unit.metadata.abilities : [];
  if (!abilities.length) return '<p class="battle-context__empty">Ability reference data is not loaded for this unit.</p>';
  return '<ul class="battle-shell__army-abilities">' + abilities.map((ability) => {
    const name = typeof ability === "string" ? ability : ability?.name ?? ability?.label ?? "Unnamed ability";
    const text = typeof ability === "string" ? "" : ability?.description ?? ability?.text ?? ability?.summary ?? "";
    return '<li><strong>' + escapeHtml(name) + '</strong>' +
      (text ? '<p>' + escapeHtml(text) + '</p>' : '') + '</li>';
  }).join("") + '</ul>';
}

function renderUnitKeywords(unit) {
  const keywords = Array.isArray(unit.profile?.keywords) ? unit.profile.keywords : [];
  if (!keywords.length) return '<p class="battle-context__empty">Keywords are not loaded for this unit.</p>';
  return '<p class="prototype-unit-keywords">' + keywords.map((keyword) =>
    escapeHtml(typeof keyword === "string" ? keyword : keyword?.name ?? keyword?.keyword ?? "")
  ).filter(Boolean).join(" · ") + '</p>';
}

function renderUnitNotes(unit, rosterUnit) {
  const armyNotes = String(rosterUnit?.notes ?? "").trim();
  const battleNote = String(unit.metadata?.battleRulesNote ?? "").trim();
  if (!armyNotes && !battleNote) {
    return '<p class="battle-context__empty">No notes are saved for this unit.</p>';
  }
  return (armyNotes
    ? '<section class="prototype-unit-note"><h3>Army list notes</h3><p>' + escapeHtml(armyNotes) + '</p></section>'
    : '') + (battleNote
      ? '<section class="prototype-unit-note"><h3>Battle note</h3><p>' + escapeHtml(battleNote) + '</p></section>'
      : '');
}

function renderMemberProfile(state, original, unit) {
  const rosterUnit = getBattleRosterUnit(state, original);
  const saved = rosterUnit?.datasheet?.characteristics;
  const battle = original.profile?.characteristics ?? original.characteristics;
  const characteristics = saved && Object.keys(saved).length ? saved
    : battle && Object.keys(battle).length ? battle : getBattleUnitDatasheet(state, original)?.characteristics;
  const sourceStatus = rosterUnit?.dataSource?.status ?? rosterUnit?.verificationStatus;
  const sourceLine = typeof sourceStatus === 'string' && sourceStatus
    ? 'Army data status · ' + escapeHtml(sourceStatus)
    : rosterUnit ? 'Reference from the saved army list' : 'Reference data attached to this battle';
  return '<p class="prototype-unit-data-status">' + sourceLine + '</p>' +
    '<h4>Characteristics</h4>' + renderCharacteristics(characteristics, { singleLine: true }) +
    '<h4>Keywords</h4>' + renderUnitKeywords(unit);
}

function renderMemberPanel(state, original, gameData, tab) {
  const unit = getArmyUnitReference(state, original);
  const rosterUnit = getBattleRosterUnit(state, original);
  if (tab === 'profile') return renderMemberProfile(state, original, unit);
  if (tab === 'weapons') return renderUnitWeapons(state, unit, rosterUnit, gameData);
  if (tab === 'abilities') return renderUnitAbilities(unit);
  return renderUnitNotes(unit, rosterUnit);
}

function renderMemberVitals(state, group, member) {
  const vitals = getLiveUnitVitals(state, member);
  const remaining = Number.isFinite(vitals.wounds) ? vitals.wounds : '—';
  const maximum = Number.isFinite(vitals.startingWounds) ? '/' + vitals.startingWounds : '';
  const models = Number.isFinite(vitals.models) ? vitals.models + (vitals.models === 1 ? ' model · ' : ' models · ') : '';
  return '<li><strong>' + escapeHtml(member.name ?? member.id) + '</strong><span>' +
    escapeHtml(armyUnitMemberRole(group, member)) + ' · ' + escapeHtml(member.status ?? 'Status unavailable') +
    '</span><b>' + escapeHtml(models) + 'W ' + escapeHtml(remaining + maximum) + '</b></li>';
}

export function renderArmyUnitDialog(state, unitId, gameData = {}, selectedTab = 'profile') {
  const group = getArmyUnitDisplayGroup(state, unitId);
  if (!group) return '<p>Unit no longer available.</p><button data-army-back>Back to army</button>';
  const tabs = ['profile', 'weapons', 'abilities', 'notes'];
  const activeTab = tabs.includes(selectedTab) ? selectedTab : 'profile';
  const titles = { profile: 'Profile', weapons: 'Weapons', abilities: 'Abilities', notes: 'Notes' };
  const tabButtons = tabs.map(tab =>
    '<button type="button" role="tab" id="army-unit-tab-' + tab + '" aria-controls="army-unit-panel-' + tab +
    '" aria-selected="' + String(activeTab === tab) + '" tabindex="' + (activeTab === tab ? '0' : '-1') +
    '" data-unit-detail-tab="' + tab + '">' + titles[tab] + '</button>'
  ).join('');
  const panels = tabs.map(tab => {
    const contents = group.members.map(member => {
      const content = renderMemberPanel(state, member, gameData, tab);
      return group.attached ? '<section class="prototype-unit-member-section" data-unit-reference-member="' +
        escapeHtml(member.id) + '"><h3>' + escapeHtml(member.name ?? member.id) + '<small>' +
        armyUnitMemberRole(group, member) + '</small></h3>' + content + '</section>' : content;
    }).join('');
    return '<div id="army-unit-panel-' + tab + '" role="tabpanel" aria-labelledby="army-unit-tab-' + tab +
      '" data-unit-detail-panel="' + tab + '"' + (activeTab === tab ? '' : ' hidden') + '>' + contents + '</div>';
  }).join('');
  const points = group.members.map(member => member.points ?? member.metadata?.points);
  const pointLabel = points.every(Number.isFinite) ? points.reduce((sum, value) => sum + value, 0) + ' pts · ' : '';
  const vitals = getLiveUnitVitals(state, group.root);
  const summary = group.attached
    ? '<p>' + escapeHtml(pointLabel) + 'Attached unit</p><ul class="prototype-formation-vitals">' +
      group.members.map(member => renderMemberVitals(state, group, member)).join('') + '</ul>'
    : '<p>' + escapeHtml(pointLabel + (group.root.status ?? 'Status unavailable')) + ' · ' +
      escapeHtml(vitals.wounds ?? '—') + ' Wounds remaining</p>';
  return '<section class="battle-shell__army-dialog prototype-unit-dialog" role="dialog" aria-modal="true" aria-labelledby="prototype-unit-title">' +
    '<header class="battle-shell__army-dialog-header"><button type="button" data-army-back>← Army list</button>' +
    '<h2 id="prototype-unit-title">' + escapeHtml(group.name) + '</h2><button type="button" data-close-army-roster>Close</button></header>' +
    summary + '<div class="prototype-unit-tabs" role="tablist" aria-label="' + escapeHtml(group.name) + ' army reference">' +
    tabButtons + '</div>' + panels + '</section>';
}
