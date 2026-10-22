import { getDamageOutcomeDistribution } from "./damage-outcome-distribution.js";
import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { getPostFightTargetStates } from "./post-fight-target-states.js";
import { getBestFightRetaliation } from "./tactical-fight-retaliation.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : [])
    .find((unit) => unit?.id === unitId) ?? null;
}

/**
 * Evaluate retaliation across the possible post-Fight states of the selected
 * enemy target. Expected damage is never treated as a guaranteed result.
 */
export function getProbabilisticFightRetaliation(
  state,
  { playerId, attackerId, sourceAttackerId = null, targetId, weapon, distribution = null } = {}
) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!attackerId || !targetId) throw new TypeError("attackerId and targetId are required.");

  const attacker = unitById(state, attackerId);
  const sourceAttacker = sourceAttackerId ? unitById(state, sourceAttackerId) : attacker;
  const target = unitById(state, targetId);
  if (!attacker || attacker.ownerId !== playerId) return null;
  if (!sourceAttacker || sourceAttacker.ownerId !== playerId) return null;
  if (!target || target.ownerId === playerId) return null;
  if (!weapon) throw new TypeError("A Fight weapon is required.");

  const sourceProfile = getProbabilisticUnitProfile(state, sourceAttacker);
  const targetProfile = getProbabilisticUnitProfile(state, target);
  const resolvedDistribution = distribution ?? getDamageOutcomeDistribution({
    attacker: sourceProfile,
    target: targetProfile,
    weapon,
    attackerRemainingWounds: sourceProfile?.wounds
  });

  const postAttack = getPostFightTargetStates({
    target: targetProfile,
    attacker: sourceProfile,
    weapon,
    distribution: resolvedDistribution
  });

  const outcomes = postAttack.states.map((postState) => {
    if (postState.destroyed) {
      return Object.freeze({
        ...postState,
        retaliationExpectedDamage: 0,
        retaliation: null
      });
    }

    const retaliation = getBestFightRetaliation(state, {
      playerId,
      attackerId,
      remainingWoundsByUnit: {
        [target.id]: postState.remainingWounds
      }
    });

    return Object.freeze({
      ...postState,
      retaliationExpectedDamage: retaliation?.expectedDamage ?? 0,
      retaliation
    });
  });

  const expectedRetaliationDamage = outcomes.reduce(
    (sum, outcome) => sum + outcome.probability * outcome.retaliationExpectedDamage,
    0
  );

  return Object.freeze({
    outcomes: Object.freeze(outcomes),
    expectedRetaliationDamage,
    survivalProbability: postAttack.survivalProbability,
    destructionProbability: postAttack.destructionProbability,
    confidence: outcomes.some((outcome) => outcome.retaliation !== null) ? "moderate" : "low"
  });
}
