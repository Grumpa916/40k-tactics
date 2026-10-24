import {
  getBattleRosterUnit,
  getBattleUnitDatasheet,
  getCombatFormationMembers,
  getCombatFormationRoot,
  getCombatFormationRootId,
  hasConfirmedNoRangedWeaponsForFormation
} from "./battle-unit-reference.js";
import { getCombatFormationWeaponOptions } from "./saved-roster-combat-profile.js";
import { UNIT_STATUS } from "../state/unit.js";

const SHOOTING_ACTIVATION_EVENT = "shooting.unit_activated";

function currentTurnEvents(state, type) {
  return (Array.isArray(state?.history) ? state.history : []).filter((event) =>
    event?.type === type &&
    event?.payload?.round === state?.battle?.round &&
    event?.payload?.turn === state?.turn
  );
}

function hasRosterBackedWeaponData(state, unit) {
  return getCombatFormationMembers(state, unit).some((member) =>
    Boolean(getBattleRosterUnit(state, member)) &&
    Array.isArray(getBattleUnitDatasheet(state, member)?.weapons)
  );
}

function isActionOnlyCandidate(state, unit) {
  if (hasConfirmedNoRangedWeaponsForFormation(state, unit)) return true;

  // A saved roster can be present while its wargear is invalid/unverified. In
  // that case the combat-profile resolver deliberately returns no weapon
  // choices. Do not offer Shoot when the UI could only lead to an empty weapon
  // picker; the unit may still perform an Action and it does not block phase
  // completion. Legacy units without saved weapon data retain the conservative
  // unresolved behavior until their profiles can be identified.
  return hasRosterBackedWeaponData(state, unit) &&
    getCombatFormationWeaponOptions(state, unit, { type: "ranged" }).length === 0;
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
    available: unresolved.filter((unit) => !isActionOnlyCandidate(state, unit)).map((unit) => unit.id),
    actionOnly: unresolved.filter((unit) => isActionOnlyCandidate(state, unit)).map((unit) => unit.id),
    activated: deployedRoots
      .filter((unit) => activated.has(unit.id))
      .map((unit) => unit.id)
  };
}
