import { UNIT_STATUS } from "../state/unit.js";

const SHOOTING_ACTIVATION_EVENT = "shooting.unit_activated";

function currentTurnEvents(state, type) {
  return (Array.isArray(state?.history) ? state.history : []).filter((event) =>
    event?.type === type &&
    event?.payload?.round === state?.battle?.round &&
    event?.payload?.turn === state?.turn
  );
}

export function getShootingCandidates(state) {
  const units = Array.isArray(state?.units) ? state.units : [];
  const activated = new Set(
    currentTurnEvents(state, SHOOTING_ACTIVATION_EVENT)
      .map((event) => event?.payload?.unitId)
      .filter(Boolean)
  );
  const activePlayerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;

  const available = units.filter((unit) =>
    unit?.status === UNIT_STATUS.DEPLOYED &&
    unit?.id &&
    (!activePlayerId || unit.ownerId === activePlayerId) &&
    !activated.has(unit.id)
  );

  return {
    available: available.map((unit) => unit.id),
    activated: units
      .filter((unit) =>
        unit?.status === UNIT_STATUS.DEPLOYED &&
        unit?.id &&
        activated.has(unit.id)
      )
      .map((unit) => unit.id)
  };
}
