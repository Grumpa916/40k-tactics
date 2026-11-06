import { getIncomingDamageComparison } from '../rules/incoming-damage-comparison.js';
import { escapeHtml } from './combat-workspace.js';
import { renderAdvisorDamageReduction } from './advisor-damage-reduction.js';
import { renderAdvisorOptionImpact } from './advisor-option-impact.js';

const damage = value => Number.isFinite(value) ? value.toFixed(1) : '—';

export function renderIncomingDamageForecast(state, { attackerId = null, targetId = null, weapon = null } = {}) {
  if (!attackerId || !targetId || !weapon) {
    return '<p>Select the attacking unit, weapon and your targeted unit to estimate incoming damage.</p>';
  }
  const comparison = getIncomingDamageComparison(state, { attackerId, targetId, weapon });
  if (!comparison) return '<p>Incoming damage estimate is unavailable because a saved combat profile is incomplete.</p>';

  const currentChance = Math.round(comparison.forecast.probabilityAnyDamage * 100);
  const active = comparison.mode === 'active';
  const expected = active ? comparison.after : comparison.forecast.expectedDamage;
  const result = `<div class="shoot-advisory__grid"><div><strong>${damage(expected)}</strong><span>${active?'with recorded protection':'current estimated damage'}</span></div><div><strong>${currentChance}%</strong><span>chance of any damage with current defenses</span></div></div>`;
  const activeImpact = active ? renderAdvisorOptionImpact({
    title:'Recorded defensive effects',
    baseline:comparison.before,
    options:[{id:'active-defences',label:'Recorded protection',expectedDamage:comparison.after,cost:comparison.effects.join(' · ')}],
    metric:'incoming damage',lowerIsBetter:true,
    note:'Already active. This comparison removes known temporary effects for the baseline; it does not change the recorded game.'
  }) : '';
  const previewImpact = !active && comparison.previews?.length ? renderAdvisorOptionImpact({
    title:'Defensive options · what changes?',
    baseline:comparison.forecast.expectedDamage,
    options:comparison.previews.map(item=>({
      id:item.id,label:item.label,expectedDamage:item.after,cost:item.cost
    })),
    metric:'incoming damage',lowerIsBetter:true,
    note:'Each option is an independent preview from current defenses. No CP or Ka’tah readiness has been spent. Confirm the tabletop trigger.'
  }) : '';

  return `<div class="shoot-advisory incoming-damage-forecast" data-incoming-damage-forecast>
    <div class="shoot-advisory__heading"><h3>Incoming damage estimate</h3><span>optional reference</span></div>
    ${result}
    ${activeImpact}
    ${previewImpact}
    ${renderAdvisorDamageReduction({
      damageCharacteristic: comparison.forecast.damageCharacteristic,
      damageReduction: comparison.forecast.damageReduction,
      appliedRules: comparison.forecast.appliedRules
    })}
    <small>Uses saved profiles and current recorded defenses. Tabletop rolls determine the result; record actual damage once after resolving the attack.</small>
  </div>`;
}
