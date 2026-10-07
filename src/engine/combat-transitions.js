import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { resolveAttack } from "../rules/attack-resolution.js";
import { buildAttackProfile } from "../rules/combat-profile.js";

export function resolveUnitAttack(state, {
  attackerId,
  targetId,
  weapon,
  random
} = {}) {
  if (!attackerId || !targetId) throw new TypeError("Attacker and target unit ids are required.");
  if (!weapon) throw new TypeError("A weapon profile is required.");
  if (attackerId === targetId) throw new Error("Attacker and target must be different units.");
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "shooting" && state.phase !== "fight") {
    throw new Error("Attacks may only be resolved in shooting or fight.");
  }

  const attacker = state.units.find((unit) => unit.id === attackerId);
  const target = state.units.find((unit) => unit.id === targetId);
  if (!attacker || !target) throw new Error("Attacker and target units must exist.");
  if (attacker.status !== UNIT_STATUS.DEPLOYED || target.status !== UNIT_STATUS.DEPLOYED) {
    throw new Error("Attacker and target units must be deployed.");
  }

  const profile = buildAttackProfile({
    attacker: attacker.profile ?? attacker,
    target: target.profile ?? target,
    weapon
  });
  const result = resolveAttack({ ...profile, random });
  const previousWounds = target.wounds ?? 0;
  const nextWounds = Math.max(0, previousWounds - result.damage.totalDamage);
  const previousStatus = target.status;
  const nextStatus = nextWounds === 0 ? UNIT_STATUS.DESTROYED : previousStatus;
  const event = createEvent("combat.attack_resolved", {
    attackerId,
    targetId,
    weaponId: weapon.id,
    phase: state.phase,
    round: state.battle.round,
    profile,
    result,
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
