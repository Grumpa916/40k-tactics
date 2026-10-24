import { getCombatFormationWeaponOptions, getProbabilisticUnitProfile } from "./saved-roster-combat-profile.js";
import { getDamageOutcomeDistribution } from "./damage-outcome-distribution.js";
import { getPostFightTargetStates } from "./post-fight-target-states.js";
import { getSpatialContext } from "./spatial-context.js";
import { getCombatFormationRoot } from "./battle-unit-reference.js";
import { clamp01, impactLabel, unitById } from "./tactical-context-utils.js";

const RANGE_MARGIN = 3;

function weaponRange(weapon) {
  const value = weapon?.characteristics?.range ?? weapon?.range;
  return Number.isFinite(value) ? Number(value) : null;
}

function evaluate(state, attacker, target, weapon, distance, { melee = false } = {}) {
  if (!weapon?.characteristics || weapon.quantityUncertain) return null;
  if (melee) {
    if (!Number.isFinite(distance) || distance > 6) return null;
  } else {
    const range = weaponRange(weapon);
    if (range != null && Number.isFinite(distance) && distance > range + RANGE_MARGIN) return null;
  }
  const source = weapon.sourceUnitId ? unitById(state, weapon.sourceUnitId) ?? attacker : attacker;
  try {
    const attackerProfile = getProbabilisticUnitProfile(state, source);
    const targetProfile = getProbabilisticUnitProfile(state, target);
    const distribution = getDamageOutcomeDistribution({ attacker: attackerProfile, target: targetProfile, weapon });
    const post = getPostFightTargetStates({ target: targetProfile, attacker: attackerProfile, weapon, distribution });
    return Object.freeze({
      targetUnitId: target.id,
      targetName: target.name ?? target.id,
      weaponId: weapon.id,
      weaponName: weapon.displayName ?? weapon.name ?? weapon.id,
      expectedDamage: distribution.expectedDamage,
      destructionProbability: post.destructionProbability,
      distance,
      mode: melee ? "melee" : "shooting"
    });
  } catch {
    return null;
  }
}

/**
 * Estimate how much damage the enemy target could plausibly return into nearby
 * friendly units if left alive. It does not model future movement, LOS, charges,
 * Stratagems or target-selection rules, so this is threat potential rather than
 * a prediction that the attack will occur.
 */
export function getTargetRetaliationRisk(state, { playerId, targetUnitId } = {}) {
  if (!playerId || !targetUnitId) {
    return Object.freeze({ score: 0, label: "none", reason: "Retaliation context is incomplete." });
  }
  const target = unitById(state, targetUnitId);
  if (!target || target.ownerId === playerId || target.status === "destroyed") {
    return Object.freeze({ score: 0, label: "none", reason: "No enemy retaliation profile is available." });
  }
  const root = getCombatFormationRoot(state, target) ?? target;
  let spatial = null;
  try { spatial = getSpatialContext(state, { playerId: root.ownerId }); } catch { spatial = null; }
  const nearby = (spatial?.unitProximity ?? [])
    .filter((entry) => entry.unitId === root.id)
    .map((entry) => ({ ...entry, unit: unitById(state, entry.otherUnitId) }))
    .filter((entry) => entry.unit && entry.unit.ownerId === playerId && entry.unit.status !== "destroyed" && getCombatFormationRoot(state, entry.unit)?.id === entry.unit.id)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  const ranged = getCombatFormationWeaponOptions(state, root, { type: "ranged" });
  const melee = getCombatFormationWeaponOptions(state, root, { type: "melee" });
  const options = [];
  for (const entry of nearby) {
    for (const weapon of ranged) {
      const result = evaluate(state, root, entry.unit, weapon, entry.distance);
      if (result) options.push(result);
    }
    for (const weapon of melee) {
      const result = evaluate(state, root, entry.unit, weapon, entry.distance, { melee: true });
      if (result) options.push(result);
    }
  }
  options.sort((a, b) =>
    b.destructionProbability - a.destructionProbability ||
    b.expectedDamage - a.expectedDamage ||
    a.targetName.localeCompare(b.targetName)
  );
  const best = options[0] ?? null;
  const score = best ? clamp01(best.expectedDamage / 8 + best.destructionProbability * 0.45) : 0;
  const reason = best
    ? `${root.name ?? root.id} has a saved-profile ${best.mode} threat into ${best.targetName}: about ${best.expectedDamage.toFixed(1)} expected damage and ${Math.round(best.destructionProbability * 100)}% destruction chance before future movement, LOS or Stratagems.`
    : "No meaningful saved-profile retaliation into nearby friendly units is currently established.";

  return Object.freeze({
    score,
    label: impactLabel(score),
    confidence: best ? "low" : "low",
    best,
    options: Object.freeze(options.slice(0, 5)),
    reason,
    assumption: "Retaliation is potential only; future movement, line of sight, charges, target-selection rules and Stratagems are not predicted."
  });
}
