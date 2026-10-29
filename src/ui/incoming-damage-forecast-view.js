import { getIncomingDamageComparison } from '../rules/incoming-damage-comparison.js';
import { escapeHtml } from './combat-workspace.js';

const damage = value => Number.isFinite(value) ? value.toFixed(1) : '—';

export function renderIncomingDamageForecast(state, { attackerId = null, targetId = null, weapon = null } = {}) {
  if (!attackerId || !targetId || !weapon) {
    return '<p>Select the attacking unit, weapon and your targeted unit to estimate incoming damage.</p>';
  }
  const comparison = getIncomingDamageComparison(state, { attackerId, targetId, weapon });
  if (!comparison) return '<p>Incoming damage estimate is unavailable because a saved combat profile is incomplete.</p>';

  const currentChance = Math.round(comparison.forecast.probabilityAnyDamage * 100);
  const result = comparison.mode === 'active'
    ? `<div class="shoot-advisory__grid"><div><strong>${damage(comparison.before)}</strong><span>without temporary effects</span></div><div><strong>${damage(comparison.after)}</strong><span>with active effects</span></div></div>
       <p>Active: ${comparison.effects.map(escapeHtml).join(' · ')}.</p>`
    : comparison.mode === 'preview'
      ? `<div class="shoot-advisory__grid"><div><strong>${damage(comparison.before)}</strong><span>current estimate</span></div><div><strong>${damage(comparison.after)}</strong><span>if In Auramite Clad is used</span></div></div>
         <p>Preview only. The stratagem has not been recorded and no CP has been spent.</p>`
      : `<div class="shoot-advisory__grid"><div><strong>${damage(comparison.after)}</strong><span>estimated damage</span></div><div><strong>${currentChance}%</strong><span>chance of any damage</span></div></div>`;

  return `<div class="shoot-advisory incoming-damage-forecast" data-incoming-damage-forecast>
    <div class="shoot-advisory__heading"><h3>Incoming damage estimate</h3><span>optional reference</span></div>
    ${result}
    <small>Uses saved profiles and current recorded defenses. Tabletop rolls determine the result; record actual damage once after resolving the attack.</small>
  </div>`;
}
