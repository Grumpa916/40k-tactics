import { getArmyUnitReference } from './army-unit-summary.js';
import { liveUnitSymbolLabels } from './live-map-symbols.js';
import { getUnitActivationPresentation } from '../rules/unit-activation-presentation.js';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

function characteristic(ref, ...keys) {
  const c = ref?.profile?.characteristics ?? {};
  for (const key of keys) {
    const value = c[key];
    if (value != null && value !== '') return value;
  }
  return '—';
}

function movementStatus(state, unit, action, refinement) {
  if (unit?.status === 'reserves') return 'RESERVES';
  if (unit?.status === 'destroyed') return 'DESTROYED';
  if (unit?.status === 'embarked') return 'EMBARKED';
  if (refinement?.movementType === 'advance') return 'ADVANCED';
  if (refinement?.movementType === 'fall_back') return 'FELL BACK';
  if (refinement?.movementType === 'special') return 'SPECIAL';
  if (action?.type === 'unit.stationary_recorded') return 'STATIONARY';
  if (action) return 'MOVED';
  if (getUnitActivationPresentation(state, unit?.id) === 'resolved') return 'RESOLVED';
  return 'READY';
}

function ownerName(state, ownerId) {
  return state?.players?.find(player => player.id === ownerId)?.name ?? ownerId ?? '';
}

export function renderMovementRosterRail(state, {
  playerId,
  perspectivePlayerId = playerId,
  selectedUnitId = null,
  rosterView = 'mine',
  actionForUnit = () => null,
  refinementForUnit = () => null
} = {}) {
  const players = Array.isArray(state?.players) ? state.players : [];
  const myId = perspectivePlayerId ?? playerId ?? players[0]?.id ?? null;
  const opponentId = players.find(player => player.id !== myId)?.id ?? null;
  const ownerId = rosterView === 'opponent' ? opponentId : myId;
  const units = (state?.units ?? []).filter(unit => unit.ownerId === ownerId);
  const symbols = liveUnitSymbolLabels(state?.units ?? []);
  const rows = units.map(unit => {
    const activeArmy = unit.ownerId === playerId;
    const selectable = activeArmy && ['deployed','reserves'].includes(unit.status);
    const status = movementStatus(state, unit, actionForUnit(unit.id), refinementForUnit(unit.id));
    const selected = unit.id === selectedUnitId;
    return `<div class="movement-roster__entry"><button type="button" class="movement-roster__row${selected ? ' is-selected' : ''}" ${selectable ? `data-move-roster-unit="${esc(unit.id)}"` : `data-open-unit-details="${esc(unit.id)}"`} aria-pressed="${selected}">
      <span class="movement-roster__token ${unit.ownerId === myId ? 'is-friendly' : 'is-opponent'}">${esc(symbols.get(unit.id) ?? 'U')}</span>
      <span class="movement-roster__identity"><strong>${esc(unit.name ?? unit.id)}</strong><small>${esc(status)}</small></span>
    </button>${selectable ? `<button type="button" class="movement-roster__reference" data-open-unit-details="${esc(unit.id)}" aria-label="View ${esc(unit.name ?? unit.id)} details">ⓘ</button>` : ''}</div>`;
  }).join('');
  return `<section class="movement-roster" aria-label="Army units">
    <div class="movement-roster__tabs">
      <button type="button" data-movement-roster-view="mine" aria-pressed="${rosterView !== 'opponent'}">My Army</button>
      <button type="button" data-movement-roster-view="opponent" aria-pressed="${rosterView === 'opponent'}">Opponent</button>
    </div>
    <div class="movement-roster__list">${rows || '<p>No units to show.</p>'}</div>
  </section>`;
}

export function renderMovementSelectedUnitCard(state, unit, { action = null, refinement = null } = {}) {
  if (!unit) return `<section class="movement-selected-unit"><h2>Selected Unit</h2><p>Select one of your units on the map or in the army list.</p></section>`;
  const ref = getArmyUnitReference(state, unit);
  const symbols = liveUnitSymbolLabels(state?.units ?? []);
  const stats = [
    ['M', characteristic(ref,'movement','Move')],
    ['T', characteristic(ref,'toughness','Toughness')],
    ['SV', characteristic(ref,'save','Save')],
    ['W', characteristic(ref,'wounds','Wounds')],
    ['OC', characteristic(ref,'objectiveControl','Objective Control','oc')]
  ];
  const status = movementStatus(state, unit, action, refinement);
  return `<section class="movement-selected-unit" data-movement-selected-unit>
    <div class="movement-selected-unit__heading">
      <span class="movement-selected-unit__token">${esc(symbols.get(unit.id) ?? 'U')}</span>
      <span><small>SELECTED UNIT</small><strong>${esc(unit.name ?? unit.id)}</strong><em>${esc(ownerName(state, unit.ownerId))}</em></span>
      <b>${esc(status)}</b>
    </div>
    <div class="movement-selected-unit__stats">${stats.map(([key,value]) => `<span><small>${key}</small><strong>${esc(value)}</strong></span>`).join('')}</div>
    <div class="movement-selected-unit__tabs" aria-label="Unit reference tabs"><span class="is-active">Movement</span><span>Weapons</span><span>Abilities</span><span>Profile</span></div>
  </section>`;
}

