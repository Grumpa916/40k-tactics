import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";

const LAYOUTS = Object.freeze(["A", "B", "C"]);

export function normalizePrimaryMissionPair(missionA, missionB) {
  if (typeof missionA !== "string" || !missionA.trim() ||
      typeof missionB !== "string" || !missionB.trim()) return null;
  return [missionA.trim(), missionB.trim()].sort((a, b) => a.localeCompare(b));
}

export function getPrimaryMissionForForceDispositions(ownDisposition, opponentDisposition) {
  if (!ownDisposition || !opponentDisposition) return null;
  const matrix = EVENT_COMPANION_MAP_CATALOG.forceDispositionMissionMatrix;
  return matrix[ownDisposition]?.[opponentDisposition] ?? null;
}

export function getBattlePrimaryMissions(myDisposition, opponentDisposition) {
  const myMission = getPrimaryMissionForForceDispositions(myDisposition, opponentDisposition);
  const opponentMission = getPrimaryMissionForForceDispositions(opponentDisposition, myDisposition);
  if (!myMission || !opponentMission) return null;
  return Object.freeze({ myMission, opponentMission });
}

export function getLayoutOptionsForForceDispositions(myDisposition, opponentDisposition) {
  const missions = getBattlePrimaryMissions(myDisposition, opponentDisposition);
  if (!missions) return null;
  const layouts = getEventCompanionMissionLayoutOptions(missions.myMission, missions.opponentMission);
  if (!layouts) return null;
  return Object.freeze({ ...missions, layouts });
}

export function getEventCompanionMissionLayoutOptions(missionA, missionB) {
  const pair = normalizePrimaryMissionPair(missionA, missionB);
  if (!pair) return null;
  const index = EVENT_COMPANION_MAP_CATALOG.layoutIndex.find((entry) =>
    entry.missionA === pair[0] && entry.missionB === pair[1]);
  if (!index) return null;
  return Object.freeze(index.layouts.map((layout, i) => Object.freeze({
    layout,
    page: index.pages[i],
    missionA: pair[0],
    missionB: pair[1],
    missionKey: pair.join(" ↔ ")
  })));
}

export function getEventCompanionMapLayout(missionA, missionB, layout) {
  if (!LAYOUTS.includes(layout)) return null;
  const options = getEventCompanionMissionLayoutOptions(missionA, missionB);
  if (!options) return null;
  const selected = options.find((item) => item.layout === layout);
  if (!selected) return null;
  const geometry = EVENT_COMPANION_MAP_CATALOG.layouts.find((item) =>
    item.missionKey === selected.missionKey && item.layout === layout);
  if (!geometry?.verified) return null;
  return geometry;
}

export function listEventCompanionMissionPairs() {
  return EVENT_COMPANION_MAP_CATALOG.layoutIndex.map((entry) => Object.freeze({
    missionA: entry.missionA,
    missionB: entry.missionB,
    layouts: Object.freeze([...entry.layouts]),
    pages: Object.freeze([...entry.pages])
  }));
}

export function validateEventCompanionMapCatalog(catalog = EVENT_COMPANION_MAP_CATALOG) {
  const errors = [];
  const expectedLayouts = new Set();
  for (const entry of catalog.layoutIndex ?? []) {
    if (!entry.missionA || !entry.missionB) errors.push("Mission pair is missing a mission name.");
    if (entry.layouts?.length !== 3 || entry.pages?.length !== 3 ||
        !["A", "B", "C"].every((layout) => entry.layouts.includes(layout))) {
      errors.push("Each mission pair must index A, B, and C layouts with source pages.");
    }
    for (const layout of entry.layouts ?? []) {
      const key = [entry.missionA, entry.missionB].sort((a, b) => a.localeCompare(b)).join(" ↔ ") + "|" + layout;
      if (expectedLayouts.has(key)) errors.push("Duplicate mission/layout key: " + key);
      expectedLayouts.add(key);
    }
  }
  const geometryKeys = new Set();
  for (const geometry of catalog.layouts ?? []) {
    const key = geometry.missionKey + "|" + geometry.layout;
    if (geometryKeys.has(key)) errors.push("Duplicate geometry key: " + key);
    geometryKeys.add(key);
    if (geometry.verified !== true) errors.push("Unverified geometry included: " + key);
    if (!Number.isInteger(geometry.page)) errors.push("Missing source page: " + key);
    for (const [label, point] of Object.entries(geometry.objectivePositions ?? {})) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) ||
          point.x < 0 || point.x > 60 || point.y < 0 || point.y > 44) {
        errors.push("Invalid objective position " + label + " in " + key);
      }
    }
    for (const [label, shape] of Object.entries(geometry.terrainGeometry ?? {})) {
      if (!Array.isArray(shape.points) || shape.points.length < 3 ||
          shape.points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
            point.x < 0 || point.x > 60 || point.y < 0 || point.y > 44)) {
        errors.push("Invalid terrain polygon " + label + " in " + key);
      }
    }
  }
  for (const key of expectedLayouts) {
    if (!geometryKeys.has(key)) errors.push("Missing verified geometry: " + key);
  }
  for (const key of geometryKeys) {
    if (!expectedLayouts.has(key)) errors.push("Geometry has no layout index entry: " + key);
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
