import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getBattlePrimaryMissions, getEventCompanionMapLayout } from "../rules/event-companion-map-catalog.js";

const WIDTH_IN = 60;
const HEIGHT_IN = 44;

function validatePosition(position) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) ||
      position.x < 0 || position.x > WIDTH_IN || position.y < 0 || position.y > HEIGHT_IN) {
    throw new RangeError("Position must be within the 60 by 44 inch battlefield.");
  }
  return { x: Math.round(position.x * 10) / 10, y: Math.round(position.y * 10) / 10 };
}

function requirePlanningState(state) {
  if (state.battle && state.battle.status !== "setup") {
    throw new Error("Deployment planning is locked after deployment begins.");
  }
}

function requirePlanningUnit(state, unitId, playerId) {
  if (!unitId) throw new TypeError("Unit id is required.");
  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (!playerId) throw new TypeError("Player id is required for deployment planning.");
  if (unit.ownerId !== playerId) throw new Error("Only your own units can be placed in the deployment plan.");
  if (unit.status === "destroyed") throw new Error("Destroyed units cannot be planned for deployment.");
  return unit;
}

function requirePlayerUnit(state, unitId, playerId) {
  if (!unitId) throw new TypeError("Unit id is required.");
  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Unit not found: " + unitId);
  if (!playerId) throw new TypeError("Player id is required.");
  if (unit.ownerId !== playerId) throw new Error("Only the owning player can change this unit's deployment.");
  if (unit.status === "destroyed") throw new Error("Destroyed units cannot be placed on the battlefield.");
  return unit;
}

export function setDeploymentPlanPosition(state, { unitId, playerId, position } = {}) {
  requirePlanningState(state);
  requirePlanningUnit(state, unitId, playerId);
  const nextPosition = validatePosition(position);
  const previousPosition = state.battlefieldMap?.deploymentPlan?.[unitId] ?? null;
  const nextState = {
    ...state,
    battlefieldMap: {
      ...(state.battlefieldMap ?? {}),
      deploymentPlan: { ...(state.battlefieldMap?.deploymentPlan ?? {}), [unitId]: nextPosition }
    }
  };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.deployment_plan_position_set", {
    unitId, playerId, position: nextPosition, previousPosition
  }));
}

export function clearDeploymentPlanPosition(state, { unitId, playerId } = {}) {
  requirePlanningState(state);
  requirePlanningUnit(state, unitId, playerId);
  const currentPlan = state.battlefieldMap?.deploymentPlan ?? {};
  if (!Object.hasOwn(currentPlan, unitId)) return state;
  const deploymentPlan = { ...currentPlan };
  delete deploymentPlan[unitId];
  const nextState = { ...state, battlefieldMap: { ...(state.battlefieldMap ?? {}), deploymentPlan } };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.deployment_plan_position_cleared", { unitId, playerId }));
}

export function clearDeploymentPlan(state, { playerId } = {}) {
  requirePlanningState(state);
  if (!playerId) throw new TypeError("Player id is required to clear a deployment plan.");
  const ownedUnitIds = new Set(state.units.filter((unit) => unit.ownerId === playerId).map((unit) => unit.id));
  const currentPlan = state.battlefieldMap?.deploymentPlan ?? {};
  const deploymentPlan = Object.fromEntries(Object.entries(currentPlan).filter(([unitId]) => !ownedUnitIds.has(unitId)));
  if (Object.keys(deploymentPlan).length === Object.keys(currentPlan).length) return state;
  const nextState = { ...state, battlefieldMap: { ...(state.battlefieldMap ?? {}), deploymentPlan } };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.deployment_plan_cleared", { playerId }));
}

function requireDeploymentState(state) {
  if (!state.battle || state.battle.status !== "deployment") {
    throw new Error("Actual deployment can only be recorded during deployment.");
  }
}

export function setActualDeploymentPosition(state, { unitId, playerId, position } = {}) {
  requireDeploymentState(state);
  const unit = requirePlayerUnit(state, unitId, playerId);
  const nextPosition = validatePosition(position);
  const previousPosition = state.battlefieldMap?.actualDeployment?.[unitId] ?? null;
  const declaredReserves = { ...(state.battlefieldMap?.declaredReserves ?? {}) };
  delete declaredReserves[unitId];
  const nextState = {
    ...state,
    units: state.units.map((item) => item.id === unitId
      ? { ...item, status: "deployed", position: nextPosition }
      : item),
    battlefieldMap: {
      ...(state.battlefieldMap ?? {}),
      actualDeployment: { ...(state.battlefieldMap?.actualDeployment ?? {}), [unitId]: nextPosition },
      declaredReserves
    }
  };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.actual_deployment_position_set", {
    unitId, playerId, position: nextPosition, previousPosition
  }));
}

