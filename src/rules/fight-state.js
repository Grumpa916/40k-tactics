import { getFightCandidates } from "./fight-candidates.js";

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
    canComplete
  };
}
