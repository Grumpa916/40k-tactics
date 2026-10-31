import {
  getActiveBurdenTrustAssignments,
  getSecondaryMissionHistory,
  SECONDARY_MISSION_STATUS
} from "./secondary-mission-lifecycle.js";
import { getLiveUnitPosition } from "./spatial-context.js";

const DEFINITION_ID = "secondary-burden-of-trust";
const OBJECTIVE_RANGE_INCHES = 3;

function distance(first, second) {
  if (!Number.isFinite(first?.x) || !Number.isFinite(first?.y) ||
      !Number.isFinite(second?.x) || !Number.isFinite(second?.y)) return null;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

/** Map-based evidence for Burden of Trust; range and control remain tabletop-confirmed. */
export function getBurdenOfTrustScoringEvidence(state, playerId, { instanceId = null } = {}) {
  if (!playerId) {
    return Object.freeze({
      count: null,
      assignments: Object.freeze([]),
      requiresTabletopConfirmation: false,
      detail: "Scoring player is not specified."
    });
  }

  const mission = getSecondaryMissionHistory(state, playerId).find((entry) =>
    entry.definitionId === DEFINITION_ID &&
    entry.status === SECONDARY_MISSION_STATUS.ACTIVE &&
    (!instanceId || entry.instanceId === instanceId)
  );
  if (!mission) {
    return Object.freeze({
      count: null,
      assignments: Object.freeze([]),
      requiresTabletopConfirmation: false,
      detail: "No active Burden of Trust card is recorded for this player."
    });
  }

  const assignments = getActiveBurdenTrustAssignments(state, mission, { turn: state.turn ?? 0 });
  if (assignments.length === 0) {
    return Object.freeze({
      count: 0,
      assignments: Object.freeze([]),
      requiresTabletopConfirmation: false,
      detail: "No Burden of Trust guard assignments are active at this checkpoint."
    });
  }

  const units = Array.isArray(state?.units) ? state.units : [];
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  let qualifyingCount = 0;
  let unresolvedCount = 0;
  const reviews = assignments.map((assignment) => {
    const objective = objectives.find((item) => item?.id === assignment.objectiveId);
    const unit = units.find((item) => item?.id === assignment.unitId && item.ownerId === playerId);
    const objectiveName = objective?.name ?? objective?.label ?? assignment.objectiveId;
    const unitName = unit?.name ?? assignment.unitId;

    if (!objective || !unit || unit.status !== "deployed" || !objective.control?.controlState) {
      unresolvedCount += 1;
      return Object.freeze({
        objectiveId: assignment.objectiveId,
        objectiveName,
        unitId: assignment.unitId,
        unitName,
        mapDistance: null,
        mapSuggestsGuarded: null,
        detail: objective && unit?.status !== "deployed"
          ? unitName + " is not currently deployed to guard " + objectiveName + "."
          : objectiveName + " or its control/guard record is unavailable."
      });
    }

    if (objective.control.controlState !== "controlled" || objective.control.controllerId !== playerId) {
      return Object.freeze({
        objectiveId: assignment.objectiveId,
        objectiveName,
        unitId: assignment.unitId,
        unitName,
        mapDistance: null,
        mapSuggestsGuarded: false,
        detail: objectiveName + " is not recorded as controlled by you."
      });
    }

    const unitPosition = getLiveUnitPosition(state, unit);
    const mapDistance = distance(unitPosition, objective.position);
    if (mapDistance == null) {
      unresolvedCount += 1;
      return Object.freeze({
        objectiveId: assignment.objectiveId,
        objectiveName,
        unitId: assignment.unitId,
        unitName,
        mapDistance: null,
        mapSuggestsGuarded: null,
        detail: unitName + " is assigned to " + objectiveName + ", but the map cannot estimate range."
      });
    }

    const mapSuggestsGuarded = mapDistance <= OBJECTIVE_RANGE_INCHES;
    if (mapSuggestsGuarded) qualifyingCount += 1;
    return Object.freeze({
      objectiveId: assignment.objectiveId,
      objectiveName,
      unitId: assignment.unitId,
      unitName,
      mapDistance,
      mapSuggestsGuarded,
      detail: objectiveName + " — " + unitName + ": map distance about " +
        mapDistance.toFixed(1) + " inches; " +
        (mapSuggestsGuarded ? "within" : "outside") +
        " the approximate 3-inch range."
    });
  });

  const count = unresolvedCount > 0 ? null : qualifyingCount;
  const summary = reviews.map((item) => item.detail).join(" ");
  return Object.freeze({
    count,
    assignments: Object.freeze(reviews),
    assignedObjectiveCount: assignments.length,
    qualifyingCount,
    unresolvedCount,
    requiresTabletopConfirmation: true,
    detail: summary + " Verify each unit is within 3 inches of its assigned objective and that you control it on the tabletop before confirming VP."
  });
}
