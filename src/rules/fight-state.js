import { getFightCandidates } from "./fight-candidates.js";

const FIGHT_ACTIVATION_EVENT = "fight.unit_activated";
const COMBAT_ATTACK_EVENT = "combat.attack_resolved";

function getCurrentTurnFightActivations(state) {
  const history = Array.isArray(state?.history) ? state.history : [];

  return history
    .filter((event) =>
      event?.type === FIGHT_ACTIVATION_EVENT &&
      event?.payload?.turn === state?.turn &&
      event?.payload?.unitId
    )
    .map((event) => ({
      unitId: event.payload.unitId,
      playerId: event.payload.playerId ?? null,
      round: event.payload.round ?? null,
      turn: event.payload.turn,
      fightsFirst: event.payload.fightsFirst === true
    }));
}

function getCurrentTurnFightAttacks(state) {
  const history = Array.isArray(state?.history) ? state.history : [];

  return history
    .filter((event) =>
      event?.type === COMBAT_ATTACK_EVENT &&
      event?.payload?.phase === "fight" &&
      event?.payload?.round === state?.battle?.round &&
      event?.payload?.turn === state?.turn &&
      event?.payload?.attackerId &&
      event?.payload?.targetId
    )
    .map((event) => ({
      attackerId: event.payload.attackerId,
      targetId: event.payload.targetId,
      weaponId: event.payload.weaponId ?? null,
      round: event.payload.round,
      turn: event.payload.turn,
      totalDamage: event.payload.result?.damage?.totalDamage ?? 0,
      targetWoundsAfter: event.payload.stateDelta?.target?.woundsAfter ?? null,
      targetStatusAfter: event.payload.stateDelta?.target?.statusAfter ?? null
    }));
}

export function getFightState(state) {
  const candidates = getFightCandidates(state);
  const battleActive = state?.battle?.status === "active";
  const inFightPhase = state?.phase === "fight";
  const canComplete =
    battleActive &&
    inFightPhase &&
    candidates.fightsFirst.length === 0 &&
    candidates.normal.length === 0;

  return {
    phase: state?.phase ?? null,
    round: state?.battle?.round ?? null,
    turn: state?.turn ?? null,
    activePlayerId: state?.activePlayer ?? null,
    candidates,
    activations: getCurrentTurnFightActivations(state),
    attacks: getCurrentTurnFightAttacks(state),
    canComplete
  };
}
