import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from "./secondary-mission-lifecycle.js";
import { getLiveUnitPosition } from "./spatial-context.js";
import { getTerritoryStatusForPosition } from "./battlefield-territory.js";
import { getSelectedBattlefieldGeometry } from "./battlefield-territory.js";
import { pointInTerrainPolygon } from "./death-trap-state.js";
import { UNIT_STATUS } from "../state/unit.js";

function ownDeploymentPoints(state, playerId, geometry) {
  const attackerId = state?.preGameSetup?.attackerPlayerId;
  const defenderId = state?.preGameSetup?.defenderPlayerId;
  const zoneKey = playerId === attackerId ? "attackerDeployment" :
    playerId === defenderId ? "defenderDeployment" : null;
  const points = zoneKey ? geometry?.deploymentZones?.[zoneKey]?.points : null;
  return Array.isArray(points) && points.length >= 3 ? points : null;
}

function positionForMap(state, unit) {
  if (!unit || unit.status !== UNIT_STATUS.DEPLOYED) return null;
  return getLiveUnitPosition(state, unit);
}

/** Advisory state for the selected Beacon; exact position and scoring stay tabletop-confirmed. */
export function getBeaconMissionState(state, { playerId, instanceId = null } = {}) {
  if (!playerId) return Object.freeze({ available: false, reason: "Player is not specified." });
  const entry = getSecondaryMissionHistory(state, playerId).find((item) =>
    item.definitionId === "secondary-beacon" &&
    item.status === SECONDARY_MISSION_STATUS.ACTIVE &&
    (!instanceId || item.instanceId === instanceId));
  if (!entry) return Object.freeze({ available: false, reason: "No active Beacon card is recorded." });

  const beaconUnitId = entry.cardState?.beaconUnitId ?? null;
  const unit = beaconUnitId
    ? (state?.units ?? []).find((item) => item.id === beaconUnitId && item.ownerId === playerId) ?? null
    : null;
  if (!beaconUnitId) {
    return Object.freeze({
      available: true, selected: false, instanceId: entry.instanceId,
      reviewSummary: "Beacon unit selection is still required."
    });
  }
  if (!unit) {
    return Object.freeze({
      available: true, selected: true, instanceId: entry.instanceId, beaconUnitId,
      unitName: beaconUnitId, unitStatus: "missing", onBattlefield: false,
      reviewSummary: "The selected Beacon unit record is unavailable. It cannot be replaced; check the battle record before scoring."
    });
  }

  const onBattlefield = unit.status === UNIT_STATUS.DEPLOYED;
  const position = positionForMap(state, unit);
  const geometry = getSelectedBattlefieldGeometry(state);
  const deploymentPoints = ownDeploymentPoints(state, playerId, geometry);
  const deploymentZoneEstimate = position && deploymentPoints
    ? pointInTerrainPolygon(position, deploymentPoints) ? "inside" : "outside"
    : "unknown";
  const territoryEstimate = position
    ? getTerritoryStatusForPosition(state, { playerId, position }).territory
    : "unknown";
  const zoneText = deploymentZoneEstimate === "inside" ? "inside your deployment zone"
    : deploymentZoneEstimate === "outside" ? "outside your deployment zone"
      : "deployment-zone position unknown";
  const territoryText = territoryEstimate === "mine" ? "within your territory"
    : territoryEstimate === "opponent" ? "in opponent territory"
      : territoryEstimate === "boundary" ? "near the territory boundary"
        : "territory position unknown";
  const reviewSummary = onBattlefield
    ? "Beacon " + unit.name + " is on the battlefield. Map estimates: " + zoneText + "; " + territoryText +
      ". Map positions are approximate—confirm model positions on the tabletop before scoring."
    : "Beacon " + unit.name + " is " + unit.status + " and is not currently on the battlefield. Neither scoring tier applies. The selected unit cannot be replaced.";

  return Object.freeze({
    available: true,
    selected: true,
    instanceId: entry.instanceId,
    beaconUnitId,
    unitName: unit.name,
    unitStatus: unit.status,
    onBattlefield,
    deploymentZoneEstimate,
    territoryEstimate,
    positionKnown: Boolean(position),
    reviewSummary
  });
}

/** Return mission-specific evidence while preserving the player's tabletop authority. */
export function getBeaconScoringEvidence(state, playerId, conditionType) {
  const beacon = getBeaconMissionState(state, { playerId });
  if (!beacon.available || !beacon.selected) {
    return { count: null, detail: beacon.reviewSummary ?? beacon.reason ?? "Select the Beacon unit when the card is drawn." };
  }
  if (!beacon.onBattlefield) {
    return { count: 0, detail: beacon.reviewSummary };
  }
  const estimate = conditionType === "beacon-outside-deployment-zone"
    ? beacon.deploymentZoneEstimate
    : beacon.territoryEstimate === "opponent" ? "outside"
      : beacon.territoryEstimate === "mine" ? "inside"
        : "unknown";
  const conditionLabel = conditionType === "beacon-outside-deployment-zone"
    ? "outside your deployment zone"
    : "outside your territory";
  const mapNote = estimate === "outside" ? "The map suggests the condition may be met."
    : estimate === "inside" ? "The map suggests the condition may not be met."
      : "The map cannot determine this condition.";
  return {
    count: null,
    detail: beacon.reviewSummary + " " + mapNote + " Confirm whether the Beacon is " + conditionLabel + " on the tabletop."
  };
}
