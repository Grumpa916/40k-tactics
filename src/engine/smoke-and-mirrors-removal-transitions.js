import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getSmokeAndMirrorsMarkerRemovalOptions } from "../rules/smoke-and-mirrors-removal.js";

export function recordSmokeAndMirrorsMarkerRemoval(state, {
  playerId,
  unitId,
  objectiveId,
  markerOwnerPlayerId,
  tabletopConfirmed = false
} = {}) {
  if (!state?.battle || state.battle.status !== "active") {
    throw new Error("Operation markers can only be removed during an active battle.");
  }

  const activePlayerId = state.activePlayer ?? state.battle.activePlayerId ?? null;
  if (!playerId || playerId !== activePlayerId) {
    throw new Error("Only the active player can record a Surveil the Foe marker removal.");
  }
  if (!unitId || !objectiveId || !markerOwnerPlayerId) {
    throw new TypeError("Marker removal requires the moving unit, objective and marker owner.");
  }

  const unit = (state.units ?? []).find((item) => item?.id === unitId);
  if (!unit || unit.ownerId !== playerId || unit.status !== "deployed") {
    throw new Error("Select a deployed unit belonging to the active player.");
  }

  const option = getSmokeAndMirrorsMarkerRemovalOptions(state, { playerId })
    .find((item) => item.objectiveId === objectiveId && item.markerOwnerPlayerId === markerOwnerPlayerId);
  if (!option) {
    throw new Error("That objective does not currently have a removable Smoke and Mirrors Decoy marker for this player.");
  }
  if (tabletopConfirmed !== true) {
    throw new Error("Confirm on the physical tabletop that this unit ended a move within range of the marked objective.");
  }

  return appendHistoryEntry(state, createEvent("mission_marker.removed", {
    markerType: "smoke-and-mirrors-decoy",
    ownerPlayerId: markerOwnerPlayerId,
    removedByPlayerId: playerId,
    unitId,
    objectiveId,
    round: state.battle.round ?? null,
    turn: state.turn ?? null,
    phase: state.phase ?? null,
    tabletopConfirmed: true,
    sourceMissionDefinitionId: "primary-surveil-the-foe"
  }));
}