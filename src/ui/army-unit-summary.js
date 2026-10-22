import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { getBattleUnitDatasheet } from '../rules/battle-unit-reference.js';
import { isUnitBattleShocked, getUnitStrengthAssessment } from '../rules/unit-status-summary.js';
import { getUnitActivationPresentation } from '../rules/unit-activation-presentation.js';
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function getArmyUnitReference(state, unit) {
  const sheet = getBattleUnitDatasheet(state, unit) ?? {};
  return { ...unit, profile:{ ...sheet, ...unit.profile, characteristics:{ ...sheet.characteristics, ...unit.characteristics, ...unit.profile?.characteristics } } };
}
export function renderArmyUnitSummary(state, unit) {
  const ref = getArmyUnitReference(state, unit), c = ref.profile.characteristics;
  const value = (...keys) => keys.map(key => c[key]).find(item => item != null && item !== '') ?? '—';
  const stats = [['M',value('movement','Move')],['T',value('toughness','Toughness')],['S','Weapon'],['SV',value('save','Save')],['LD',value('leadership','Leadership')],['OC',value('objectiveControl','Objective Control','oc')]];
  const vitals = getLiveUnitVitals(state, unit);
  const strength = getUnitStrengthAssessment(unit);
  const models = Number.isFinite(vitals.models) && Number.isFinite(vitals.startingModels) ? `${vitals.models}/${vitals.startingModels}` : '—';
  const status = isUnitBattleShocked(unit) ? 'Battle-shocked' : getUnitActivationPresentation(state,unit.id) === 'resolved' ? '✓ Resolved' : unit.status === 'deployed' ? 'Available' : unit.status;
  const shocked = isUnitBattleShocked(unit);
  return `<div class="prototype-roster-row"><button type="button" class="prototype-roster-main" data-open-unit-details="${esc(unit.id)}"><strong>${esc(unit.name ?? unit.id)}${Number.isFinite(unit.points ?? unit.metadata?.points) ? `<small>${esc(unit.points ?? unit.metadata.points)} pts</small>` : ''}</strong><span class="prototype-unit-stats">${stats.map(([key,val])=>`<span><small>${key}</small><b>${esc(val)}</b></span>`).join('')}</span><span class="prototype-roster-spacer"></span><span class="prototype-counter"${!strength.known ? ' title="Model count not fully tracked"' : ''}><small>MODELS</small><b>${esc(models)}</b></span><span class="prototype-counter"><small>WOUNDS</small><b>${esc(vitals.wounds ?? '—')}</b></span><span class="prototype-unit-status">${esc(status)} ↗</span></button><button type="button" class="prototype-battleshock-toggle" data-manual-battle-shock="${esc(unit.id)}" aria-pressed="${shocked}">${shocked ? 'Clear Battle-shock' : '+ Battle-shock'}</button></div>`;
}

