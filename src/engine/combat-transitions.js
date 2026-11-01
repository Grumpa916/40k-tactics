import { getAttackReviewSnapshot } from '../rules/review-context-snapshot.js';
import { getProbabilisticUnitProfile } from '../rules/saved-roster-combat-profile.js';
import { getCombatFormationRoot } from '../rules/battle-unit-reference.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { validatePrecisionAllocation } from '../rules/precision-allocation.js';
import { isCombatActivationFinished } from "../rules/combat-activation-state.js";
import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { isMeleeWeapon } from "../rules/weapon-rules.js";
import { resolveAttack } from "../rules/attack-resolution.js";
import { buildAttackProfile } from "../rules/combat-profile.js";
import { getDamageOutcomeDistribution } from "../rules/damage-outcome-distribution.js";

function wasActivatedToShootThisTurn(state, unitId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  return history.some((event) =>
    event?.type === "shooting.unit_activated" &&
    event?.payload?.unitId === unitId &&
    event?.payload?.round === state?.battle?.round &&
    event?.payload?.turn === state?.turn &&
    (event?.payload?.actionType ?? "shoot") === "shoot"
  );
}

function fellBackThisTurn(state, unitId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  return history.some((event) =>
    event?.type === "unit.fell_back" &&
    event?.payload?.unitId === unitId &&
    event?.payload?.round === state?.battle?.round &&
    event?.payload?.turn === state?.turn
  );
}

function wasActivatedToFightThisTurn(state, unitId) {
  const history = Array.isArray(state?.history) ? state.history : [];
  return history.some((event) =>
    event?.type === "fight.unit_activated" &&
    event?.payload?.unitId === unitId &&
    event?.payload?.round === state?.battle?.round &&
    event?.payload?.turn === state?.turn &&
    (event?.payload?.actionType ?? "fight") === "fight"
  );
}

export function resolveUnitAttack(state, {
  attackerId,
  targetId,
  allocationTargetId = null,
  weapon,
  actualDamage = null,
  random
} = {}) {
  if (!attackerId || !targetId) throw new TypeError("Attacker and target unit ids are required.");
  if (!weapon) throw new TypeError("A weapon profile is required.");
  if (isCombatActivationFinished(state, attackerId)) throw new Error("This unit has finished its activation for this phase and turn.");
  if (attackerId === targetId) throw new Error("Attacker and target must be different units.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "shooting" && state.phase !== "fight") {
    throw new Error("Attacks may only be resolved in shooting or fight.");
  }
  if (state.phase === "shooting" && fellBackThisTurn(state, attackerId)) {
    throw new Error("A unit that Fell Back cannot shoot this turn.");
  }
  if (state.phase === "shooting" && !wasActivatedToShootThisTurn(state, attackerId)) {
    throw new Error("Shooting attack requires the unit to be activated first.");
  }
  if (state.phase === "fight" && !wasActivatedToFightThisTurn(state, attackerId)) {
    throw new Error("Fight attack requires the unit to be activated first.");
  }
  if (state.phase === "shooting" && isMeleeWeapon(weapon)) {
    throw new Error("Shooting attacks require a ranged weapon.");
  }
  if (state.phase === "fight" && !isMeleeWeapon(weapon)) {
    throw new Error("Fight attacks require a melee weapon.");
  }

  const attacker = state.units.find((unit) => unit.id === attackerId);
  const target = state.units.find((unit) => unit.id === targetId);
  if (!attacker || !target) throw new Error("Attacker and target units must exist.");
  if (attacker.status !== UNIT_STATUS.DEPLOYED || target.status !== UNIT_STATUS.DEPLOYED) {
    throw new Error("Attacker and target units must be deployed.");
  }

  const sourceAttacker = weapon?.sourceUnitId
    ? state.units.find((unit) => unit.id === weapon.sourceUnitId)
    : attacker;
  if (!sourceAttacker || sourceAttacker.status !== UNIT_STATUS.DEPLOYED) {
    throw new Error("The selected weapon source must be deployed.");
  }
  if (sourceAttacker.ownerId !== attacker.ownerId || getCombatFormationRoot(state, sourceAttacker)?.id !== attacker.id) {
    throw new Error("The selected weapon does not belong to this combat formation.");
  }

  // Fight target legality is confirmed on the physical tabletop. Recorded Charge
  // engagements remain tactical/history context and must not hard-lock execution.
  const allocationTarget = validatePrecisionAllocation(state, { targetId, allocationTargetId, weapon });
  const damageTarget = allocationTarget ?? target;
  if (damageTarget.status !== UNIT_STATUS.DEPLOYED) {
    throw new Error("The selected damage allocation target must be deployed.");
  }

  if (actualDamage !== null && (!Number.isInteger(actualDamage) || actualDamage < 0)) {
    throw new TypeError("Actual damage must be a non-negative integer.");
  }
  let profile = null;
  let result = null;
  let expectedDamage = null;
  let reviewSnapshot = null;
  const attackerProfile = getProbabilisticUnitProfile(state, sourceAttacker);
  const targetProfile = getProbabilisticUnitProfile(state, target);
  try {
    profile = buildAttackProfile({
      attacker: attackerProfile,
      target: targetProfile,
      weapon
    });
    if (actualDamage === null) result = resolveAttack({ ...profile, random });
    const forecast = getDamageOutcomeDistribution({ attacker: attackerProfile, target: targetProfile, weapon });
    expectedDamage = forecast.expectedDamage;
    reviewSnapshot = getAttackReviewSnapshot(forecast,targetProfile,allocationTarget?.id);
  } catch (error) {
    // Live battles deliberately allow incomplete saved-roster profiles. When the
    // player supplies actual damage, preserve that authoritative table result
    // instead of blocking the event because baseline probability data is missing.
    if (actualDamage === null) throw error;
  }
  const recordedDamage = actualDamage ?? result.damage.totalDamage;
  const previousWounds = getLiveUnitVitals(state, damageTarget).wounds;
  const tracksWounds = Number.isFinite(previousWounds) && previousWounds >= 0;
  const nextWounds = tracksWounds
    ? Math.max(0, previousWounds - recordedDamage)
    : previousWounds;
  const previousStatus = damageTarget.status;
  const nextStatus = tracksWounds && nextWounds === 0
    ? UNIT_STATUS.DESTROYED
    : previousStatus;
  const event = createEvent("combat.attack_resolved", {
    attackerId,
    sourceAttackerId: sourceAttacker.id,
    sourceAttackerName: sourceAttacker.name ?? sourceAttacker.id,
    targetId,
    allocationTargetId: allocationTarget?.id ?? null,
    allocationTargetName: allocationTarget ? (allocationTarget.name ?? allocationTarget.id) : null,
    weaponId: weapon.id,
    weaponName: weapon.name ?? weapon.id,
    phase: state.phase,
    round: state.battle.round,
    turn: state.turn,
    profile,
    result,
    expectedDamage,
    reviewSnapshot,
    actualDamage: recordedDamage,
    stateDelta: {
      target: {
        unitId: damageTarget.id,
        woundsBefore: previousWounds,
        woundsAfter: nextWounds,
        statusBefore: previousStatus,
        statusAfter: nextStatus
      }
    }
  });

  return appendHistoryEntry({
    ...state,
    units: state.units.map((unit) =>
      unit.id === damageTarget.id ? { ...unit, wounds: nextWounds, status: nextStatus } : unit
    )
  }, event);
}
