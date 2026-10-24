import { getFightOpportunityRecommendations } from "../rules/tactical-fight-opportunities.js";
import { escapeHtml } from "./combat-workspace.js";

export function fightAdvisory(attackerId, weaponId, targetId, state, weapons, perspectivePlayerId) {
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
      <p>${escapeHtml(recommendation.reason)}</p>
    </aside>
  `;
}

