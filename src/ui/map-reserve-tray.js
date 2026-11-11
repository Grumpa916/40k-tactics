import { attachmentParent } from '../rules/event-preparation.js';
import { unitDisplayLabels } from './map-unit-labels.js';
import { getPendingVenatariIngress } from '../rules/venatari-abilities.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function getReserveCandidates(state, playerId = null) {
  return (state?.units ?? []).filter(unit => unit.status !== 'destroyed' &&
    unit.status !== 'embarked' && !attachmentParent(state, unit) &&
    (!playerId || unit.ownerId === playerId));
}
export function getMapReserveUnits(state, { playerId = null } = {}) {
  return getReserveCandidates(state, playerId).filter(unit =>
    unit.status === 'reserves' &&
    (state.battle?.status === 'active' || state.battlefieldMap?.declaredReserves?.[unit.id]));
}

export function renderMapReserveTray(state,{selectedUnitId,playerId=null}={}) {
  const units=getReserveCandidates(state,playerId);
  const reserves=getMapReserveUnits(state,{playerId});
  const selected=units.find(unit=>unit.id===selectedUnitId);
  const canSend=selected && !reserves.includes(selected);
  const labels=unitDisplayLabels(state.units??[]);
  const labelFor=unit=>unit ? (labels.get(unit.id)??unit.name??unit.id) : '';
  return `<link rel="stylesheet" href="${new URL('./styles/map-reserve-tray.css',import.meta.url).href}"><div class="map-reserve-tray" data-map-reserve-area aria-label="Reserves tray">
    <button type="button" data-map-send-reserve ${canSend?'':'disabled'}>Reserves · ${reserves.length}${canSend?' · Move '+esc(labelFor(selected))+' here':''}</button>
    <div class="map-reserve-tray__units">${reserves.map(unit=>`<button type="button" data-map-reserve-select="${esc(unit.id)}" aria-pressed="${unit.id===selectedUnitId}">${esc(labelFor(unit))}${playerId?'':' · '+esc(state.players?.find(p=>p.id===unit.ownerId)?.name??unit.ownerId)}</button>`).join('')||'<span>No units in reserves</span>'}</div>
    <small>${reserves.includes(selected)?esc(labelFor(selected))+' selected · tap an empty map position to place.':'Select a battlefield unit, then tap this Reserves area. Select a reserve unit, then tap the map.'}</small>
  </div>`;
}
export function tappedMapPosition(event,board) {
  const rect=board?.getBoundingClientRect?.();
  if(!rect?.width||!rect?.height||!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
  return {x:Math.round(Math.max(0,Math.min(60,(event.clientX-rect.left)/rect.width*60))*10)/10,y:Math.round(Math.max(0,Math.min(44,(1-(event.clientY-rect.top)/rect.height)*44))*10)/10};
}

export function renderVenatariIngressTray(state, {selectedUnitId}={}) {
  const pending = getPendingVenatariIngress(state);
  if (!pending.length) return '';
  return `<section class="map-reserve-tray" aria-label="Swift Ruin arrivals"><strong>Swift Ruin · place before leaving Movement</strong><div class="map-reserve-tray__units">${pending.map(unit =>
    `<button type="button" data-map-reserve-select="${esc(unit.id)}" aria-pressed="${unit.id===selectedUnitId}">${esc(unit.name)}</button>`).join('')}</div><small>Select this unit, then tap its arrival position on the map. Confirm legal placement at the table.</small></section>`;
}

/**
 * The live Movement map uses the same board viewport as Charge. Keep transfers
 * available from the map surface, but open the full tray only on demand so it
 * never consumes the board's normal height. Click handling remains on the
 * existing data-map-reserve-area and data-map-reserve-select controls.
 */
export function renderMovementReserveDock(state, { selectedUnitId, playerId = null } = {}) {
  const reserveCount = getMapReserveUnits(state, { playerId }).length;
  const arrivals = getPendingVenatariIngress(state).length;
  return `<details class="movement-map-reserves" data-movement-map-reserves>
    <summary>Reserves · ${reserveCount}${arrivals ? ' · arrivals' : ''}</summary>
    <div class="movement-map-reserves__popover">
      ${renderMapReserveTray(state, { selectedUnitId, playerId })}
      ${renderVenatariIngressTray(state, { selectedUnitId })}
    </div>
  </details>`;
}
