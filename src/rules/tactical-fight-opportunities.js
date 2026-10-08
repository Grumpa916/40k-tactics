import { getExpectedDamage } from "./expected-damage.js";
import { evaluateFightOpportunity } from "./tactical-fight-opportunity.js";

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
 * This adapter deliberately does not discover targets from the map or infer
 * enemy retaliation. Each option must supply the selected attacker/target and
 * optionally the selected weapons plus an explicit retaliation estimate.
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

      if (!attacker || !target) return null;
      if (attacker.ownerId !== playerId || target.ownerId === playerId) return null;
      if (attacker.status === "destroyed" || target.status === "destroyed") return null;

      const expectedDamage =
        Number.isFinite(option?.expectedDamage)
          ? option.expectedDamage
          : expectedDamageForOption(attacker, target, option?.weapon);

      const evaluation = evaluateFightOpportunity({
        expectedDamage,
        retaliationExpectedDamage: option?.retaliationExpectedDamage ?? 0,
        remainingWounds: option?.remainingWounds ?? attacker.wounds ?? 0,
        maxWounds: option?.maxWounds ?? attacker.maxWounds ?? null,
        targetWounds: option?.targetWounds ?? target.wounds ?? null,
        retaliationConfidence: option?.retaliationConfidence ?? "low"
      });

      return {
        type: "fight-opportunity",
        unitId: attacker.id,
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
