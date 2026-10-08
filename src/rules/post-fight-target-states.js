import { getDamageOutcomeDistribution } from "./damage-outcome-distribution.js";

/**
 * Convert a damage distribution into possible post-Fight target states.
 *
 * Expected damage is deliberately not used as a deterministic state change.
 * Each outcome is clamped to the target's current wounds and retains its
 * probability, allowing later retaliation logic to weight survival and
 * degradation correctly.
 */
export function getPostFightTargetStates(
  { target, attacker, weapon } = {},
  { distribution = null } = {}
) {
  if (!target || !Number.isFinite(target.wounds) || target.wounds < 0) {
    throw new TypeError("A target with a non-negative wounds value is required.");
  }

  const resolvedDistribution = distribution ??
    getDamageOutcomeDistribution({ attacker, target, weapon });

  if (!Array.isArray(resolvedDistribution?.outcomes)) {
    throw new TypeError("A valid damage outcome distribution is required.");
  }

  const states = resolvedDistribution.outcomes.map(({ damage, probability }) => {
    const remainingWounds = Math.max(0, target.wounds - damage);

    return Object.freeze({
      damage,
      probability,
      remainingWounds,
      destroyed: remainingWounds === 0
    });
  });

  return Object.freeze({
    states: Object.freeze(states),
    survivalProbability: states
      .filter((state) => !state.destroyed)
      .reduce((sum, state) => sum + state.probability, 0),
    destructionProbability: states
      .filter((state) => state.destroyed)
      .reduce((sum, state) => sum + state.probability, 0)
  });
}
