import { getBattlePrimaryMissions, getEventCompanionMapLayout } from "./event-companion-map-catalog.js";

const BATTLEFIELD_WIDTH = 60;
const BATTLEFIELD_HEIGHT = 44;
const DEFAULT_MAP_UNCERTAINTY = 3;
const EPSILON = 0.2;

function validRect(rect) {
  return Boolean(rect &&
    Number.isFinite(Number(rect.x)) && Number.isFinite(Number(rect.y)) &&
    Number.isFinite(Number(rect.width)) && Number.isFinite(Number(rect.height)) &&
    Number(rect.width) > 0 && Number(rect.height) > 0);
}

function normalizeRect(rect) {
  if (!validRect(rect)) return null;
  return Object.freeze({
    x: Number(rect.x),
    y: Number(rect.y),
    width: Number(rect.width),
    height: Number(rect.height)
  });
}

function sharedBoundary(first, second) {
  if (!first || !second) return null;

  const firstRight = first.x + first.width;
  const secondRight = second.x + second.width;
  const firstTop = first.y + first.height;
  const secondTop = second.y + second.height;

  const fullHeight = Math.abs(first.height - BATTLEFIELD_HEIGHT) <= EPSILON &&
    Math.abs(second.height - BATTLEFIELD_HEIGHT) <= EPSILON;
  if (fullHeight) {
    if (Math.abs(firstRight - second.x) <= EPSILON) {
      return Object.freeze({ orientation: "vertical", coordinate: (firstRight + second.x) / 2 });
    }
    if (Math.abs(secondRight - first.x) <= EPSILON) {
      return Object.freeze({ orientation: "vertical", coordinate: (secondRight + first.x) / 2 });
    }
  }

  const fullWidth = Math.abs(first.width - BATTLEFIELD_WIDTH) <= EPSILON &&
    Math.abs(second.width - BATTLEFIELD_WIDTH) <= EPSILON;
  if (fullWidth) {
    if (Math.abs(firstTop - second.y) <= EPSILON) {
      return Object.freeze({ orientation: "horizontal", coordinate: (firstTop + second.y) / 2 });
    }
    if (Math.abs(secondTop - first.y) <= EPSILON) {
      return Object.freeze({ orientation: "horizontal", coordinate: (secondTop + first.y) / 2 });
    }
  }

  return null;
}

export function getSelectedBattlefieldGeometry(state) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!setup?.myDisposition || !setup?.opponentDisposition || !setup?.layout) return null;
  const missions = getBattlePrimaryMissions(setup.myDisposition, setup.opponentDisposition);
  if (!missions) return null;
  return getEventCompanionMapLayout(missions.myMission, missions.opponentMission, setup.layout);
}

export function getTerritoryRegionsFromGeometry(geometry) {
  if (!geometry?.verified) return null;
  const attacker = normalizeRect(geometry.deploymentZones?.attackerTerritory);
  const defender = normalizeRect(geometry.deploymentZones?.defenderTerritory);
  if (!attacker || !defender) return null;
  const divider = sharedBoundary(attacker, defender);
  if (!divider) return null;
  return Object.freeze({ attacker, defender, divider });
}

export function getBattlefieldTerritoryContext(state, { playerId = null } = {}) {
  const geometry = getSelectedBattlefieldGeometry(state);
  const regions = getTerritoryRegionsFromGeometry(geometry);
  if (!regions) return null;

  const attackerPlayerId = state?.preGameSetup?.attackerPlayerId ?? null;
  const defenderPlayerId = state?.preGameSetup?.defenderPlayerId ?? null;
  const perspectiveRole = playerId && playerId === attackerPlayerId
    ? "attacker"
    : playerId && playerId === defenderPlayerId
      ? "defender"
      : null;

  return Object.freeze({
    geometry,
    ...regions,
    attackerPlayerId,
    defenderPlayerId,
    perspectiveRole,
    myTerritory: perspectiveRole === "attacker" ? regions.attacker : perspectiveRole === "defender" ? regions.defender : null,
    opponentTerritory: perspectiveRole === "attacker" ? regions.defender : perspectiveRole === "defender" ? regions.attacker : null
  });
}

function rectContains(rect, position) {
  if (!rect || !Number.isFinite(position?.x) || !Number.isFinite(position?.y)) return false;
  return position.x >= rect.x - EPSILON && position.x <= rect.x + rect.width + EPSILON &&
    position.y >= rect.y - EPSILON && position.y <= rect.y + rect.height + EPSILON;
}

export function getTerritoryStatusForPosition(state, { playerId, position, uncertainty = DEFAULT_MAP_UNCERTAINTY } = {}) {
  const context = getBattlefieldTerritoryContext(state, { playerId });
  if (!context || !context.perspectiveRole || !Number.isFinite(position?.x) || !Number.isFinite(position?.y)) {
    return Object.freeze({ territory: "unknown", confidence: "low", distanceToBoundary: null });
  }

  const distanceToBoundary = context.divider.orientation === "vertical"
    ? Math.abs(Number(position.x) - context.divider.coordinate)
    : Math.abs(Number(position.y) - context.divider.coordinate);
  const advisoryBand = Number.isFinite(Number(uncertainty)) ? Math.max(0, Number(uncertainty)) : DEFAULT_MAP_UNCERTAINTY;

  if (distanceToBoundary <= advisoryBand) {
    return Object.freeze({ territory: "boundary", confidence: "low", distanceToBoundary });
  }

  if (rectContains(context.myTerritory, position)) {
    return Object.freeze({ territory: "mine", confidence: "moderate", distanceToBoundary });
  }
  if (rectContains(context.opponentTerritory, position)) {
    return Object.freeze({ territory: "opponent", confidence: "moderate", distanceToBoundary });
  }
  return Object.freeze({ territory: "unknown", confidence: "low", distanceToBoundary });
}

export const BATTLEFIELD_TERRITORY_MAP_UNCERTAINTY = DEFAULT_MAP_UNCERTAINTY;
