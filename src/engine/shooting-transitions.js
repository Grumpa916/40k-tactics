import { getMissionActionOptions, ACTION_REVIEW_TIMINGS } from "../rules/mission-action-state.js";
import { getDeathTrapTerrainOptions } from "../rules/death-trap-state.js";
import { getSmokeAndMirrorsObjectiveOptions } from "../rules/smoke-and-mirrors-state.js";
import { getTriangulationObjectiveOptions, getTriangulationState } from "../rules/triangulation-state.js";
import { getSurveilTheFoeTargetOptions } from "../rules/surveil-the-foe-state.js";
import { getGatherIntelObjectiveOptions } from "../rules/gather-intel-state.js";
import { getSecureAssetObjectiveOptions, getSecureAssetState } from "../rules/secure-asset-state.js";
import {
  getLocateAndDenyCentralObjectiveOptions,
  getLocateAndDenyMarkerRemovalOptions,
  getLocateAndDenyState
} from "../rules/locate-and-deny-state.js";
import { recordLocateAndDenyMarkerSetup } from "./locate-and-deny-transitions.js";
import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getShootingCandidates } from "../rules/shooting-candidates.js";
import { changePhase } from "./state-transitions.js";

const SHOOTING_ACTION_TYPES = new Set(["shoot", "mission_action", "special_action", "not_shoot"]);

