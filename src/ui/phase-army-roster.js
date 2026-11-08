import { liveUnitSymbolLabels } from './live-map-symbols.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { getArmyUnitDisplayGroups, armyUnitMemberRole } from './army-unit-display-groups.js';
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

export function renderPhaseArmyRoster(state, perspectivePlayerId, {
  selectableIds = [], selectedUnitId = null, targetIds = []
} = {}) {
  const myId = perspectivePlayerId ?? state.players?.[0]?.id ?? state.activePlayer;
  const symbols = liveUnitSymbolLabels(state.units ?? []);
  const selectable = new Set(selectableIds), targets = new Set(targetIds);
  const row = (unit, side, role = '') => {
    const vitals = getLiveUnitVitals(state, unit);
    const remaining = Number.isFinite(vitals.wounds) ? String(vitals.wounds) : '—';
    const maximum = Number.isFinite(vitals.startingWounds) ? '/' + vitals.startingWounds : '';
    const id = esc(unit.id);
    const name = esc(unit.name ?? unit.id);
    const details = 'data-open-unit-details="' + id + '"';
    const selection = selectable.has(unit.id)
      ? 'data-select-phase-unit="' + id + '" aria-pressed="' + (unit.id === selectedUnitId || targets.has(unit.id)) + '"' : null;
    const button = '<button type="button" class="phase-army-roster__unit" ' + (selection ?? details) + '><span class="phase-army-roster__token ' + (side === 'mine' ? 'is-friendly' : 'is-opponent') + '">' + esc(symbols.get(unit.id) ?? 'U') + '</span><span>' +
      (role ? '<small class="phase-army-roster__role">' + role + '</small>' : '') +
      '<strong>' + name + '</strong><small class="phase-army-roster__vitals"><span>' + esc(unit.status ?? 'Unknown status') + '</span><b aria-label="' + remaining + ' of ' + (maximum ? maximum.slice(1) : 'unknown') + ' wounds remaining">W ' + remaining + maximum + '</b></small></span></button>';
    return selection ? '<div class="phase-army-roster__selectable">' + button +
      '<button type="button" class="phase-army-roster__details" ' + details + ' aria-label="Details for ' + name + '">ⓘ</button></div>' : button;
  };
  const list = side => getArmyUnitDisplayGroups(state, (state.units ?? []).filter(unit =>
    side === 'mine' ? unit.ownerId === myId : unit.ownerId !== myId)).map(group => group.attached
      ? '<section class="phase-army-roster__group" aria-label="' + esc(group.name) + '"><h3>Attached unit</h3>' +
        group.members.map(unit => row(unit, side, armyUnitMemberRole(group, unit))).join('') + '</section>'
      : row(group.root, side)).join('') || '<p>No units to show.</p>';
  return '<link rel="stylesheet" href="' + new URL('./styles/phase-army-roster.css', import.meta.url).href + '"><aside class="phase-army-roster" aria-label="Army lists"><div class="phase-army-roster__tabs"><button type="button" data-phase-army-view="mine" aria-pressed="true">My Army</button><button type="button" data-phase-army-view="opponent" aria-pressed="false">Opponent</button></div><div class="phase-army-roster__list" data-phase-army-list="mine">' + list('mine') + '</div><div class="phase-army-roster__list" data-phase-army-list="opponent" hidden>' + list('opponent') + '</div></aside>';
}

export function bindPhaseArmySelection(container, onSelect) {
  container.querySelectorAll?.('[data-select-phase-unit]').forEach(button => {
    button.addEventListener('click', () => onSelect(button.getAttribute('data-select-phase-unit')));
  });
}

export function refreshPhaseArmyRoster(container, side = 'mine') {
  container.querySelectorAll?.('[data-phase-army-view]').forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute('data-phase-army-view') === side)));
  container.querySelectorAll?.('[data-phase-army-list]').forEach(list => { list.hidden = list.getAttribute('data-phase-army-list') !== side; });
}
