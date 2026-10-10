import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

const WIDTH_IN = 60;
const HEIGHT_IN = 44;

function validatePosition(position) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) ||
      position.x < 0 || position.x > WIDTH_IN || position.y < 0 || position.y > HEIGHT_IN) {
    throw new RangeError("Planned position must be within the 60 by 44 inch battlefield.");
  }
  return { x: Math.round(position.x * 10) / 10, y: Math.round(position.y * 10) / 10 };
}

function requirePlanningState(state) {
  if (state.battle && state.battle.status !== "setup") {
    throw new Error("Deployment planning is locked after deployment begins.");
  }
}

function requirePlayerUnit(state, unitId, playerId) {
  if (!unitId) throw new TypeError("Unit id is required.");
  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (!playerId) throw new TypeError("Player id is required for deployment planning.");
  if (unit.ownerId !== playerId) throw new Error("Only your own units can be placed in the deployment plan.");
  if (unit.status === "destroyed") throw new Error("Destroyed units cannot be planned for deployment.");
  return unit;
}

export function setDeploymentPlanPosition(state, { unitId, playerId, position } = {}) {
  requirePlanningState(state);
  requirePlayerUnit(state, unitId, playerId);
  const nextPosition = validatePosition(position);
  const previousPosition = state.battlefieldMap?.deploymentPlan?.[unitId] ?? null;
  const nextState = {
    ...state,
    battlefieldMap: {
      ...(state.battlefieldMap ?? {}),
      deploymentPlan: {
        ...(state.battlefieldMap?.deploymentPlan ?? {}),
        [unitId]: nextPosition
      }
    }
  };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.deployment_plan_position_set", {
    unitId, playerId, position: nextPosition, previousPosition
  }));
}

export function clearDeploymentPlanPosition(state, { unitId, playerId } = {}) {
  requirePlanningState(state);
  requirePlayerUnit(state, unitId, playerId);
  const currentPlan = state.battlefieldMap?.deploymentPlan ?? {};
  if (!Object.hasOwn(currentPlan, unitId)) return state;
  const deploymentPlan = { ...currentPlan };
  delete deploymentPlan[unitId];
  const nextState = {
    ...state,
    battlefieldMap: { ...(state.battlefieldMap ?? {}), deploymentPlan }
  };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.deployment_plan_position_cleared", {
    unitId, playerId
  }));
}

export function clearDeploymentPlan(state, { playerId } = {}) {
  requirePlanningState(state);
  if (!playerId) throw new TypeError("Player id is required to clear a deployment plan.");
  const ownedUnitIds = new Set(state.units.filter((unit) => unit.ownerId === playerId).map((unit) => unit.id));
  const currentPlan = state.battlefieldMap?.deploymentPlan ?? {};
  const deploymentPlan = Object.fromEntries(Object.entries(currentPlan).filter(([unitId]) => !ownedUnitIds.has(unitId)));
  if (Object.keys(deploymentPlan).length === Object.keys(currentPlan).length) return state;
  const nextState = {
    ...state,
    battlefieldMap: { ...(state.battlefieldMap ?? {}), deploymentPlan }
  };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.deployment_plan_cleared", { playerId }));
}
