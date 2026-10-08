import { getFightCandidates } from "./fight-candidates.js";

const FIGHT_ACTIVATION_EVENT = "fight.unit_activated";

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
    canComplete
  };
}
