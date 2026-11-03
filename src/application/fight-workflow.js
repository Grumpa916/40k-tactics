import { isCombatActivationFinished } from "../rules/combat-activation-state.js";
import { createCommand } from "../commands/command.js";
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { executeCommand } from "../engine/command-engine.js";
import { getFightState } from "../rules/fight-state.js";
import { getFightEngagementState } from "../rules/fight-engagement-state.js";
import { getCombatFormationWeaponOptions } from "../rules/saved-roster-combat-profile.js";
import { getCombatFormationMembers, getCombatFormationRoot, getCombatFormationRootId } from "../rules/battle-unit-reference.js";
import { unitDisplayLabels } from "../ui/map-unit-labels.js";

function playerName(player) {
  return player?.name ?? player?.id ?? "Unknown";
}

function describeUnit(state, unitId, perspectivePlayerId) {
  const unit = state.units.find((item) => item?.id === unitId);
  const displayName = unitDisplayLabels(state.units).get(unitId);
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
    name: displayName ?? unit.name ?? unit.id,
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

function formationChargedThisTurn(state, unitId) {
  const rootId = getCombatFormationRootId(state, unitId);
  if (!rootId) return false;
  return (Array.isArray(state?.history) ? state.history : []).some((event) =>
    event?.type === "charge.outcome_recorded" &&
    event?.payload?.outcome === "successful" &&
    event?.payload?.turn === state?.turn &&
    event?.payload?.round === state?.battle?.round &&
    getCombatFormationRootId(state, event?.payload?.unitId) === rootId
  );
}

function hasRecordedLiveEngagement(state, unitId) {
  const rootId = getCombatFormationRootId(state, unitId);
  if (!rootId) return false;
  const deployedRoots = new Set(
    (Array.isArray(state?.units) ? state.units : [])
      .filter((unit) => unit?.status === "deployed" && getCombatFormationRoot(state, unit)?.id === unit.id)
      .map((unit) => unit.id)
  );
  const current = getFightEngagementState(state);
  return current.relationships.some((relationship) => {
    const roots = relationship.unitIds
      .map((relatedId) => getCombatFormationRootId(state, relatedId))
      .filter(Boolean);
    return roots.includes(rootId) && roots.some((relatedRootId) =>
      relatedRootId !== rootId && deployedRoots.has(relatedRootId)
    );
  });
}

function tabletopFightTargets(state, attacker, perspectivePlayerId) {
  return state.units
    .filter((unit) =>
      unit?.status === "deployed" &&
      unit?.id !== attacker.id &&
      unit?.ownerId !== attacker.ownerId &&
      getCombatFormationRoot(state, unit)?.id === unit.id
    )
    .map((unit) => describeUnit(state, unit.id, perspectivePlayerId));
}

function selectableFightAttackers(state, fight, perspectivePlayerId, { includeCandidates = false } = {}) {
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
  const fightsFirst = new Set(fight.candidates.fightsFirst);
  const normal = new Set(fight.candidates.normal);
  const inferred = new Set([...fightsFirst, ...normal]);
  const selectable = new Set(activatedToFight);

  if (includeCandidates) {
    for (const unit of state.units ?? []) {
      if (unit?.status !== "deployed") continue;
      if (getCombatFormationRoot(state, unit)?.id !== unit.id) continue;
      if (isCombatActivationFinished(state, unit.id, "fight")) continue;
      selectable.add(unit.id);
    }
  }

  return state.units
    .filter((unit) => unit?.status === "deployed" && selectable.has(unit?.id) && getCombatFormationRoot(state, unit)?.id === unit.id && !isCombatActivationFinished(state, unit.id, "fight"))
    .map((unit) => ({
      ...describeUnit(state, unit.id, perspectivePlayerId),
      fightsFirst: fightsFirst.has(unit.id),
      inferredEligible: inferred.has(unit.id),
      eligibilitySource: fightsFirst.has(unit.id)
        ? "fights-first"
        : normal.has(unit.id)
          ? "inferred"
          : activatedToFight.has(unit.id)
            ? "active"
            : "tabletop-confirmed"
    }));
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

export function recordFightActivation(state, {
  unitId,
  actionType = "fight",
  tabletopConfirmed = false
} = {}, context = {}) {
  return executeCommand(
    state,
    createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, { unitId, actionType, tabletopConfirmed }),
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

export function activateFightUnit(session, {
  unitId,
  actionType = "fight",
  tabletopConfirmed = false
} = {}, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }

  return session.dispatch(
    createCommand(COMMAND_TYPES.RECORD_FIGHT_ACTIVATION, { unitId, actionType, tabletopConfirmed }),
    context
  );
}

export function getFightWeaponOptions(state, { attackerId, gameData = null } = {}) {
  const attacker = state?.units?.find((unit) => unit?.id === attackerId);
  if (!attacker) return [];

  const formationMembers = getCombatFormationMembers(state, attacker);
  if (formationMembers.length > 1) {
    return getCombatFormationWeaponOptions(state, attacker, { type: "melee" });
  }

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
      displayName: weapon.name ?? weapon.id,
      type: weapon.type,
      sourceUnitId: attacker.id,
      sourceUnitName: attacker.name ?? attacker.id,
      formationUnitId: attacker.id,
      characteristics: { ...(weapon.characteristics ?? {}) }
    }));
  return linkedWeapons.length ? linkedWeapons : getCombatFormationWeaponOptions(state, attacker, { type: "melee" });
}

export function resolveFightAttack(session, {
  attackerId,
  targetId,
  allocationTargetId = null,
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
      allocationTargetId,
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
  const attackers = selectableFightAttackers(state, fight, perspectivePlayerId, { includeCandidates });

  if (!attackerId) {
    return {
      attackers,
      targets: [],
      chargedThisTurn: false,
      recordedEngagement: false,
      overrunAvailable: false,
      targetSelectionPolicy: "tabletop-confirmed",
      fighterSelectionPolicy: "tabletop-confirmed"
    };
  }

  const attacker = state.units.find((unit) => unit?.id === attackerId);
  if (!attacker || !attackers.some((unit) => unit.unitId === attackerId)) {
    return {
      attackers,
      targets: [],
      chargedThisTurn: false,
      recordedEngagement: false,
      overrunAvailable: false,
      targetSelectionPolicy: "tabletop-confirmed",
      fighterSelectionPolicy: "tabletop-confirmed"
    };
  }

  const chargedThisTurn = formationChargedThisTurn(state, attackerId);
  const recordedEngagement = hasRecordedLiveEngagement(state, attackerId);

  return {
    attackers,
    // Both fighter and target legality are confirmed on the physical tabletop.
    // Recorded engagement/Charge state remains tactical context, not a hard lock.
    targets: tabletopFightTargets(state, attacker, perspectivePlayerId),
    chargedThisTurn,
    recordedEngagement,
    overrunAvailable: chargedThisTurn && !recordedEngagement,
    targetSelectionPolicy: "tabletop-confirmed",
    fighterSelectionPolicy: "tabletop-confirmed"
  };
}

export function finishFightPhase(session, { confirmRemaining = false } = {}, context = {}) {
  if (!session || typeof session.dispatch !== "function") {
    throw new TypeError("A game session is required.");
  }

  return session.dispatch(
    createCommand(COMMAND_TYPES.COMPLETE_FIGHT_PHASE, { confirmRemaining }),
    context
  );
}
