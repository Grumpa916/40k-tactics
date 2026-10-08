import { createCommand } from "../commands/command.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { executeCommand } from "../engine/command-engine.js";
import { getShootingState } from "../rules/shooting-state.js";

function playerName(player) {
  return player?.name ?? player?.id ?? "Unknown";
}

function describeUnit(state, unitId, perspectivePlayerId) {
  const unit = state.units.find((item) => item?.id === unitId);
  if (!unit) {
    return { unitId, name: unitId, ownerId: null, ownerName: "Unknown", side: null, status: null };
  }
  const owner = state.players.find((player) => player?.id === unit.ownerId);
  return {
    unitId: unit.id,
    name: unit.name ?? unit.id,
    ownerId: unit.ownerId ?? null,
    ownerName: playerName(owner),
    side: perspectivePlayerId
      ? unit.ownerId === perspectivePlayerId ? "self" : "opponent"
      : null,
    status: unit.status ?? null
  };
}

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

export function getShootingViewModel(state, { perspectivePlayerId = null } = {}) {
  const shooting = getShootingState(state);
  return {
    phase: shooting.phase,
    round: shooting.round,
    turn: shooting.turn,
    activePlayerId: shooting.activePlayerId,
    candidates: shooting.candidates.available.map((unitId) =>
      describeUnit(state, unitId, perspectivePlayerId)
    ),
    activations: shooting.activations.map((activation) => ({
      ...activation,
      unit: describeUnit(state, activation.unitId, perspectivePlayerId)
    })),
    attacks: shooting.attacks,
    canComplete: shooting.canComplete
  };
}

export function recordShootingActivation(state, {
  unitId,
  actionType = "shoot",
  actionId = null
} = {}, context = {}) {
  return executeCommand(
    state,
    createCommand(COMMAND_TYPES.RECORD_SHOOTING_ACTIVATION, { unitId, actionType, actionId }),
    context
  );
}

export function completeShootingPhase(state, context = {}) {
  return executeCommand(
    state,
    createCommand(COMMAND_TYPES.COMPLETE_SHOOTING_PHASE),
    context
  );
}

export function activateShootingUnit(session, {
  unitId,
  actionType = "shoot",
  actionId = null
} = {}, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }
  return session.dispatch(
    createCommand(COMMAND_TYPES.RECORD_SHOOTING_ACTIVATION, { unitId, actionType, actionId }),
    context
  );
}

export function resolveShootingAttack(session, {
  attackerId,
  targetId,
  weapon
} = {}, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }
  return session.dispatch(
    createCommand(COMMAND_TYPES.RESOLVE_ATTACK, {
      attackerId,
      targetId,
      weapon
    }),
    context
  );
}

export function finishShootingPhase(session, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }
  return session.dispatch(
    createCommand(COMMAND_TYPES.COMPLETE_SHOOTING_PHASE),
    context
  );
}

export function getShootingWeaponOptions(state, { attackerId, gameData = null } = {}) {
  if (!wasActivatedToShootThisTurn(state, attackerId)) return [];
  const attacker = state?.units?.find((unit) => unit?.id === attackerId);
  if (!attacker) return [];
  const weaponIds = Array.isArray(attacker.profile?.weaponIds)
    ? attacker.profile.weaponIds
    : Array.isArray(attacker.weaponIds) ? attacker.weaponIds : [];
  const weapons = Array.isArray(gameData?.weapons) ? gameData.weapons : [];
  return weaponIds
    .map((weaponId) => weapons.find((weapon) => weapon?.id === weaponId))
    .filter((weapon) => weapon?.type === "ranged")
    .map((weapon) => ({
      id: weapon.id,
      name: weapon.name ?? weapon.id,
      type: weapon.type,
      characteristics: { ...(weapon.characteristics ?? {}) }
    }));
}

export function getShootingTargetOptions(state, { attackerId, perspectivePlayerId = null } = {}) {
  if (!wasActivatedToShootThisTurn(state, attackerId)) return [];
  const attacker = state?.units?.find((unit) => unit?.id === attackerId);
  if (!attacker) return [];
  return state.units
    .filter((unit) =>
      unit?.status === "deployed" &&
      unit?.id !== attackerId &&
      unit?.ownerId !== attacker.ownerId
    )
    .map((unit) => describeUnit(state, unit.id, perspectivePlayerId));
}
