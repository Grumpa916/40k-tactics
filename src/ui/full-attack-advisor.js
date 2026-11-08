import { getFullAttackAdvice } from '../rules/full-attack-advisor.js';
import { escapeHtml as esc } from './combat-workspace.js';
let previousState, cache = new Map();
const percent = value => `${Math.round(value * 100)}%`;
export function renderFullAttackAdvisor(state, options) {
  if (previousState !== state) { previousState = state; cache = new Map(); }
  const key = JSON.stringify([options.attackerId, options.targetId, options.weapon, options.mapDistance, options.measuredDistance]);
  if (!cache.has(key)) cache.set(key, getFullAttackAdvice(state, options));
  const advice = cache.get(key);
  if (!advice.available) return `<details data-view-key="full-attack"><summary>Full Attack · unavailable</summary><p>${esc(advice.reason)}</p></details>`;
  const mission = advice.mission;
  return `<details data-view-key="full-attack" class="shoot-advisory__details" data-full-attack>
    <summary>Full Attack · shot → charge → fight</summary>
    <p><strong>${esc(advice.weaponName)}</strong> followed by ${advice.meleeWeapons.map(esc).join(', ')}.</p>
    <p>${advice.exact ? 'Measured charge roll' : 'Approximate map charge scenarios (±3″); casualty removal can change the distance.'}</p>
    ${advice.scenarios.map(item => `<div class="shoot-advisory__grid">
      <div><strong>${esc(Math.ceil(item.requiredRoll))}+</strong><span>charge roll · ${percent(item.chargeProbability)}</span></div>
      <div><strong>${item.expectedDamage.toFixed(1)}</strong><span>combined baseline damage</span></div>
      <div><strong>${percent(item.destructionProbability)}</strong><span>baseline destruction chance</span></div>
      <div><strong>${percent(item.meleeKillProbability)}</strong><span>additional kill chance from melee</span></div>
      <div><strong>${percent(item.exposureProbability)}</strong><span>charge succeeds and target survives</span></div>
      <div><strong>${item.retaliationExpectedDamage == null ? 'Unknown' : item.retaliationExpectedDamage.toFixed(1)}</strong><span>weighted target fight-back damage</span></div>
    </div>`).join('')}
    <p>Unknown fight-back means casualty allocation or weapon data cannot support an estimate; it does not mean safe.</p>
    ${mission.killVp > 0 ? `<p>A successful kill may unlock ${esc(mission.killVp)} Primary VP if the mission conditions are met.</p>` : ''}
    ${[mission.primary, mission.secondary, mission.objective].filter(Boolean).map(text => `<p>${esc(text)}</p>`).join('')}
    <p>${esc(advice.chargeRule)}</p><small>${esc(advice.assumptions)}</small>
  </details>`;
}
