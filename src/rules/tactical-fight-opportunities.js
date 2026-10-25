import { getExpectedDamage } from "./expected-damage.js";
import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { evaluateFightOpportunity } from "./tactical-fight-opportunity.js";
import { getBestFightRetaliation } from "./tactical-fight-retaliation.js";
import { getProbabilisticFightRetaliation } from "./probabilistic-fight-retaliation.js";
import { getTargetStrategicContext } from "./tactical-target-context.js";

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

function strategicFightRecommendation(evaluation, strategicContext, retaliationEstimateAvailable) {
  const objectiveSwing = strategicContext?.objectiveSwing;
  const secondary = strategicContext?.secondary;
  const role = strategicContext?.scoringRole;
  const battleShock = strategicContext?.battleShock;

  // Unknown return damage must stay visibly unknown. Strategic value can rank the
  // target, but it must never turn missing retaliation data into an "acceptable"
  // preservation-risk claim.
  if (!retaliationEstimateAvailable) {
    return "Fight opportunity can be evaluated offensively; retaliation data is not available. Mission value can still affect target priority, but confirm the enemy response at the table.";
  }
  if (battleShock?.active && battleShock.marginalKillPenalty >= 0.5 && evaluation.targetImpact < 0.5) {
    return "Lower marginal kill value: Battle-shock is already suppressing part of this target's scoring value. Prefer a more important combat unless this Fight protects your position.";
  }
  if (objectiveSwing?.potentialFlip && evaluation.targetImpact >= 0.25) {
    return "Priority Fight: damaging or removing this target can contribute to an objective-control swing as well as the combat result.";
  }
  if ((secondary?.potentialVp ?? 0) >= 3 || (secondary?.denialVp ?? 0) >= 3 || secondary?.score >= 0.7) {
    return "Priority Fight: this target has meaningful verified Secondary Mission leverage in addition to its melee value.";
  }
  if (role?.role === "key-scoring-unit" && evaluation.targetImpact >= 0.25) {
    return "Mission-relevant Fight: this target is a key scoring piece, so attacking it can be worthwhile even when another target offers slightly better raw damage.";
  }
  if (evaluation.risk === "high" && (strategicContext?.score ?? 0) < 0.55) {
    return "High preservation risk for limited strategic gain. Consider another eligible target or activation if the Fight order allows it.";
  }
  if (evaluation.targetImpact >= 0.5 && evaluation.risk !== "high") {
    return "Strong Fight opportunity: projected damage is significant and the modeled return-damage risk is acceptable relative to the target's value.";
  }
  if (evaluation.retaliationExpectedDamage > 0) {
    return "Fight opportunity has measurable retaliation risk; weigh that trade against the target's mission and threat value.";
  }
  return "Fight opportunity is primarily damage-driven; no stronger mission or retaliation signal is currently established.";
}

/**
 * Evaluate Fight options supplied by authoritative Fight UI context.
 *
 * This adapter does not use map geometry. Enemy retaliation is derived from
 * authoritative Fight engagement history when known melee weapon profiles are
 * available; explicit retaliation estimates remain supported for richer UI context.
 * Strategic target context uses the same mission/OC/threat layer as Shooting.
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

      const retaliationEstimateAvailable = Number.isFinite(option?.retaliationExpectedDamage) ||
        probabilisticRetaliation?.confidence === "moderate" || Number.isFinite(automaticRetaliation?.expectedDamage);

      const evaluation = evaluateFightOpportunity({
        expectedDamage,
        retaliationExpectedDamage,
        remainingWounds: option?.remainingWounds ?? attacker.wounds ?? 0,
        maxWounds: option?.maxWounds ?? attacker.maxWounds ?? null,
        targetWounds: option?.targetWounds ?? targetProfile?.wounds ?? target.wounds ?? null,
        retaliationConfidence
      });

      let strategicContext = null;
      try {
        strategicContext = getTargetStrategicContext(state, { playerId, targetUnitId: target.id });
      } catch {
        strategicContext = null;
      }
      const strategicScore = strategicContext?.score ?? 0;
      const objectiveSwingBonus = strategicContext?.objectiveSwing?.potentialFlip ? 0.75 : 0;
      const verifiedVp = Math.max(
        strategicContext?.secondary?.potentialVp ?? 0,
        strategicContext?.secondary?.denialVp ?? 0
      );
      const verifiedVpBonus = Math.min(1.5, verifiedVp * 0.25);
      const battleShockPenalty = (strategicContext?.battleShock?.marginalKillPenalty ?? 0) * 1.5;
      const combatScore = evaluation.targetImpact * 3 - evaluation.preservationRisk * 2;
      const strategicPoints = strategicScore * 3 + objectiveSwingBonus + verifiedVpBonus - battleShockPenalty;
      const decisionScore = combatScore + strategicPoints;
      const recommendation = strategicContext
        ? strategicFightRecommendation(evaluation, strategicContext, retaliationEstimateAvailable)
        : evaluation.risk === "high"
          ? "Strong offensive opportunity, but expected retaliation creates significant preservation risk."
          : evaluation.retaliationExpectedDamage > 0
            ? "Fight opportunity has measurable retaliation risk."
            : retaliationEstimateAvailable
              ? "No expected damage from the modeled response; tabletop rules and unmodeled effects still apply."
              : "Fight opportunity can be evaluated offensively; retaliation data is not available.";

      return {
        type: "fight-opportunity",
        unitId: attacker.id,
        sourceUnitId: sourceAttacker.id,
        targetUnitId: target.id,
        weaponId: option?.weapon?.id ?? option?.weaponId ?? null,
        expectedDamage: evaluation.expectedDamage,
        retaliationExpectedDamage: evaluation.retaliationExpectedDamage,
        retaliationEstimateAvailable,
        targetImpact: evaluation.targetImpact,
        retaliationRisk: evaluation.retaliationRisk,
        preservationRisk: evaluation.preservationRisk,
        netCombatValue: evaluation.netCombatValue,
        risk: evaluation.risk,
        confidence: evaluation.confidence,
        targetSurvivalProbability: probabilisticRetaliation?.survivalProbability ?? null,
        targetDestructionProbability: probabilisticRetaliation?.destructionProbability ?? null,
        strategicContext,
        strategicScore,
        verifiedVpLeverage: verifiedVp,
        decisionScore,
        decisionBreakdown: Object.freeze({
          combatScore,
          strategicPoints,
          objectiveSwingBonus,
          verifiedVpBonus,
          battleShockPenalty
        }),
        recommendation,
        reason: recommendation
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      b.decisionScore - a.decisionScore ||
      b.netCombatValue - a.netCombatValue ||
      b.targetImpact - a.targetImpact ||
      a.targetUnitId.localeCompare(b.targetUnitId)
    );
}
