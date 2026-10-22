import {
  getCombatFormationRoot,
  getCombatFormationRootId,
  hasConfirmedNoRangedWeaponsForFormation
} from "./battle-unit-reference.js";
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
      .map((event) => getCombatFormationRootId(state, event?.payload?.unitId))
      .filter(Boolean)
  );
  const activePlayerId = state?.activePlayer ?? state?.battle?.activePlayerId ?? null;

  const deployedRoots = units.filter((unit) =>
    unit?.status === UNIT_STATUS.DEPLOYED &&
    unit?.id &&
    getCombatFormationRoot(state, unit)?.id === unit.id
  );
  const unresolved = deployedRoots.filter((unit) =>
    (!activePlayerId || unit.ownerId === activePlayerId) &&
    !activated.has(unit.id)
  );

  return {
    available: unresolved.filter((unit) => !hasConfirmedNoRangedWeaponsForFormation(state, unit)).map((unit) => unit.id),
    actionOnly: unresolved.filter((unit) => hasConfirmedNoRangedWeaponsForFormation(state, unit)).map((unit) => unit.id),
    activated: deployedRoots
      .filter((unit) => activated.has(unit.id))
      .map((unit) => unit.id)
  };
}
