import { getShootingTargetComparison } from '../rules/tactical-shooting-comparison.js';
import { getAttackDamageForecast } from '../rules/attack-damage-forecast.js';
import { escapeHtml } from './combat-workspace.js';
import { renderAdvisorDecisionSummary } from './advisor-decision-summary.js';

export function shootingTargetComparisonCards(attackerId, weaponId, selectedTargetId, state, weapons, perspectivePlayerId, comparison = null) {
  if (!attackerId || !weaponId || !perspectivePlayerId) return '<p class="shoot-tabletop__empty-advice">Choose a shooter and weapon to compare targets.</p>';
  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return '<p class="shoot-tabletop__empty-advice">Choose a valid ranged weapon to compare targets.</p>';
  const result = comparison ?? getShootingTargetComparison(state, { playerId: state.units.find(unit => unit.id === attackerId)?.ownerId ?? perspectivePlayerId, attackerId, weapon });
  if (!result.comparisons.length) return '<p class="shoot-tabletop__empty-advice">No eligible targets are available for comparison.</p>';
  const cards = result.comparisons.map((item) => {
    const destroy = Number.isFinite(item.destructionProbability) ? Math.round(item.destructionProbability * 100) + '%' : '—';
    const expected = Number.isFinite(item.expectedDamage) ? item.expectedDamage.toFixed(1) : '—';
    const mission = item.secondaryMissionImpact?.score >= item.primaryMissionImpact?.score
      ? item.secondaryMissionImpact?.label ?? 'none'
      : item.primaryMissionImpact?.label ?? 'none';
    return `<button type="button" class="shoot-tabletop__comparison${item.targetUnitId === selectedTargetId ? ' is-selected' : ''}" data-advisor-target="${escapeHtml(item.targetUnitId)}">
      <span><strong>#${item.rank} ${escapeHtml(item.targetName)}</strong><small>${escapeHtml(item.recommendation)}</small></span>
      <span class="shoot-tabletop__comparison-stats"><b>${expected}</b><small>mean</small><b>${destroy}</b><small>destroy</small><b>${escapeHtml(mission)}</b><small>mission</small></span>
    </button>`;
  });
  return '<div class="shoot-tabletop__comparison-list">' + cards.slice(0,3).join('') +
    (cards.length > 3 ? '<details data-comparison-more><summary>More targets (' + (cards.length-3) + ')</summary>' + cards.slice(3).join('') + '</details>' : '') + '</div>';
}

