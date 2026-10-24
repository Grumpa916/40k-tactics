import { getShootingCandidates } from "./shooting-candidates.js";
import { getCombatFormationWeaponOptions, getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { getDamageOutcomeDistribution } from "./damage-outcome-distribution.js";
import { getPostFightTargetStates } from "./post-fight-target-states.js";
import { getSpatialContext } from "./spatial-context.js";
import { clamp01, unitById } from "./tactical-context-utils.js";

const RANGE_MARGIN = 3;

function weaponRange(weapon) {
  const value = weapon?.characteristics?.range ?? weapon?.range;
  return Number.isFinite(value) ? Number(value) : null;
}

function distanceFor(spatial, attackerId, targetId) {
  return (spatial?.unitProximity ?? []).find((entry) =>
    entry.unitId === attackerId && entry.otherUnitId === targetId
  )?.distance ?? null;
}

function evaluateWeapon(state, attacker, target, weapon, distance = null) {
  if (!attacker || !target || !weapon?.characteristics || weapon.quantityUncertain) return null;
  const range = weaponRange(weapon);
  if (range != null && distance != null && distance > range + RANGE_MARGIN) return null;
  const source = weapon.sourceUnitId ? unitById(state, weapon.sourceUnitId) ?? attacker : attacker;
  try {
    const attackerProfile = getProbabilisticUnitProfile(state, source);
    const targetProfile = getProbabilisticUnitProfile(state, target);
    const distribution = getDamageOutcomeDistribution({ attacker: attackerProfile, target: targetProfile, weapon });
    const post = getPostFightTargetStates({ target: targetProfile, attacker: attackerProfile, weapon, distribution });
    return Object.freeze({
      unitId: attacker.id,
      unitName: attacker.name ?? attacker.id,
      sourceUnitId: source.id,
      sourceUnitName: source.name ?? source.id,
      weaponId: weapon.id,
      weaponName: weapon.displayName ?? weapon.name ?? weapon.id,
      expectedDamage: distribution.expectedDamage,
      destructionProbability: post.destructionProbability,
      distance,
      range
    });
  } catch {
    return null;
  }
}

function bestOptionForUnit(state, unit, target, spatial) {
  const distance = distanceFor(spatial, unit.id, target.id);
  const options = getCombatFormationWeaponOptions(state, unit, { type: "ranged" })
    .map((weapon) => evaluateWeapon(state, unit, target, weapon, distance))
    .filter(Boolean)
    .sort((a, b) =>
      b.destructionProbability - a.destructionProbability ||
      b.expectedDamage - a.expectedDamage ||
      a.weaponName.localeCompare(b.weaponName)
    );
  return options[0] ?? null;
}

/**
 * Compare the selected weapon with unresolved friendly shooting activations.
 * The combined-fire estimate adds expected damage; it does not pretend separate
 * attacks are one exact probability distribution. This is an allocation aid.
 */
export function getFireCoordinationContext(state, {
  playerId,
  attackerId,
  targetUnitId,
  currentWeapon = null,
  currentExpectedDamage = null,
  currentDestructionProbability = null
} = {}) {
  if (!playerId || !attackerId || !targetUnitId) {
    return Object.freeze({ score: 0, alternatives: Object.freeze([]), reason: "Fire-coordination context is incomplete." });
  }
  const target = unitById(state, targetUnitId);
  if (!target || target.status === "destroyed") {
    return Object.freeze({ score: 0, alternatives: Object.freeze([]), reason: "Target is not available for fire coordination." });
  }

  let candidates;
  let spatial;
  try {
    candidates = getShootingCandidates(state).available.filter((id) => id !== attackerId);
    spatial = getSpatialContext(state, { playerId });
  } catch {
    candidates = [];
    spatial = null;
  }

  const alternatives = candidates
    .map((id) => unitById(state, id))
    .filter(Boolean)
    .map((unit) => bestOptionForUnit(state, unit, target, spatial))
    .filter(Boolean)
    .sort((a, b) =>
      b.destructionProbability - a.destructionProbability ||
      b.expectedDamage - a.expectedDamage ||
      a.unitName.localeCompare(b.unitName)
    );

  const currentExpected = Number.isFinite(currentExpectedDamage) ? Math.max(0, currentExpectedDamage) : 0;
  const currentKill = Number.isFinite(currentDestructionProbability) ? clamp01(currentDestructionProbability) : 0;
  const best = alternatives[0] ?? null;
  const targetProfile = getProbabilisticUnitProfile(state, target);
  const targetWounds = Number(targetProfile?.wounds);
  const betterMatch = Boolean(best && (
    (best.expectedDamage >= currentExpected + 1.5 && best.expectedDamage >= currentExpected * 1.35) ||
    best.destructionProbability >= currentKill + 0.25
  ));
  const topContributors = alternatives.slice(0, 2);
  const combinedExpectedDamage = currentExpected + topContributors.reduce((sum, item) => sum + item.expectedDamage, 0);
  const coverage = Number.isFinite(targetWounds) && targetWounds > 0
    ? combinedExpectedDamage / targetWounds
    : null;
  const concentratedFireViable = topContributors.length > 0 && currentKill < 0.8 &&
    Number.isFinite(coverage) && coverage >= 0.8;
  const likelyOverkill = Number.isFinite(targetWounds) && targetWounds > 0 && currentExpected >= targetWounds * 1.35 &&
    Boolean(best && best.destructionProbability >= 0.7);

  let reason = "No substantially better unresolved friendly shooting match is established.";
  if (betterMatch) {
    reason = `${best.unitName} with ${best.weaponName} is a stronger saved-profile match for this target (${best.expectedDamage.toFixed(1)} expected damage, ${Math.round(best.destructionProbability * 100)}% destruction).`;
  }
  if (concentratedFireViable) {
    const names = topContributors.map((item) => item.unitName).join(" + ");
    reason += ` Concentrating this activation with ${names} reaches about ${combinedExpectedDamage.toFixed(1)} combined expected damage; resolve each attack separately at the table.`;
  }
  if (likelyOverkill) {
    reason += " This weapon may be more destructive than needed while another available activation has a strong kill profile; consider preserving the stronger weapon for a harder target.";
  }

  const score = clamp01(
    (betterMatch ? 0.55 : 0) +
    (concentratedFireViable ? 0.35 : 0) +
    (likelyOverkill ? 0.3 : 0)
  );

  return Object.freeze({
    score,
    betterMatch,
    likelyOverkill,
    concentratedFireViable,
    currentExpectedDamage: currentExpected,
    currentDestructionProbability: currentKill,
    targetWounds: Number.isFinite(targetWounds) ? targetWounds : null,
    combinedExpectedDamage,
    expectedCoverage: coverage,
    bestAlternative: best,
    contributors: Object.freeze(topContributors),
    alternatives: Object.freeze(alternatives),
    reason,
    assumption: "Combined-fire planning sums expected damage from separate unresolved activations; it is not an exact combined destruction probability."
  });
}
