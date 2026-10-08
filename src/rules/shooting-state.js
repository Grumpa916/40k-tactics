import { getShootingCandidates } from "./shooting-candidates.js";

const SHOOTING_ACTIVATION_EVENT = "shooting.unit_activated";
const COMBAT_ATTACK_EVENT = "combat.attack_resolved";

export function getShootingState(state) {
  const candidates = getShootingCandidates(state);
  const history = Array.isArray(state?.history) ? state.history : [];
  const activations = history
    .filter((event) =>
      event?.type === SHOOTING_ACTIVATION_EVENT &&
      event?.payload?.round === state?.battle?.round &&
      event?.payload?.turn === state?.turn
    )
    .map((event) => ({
      unitId: event.payload.unitId,
      playerId: event.payload.playerId ?? null,
      round: event.payload.round ?? null,
      turn: event.payload.turn
    }));

  const attacks = history
    .filter((event) =>
      event?.type === COMBAT_ATTACK_EVENT &&
      event?.payload?.phase === "shooting" &&
      event?.payload?.round === state?.battle?.round &&
      event?.payload?.turn === state?.turn &&
      event?.payload?.attackerId &&
      event?.payload?.targetId
    )
    .map((event) => ({
      attackerId: event.payload.attackerId,
      targetId: event.payload.targetId,
      weaponId: event.payload.weaponId ?? null,
      totalDamage: event.payload.result?.damage?.totalDamage ?? 0,
      targetWoundsAfter: event.payload.stateDelta?.target?.woundsAfter ?? null,
      targetStatusAfter: event.payload.stateDelta?.target?.statusAfter ?? null
    }));

  return {
    phase: state?.phase ?? null,
    round: state?.battle?.round ?? null,
    turn: state?.turn ?? null,
    activePlayerId: state?.activePlayer ?? state?.battle?.activePlayerId ?? null,
    candidates,
    activations,
    attacks,
    canComplete: candidates.available.length === 0
  };
}
