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
      expectedDamage: event.payload.expectedDamage ?? event.payload.result?.damage?.totalDamage ?? 0,
      actualDamage: event.payload.actualDamage ?? event.payload.result?.damage?.totalDamage ?? 0,
      totalDamage: event.payload.actualDamage ?? event.payload.result?.damage?.totalDamage ?? 0,
      targetWoundsAfter: event.payload.stateDelta?.target?.woundsAfter ?? null,
      targetStatusAfter: event.payload.stateDelta?.target?.statusAfter ?? null
    }));
}

function getFightActivationSummaries(activations, attacks) {
  const attacksByUnit = new Map();

  for (const attack of attacks) {
    const current = attacksByUnit.get(attack.attackerId) ?? {
      attackCount: 0,
      totalDamage: 0,
      targetIds: []
    };

    current.attackCount += 1;
    current.totalDamage += attack.totalDamage;

    if (!current.targetIds.includes(attack.targetId)) {
      current.targetIds.push(attack.targetId);
    }

    attacksByUnit.set(attack.attackerId, current);
  }

  return activations.map((activation) => {
    const combat = attacksByUnit.get(activation.unitId) ?? {
      attackCount: 0,
      totalDamage: 0,
      targetIds: []
    };

    return {
      ...activation,
      attackCount: combat.attackCount,
      totalDamage: combat.totalDamage,
      targetIds: [...combat.targetIds]
    };
  });
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
  const activations = getCurrentTurnFightActivations(state);
  const attacks = getCurrentTurnFightAttacks(state);

  return {
    phase: state?.phase ?? null,
    round: state?.battle?.round ?? null,
    turn: state?.turn ?? null,
    activePlayerId: state?.activePlayer ?? null,
    candidates,
    activations,
    attacks,
    activationSummaries: getFightActivationSummaries(activations, attacks),
    canComplete
  };
}
