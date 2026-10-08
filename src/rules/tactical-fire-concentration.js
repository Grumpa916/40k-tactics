import { getExpectedDamage } from "./expected-damage.js";
import { getShootingCandidates } from "./shooting-candidates.js";
import { getSpatialContext } from "./spatial-context.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : []).find((unit) => unit.id === unitId) ?? null;
}

function weaponById(state, weaponId) {
  return (Array.isArray(state?.data?.weapons) ? state.data.weapons : [])
    .find((weapon) => weapon?.id === weaponId) ?? null;
}

function remainingWounds(unit) {
  return Number.isFinite(unit?.wounds) ? unit.wounds : null;
}

function rangeFromWeapon(weapon) {
  const value = weapon?.characteristics?.range ?? weapon?.range;
  return Number.isFinite(value) ? value : null;
}

function proximityFor(state, unitId, targetUnitId) {
  const spatial = getSpatialContext(state, { playerId: unitById(state, unitId)?.ownerId });
  return spatial.unitProximity.find(
    (item) => item.unitId === unitId && item.otherUnitId === targetUnitId
  ) ?? null;
}

function availableWeapons(state, unit) {
  const weaponIds = Array.isArray(unit?.profile?.weaponIds)
    ? unit.profile.weaponIds
    : Array.isArray(unit?.weaponIds)
      ? unit.weaponIds
      : [];

  return weaponIds
    .map((weaponId) => weaponById(state, weaponId))
    .filter((weapon) => weapon?.type !== "melee");
}

/**
 * Estimate whether available friendly shooting units can collectively put
 * meaningful damage into a selected enemy target.
 *
 * This is advisory only. Approximate spatial context is used to exclude only
 * clearly unreachable ranged weapons; it does not determine exact range or LOS.
 */
export function getFireConcentrationAdvisory(state, {
  playerId,
  targetUnitId
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!targetUnitId) throw new TypeError("targetUnitId is required.");

  const target = unitById(state, targetUnitId);
  if (!target || target.ownerId === playerId || target.status === "destroyed") {
    throw new Error("Fire concentration target must be a living enemy unit.");
  }

  const remaining = remainingWounds(target);
  if (remaining == null || remaining <= 0) {
    throw new Error("Fire concentration target must have remaining wounds.");
  }

  const candidateIds = new Set(
    getShootingCandidates({
      ...state,
      activePlayer: playerId,
      battle: { ...(state?.battle ?? {}), activePlayerId: playerId }
    }).available
  );

  const contributors = [];

  for (const unit of Array.isArray(state?.units) ? state.units : []) {
    if (!candidateIds.has(unit?.id)) continue;

    const proximity = proximityFor(state, unit.id, targetUnitId);
    if (!proximity) continue;

    for (const weapon of availableWeapons(state, unit)) {
      const range = rangeFromWeapon(weapon);
      if (range != null && proximity.distance != null && proximity.distance > range) {
        continue;
      }

      try {
        const expectedDamage = getExpectedDamage({
          attacker: unit,
          target,
          weapon
        }).expectedDamage;

        if (expectedDamage <= 0) continue;

        contributors.push({
          unitId: unit.id,
          weaponId: weapon.id,
          expectedDamage,
          targetDistance: proximity.distance,
          targetBand: proximity.band
        });
      } catch {
        // Incomplete profiles do not contribute an invented damage estimate.
      }
    }
  }

  contributors.sort((a, b) =>
    b.expectedDamage - a.expectedDamage ||
    a.unitId.localeCompare(b.unitId) ||
    a.weaponId.localeCompare(b.weaponId)
  );

  const expectedCombinedDamage = contributors.reduce(
    (total, item) => total + item.expectedDamage,
    0
  );

  let category = "insufficient-firepower";
  if (expectedCombinedDamage >= remaining * 1.5) {
    category = "overkill-opportunity";
  } else if (expectedCombinedDamage >= remaining) {
    category = "fire-concentration-opportunity";
  }

  return Object.freeze({
    targetUnitId,
    availableFirepower: contributors.length,
    expectedCombinedDamage,
    targetRemainingWounds: remaining,
    category,
    contributors: Object.freeze(contributors.map((item) => Object.freeze(item)))
  });
}
