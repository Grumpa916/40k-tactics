import { getProbabilisticUnitProfile } from '../rules/saved-roster-combat-profile.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { createUnit, UNIT_STATUS } from "../state/unit.js";
import { selectRosterForBattle } from "../state/army-roster-library.js";

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "battle-roster-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

/**
 * Applies a reusable roster to a player during setup, preserving a battle-specific
 * snapshot and replacing only that player's current units.
 */
export function applyArmyRosterToBattle(state, { roster, playerId, snapshotId = makeId(), selectedAt = new Date().toISOString() } = {}) {
  if (!state?.battle || state.battle.status !== "setup" || state.phase !== "setup") {
    throw new Error("An army roster can only be assigned while battle setup is active.");
  }
  if (!roster || !roster.id || !Array.isArray(roster.units)) {
    throw new TypeError("A valid saved army roster is required.");
  }
  if (!playerId || !state.players?.some((player) => player.id === playerId)) {
    throw new Error("Choose a player in this battle.");
  }
  const snapshot = selectRosterForBattle(roster, {
    playerId, snapshotId, battleId: state.battle.id, selectedAt
  });
  const units = snapshot.units.map((unit) => createUnit({
    id: playerId + ":" + unit.id,
    ownerId: playerId,
    name: unit.name,
    status: UNIT_STATUS.RESERVES,
    models: [],
    metadata: {
      rosterUnitId: unit.id,
      sourceRosterId: roster.id,
      sourceRosterName: roster.name,
      notes: String(unit.notes ?? ""),
      datasheetId: unit.datasheetId ?? null,
      modelCount: Math.max(1, Number(unit.modelCount) || 1),
      dataSource: unit.dataSource ?? { status: unit.datasheetId ? "unverified" : "manual-entry" }
    }
  }));
  const next = {
    ...state,
    units: [...(state.units ?? []).filter((unit) => unit.ownerId !== playerId), ...units],
    armyRosters: {
      ...(state.armyRosters ?? {}),
      [playerId]: snapshot
    }
  };
  next.units = next.units.map(unit => {
    if (unit.ownerId !== playerId) return unit;
    const profile = getProbabilisticUnitProfile(next, unit);
    const vitals = getLiveUnitVitals(next, unit);
    return { ...unit, wounds: vitals.wounds, startingWounds: vitals.startingWounds,
      profile: { characteristics: { ...profile.characteristics } } };
  });
  return appendHistoryEntry(next, createEvent("battle.army_roster_assigned", {
    playerId, rosterId: roster.id, rosterName: roster.name,
    snapshotId, unitCount: units.length
  }));
}

