import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
import { renderSelectedUnitQuickAdjust } from './selected-unit-quick-adjust.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

// A compact summary stays beside the phase decision, with existing verified
// one-tap wound/model/Battle-shock corrections available on disclosure.
// Existing live-casualty-controls event delegation performs all writes.
// This does not create a second unit selection route or edit battle state.
export function renderPhaseSelectedVitals(state, unitId) {
  if (!unitId || state?.battle?.status!=='active') return '';
  const unit=(state.units??[]).find(item=>item.id===unitId);
  if (!unit || !['deployed','reserves'].includes(unit.status)) return '';
  const vitals=getLiveUnitVitals(state,unit);
  const woundText=Number.isFinite(vitals.wounds)?String(vitals.wounds):'—';
  const woundMaximum=Number.isFinite(vitals.startingWounds)?'/'+vitals.startingWounds:'';
  const models=Number.isInteger(vitals.models)?vitals.models:'—';
  const shocked=isUnitBattleShocked(unit);
  return '<details class="phase-selected-vitals" data-view-key="phase-selected-vitals-'+esc(unit.id)+'">'+
    '<summary aria-label="Adjust wounds, models and Battle-shock for '+esc(unit.name??unit.id)+'">'+
    '<span>W '+esc(woundText+woundMaximum)+'</span><span>'+esc(models)+' models</span>'+
    '<span>Battle-shock: '+(shocked?'On':'Off')+'</span></summary>'+
    renderSelectedUnitQuickAdjust(state,unit.id)+'</details>';
}