export function recordShootingActivation(state, {
  unitId,
  actionType = "shoot",
  actionId = null,
  missionInstanceId = null,
  objectiveId = null,
  terrainAreaId = null,
  targetUnitId = null,
  reviewTiming = null,
  rulesConfirmed = false,
  locateSetupOnly = false,
  locateMarkerSetupTerrainAreaIds = null
} = {}) {
  if (!unitId) throw new TypeError("Shooting activation unit id is required.");
  if (!SHOOTING_ACTION_TYPES.has(actionType)) {
    throw new TypeError("Shooting activation action type is invalid.");
  }
  if (["mission_action", "special_action"].includes(actionType) && !actionId) {
    throw new TypeError("A Shooting action id is required for non-shoot activations.");
  }
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "shooting") throw new Error("Shooting activations may only be recorded in the Shooting phase.");

  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Shooting activation unit not found: " + unitId);
  if (unit.status !== UNIT_STATUS.DEPLOYED) throw new Error("Shooting activation unit must be deployed.");
  if (actionType === "shoot" && state.history.some((event) =>
    event?.type === "unit.fell_back" &&
    event?.payload?.unitId === unitId &&
    event?.payload?.round === state.battle.round &&
    event?.payload?.turn === state.turn
  )) {
    throw new Error("A unit that Fell Back cannot shoot this turn.");
  }
  if (!unit.ownerId) throw new Error("Shooting activation unit must have an owner.");

  const activePlayerId = state.activePlayer ?? state.battle.activePlayerId ?? null;
  if (activePlayerId && unit.ownerId !== activePlayerId) {
    throw new Error("Only the active player's units can be selected for a Shooting activation.");
  }

  if (locateSetupOnly) {
    if (actionType !== "mission_action" || actionId !== "primary-locate-and-deny") {
      throw new Error("Locate and Deny marker setup must be recorded from its mission Action workflow.");
    }
    if (!Array.isArray(locateMarkerSetupTerrainAreaIds)) {
      throw new TypeError("Locate and Deny marker setup requires selected terrain areas.");
    }
    return recordLocateAndDenyMarkerSetup(state, {
      playerId: activePlayerId,
      terrainAreaIds: locateMarkerSetupTerrainAreaIds
    });
  }

  const candidates = getShootingCandidates(state);
  if (!candidates.available.includes(unitId) && !(actionType !== "shoot" && candidates.actionOnly.includes(unitId))) {
    throw new Error("Unit is not an available Shooting candidate.");
  }

  let linkedMission = null;
  let deathTrapTerrain = null;
  if (missionInstanceId) {
    if (actionType !== "mission_action") throw new Error("Only a mission Action can link a mission card.");
    linkedMission = getMissionActionOptions(state, activePlayerId).find(item => item.instanceId === missionInstanceId);
    if (!linkedMission) throw new Error("Select one of the active player's active secondary mission Actions or available primary mission Actions.");
    if (!rulesConfirmed) throw new Error("Confirm action eligibility against the physical mission card.");
    if (!ACTION_REVIEW_TIMINGS.includes(reviewTiming)) throw new Error("Choose the card's scoring checkpoint.");
    if (objectiveId && !state.objectives.some(item=>item.id===objectiveId)) throw new Error("Select an objective on this battlefield.");
    if (linkedMission.definitionId === "primary-death-trap") {
      if (!terrainAreaId) throw new Error("Select the terrain area being trapped.");
      deathTrapTerrain = getDeathTrapTerrainOptions(state, { playerId: activePlayerId }).find(item => item.terrainAreaId === terrainAreaId);
      if (!deathTrapTerrain) throw new Error("Select a terrain area from the current Event Companion battlefield.");
      if (deathTrapTerrain.trapped) throw new Error("That terrain area is already trapped.");
      if (deathTrapTerrain.boobyTrapEligibleByGeometry === false) {
        throw new Error("That terrain area is wholly within your deployment zone and is not a non-home objective area.");
      }
    }
    if (linkedMission.definitionId === "primary-smoke-and-mirrors") {
      if (!objectiveId) throw new Error("Select the objective being Decoyed.");
      const eligibleObjective = getSmokeAndMirrorsObjectiveOptions(state, { playerId: activePlayerId })
        .find(item => item.objectiveId === objectiveId);
      if (!eligibleObjective) {
        throw new Error("Select a non-home objective that is not already Decoyed and has not been selected for another Decoy attempt this turn.");
      }
    }
    if (linkedMission.definitionId === "primary-triangulation") {
      const triangulation = getTriangulationState(state, { playerId: activePlayerId });
      if (state.battle.round < 2) throw new Error("Triangulate cannot be started before the second battle round.");
      if (triangulation.usedThisTurn) throw new Error("Triangulate can only be started once per turn.");
      if (reviewTiming !== "end-of-turn") throw new Error("Triangulate completes at the end of your turn.");
      if (!objectiveId || !getTriangulationObjectiveOptions(state, { playerId: activePlayerId }).some(item => item.objectiveId === objectiveId)) {
        throw new Error("Select a non-home objective that is not already triangulated or reserved by another Triangulate attempt.");
      }
    }
    if (linkedMission.definitionId === "primary-gather-intel") {
      if (state.battle.round < 2) throw new Error("Extract Intelligence cannot be started before the second battle round.");
      if (reviewTiming !== "end-of-turn") throw new Error("Extract Intelligence completes at the end of your turn.");
      if (!objectiveId || !getGatherIntelObjectiveOptions(state, { playerId: activePlayerId }).some(item => item.objectiveId === objectiveId)) {
        throw new Error("Select a different eligible non-home objective that does not already have one of your Gather Intel operation markers or another Extract Intelligence attempt this turn.");
      }
    }
    if (linkedMission.definitionId === "primary-secure-asset") {
      const secure = getSecureAssetState(state, { playerId: activePlayerId });
      if (secure.usedThisTurn) throw new Error("Secure Asset can only be started once per turn.");
      if (reviewTiming !== "end-of-turn") throw new Error("Secure Asset completes at the end of your turn.");
      if (!objectiveId || !getSecureAssetObjectiveOptions(state, { playerId: activePlayerId }).some(item => item.objectiveId === objectiveId)) {
        throw new Error("Select an objective other than your home objective for Secure Asset.");
      }
    }
    if (linkedMission.definitionId === "primary-locate-and-deny") {
      const locate = getLocateAndDenyState(state, { playerId: activePlayerId });
      if (!locate.setupComplete) throw new Error("Record the Locate and Deny operation-marker setup before starting Sensor Sweep.");
      if (locate.activeMarkerCount <= 1) throw new Error("Sensor Sweep cannot be started when only one operation marker remains.");
      if (locate.sensorSweepUsedThisTurn) throw new Error("Sensor Sweep can only be started once per turn.");
      if (!objectiveId || !getLocateAndDenyCentralObjectiveOptions(state, { playerId: activePlayerId }).some(item => item.objectiveId === objectiveId)) {
        throw new Error("Select the central objective this unit is within range of for Sensor Sweep.");
      }
      if (!terrainAreaId || !getLocateAndDenyMarkerRemovalOptions(state, { playerId: activePlayerId }).some(item => item.terrainAreaId === terrainAreaId)) {
        throw new Error("Select one of your remaining Locate and Deny operation markers to remove.");
      }
    }
    if (linkedMission.definitionId === "primary-surveil-the-foe") {
      if (!targetUnitId) throw new Error("Select the enemy unit being Surveilled.");
      const eligibleTarget = getSurveilTheFoeTargetOptions(state, { playerId: activePlayerId, unitId })
        .find(item => item.targetUnitId === targetUnitId);
      if (!eligibleTarget) {
        throw new Error("Select an enemy deployed unit that has not already been Surveilled this turn.");
      }
    }
  }
  return appendHistoryEntry(state, createEvent("shooting.unit_activated", {
    unitId,
    playerId: unit.ownerId,
    round: state.battle.round,
    turn: state.turn,
    actionType,
    actionId:linkedMission?.definitionId ?? actionId,
    ...(linkedMission ? { missionInstanceId, missionDefinitionId:linkedMission.definitionId, missionName:linkedMission.name,
      reviewTiming, objectiveId, ...(terrainAreaId ? { terrainAreaId } : {}), ...(targetUnitId ? { targetUnitId } : {}), ...(deathTrapTerrain ? { actionCompletedImmediately: true } : {}), rulesConfirmed:true } : {})
  }));
}

export function completeShootingPhase(state) {
  const candidates = getShootingCandidates(state);
  if (candidates.available.length > 0) {
    throw new Error("Shooting phase cannot be completed while eligible units remain.");
  }
  return changePhase(state, { phase: "charge" });
}
