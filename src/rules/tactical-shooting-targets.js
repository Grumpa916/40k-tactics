import { getCombatHistorySummary } from "./combat-history-summary.js";
import { getSpatialContext } from "./spatial-context.js";
import { getExpectedDamage } from "./expected-damage.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : []).find((unit) => unit.id === unitId) ?? null;
}

function rangeFromWeapon(weapon) {
  const value = weapon?.characteristics?.range ?? weapon?.range;
  return Number.isFinite(value) ? value : null;
}

function proximityScore(band) {
  return {
    close: 3,
    near: 2,
    mid: 1,
    far: 0,
    "very-far": -2
  }[band] ?? 0;
}

function rangeScore(distance, range) {
  if (range == null || distance == null) return 0;
  return distance <= range ? 2 : -2;
}

/**
 * Rank enemy targets for a player's Shooting activation.
 *
 * This is advisory only. It uses the coarse spatial context and authoritative
 * combat history, but never determines whether an attack is legally possible.
 * A weapon range, when supplied, is treated as an approximate prioritization
 * signal rather than a range/LOS legality check.
 */
export function getShootingTargetPriorities(state, {
  playerId,
  attackerId,
  weapon = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!attackerId) throw new TypeError("attackerId is required.");

  const attacker = unitById(state, attackerId);
  if (!attacker || attacker.ownerId !== playerId) {
    throw new Error("Shooting attacker must belong to playerId.");
  }

  const combat = getCombatHistorySummary(state, { playerId });
  const attackerSummary = combat.units.find((unit) => unit.unitId === attackerId);
  const spatial = getSpatialContext(state, { playerId });
  const proximities = spatial.unitProximity.filter(
    (item) => item.unitId === attackerId
  );
  const range = rangeFromWeapon(weapon);
  const priorities = [];

  for (const proximity of proximities) {
    const target = unitById(state, proximity.otherUnitId);
    if (!target || target.ownerId === playerId || target.status === "destroyed") continue;

    const engaged = attackerSummary?.engagedWith?.includes(target.id) ?? false;

    // Normal Fight-engaged targets are not Shooting recommendations. Any
    // future exceptions should be supplied by authoritative unit/rule data.
    if (engaged) continue;

    let priority = proximityScore(proximity.band);
    priority += rangeScore(proximity.distance, range);

    let expectedDamage = null;
    if (weapon?.characteristics && attacker.characteristics && target.characteristics) {
      try {
        expectedDamage = getExpectedDamage({ attacker, target, weapon }).expectedDamage;
        priority += Math.min(3, expectedDamage);
      } catch {
        // Incomplete profiles remain eligible; expected damage is optional advisory data.
      }
    }

    const reasons = [];
    if (proximity.band === "close" || proximity.band === "near") {
      reasons.push("Enemy is approximately " + proximity.distance + " inches away.");
    }
    if (expectedDamage != null) {
      reasons.push("Baseline expected damage is approximately " + expectedDamage.toFixed(2) + ".");
    }
    if (range != null) {
      reasons.push(
        proximity.distance <= range
          ? "Target is within the weapon's approximate range."
          : "Target is beyond the weapon's approximate range."
      );
    }

    priorities.push({
      type: "shooting-target",
      priority,
      unitId: attackerId,
      targetUnitId: target.id,
      targetDistance: proximity.distance,
      targetBand: proximity.band,
      weaponId: weapon?.id ?? null,
      expectedDamage,
      reason: reasons.join(" ")
    });
  }

  priorities.sort((a, b) =>
    b.priority - a.priority ||
    (a.targetDistance ?? Infinity) - (b.targetDistance ?? Infinity) ||
    a.targetUnitId.localeCompare(b.targetUnitId)
  );

  return {
    playerId,
    attackerId,
    weaponId: weapon?.id ?? null,
    priorities
  };
}