export function shootingAdvisory(attackerId, weaponId, targetId, state, weapons, perspectivePlayerId, { openDetails = false, comparison = null } = {}) {
  if (!attackerId || !weaponId || !targetId || !perspectivePlayerId) return "";
  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return "";
  const result = comparison ?? getShootingTargetComparison(state, { playerId: state.units.find(unit => unit.id === attackerId)?.ownerId ?? perspectivePlayerId, attackerId, weapon });
  const recommendation = result.comparisons.find((item) => item.targetUnitId === targetId);
  if (!recommendation) return "";
  const expected = Number.isFinite(recommendation.expectedDamage) ? recommendation.expectedDamage.toFixed(1) : "—";
  const expectedOrMore = Number.isFinite(recommendation.probabilityAtLeastExpectedDamage)
    ? Math.round(recommendation.probabilityAtLeastExpectedDamage * 100) + "%"
    : "—";
  const destruction = Number.isFinite(recommendation.destructionProbability)
    ? Math.round(recommendation.destructionProbability * 100) + "%"
    : "—";
  const primaryImpact = recommendation.primaryMissionImpact?.label ?? "none";
  const secondaryImpact = recommendation.secondaryMissionImpact?.label ?? "none";
  const threat = recommendation.recentThreat?.label ?? "none";
  const impact = recommendation.impactClassification === "unknown"
    ? "Unknown"
    : recommendation.impactClassification.replaceAll("-", " ");
  const confidence = recommendation.confidence ? recommendation.confidence : "low";
  const rangeConfidence = recommendation.rangeConfidence ? recommendation.rangeConfidence : "low";
  const unresolved = recommendation.secondaryMissionImpact?.unresolvedMissions ?? [];
  return `
    <aside class="shoot-advisory" data-shoot-advisory>
      <div class="shoot-advisory__heading"><h3>Shooting Advisor</h3><span>${escapeHtml(recommendation.rangeStatus)} range</span></div>
      <div class="shoot-advisory__grid">
        <div><strong>${expected}</strong><span>expected damage</span></div>
        <div><strong>${expectedOrMore}</strong><span>chance of ${escapeHtml(recommendation.expectedDamageThreshold ?? "expected")}+ damage</span></div>
        <div><strong>${destruction}</strong><span>destruction chance</span></div>
      </div>
      ${renderAdvisorDecisionSummary(recommendation)}
      <details class="shoot-advisory__details" data-view-key="shoot-assumptions" ${openDetails ? "open" : ""}><summary>Advisor assumptions &amp; detail</summary>
      <div class="shoot-advisory__grid">        <div><strong>${escapeHtml(primaryImpact)}</strong><span>Primary impact</span></div>
        <div><strong>${escapeHtml(secondaryImpact)}</strong><span>Secondary impact</span></div>
        <div><strong>${escapeHtml(threat)}</strong><span>recent threat</span></div>
        <div><strong>${escapeHtml(impact)}</strong><span>outcome profile</span></div>
      </div>
        ${recommendation.gameStrategy?.reason ? `<p>${escapeHtml(recommendation.gameStrategy.reason)}</p>` : ''}
        <p>${escapeHtml(recommendation.primaryMissionImpact?.reason ?? "")}</p>
        <p>${escapeHtml(recommendation.secondaryMissionImpact?.reason ?? "")}</p>
        <p>${escapeHtml(recommendation.recentThreat?.reason ?? "")}</p>
        ${unresolved.length ? `<p>Not used for ranking until verified: ${escapeHtml(unresolved.join(", "))}.</p>` : ""}
        <small>${(recommendation.assumptions ?? []).map(escapeHtml).join(" · ")}</small>
      </details>
      <small>Advisor confidence: ${escapeHtml(confidence)} · Range confidence: ${escapeHtml(rangeConfidence)}</small>
    </aside>
  `;
}

export function shootingDamageForecast(attackerId, weaponId, targetId, state, weapons) {
  if (!attackerId || !weaponId || !targetId) return "";
  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return "";
  const forecast = getAttackDamageForecast(state, { attackerId, targetId, weapon });
  if (!forecast) {
    return `
      <aside class="shoot-advisory" data-shoot-damage-forecast>
        <div class="shoot-advisory__heading"><h3>Damage outlook</h3><span>table result remains authoritative</span></div>
        <p>Expected damage is unavailable because one or more saved combat characteristics are incomplete.</p>
      </aside>
    `;
  }
  const expected = forecast.expectedDamage.toFixed(1);
  const thresholdChance = Math.round(forecast.probabilityAtLeastThreshold * 100) + "%";
  const anyDamageChance = Math.round(forecast.probabilityAnyDamage * 100) + "%";
  return `
    <aside class="shoot-advisory" data-shoot-damage-forecast>
      <div class="shoot-advisory__heading"><h3>Damage outlook</h3><span>baseline probability</span></div>
      <div class="shoot-advisory__grid">
        <div><strong>${escapeHtml(expected)}</strong><span>expected damage</span></div>
        <div><strong>${escapeHtml(thresholdChance)}</strong><span>chance of ${escapeHtml(forecast.thresholdDamage)}+ damage</span></div>
        <div><strong>${escapeHtml(anyDamageChance)}</strong><span>chance to cause any damage</span></div>
      </div>
      <small>Uses saved profiles and known weapon characteristics. Exact tabletop modifiers and dice remain authoritative.</small>
    </aside>
  `;
}
