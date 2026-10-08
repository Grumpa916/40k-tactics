import { getExpectedDamage } from "./expected-damage.js";
import { getFightEngagementState } from "./fight-engagement-state.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : [])
    .find((unit) => unit?.id === unitId) ?? null;
}

function availableMeleeWeapons(unit) {
  const pools = [
    Array.isArray(unit?.weapons) ? unit.weapons : [],
    Array.isArray(unit?.meleeWeapons) ? unit.meleeWeapons : []
  ];

  const seen = new Set();
  return pools.flat().filter((weapon) => {
    if (!weapon || weapon.type !== "melee") return false;
    const key = weapon.id ?? JSON.stringify(weapon);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function expectedDamage(attacker, target, weapon) {
  try {
    return getExpectedDamage({ attacker, target, weapon }).expectedDamage;
  } catch {
    return null;
  }
}

function engagedOpponents(state, playerId, attackerId) {
  const engagement = getFightEngagementState(state);
  const ids = new Set();

  for (const relationship of engagement.relationships) {
    if (!relationship.unitIds.includes(attackerId)) continue;

    for (const unitId of relationship.unitIds) {
      if (unitId === attackerId) continue;
      const unit = unitById(state, unitId);
      if (unit && unit.ownerId !== playerId && unit.status !== "destroyed") {
        ids.add(unit.id);
      }
    }
  }

  return [...ids];
}

/**
 * Evaluate the strongest known enemy retaliation against one Fight attacker.
 *
 * Retaliation is derived only from authoritative current engagement history and
 * known melee weapon profiles. It does not use map coordinates, invent future
 * charges, or assume hidden abilities/stratagems.
 *
 * Explicit retaliationOptions can be supplied by a Fight UI when the available
 * enemy weapon/loadout context is richer than the stored unit profile.
 */
export function getBestFightRetaliation(
  state,
  { playerId, attackerId, retaliationOptions = [] } = {}
) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!attackerId) throw new TypeError("attackerId is required.");

  const attacker = unitById(state, attackerId);
  if (!attacker || attacker.ownerId !== playerId || attacker.status === "destroyed") {
    return null;
  }

  const candidates = [];

  for (const option of Array.isArray(retaliationOptions) ? retaliationOptions : []) {
    const enemy = unitById(state, option?.unitId);
    const weapon = option?.weapon;

    if (!enemy || enemy.ownerId === playerId || enemy.status === "destroyed") continue;
    if (!weapon || weapon.type !== "melee") continue;

    const damage = Number.isFinite(option?.expectedDamage)
      ? option.expectedDamage
      : expectedDamage(enemy, attacker, weapon);

    if (!Number.isFinite(damage)) continue;

    candidates.push({
      unitId: enemy.id,
      weaponId: weapon.id ?? null,
      expectedDamage: damage,
      confidence: option?.confidence ?? "moderate",
      source: "explicit"
    });
  }

  for (const enemyId of engagedOpponents(state, playerId, attackerId)) {
    const enemy = unitById(state, enemyId);
    for (const weapon of availableMeleeWeapons(enemy)) {
      const damage = expectedDamage(enemy, attacker, weapon);
      if (!Number.isFinite(damage)) continue;

      candidates.push({
        unitId: enemy.id,
        weaponId: weapon.id ?? null,
        expectedDamage: damage,
        confidence: "moderate",
        source: "engagement"
      });
    }
  }

  candidates.sort((a, b) =>
    b.expectedDamage - a.expectedDamage ||
    String(a.unitId).localeCompare(String(b.unitId)) ||
    String(a.weaponId).localeCompare(String(b.weaponId))
  );

  return candidates[0] ?? null;
}
