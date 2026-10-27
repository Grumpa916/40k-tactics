import { getDamageOutcomeDistribution } from "./damage-outcome-distribution.js";
import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";

export function getAttackDamageForecast(state, { attackerId, targetId, weapon } = {}) {
  if (!attackerId || !targetId || !weapon) return null;
  const attacker = state?.units?.find((unit) => unit?.id === attackerId);
  const sourceAttacker = weapon?.sourceUnitId
    ? state?.units?.find((unit) => unit?.id === weapon.sourceUnitId)
    : attacker;
  const target = state?.units?.find((unit) => unit?.id === targetId);
  if (!attacker || !sourceAttacker || !target) return null;

  try {
    const distribution = getDamageOutcomeDistribution({
      attacker: getProbabilisticUnitProfile(state, sourceAttacker),
      target: getProbabilisticUnitProfile(state, target),
      weapon
    });
    const expectedDamage = distribution.expectedDamage;
    const thresholdDamage = Math.max(1, Math.round(expectedDamage));
    const probabilityAtLeastThreshold = distribution.outcomes.reduce(
      (sum, outcome) => sum + (outcome.damage >= thresholdDamage ? outcome.probability : 0),
      0
    );
    const probabilityAnyDamage = distribution.outcomes.reduce(
      (sum, outcome) => sum + (outcome.damage > 0 ? outcome.probability : 0),
      0
    );

    return Object.freeze({
      appliedRules: distribution.contextualAbilities?.appliedRules ?? [],
      expectedDamage,
      thresholdDamage,
      probabilityAtLeastThreshold,
      probabilityAnyDamage,
      outcomes: distribution.outcomes
    });
  } catch {
    return null;
  }
}
