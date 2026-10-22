import { getExpectedDamage } from "./expected-damage.js";
import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { evaluateFightOpportunity } from "./tactical-fight-opportunity.js";
import { getBestFightRetaliation } from "./tactical-fight-retaliation.js";
import { getProbabilisticFightRetaliation } from "./probabilistic-fight-retaliation.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : [])
    .find((unit) => unit?.id === unitId) ?? null;
}

function expectedDamageForOption(attacker, target, weapon) {
  if (!attacker || !target || !weapon) return null;
  try {
    return getExpectedDamage({ attacker, target, weapon }).expectedDamage;
  } catch {
    return null;
  }
}

/**
 * Evaluate Fight options supplied by authoritative Fight UI context.
 *
 * This adapter does not use map geometry. Enemy retaliation is derived from
 * authoritative Fight engagement history when known melee weapon profiles are
 * available; explicit retaliation estimates remain supported for richer UI context.
 */
export function getFightOpportunityRecommendations(
  state,
  { playerId, options = [] } = {}
) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!Array.isArray(options)) return [];

  return options
    .map((option) => {
      const attacker = unitById(state, option?.unitId);
      const target = unitById(state, option?.targetUnitId);
      const sourceAttacker = option?.weapon?.sourceUnitId
        ? unitById(state, option.weapon.sourceUnitId) ?? attacker
        : attacker;

      if (!attacker || !target || !sourceAttacker) return null;
      if (attacker.ownerId !== playerId || target.ownerId === playerId || sourceAttacker.ownerId !== playerId) return null;
      if (attacker.status === "destroyed" || target.status === "destroyed" || sourceAttacker.status === "destroyed") return null;

      const sourceProfile = getProbabilisticUnitProfile(state, sourceAttacker);
      const targetProfile = getProbabilisticUnitProfile(state, target);
      const expectedDamage =
        Number.isFinite(option?.expectedDamage)
          ? option.expectedDamage
          : expectedDamageForOption(sourceProfile, targetProfile, option?.weapon);

      // Expected damage is an average, not a guaranteed result. Do not
      // convert it into a deterministic kill. Retaliation therefore remains
      // available whenever the enemy is an authoritative engaged candidate.
      const probabilisticRetaliation =
        Number.isFinite(option?.retaliationExpectedDamage) || !option?.weapon
          ? null
          : (() => {
              try {
                return getProbabilisticFightRetaliation(state, {
                  playerId,
                  attackerId: attacker.id,
                  sourceAttackerId: sourceAttacker.id,
                  targetId: target.id,
                  weapon: option.weapon
                });
              } catch {
                return null;
              }
            })();

      const automaticRetaliation =
        Number.isFinite(option?.retaliationExpectedDamage)
          ? null
          : probabilisticRetaliation ?? getBestFightRetaliation(state, {
              playerId,
              attackerId: attacker.id,
              retaliationOptions: option?.retaliationOptions
            });

      const retaliationExpectedDamage =
        Number.isFinite(option?.retaliationExpectedDamage)
          ? option.retaliationExpectedDamage
          : probabilisticRetaliation?.expectedRetaliationDamage ?? automaticRetaliation?.expectedDamage ?? 0;

      const retaliationConfidence =
        option?.retaliationConfidence ??
        automaticRetaliation?.confidence ??
        "low";

      const evaluation = evaluateFightOpportunity({
        expectedDamage,
        retaliationExpectedDamage,
        remainingWounds: option?.remainingWounds ?? attacker.wounds ?? 0,
        maxWounds: option?.maxWounds ?? attacker.maxWounds ?? null,
        targetWounds: option?.targetWounds ?? targetProfile?.wounds ?? target.wounds ?? null,
        retaliationConfidence
      });

      return {
        type: "fight-opportunity",
        unitId: attacker.id,
        sourceUnitId: sourceAttacker.id,
        targetUnitId: target.id,
        weaponId: option?.weapon?.id ?? option?.weaponId ?? null,
        expectedDamage: evaluation.expectedDamage,
        retaliationExpectedDamage: evaluation.retaliationExpectedDamage,
        targetImpact: evaluation.targetImpact,
        retaliationRisk: evaluation.retaliationRisk,
        preservationRisk: evaluation.preservationRisk,
        netCombatValue: evaluation.netCombatValue,
        risk: evaluation.risk,
        confidence: evaluation.confidence,
        targetSurvivalProbability: probabilisticRetaliation?.survivalProbability ?? null,
        targetDestructionProbability: probabilisticRetaliation?.destructionProbability ?? null,
        reason: evaluation.risk === "high"
          ? "Strong offensive opportunity, but expected retaliation creates significant preservation risk."
          : evaluation.retaliationExpectedDamage > 0
            ? "Fight opportunity has measurable retaliation risk."
            : "Fight opportunity can be evaluated offensively; retaliation data is not available."
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      b.netCombatValue - a.netCombatValue ||
      b.targetImpact - a.targetImpact ||
      a.targetUnitId.localeCompare(b.targetUnitId)
    );
}
