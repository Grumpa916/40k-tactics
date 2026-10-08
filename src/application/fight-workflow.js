import { createCommand } from "../commands/command.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { executeCommand } from "../engine/command-engine.js";
import { getFightState } from "../rules/fight-state.js";

function playerName(player) {
  return player?.name ?? player?.id ?? "Unknown";
}

function describeUnit(state, unitId, perspectivePlayerId) {
  const unit = state.units.find((item) => item?.id === unitId);
  if (!unit) {
    return {
      unitId,
      name: unitId,
      ownerId: null,
      ownerName: "Unknown",
      side: null,
      status: null
    };
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

function describeActivation(state, activation, perspectivePlayerId) {
  return {
    ...activation,
    unit: describeUnit(state, activation.unitId, perspectivePlayerId)
  };
}

export function getFightViewModel(state, { perspectivePlayerId = null } = {}) {
  const fight = getFightState(state);

  return {
    phase: fight.phase,
    round: fight.round,
    turn: fight.turn,
    activePlayerId: fight.activePlayerId,
    candidates: {
      fightsFirst: fight.candidates.fightsFirst
        .map((unitId) => describeUnit(state, unitId, perspectivePlayerId)),
      normal: fight.candidates.normal
        .map((unitId) => describeUnit(state, unitId, perspectivePlayerId)),
      activated: fight.candidates.activated
        .map((unitId) => describeUnit(state, unitId, perspectivePlayerId))
    },
    activations: fight.activationSummaries
      .map((activation) => describeActivation(state, activation, perspectivePlayerId)),
    attacks: fight.attacks,
    canComplete: fight.canComplete
  };
}

export function recordFightActivation(state, { unitId } = {}, context = {}) {
  return executeCommand(
    state,
    createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, { unitId }),
    context
  );
}

export function completeFightPhase(state, context = {}) {
  return executeCommand(
    state,
    createCommand(COMMAND_TYPES.COMPLETE_FIGHT_PHASE),
    context
  );
}

export function activateFightUnit(session, { unitId } = {}, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }

  return session.dispatch(
    createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, { unitId }),
    context
  );
}

export function getFightWeaponOptions(state, { attackerId, gameData = null } = {}) {
  const attacker = state?.units?.find((unit) => unit?.id === attackerId);
  if (!attacker) return [];

  const weaponIds = Array.isArray(attacker.profile?.weaponIds)
    ? attacker.profile.weaponIds
    : Array.isArray(attacker.weaponIds) ? attacker.weaponIds : [];
  const weapons = Array.isArray(gameData?.weapons) ? gameData.weapons : [];

  return weaponIds
    .map((weaponId) => weapons.find((weapon) => weapon?.id === weaponId))
    .filter((weapon) => weapon?.type === "melee")
    .map((weapon) => ({
      id: weapon.id,
      name: weapon.name ?? weapon.id,
      type: weapon.type,
      characteristics: { ...(weapon.characteristics ?? {}) }
    }));
}

export function resolveFightAttack(session, {
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

export function getFightAttackOptions(
  state,
  { attackerId = null, perspectivePlayerId = null } = {}
) {
  const fight = getFightState(state);
  const activated = new Set(fight.candidates.activated);
  const attackers = state.units
    .filter((unit) => activated.has(unit?.id))
    .map((unit) => describeUnit(state, unit.id, perspectivePlayerId));

  if (!attackerId) {
    return {
      attackers,
      targets: []
    };
  }

  const attacker = state.units.find((unit) => unit?.id === attackerId);
  if (!attacker || !activated.has(attackerId)) {
    return {
      attackers,
      targets: []
    };
  }

  return {
    attackers,
    targets: state.units
      .filter((unit) =>
        unit?.status === "deployed" &&
        unit?.id !== attackerId &&
        unit?.ownerId !== attacker.ownerId
      )
      .map((unit) => describeUnit(state, unit.id, perspectivePlayerId))
  };
}

export function finishFightPhase(session, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }

  return session.dispatch(
    createCommand(COMMAND_TYPES.COMPLETE_FIGHT_PHASE),
    context
  );
}
