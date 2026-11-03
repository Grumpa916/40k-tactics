import { renderAdvisorAppliedRules } from './advisor-applied-rules.js';
import { getFightOpportunityRecommendations } from "../rules/tactical-fight-opportunities.js";
import { escapeHtml } from "./combat-workspace.js";

export function fightAdvisory(attackerId, weaponId, targetId, state, weapons, perspectivePlayerId, { compact = false } = {}) {
  if (!attackerId || !weaponId || !targetId) return "";

  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return "";

  const recommendations = getFightOpportunityRecommendations(state, {
    playerId: state.units.find(unit => unit.id === attackerId)?.ownerId ?? perspectivePlayerId,
    options: [{
      unitId: attackerId,
      targetUnitId: targetId,
      weapon
    }]
  });
  const recommendation = recommendations[0];
  if (!recommendation) return "";

  const expectedDamage = Number.isFinite(recommendation.expectedDamage)
    ? recommendation.expectedDamage.toFixed(1)
    : "—";
  const retaliation = recommendation.retaliationEstimateAvailable && Number.isFinite(recommendation.retaliationExpectedDamage)
    ? recommendation.retaliationExpectedDamage.toFixed(1)
    : "—";
  const survival = Number.isFinite(recommendation.targetSurvivalProbability)
    ? Math.round(recommendation.targetSurvivalProbability * 100) + "%"
    : "—";
  const destruction = Number.isFinite(recommendation.targetDestructionProbability)
    ? Math.round(recommendation.targetDestructionProbability * 100) + "%"
    : "—";
  const strategicLabel = recommendation.strategicContext?.label ?? "unknown";
  const scoringRole = recommendation.strategicContext?.scoringRole?.role ?? null;
  const objectiveSwing = recommendation.strategicContext?.objectiveSwing?.potentialFlip
    ? " · objective swing possible"
    : "";

  if (compact) return `
    <aside class="fight-advisory fight-advisory--compact" data-fight-advisory>
      <small class="fight-advisory__confidence">${escapeHtml(recommendation.confidence)} confidence</small>
      <p class="fight-advisory__recommendation"><strong>${escapeHtml(recommendation.recommendation ?? recommendation.reason)}</strong></p>
      <div class="fight-advisory__grid">
        <div><strong>${expectedDamage}</strong><span>expected damage</span></div>
        <div><strong>${retaliation}</strong><span>expected retaliation</span></div>
      </div>
      <details class="fight-advisory__more" data-view-key="fight-advisor-details">
        <summary>More analysis · survival, destruction &amp; rules</summary>
        <div class="fight-advisory__grid">
          <div><strong>${survival}</strong><span>target survival</span></div>
          <div><strong>${destruction}</strong><span>target destruction</span></div>
        </div>
        <p><strong>Strategic value: ${escapeHtml(strategicLabel)}</strong>${scoringRole ? ` · ${escapeHtml(scoringRole.replaceAll("-", " "))}` : ""}${escapeHtml(objectiveSwing)}</p>
        ${renderAdvisorAppliedRules(recommendation.appliedRules)}
        <p>Estimates are advisory; confirm eligibility and rules on the tabletop.</p>
      </details>
    </aside>
  `;
  return `
    <aside class="fight-advisory" data-fight-advisory>
      <div class="fight-section__heading">
        <h2>Fight Advisor</h2>
        <span class="fight-section__hint">${escapeHtml(recommendation.confidence)} confidence</span>
      </div>
      <div class="fight-advisory__grid">
        <div><strong>${expectedDamage}</strong><span>expected damage</span></div>
        <div><strong>${retaliation}</strong><span>expected retaliation</span></div>
        <div><strong>${survival}</strong><span>target survival</span></div>
        <div><strong>${destruction}</strong><span>target destruction</span></div>
      </div>
      ${renderAdvisorAppliedRules(recommendation.appliedRules)}
      <p><strong>Strategic value: ${escapeHtml(strategicLabel)}</strong>${scoringRole ? ` · ${escapeHtml(scoringRole.replaceAll("-", " "))}` : ""}${escapeHtml(objectiveSwing)}</p>
      <p>${escapeHtml(recommendation.recommendation ?? recommendation.reason)}</p>
    </aside>
  `;
}

