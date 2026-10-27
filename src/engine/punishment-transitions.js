import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getCombatFormationRoot } from "../rules/battle-unit-reference.js";
import { isPunishmentMissionForPlayer } from "../rules/punishment-condemnation.js";

function deployedEnemyRoots(state, playerId) {
  const roots = new Map();
  for (const unit of Array.isArray(state?.units) ? state.units : []) {
    if (!unit?.id || unit.ownerId === playerId || unit.status !== "deployed") continue;
    const root = getCombatFormationRoot(state, unit) ?? unit;
    if (root?.status === "deployed" && root.ownerId !== playerId) roots.set(root.id, root);
  }
  return roots;
}

export function recordPunishmentCondemnation(state, {
  playerId,
  unitIds,
  tabletopEligibilityConfirmed = false
} = {}) {
  if (state?.battle?.status !== "active") {
    throw new Error("Punishment condemnation can only be recorded during an active battle.");
  }
  if (state?.phase !== "start_turn") {
    throw new Error("Select Punishment condemned units at the start of your turn.");
  }
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  if (!playerId || playerId !== activePlayerId) {
    throw new Error("Punishment condemnation must be recorded for the active player.");
  }
  if (!isPunishmentMissionForPlayer(state, playerId)) {
    throw new Error("The active player's Primary Mission is not Punishment.");
  }

  const enemyRoots = deployedEnemyRoots(state, playerId);
  const selected = [...new Set((Array.isArray(unitIds) ? unitIds : []).filter(Boolean))];
  if (enemyRoots.size === 0) {
    if (selected.length > 0) throw new Error("There are no enemy units on the battlefield to condemn.");
  } else {
    if (selected.length < 1 || selected.length > 3) {
      throw new Error("Select between one and three enemy units for Punishment.");
    }
    for (const unitId of selected) {
      if (!enemyRoots.has(unitId)) throw new Error("Each condemned unit must be an enemy unit currently on the battlefield.");
    }
    if (tabletopEligibilityConfirmed !== true) {
      throw new Error("Confirm the selected units qualify using the tabletop positions before recording Punishment.");
    }
  }

  const round = state.battle?.round ?? 0;
  const turn = state.turn ?? 0;
  const record = Object.freeze({
    playerId,
    round,
    turn,
    unitIds: Object.freeze(selected),
    unitNames: Object.freeze(selected.map((unitId) => enemyRoots.get(unitId)?.name ?? unitId)),
    tabletopEligibilityConfirmed: selected.length > 0 ? true : false
  });
  const existing = Array.isArray(state?.scoring?.punishmentCondemnations)
    ? state.scoring.punishmentCondemnations
    : [];
  const punishmentCondemnations = [
    ...existing.filter((item) => !(item?.playerId === playerId && item?.turn === turn)),
    record
  ];
  const next = {
    ...state,
    scoring: {
      ...(state.scoring ?? {}),
      punishmentCondemnations
    }
  };
  return appendHistoryEntry(next, createEvent("primary.punishment_condemnation_recorded", {
    playerId,
    unitIds: selected,
    unitNames: record.unitNames,
    tabletopEligibilityConfirmed: record.tabletopEligibilityConfirmed,
    round,
    turn,
    phase: state.phase
  }));
}
