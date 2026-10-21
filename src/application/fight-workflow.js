import { createCommand } from "../commands/command.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { executeCommand } from "../engine/command-engine.js";
import { getFightState } from "../rules/fight-state.js";
import { areUnitsEngaged, hasFightEngagementHistory } from "../rules/fight-engagement-state.js";
import { getDatasheetWeaponOptions } from "../rules/saved-roster-combat-profile.js";

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

export function recordFightActivation(state, { unitId, actionType = "fight" } = {}, context = {}) {
  return executeCommand(
    state,
    createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, { unitId, actionType }),
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

export function activateFightUnit(session, { unitId, actionType = "fight" } = {}, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }

  return session.dispatch(
    createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, { unitId, actionType }),
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

  const linkedWeapons = weaponIds
    .map((weaponId) => weapons.find((weapon) => weapon?.id === weaponId))
    .filter((weapon) => weapon?.type === "melee")
    .map((weapon) => ({
      id: weapon.id,
      name: weapon.name ?? weapon.id,
      type: weapon.type,
      characteristics: { ...(weapon.characteristics ?? {}) }
    }));
  return linkedWeapons.length ? linkedWeapons : getDatasheetWeaponOptions(state, attacker, { type: "melee" });
}

export function resolveFightAttack(session, {
  attackerId,
  targetId,
  weapon,
  actualDamage = null
} = {}, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }

  return session.dispatch(
    createCommand(COMMAND_TYPES.RESOLVE_ATTACK, {
      attackerId,
      targetId,
      weapon,
      actualDamage
    }),
    context
  );
}

export function getFightAttackOptions(
  state,
  { attackerId = null, perspectivePlayerId = null, includeCandidates = false } = {}
) {
  const fight = getFightState(state);
  const activated = new Set(fight.candidates.activated);
  const activatedToFight = new Set(
    (Array.isArray(state?.history) ? state.history : [])
      .filter((event) =>
        event?.type === "fight.unit_activated" &&
        event?.payload?.turn === state?.turn &&
        (event?.payload?.actionType ?? "fight") === "fight"
      )
      .map((event) => event?.payload?.unitId)
      .filter(Boolean)
  );
  const selectable = new Set(activatedToFight);
  if (includeCandidates) {
    for (const id of fight.candidates.fightsFirst) selectable.add(id);
    if (!fight.candidates.fightsFirst.length) for (const id of fight.candidates.normal) selectable.add(id);
  }
  const attackers = state.units
    .filter((unit) => unit.status === "deployed" && selectable.has(unit?.id))
    .map((unit) => describeUnit(state, unit.id, perspectivePlayerId));

  if (!attackerId) {
    return {
      attackers,
      targets: state.units
        .filter((unit) => unit?.status === "deployed" && !activated.has(unit?.id))
        .map((unit) => describeUnit(state, unit.id, perspectivePlayerId))
    };
  }

  const attacker = state.units.find((unit) => unit?.id === attackerId);
  if (!attacker || !selectable.has(attackerId)) {
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
        unit?.ownerId !== attacker.ownerId &&
        (!hasFightEngagementHistory(state) || areUnitsEngaged(state, attackerId, unit.id))
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

