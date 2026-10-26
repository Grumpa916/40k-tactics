import { getExpectedDamage } from "./expected-damage.js";
import { getFightEngagementState } from "./fight-engagement-state.js";
import { isCombatActivationFinished } from "./combat-activation-state.js";

function hasFinishedFighting(state, unitId) {
  return isCombatActivationFinished(state, unitId, "fight") || (state.history ?? []).some(event =>
    event.type === "fight.unit_activated" && event.payload?.unitId === unitId &&
    event.payload?.actionType === "not_fight" && event.payload?.turn === state.turn &&
    event.payload?.round === state.battle?.round);
}

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

function targetWithHitModifier(target, hitModifier = 0) {
  const modifier = Number(hitModifier) || 0;
  if (!modifier) return target;
  const characteristics = target?.characteristics ?? target?.profile?.characteristics ?? {};
  const current = Number(characteristics?.hitModifier) || 0;
  return {
    ...target,
    characteristics: {
      ...characteristics,
      hitModifier: current + modifier
    }
  };
}

function expectedDamage(attacker, target, weapon, attackerRemainingWounds = attacker?.wounds, targetHitModifier = 0) {
  try {
    return getExpectedDamage({
      attacker,
      target: targetWithHitModifier(target, targetHitModifier),
      weapon,
      attackerRemainingWounds
    }).expectedDamage;
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
 * targetHitModifier represents a modifier imposed on attacks targeting the
 * friendly unit (for example Kaptaris -1 to Hit). The normal ±1 roll-modifier
 * cap remains enforced by the damage engine.
 */
export function getBestFightRetaliation(
  state,
  {
    playerId,
    attackerId,
    retaliationOptions = [],
    remainingWoundsByUnit = {},
    destroyedUnitIds = [],
    targetHitModifier = 0
  } = {}
) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!attackerId) throw new TypeError("attackerId is required.");

  const attacker = unitById(state, attackerId);
  if (!attacker || attacker.ownerId !== playerId || attacker.status === "destroyed") {
    return null;
  }

  const candidates = [];
  const destroyed = new Set(Array.isArray(destroyedUnitIds) ? destroyedUnitIds : []);

  for (const option of Array.isArray(retaliationOptions) ? retaliationOptions : []) {
    const enemy = unitById(state, option?.unitId);
    const weapon = option?.weapon;

    if (!enemy || enemy.ownerId === playerId || enemy.status === "destroyed" || destroyed.has(enemy.id) || hasFinishedFighting(state, enemy.id)) continue;
    if (!weapon || weapon.type !== "melee") continue;

    const damage = Number.isFinite(option?.expectedDamage) && !targetHitModifier
      ? option.expectedDamage
      : expectedDamage(enemy, attacker, weapon, remainingWoundsByUnit[enemy.id] ?? enemy.wounds, targetHitModifier);

    if (!Number.isFinite(damage)) continue;

    candidates.push({
      unitId: enemy.id,
      weaponId: weapon.id ?? null,
      expectedDamage: damage,
      confidence: option?.confidence ?? "moderate",
      source: "explicit",
      targetHitModifier
    });
  }

  for (const enemyId of engagedOpponents(state, playerId, attackerId)) {
    const enemy = unitById(state, enemyId);
    if (destroyed.has(enemy.id) || hasFinishedFighting(state, enemy.id)) continue;
    for (const weapon of availableMeleeWeapons(enemy)) {
      const damage = expectedDamage(enemy, attacker, weapon, remainingWoundsByUnit[enemy.id] ?? enemy.wounds, targetHitModifier);
      if (!Number.isFinite(damage)) continue;

      candidates.push({
        unitId: enemy.id,
        weaponId: weapon.id ?? null,
        expectedDamage: damage,
        confidence: "moderate",
        source: "engagement",
        targetHitModifier
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
