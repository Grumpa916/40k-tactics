function clampProbability(value) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null;
}

/**
 * Convert an existing probabilistic Shooting result into decision-oriented
 * advisory context. This layer derives normalized impact and confidence from
 * already-computed values; it does not introduce a hidden tactical score.
 */
export function evaluateShootingOpportunity({
  expectedDamage = null,
  destructionProbability = null,
  survivalProbability = null,
  targetWounds = null,
  impactClassification = "unknown",
  rangeStatus = "unknown"
} = {}) {
  const damage = Number.isFinite(expectedDamage) && expectedDamage > 0
    ? expectedDamage
    : 0;
  const wounds = Number.isFinite(targetWounds) && targetWounds > 0
    ? targetWounds
    : null;
  const targetImpact = wounds ? Math.min(1, damage / wounds) : 0;
  const destruction = clampProbability(destructionProbability);
  const survival = clampProbability(survivalProbability);

  const rangeConfidence =
    rangeStatus === "within" ? "moderate" :
    rangeStatus === "borderline" ? "low" :
    "low";

  const confidence =
    rangeStatus === "borderline" ? "low" :
    destruction !== null && survival !== null ? "moderate" :
    "low";

  const recommendationReason =
    impactClassification === "likely-destruction"
      ? "High-confidence offensive opportunity with a strong chance to destroy the target."
      : impactClassification === "possible-destruction"
        ? "Potential destruction opportunity; destruction is plausible but not the baseline expectation."
        : impactClassification === "likely-severe-degradation"
          ? "Strong degradation opportunity; expected damage is at least half the target's remaining wounds."
          : impactClassification === "limited-impact"
            ? "Limited baseline impact; consider whether this target is worth committing the shooting activation to."
            : "Insufficient probabilistic data for a stronger Shooting recommendation.";

  return Object.freeze({
    expectedDamage: damage,
    destructionProbability: destruction,
    survivalProbability: survival,
    targetImpact,
    normalizedImpact: targetImpact,
    impactClassification,
    rangeStatus,
    rangeConfidence,
    confidence,
    recommendationReason
  });
}
