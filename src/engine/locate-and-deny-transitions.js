import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getLocateAndDenySetup, getLocateAndDenyTerrainOptions, isLocateAndDenyMissionForPlayer } from "../rules/locate-and-deny-state.js";

export function recordLocateAndDenyMarkerSetup(state, {
  playerId,
  terrainAreaIds = [],
  perspectivePlayerId = null
} = {}) {
  const perspective = perspectivePlayerId ?? state?.players?.[0]?.id ?? playerId;
  if (!playerId || !isLocateAndDenyMissionForPlayer(state, playerId, perspective)) {
    throw new Error("Locate and Deny is not active for that player.");
  }
  const locateActionStarted = (state?.history ?? []).some((event) =>
    event?.type === "shooting.unit_activated" &&
    event.payload?.playerId === playerId &&
    event.payload?.missionDefinitionId === "primary-locate-and-deny"
  );
  if (locateActionStarted) {
    throw new Error("Locate and Deny marker setup cannot be changed after Sensor Sweep has been started.");
  }
  if (!Array.isArray(terrainAreaIds)) throw new TypeError("terrainAreaIds must be an array.");
  const unique = [...new Set(terrainAreaIds.filter((id) => typeof id === "string" && id.length > 0))];
  const options = getLocateAndDenyTerrainOptions(state, { playerId, perspectivePlayerId: perspective });
  const eligible = new Set(options.filter((entry) => entry.eligible).map((entry) => entry.terrainAreaId));
  const expected = options.some((entry) => entry.eligible) ? Math.min(5, eligible.size) : 5;
  if (unique.length !== expected) {
    throw new Error(`Select exactly ${expected} eligible terrain area${expected === 1 ? "" : "s"} for Locate and Deny.`);
  }
  if (!unique.every((id) => eligible.has(id))) {
    throw new Error("Locate and Deny markers must be placed in eligible terrain areas outside your deployment zone.");
  }
  const next = appendHistoryEntry(state, createEvent("locate_and_deny.setup_recorded", {
    playerId,
    terrainAreaIds: unique,
    markerType: "locate-and-deny-operation",
    sourceMissionDefinitionId: "primary-locate-and-deny",
    lateAppCapture: state?.battle?.status === "active"
  }));
  const setup = getLocateAndDenySetup(next, { playerId, perspectivePlayerId: perspective });
  if (!setup.setupComplete) throw new Error("Locate and Deny marker setup could not be validated.");
  return next;
}
