import { getSecondaryMissionIntelligence } from "./secondary-mission-intelligence.js";
import { getSpatialContext, getLiveUnitPosition } from "./spatial-context.js";

/**
 * Approximate unit selection for a secondary.
 * Returns the most relevant friendly unit ID, or null.
 * Uses existing rough distance / zone data only — not authoritative.
 */
export function selectUnitForSecondary(state, { playerId, definitionId }) {
  if (!playerId || !definitionId) return null;

  const intel = getSecondaryMissionIntelligence(state, { playerId })
    .find(c => c.definitionId === definitionId);
  if (!intel || !intel.eligibleNow) return null;

  const units = (state.units ?? []).filter(u => u.ownerId === playerId && u.status !== "destroyed");
  if (!units.length) return null;

  const spatial = getSpatialContext(state, { playerId });
  const opponentId = (state.players ?? []).find(p => p.id !== playerId)?.id;

  switch (intel.focus) {
    case "enemy-deployment":
      return closestToZone(units, state, "opponent-deployment") ?? units[0]?.id ?? null;

    case "home-defence":
    case "assigned-guard":
    case "selected-objective":
    case "forward-objectives":
    case "two-midfield-objectives":
      return closestToRelevantObjective(units, spatial, intel) ?? units[0]?.id ?? null;

    case "destroy-character":
    case "destroy-heavy-model":
    case "destroy-large-unit":
    case "destroy-any-unit":
      return closestToQualifyingEnemy(units, state, opponentId, intel.focus) ?? units[0]?.id ?? null;

    default:
      return units[0]?.id ?? null;
  }
}

function closestToZone(units, state, zone) {
  // Approximate: prefer units whose live position is in the named zone.
  // Falls back to any unit if none match.
  const inZone = units.filter(u => {
    const pos = getLiveUnitPosition(state, u);
    if (!pos) return false;
    // Simple half-board check for opponent deployment (right side in landscape)
    if (zone === "opponent-deployment") return pos.x > 30;
    return false;
  });
  return (inZone[0] ?? units[0])?.id ?? null;
}

function closestToRelevantObjective(units, spatial, intel) {
  const targetObjId = intel.selectedObjectiveId
    ?? intel.guarding?.[0]?.objectiveId
    ?? null;
  if (!targetObjId) return units[0]?.id ?? null;

  const proximities = (spatial.objectiveProximity ?? [])
    .filter(p => p.objectiveId === targetObjId)
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

  const best = proximities[0];
  return best?.unitId ?? units[0]?.id ?? null;
}

function closestToQualifyingEnemy(units, state, opponentId, focus) {
  if (!opponentId) return units[0]?.id ?? null;
  const enemies = (state.units ?? []).filter(u => u.ownerId === opponentId && u.status !== "destroyed");
  const qualifying = enemies.filter(e => {
    if (focus === "destroy-character") return hasKeyword(e, "CHARACTER");
    if (focus === "destroy-heavy-model") return (e.wounds ?? 0) >= 10;
    if (focus === "destroy-large-unit") return (e.startingStrength ?? e.models?.length ?? 0) >= 13;
    return true;
  });
  if (!qualifying.length) return units[0]?.id ?? null;

  // Rough: pick first friendly unit (distance refinement can come later)
  return units[0]?.id ?? null;
}

function hasKeyword(unit, keyword) {
  const kws = unit.keywords ?? unit.datasheet?.keywords ?? [];
  return kws.some(k => String(k).toUpperCase().includes(keyword));
}
