import { getExpectedDamage } from "./expected-damage.js";
import { getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { evaluateFightOpportunity } from "./tactical-fight-opportunity.js";
import { getBestFightRetaliation } from "./tactical-fight-retaliation.js";
import { getProbabilisticFightRetaliation } from "./probabilistic-fight-retaliation.js";
import { getTargetStrategicContext } from "./tactical-target-context.js";
import { getCustodesFightAdvisorContext } from "./custodes-tactical-advisor.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : [])
    .find((unit) => unit?.id === unitId) ?? null;
}

function expectedDamageForOption(attacker, target, weapon) {
  if (!attacker || !target || !weapon) return null;
  try {
    return getExpectedDamage({ attacker, target, weapon });
  } catch {
    return null;
  }
}

function strategicFightRecommendation(evaluation, strategicContext, retaliationEstimateAvailable) {
  const objectiveSwing = strategicContext?.objectiveSwing;
  const secondary = strategicContext?.secondary;
  const role = strategicContext?.scoringRole;
  const battleShock = strategicContext?.battleShock;

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

function getKaptarisRetaliation(state, { playerId, attacker, sourceAttacker, target, weapon, retaliationOptions, enabled }) {
  if (!enabled) return null;
  try {
    if (weapon) {
      const probabilistic = getProbabilisticFightRetaliation(state, {
        playerId,
        attackerId: attacker.id,
        sourceAttackerId: sourceAttacker.id,
        targetId: target.id,
        weapon,
        targetHitModifier: 1
      });
      if (probabilistic?.confidence === "moderate") {
        return Object.freeze({
          expectedDamage: probabilistic.expectedRetaliationDamage,
          source: "probabilistic",
          confidence: probabilistic.confidence,
          details: probabilistic
        });
      }
    }
    const best = getBestFightRetaliation(state, {
      playerId,
      attackerId: attacker.id,
      retaliationOptions,
      targetHitModifier: 1
    });
    return best ? Object.freeze({
      expectedDamage: best.expectedDamage,
      source: best.source,
      confidence: best.confidence,
      details: best
    }) : null;
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
      const calculation = expectedDamageForOption(sourceProfile, targetProfile, option?.weapon);
      const baselineExpectedDamage =
        Number.isFinite(option?.expectedDamage)
          ? option.expectedDamage
          : calculation?.expectedDamage ?? null;

      let custodesFight = null;
      if (option?.weapon) {
        try {
          custodesFight = getCustodesFightAdvisorContext(state, {
            playerId,
            unitId: attacker.id,
            sourceUnitId: sourceAttacker.id,
            targetUnitId: target.id,
            weapon: option.weapon
          });
        } catch {
          custodesFight = null;
        }
      }
      const automaticCustodesOption = custodesFight?.options
        ?.filter((item) => item?.requiresKatahUse !== true && item?.requiresTableConfirmation !== true)
        ?.sort((a, b) => b.expectedDamage - a.expectedDamage)?.[0] ?? null;
      const automaticBaseline = Number.isFinite(custodesFight?.baselineExpectedDamage)
        ? custodesFight.baselineExpectedDamage
        : baselineExpectedDamage;
      const expectedDamage = Number.isFinite(automaticCustodesOption?.expectedDamage)
        ? Math.max(automaticBaseline ?? 0, automaticCustodesOption.expectedDamage)
        : automaticBaseline;

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

      const kaptaris = getKaptarisRetaliation(state, {
        playerId,
        attacker,
        sourceAttacker,
        target,
        weapon: option?.weapon,
        retaliationOptions: option?.retaliationOptions,
        enabled: Boolean(custodesFight?.katah?.readied && state?.phase === "fight")
      });
      const kaptarisDamagePrevented = kaptaris && Number.isFinite(retaliationExpectedDamage)
        ? Math.max(0, retaliationExpectedDamage - kaptaris.expectedDamage)
        : 0;

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
        strategicContext = getTargetStrategicContext(state, {
          playerId,
          attackerId: sourceAttacker.id,
          targetUnitId: target.id
        });
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
      const katahPotentialBonus = custodesFight?.bestOption?.requiresKatahUse && custodesFight.expectedDamageGain > 0
        ? Math.min(0.6, custodesFight.expectedDamageGain / Math.max(1, targetProfile?.wounds ?? 1))
        : 0;
      const kaptarisPotentialBonus = kaptarisDamagePrevented > 0
        ? Math.min(0.5, kaptarisDamagePrevented / Math.max(1, attacker.maxWounds ?? attacker.wounds ?? 1))
        : 0;
      const combatScore = evaluation.targetImpact * 3 - evaluation.preservationRisk * 2;
      const strategicPoints = strategicScore * 3 + objectiveSwingBonus + verifiedVpBonus - battleShockPenalty + katahPotentialBonus + kaptarisPotentialBonus;
      const decisionScore = combatScore + strategicPoints;
      const baseRecommendation = strategicContext
        ? strategicFightRecommendation(evaluation, strategicContext, retaliationEstimateAvailable)
        : evaluation.risk === "high"
          ? "Strong offensive opportunity, but expected retaliation creates significant preservation risk."
          : evaluation.retaliationExpectedDamage > 0
            ? "Fight opportunity has measurable retaliation risk."
            : retaliationEstimateAvailable
              ? "No expected damage from the modeled response; tabletop rules and unmodeled effects still apply."
              : "Fight opportunity can be evaluated offensively; retaliation data is not available.";
      const offensiveRecommendation = custodesFight?.recommendation
        ? `${baseRecommendation} ${custodesFight.recommendation}`
        : baseRecommendation;
      const recommendation = kaptarisDamagePrevented > 0.01
        ? `${offensiveRecommendation} Kaptaris would reduce modeled return damage from ${retaliationExpectedDamage.toFixed(2)} to ${kaptaris.expectedDamage.toFixed(2)} (about ${kaptarisDamagePrevented.toFixed(2)} prevented); confirm Kaptaris only if you choose to spend this unit's readiness.`
        : offensiveRecommendation;

      return {
        type: "fight-opportunity",
        unitId: attacker.id,
        sourceUnitId: sourceAttacker.id,
        targetUnitId: target.id,
        weaponId: option?.weapon?.id ?? option?.weaponId ?? null,
        appliedRules: calculation?.contextualAbilities?.appliedRules ?? [],
        baselineExpectedDamage,
        expectedDamage: evaluation.expectedDamage,
        custodesFight,
        custodesDefence: Object.freeze({
          kaptarisAvailable: Boolean(custodesFight?.katah?.readied && state?.phase === "fight"),
          baselineRetaliationExpectedDamage: retaliationExpectedDamage,
          kaptarisExpectedDamage: kaptaris?.expectedDamage ?? null,
          damagePrevented: kaptarisDamagePrevented,
          confidence: kaptaris?.confidence ?? "low"
        }),
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
          battleShockPenalty,
          katahPotentialBonus,
          kaptarisPotentialBonus
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
