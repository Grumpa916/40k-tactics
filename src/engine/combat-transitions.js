import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { isMeleeWeapon } from "../rules/weapon-rules.js";
import { resolveAttack } from "../rules/attack-resolution.js";
import { buildAttackProfile } from "../rules/combat-profile.js";
import { areUnitsEngaged, hasFightEngagementHistory } from "../rules/fight-engagement-state.js";

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
    event?.payload?.turn === state?.turn
  );
}

export function resolveUnitAttack(state, {
  attackerId,
  targetId,
  weapon,
  actualDamage = null,
  random
} = {}) {
  if (!attackerId || !targetId) throw new TypeError("Attacker and target unit ids are required.");
  if (!weapon) throw new TypeError("A weapon profile is required.");
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

  if (state.phase === "fight" && hasFightEngagementHistory(state) && !areUnitsEngaged(state, attackerId, targetId)) {
    throw new Error("Fight attacks require the attacker and target to be engaged.");
  }

  const profile = buildAttackProfile({
    attacker: attacker.profile ?? attacker,
    target: target.profile ?? target,
    weapon
  });
  if (actualDamage !== null && (!Number.isInteger(actualDamage) || actualDamage < 0)) {
    throw new TypeError("Actual damage must be a non-negative integer.");
  }
  const result = resolveAttack({ ...profile, random });
  const expectedDamage = result.damage.totalDamage;
  const recordedDamage = actualDamage ?? expectedDamage;
  const previousWounds = target.wounds;
  const tracksWounds = Number.isFinite(previousWounds) && previousWounds >= 0;
  const nextWounds = tracksWounds
    ? Math.max(0, previousWounds - recordedDamage)
    : previousWounds;
  const previousStatus = target.status;
  const nextStatus = tracksWounds && nextWounds === 0
    ? UNIT_STATUS.DESTROYED
    : previousStatus;
  const event = createEvent("combat.attack_resolved", {
    attackerId,
    targetId,
    weaponId: weapon.id,
    phase: state.phase,
    round: state.battle.round,
    turn: state.turn,
    profile,
    result,
    expectedDamage,
    actualDamage: recordedDamage,
    stateDelta: {
      target: {
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
      unit.id === targetId ? { ...unit, wounds: nextWounds, status: nextStatus } : unit
    )
  }, event);
}