export function declareUnitReserve(state, { unitId, playerId } = {}) {
  requireDeploymentState(state);
  const unit = requirePlayerUnit(state, unitId, playerId);
  const actualDeployment = { ...(state.battlefieldMap?.actualDeployment ?? {}) };
  delete actualDeployment[unitId];
  const declaredReserves = { ...(state.battlefieldMap?.declaredReserves ?? {}), [unitId]: true };
  const nextState = {
    ...state,
    units: state.units.map((item) => item.id === unitId
      ? { ...item, status: "reserves", position: null }
      : item),
    battlefieldMap: { ...(state.battlefieldMap ?? {}), actualDeployment, declaredReserves }
  };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.unit_declared_reserve", {
    unitId, playerId, previousPosition: state.battlefieldMap?.actualDeployment?.[unitId] ?? null
  }));
}


const EVENT_COMPANION_FORCE_DISPOSITIONS = Object.freeze([
  "Take and Hold", "Disruption", "Purge the Foe", "Priority Assets", "Reconnaissance"
]);

const EVENT_COMPANION_OBJECTIVE_NAMES = Object.freeze([
  "Defender Home", "Attacker Home", "Central 1", "Expansion 1", "Expansion 2"
]);

function synchronizeCanonicalLayoutObjectives(state, missionSetup) {
  if (!missionSetup?.myDisposition || !missionSetup?.opponentDisposition) return state.objectives ?? [];
  const missions = getBattlePrimaryMissions(missionSetup.myDisposition, missionSetup.opponentDisposition);
  if (!missions) return state.objectives ?? [];
  const geometry = getEventCompanionMapLayout(missions.myMission, missions.opponentMission, missionSetup.layout);
  if (!geometry?.verified) return state.objectives ?? [];

  const objectives = [...(Array.isArray(state.objectives) ? state.objectives : [])];
  for (const name of EVENT_COMPANION_OBJECTIVE_NAMES) {
    const position = geometry.objectivePositions?.[name];
    if (!position) continue;
    const canonicalId = "event-companion:" + name;
    const index = objectives.findIndex((item) => item &&
      (item.layoutObjective === name || item.id === canonicalId));
    if (index >= 0) {
      // Explicit layoutObjective links are authoritative. Preserve the application
      // ID and control record while updating only the verified position.
      objectives[index] = { ...objectives[index], position: { ...position } };
    } else {
      objectives.push({
        id: canonicalId,
        name,
        label: name,
        layoutObjective: name,
        position: { ...position },
        control: null
      });
    }
  }
  return objectives;
}

export function setEventCompanionMissionSetup(state, {
  myDisposition, opponentDisposition, layout = "A"
} = {}) {
  if (state.battle && state.battle.status !== "setup") {
    throw new Error("Mission setup is locked after deployment begins.");
  }
  if ((myDisposition != null && !EVENT_COMPANION_FORCE_DISPOSITIONS.includes(myDisposition)) ||
      (opponentDisposition != null && !EVENT_COMPANION_FORCE_DISPOSITIONS.includes(opponentDisposition))) {
    throw new TypeError("Choose a valid Force Disposition for each army.");
  }
  if (!["A", "B", "C"].includes(layout)) {
    throw new TypeError("Choose layout A, B, or C.");
  }
  const previous = state.battlefieldMap?.missionSetup ?? null;
  const nextSetup = { myDisposition, opponentDisposition, layout };
  if (previous?.myDisposition === myDisposition &&
      previous?.opponentDisposition === opponentDisposition &&
      previous?.layout === layout) return state;
  const objectives = synchronizeCanonicalLayoutObjectives(state, nextSetup);
  const nextState = {
    ...state,
    objectives,
    battlefieldMap: {
      ...(state.battlefieldMap ?? {}),
      missionSetup: nextSetup
    }
  };
  return appendHistoryEntry(nextState, createEvent("battlefield_map.event_companion_mission_setup_set", {
    previous, missionSetup: nextSetup
  }));
}
