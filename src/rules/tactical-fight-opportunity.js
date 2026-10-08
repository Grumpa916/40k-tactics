function nonNegative(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Evaluate the tradeoff of a Fight activation.
 *
 * Expected retaliation is an input because the rules layer cannot safely infer
 * future enemy choices, hidden abilities, CP, or exact tabletop geometry.
 * The result is advisory and does not determine Fight legality.
 */
export function evaluateFightOpportunity({
  expectedDamage = 0,
  retaliationExpectedDamage = 0,
  remainingWounds = 0,
  maxWounds = null,
  targetWounds = null
} = {}) {
  const offense = nonNegative(expectedDamage);
  const retaliation = nonNegative(retaliationExpectedDamage);
  const wounds = nonNegative(remainingWounds);
  const maximum = Number.isFinite(maxWounds) && maxWounds > 0 ? maxWounds : null;
  const target = nonNegative(targetWounds);

  const targetImpact = target > 0 ? Math.min(1, offense / target) : 0;
  const retaliationRisk = wounds > 0 ? Math.min(1, retaliation / wounds) : 0;
  const preservationRisk = maximum
    ? Math.min(1, retaliation / maximum)
    : retaliationRisk;

  const netCombatValue = offense - retaliation;

  const risk =
    retaliationRisk >= 0.75 ? "high" :
    retaliationRisk >= 0.4 ? "moderate" :
    "low";

  const confidence =
    Number.isFinite(retaliationExpectedDamage) && retaliationExpectedDamage > 0
      ? "moderate"
      : "low";

  return Object.freeze({
    expectedDamage: offense,
    retaliationExpectedDamage: retaliation,
    targetImpact,
    retaliationRisk,
    preservationRisk,
    netCombatValue,
    risk,
    confidence
  });
}
