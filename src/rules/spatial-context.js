const ROUGH_DISTANCE_BUCKET = 3;

function validPosition(position) {
  return Number.isFinite(position?.x) && Number.isFinite(position?.y);
}

function modelPositions(unit) {
  if (Array.isArray(unit?.models) && unit.models.some((model) => validPosition(model?.position))) {
    return unit.models.filter((model) => validPosition(model.position)).map((model) => model.position);
  }
  return validPosition(unit?.position) ? [unit.position] : [];
}

function centroid(unit) {
  const positions = modelPositions(unit);
  if (positions.length === 0) return null;
  return {
    x: positions.reduce((sum, position) => sum + position.x, 0) / positions.length,
    y: positions.reduce((sum, position) => sum + position.y, 0) / positions.length
  };
}

function hasRecordedMovement(state, unitId) {
  return (Array.isArray(state?.history) ? state.history : []).some((event) =>
    ["unit.normal_move_resolved", "unit.advanced"].includes(event?.type) &&
    event.payload?.unitId === unitId &&
    Array.isArray(event.payload?.moves) && event.payload.moves.length > 0
  );
}

export function getLiveUnitPosition(state, unit) {
  // The battlefield map displays the recorded deployment position until a
  // gameplay move replaces it. Tactical range/charge/territory advice must use
  // that same source or a unit can appear in one area on the map while being
  // evaluated from an older model position.
  const initialDeployment = state?.battlefieldMap?.actualDeployment?.[unit.id];
  if (initialDeployment && !hasRecordedMovement(state, unit.id)) {
    const position = initialDeployment.position ?? initialDeployment;
    if (validPosition(position)) return position;
  }
  return centroid(unit);
}

function roughDistance(first, second) {
  if (!validPosition(first) || !validPosition(second)) return null;
  const distance = Math.hypot(second.x - first.x, second.y - first.y);
  return Math.round(distance / ROUGH_DISTANCE_BUCKET) * ROUGH_DISTANCE_BUCKET;
}

function roughDistanceBand(distance) {
  if (distance == null) return "unknown";
  if (distance <= 6) return "close";
  if (distance <= 12) return "near";
  if (distance <= 24) return "mid";
  if (distance <= 36) return "far";
  return "very-far";
}

/**
 * Derive coarse positional context for tactical advice.
 *
 * This is intentionally advisory rather than authoritative. It rounds
 * distances into broad 3-inch increments and never changes game state or
 * determines legal range, line of sight, or objective control.
 */
export function getSpatialContext(state, { playerId } = {}) {
  if (!playerId) throw new TypeError("playerId is required.");

  const units = Array.isArray(state?.units) ? state.units : [];
  const positions = new Map(
    units.map((unit) => [unit.id, getLiveUnitPosition(state, unit)])
  );

  const ownedUnits = units.filter((unit) => unit.ownerId === playerId);
  const unitProximity = [];

  for (const unit of ownedUnits) {
    if (unit.status === "destroyed") continue;
    const origin = positions.get(unit.id);
    if (!origin) continue;

    for (const other of units) {
      if (other.id === unit.id || other.status === "destroyed") continue;
      const distance = roughDistance(origin, positions.get(other.id));
      if (distance == null) continue;
      unitProximity.push({
        unitId: unit.id,
        otherUnitId: other.id,
        distance,
        band: roughDistanceBand(distance)
      });
    }
  }

  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  const objectiveProximity = [];

  for (const unit of ownedUnits) {
    if (unit.status === "destroyed") continue;
    const origin = positions.get(unit.id);
    if (!origin) continue;

    for (const objective of objectives) {
      if (!validPosition(objective?.position)) continue;
      const distance = roughDistance(origin, objective.position);
      objectiveProximity.push({
        unitId: unit.id,
        objectiveId: objective.id,
        distance,
        band: roughDistanceBand(distance)
      });
    }
  }

  return {
    playerId,
    units: ownedUnits.map((unit) => ({
      unitId: unit.id,
      positionKnown: positions.get(unit.id) !== null
    })),
    unitProximity,
    objectiveProximity
  };
}
