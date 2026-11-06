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

// Corner/deployment layouts have parallel *diagonal* zone boundaries.
// The territorial halfway line is the geometric midline between those two
// boundaries, not the vertical x=30 split used by older catalog rectangles.
// Derive it from actual deployment polygons so all seven diagonal layouts
// use the same geometry in the map and the tactical/scoring calculations.
function diagonalZoneEdge(points) {
  if (!Array.isArray(points)) return null;
  const eligible = points.map((point,index) => {
    const next=points[(index+1)%points.length];
    return {point,next,dx:next.x-point.x,dy:next.y-point.y};
  }).filter(edge => Math.abs(edge.dx)>=20 && Math.abs(edge.dy)>=30);
  if (!eligible.length) return null;
  eligible.sort((a,b)=>Math.hypot(b.dx,b.dy)-Math.hypot(a.dx,a.dy));
  const {point,dx,dy}=eligible[0];
  return Object.freeze({
    xAtZero:point.x-point.y*dx/dy,
    xAtEnd:point.x+(BATTLEFIELD_HEIGHT-point.y)*dx/dy,
    slope:dx/dy
  });
}

function deploymentDiagonalDivider(geometry) {
  const zones=geometry?.deploymentZones;
  const defender=diagonalZoneEdge(zones?.defenderDeployment?.points);
  const attacker=diagonalZoneEdge(zones?.attackerDeployment?.points);
  if (!defender || !attacker || Math.abs(defender.slope-attacker.slope)>0.1) return null;
  const start=Object.freeze({x:(defender.xAtEnd+attacker.xAtEnd)/2,y:BATTLEFIELD_HEIGHT});
  const end=Object.freeze({x:(defender.xAtZero+attacker.xAtZero)/2,y:0});
  if (![start.x,end.x].every(x=>x>=0 && x<=BATTLEFIELD_WIDTH) ||
      Math.abs(start.x-end.x)<5) return null;
  return Object.freeze({orientation:"diagonal",start,end});
}

function signedLineSide(point, divider) {
  const {start,end}=divider;
  return (end.x-start.x)*(point.y-start.y)-(end.y-start.y)*(point.x-start.x);
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
  const divider = deploymentDiagonalDivider(geometry) ?? sharedBoundary(attacker, defender);
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

  const diagonal=context.divider.orientation==="diagonal";
  const lineLength=diagonal
    ? Math.hypot(context.divider.end.x-context.divider.start.x,context.divider.end.y-context.divider.start.y)
    : null;
  const signedDistance=diagonal ? signedLineSide(position,context.divider) : null;
  const distanceToBoundary=diagonal
    ? Math.abs(signedDistance)/lineLength
    : context.divider.orientation==="vertical"
      ? Math.abs(Number(position.x)-context.divider.coordinate)
      : Math.abs(Number(position.y)-context.divider.coordinate);
  const advisoryBand = Number.isFinite(Number(uncertainty)) ? Math.max(0, Number(uncertainty)) : DEFAULT_MAP_UNCERTAINTY;

  if (distanceToBoundary <= advisoryBand) {
    return Object.freeze({ territory: "boundary", confidence: "low", distanceToBoundary });
  }

  if (diagonal) {
    const marker=context.geometry.objectivePositions?.["Defender Home"];
    if (!marker || !Number.isFinite(marker.x) || !Number.isFinite(marker.y) ||
        position.x<0 || position.x>BATTLEFIELD_WIDTH ||
        position.y<0 || position.y>BATTLEFIELD_HEIGHT) {
      return Object.freeze({ territory:"unknown",confidence:"low",distanceToBoundary });
    }
    const defenderSide=signedLineSide(marker,context.divider);
    const isDefenderSide=signedDistance*defenderSide>0;
    const isMine=context.perspectiveRole===(isDefenderSide?"defender":"attacker");
    return Object.freeze({
      territory:isMine?"mine":"opponent",
      confidence:"moderate",
      distanceToBoundary
    });
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
