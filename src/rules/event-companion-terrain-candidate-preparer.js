import { getEventCompanionPlacementObservations } from "../data/event-companion-placement-candidate-observations.js";
import { transformEventCompanionPlacement } from "./event-companion-terrain-placement-policy.js";
import { terrainGuideViolatesMeasuredTerrain } from "../ui/terrain-placement-path-safety.js";

export const TERRAIN_CANDIDATE_SNAP_TOLERANCE = 0.85;

const TRANSFORM_BY_PAGE = Object.freeze({
  24: "flipX", 25: "flipX", 26: "flipX", 27: "flipX", 28: "flipX",
  29: "flipX", 30: "flipX", 31: "flipX", 32: "flipY", 33: "identity",
  34: "flipX", 35: "identity", 36: "flipX", 37: "flipX", 38: "flipX",
  39: "flipX", 40: "flipX", 41: "flipX", 42: "flipX", 43: "flipX",
  44: "flipX", 45: "flipX", 46: "flipX", 47: "flipX", 48: "flipX",
  49: "flipX", 50: "flipX", 51: "flipX", 52: "flipX", 53: "flipX"
});

function geometryPoints(shape) {
  return (shape?.points ?? [])
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => [Number(point.x), Number(point.y)]);
}

function nearestTerrainVertex(layout, target) {
  let best = null;
  for (const [terrain, shape] of Object.entries(layout?.terrainGeometry ?? {})) {
    for (const anchor of geometryPoints(shape)) {
      const distance = Math.hypot(anchor[0] - target[0], anchor[1] - target[1]);
      if (!best || distance < best.distance) best = { terrain, anchor: [...anchor], distance };
    }
  }
  return best;
}

function frozenIssue(observation, reason, details = {}) {
  return Object.freeze({ observation, reason, ...details });
}

export function getEventCompanionTerrainCandidateTransform(page) {
  return TRANSFORM_BY_PAGE[Number(page)] ?? null;
}

export function prepareEventCompanionTerrainPlacementCandidate(layout) {
  const page = Number(layout?.page);
  const transform = getEventCompanionTerrainCandidateTransform(page);
  const observations = getEventCompanionPlacementObservations(page);
  const guides = [];
  const excluded = [];
  const unresolved = [];

  if (!transform || !observations.length) {
    return Object.freeze({
      page,
      transform,
      guides: Object.freeze([]),
      excluded: Object.freeze([]),
      unresolved: Object.freeze([]),
      sourceAudit: Object.freeze({ printedDimensionCount: observations.length, terrainGuideCount: 0, excludedCount: 0, ambiguousCount: 0 }),
      readyForConfirmation1: false
    });
  }

  for (const observation of observations) {
    if (observation.confidence !== "high") {
      unresolved.push(frozenIssue(observation, "ambiguous-source"));
      continue;
    }

    // The app's terrain-placement overlay is specifically terrain-to-table-edge
    // placement information. Source dimensions that are wholly internal to the
    // battlefield are retained in the audit but not rendered as terrain guides.
    if (!observation.sourceAnchor || !observation.edge) {
      excluded.push(frozenIssue(observation, "non-edge-dimension"));
      continue;
    }

    const transformed = transformEventCompanionPlacement(observation.sourceAnchor, observation.edge, transform);
    const nearest = transformed.point ? nearestTerrainVertex(layout, transformed.point) : null;
    if (!nearest || nearest.distance > TERRAIN_CANDIDATE_SNAP_TOLERANCE) {
      unresolved.push(frozenIssue(observation, "no-reproducible-corner", {
        transformedPoint: transformed.point,
        nearestTerrain: nearest?.terrain ?? null,
        nearestAnchor: nearest?.anchor ?? null,
        distance: nearest ? Number(nearest.distance.toFixed(3)) : null
      }));
      continue;
    }

    const measuredTerrain = geometryPoints(layout?.terrainGeometry?.[nearest.terrain]);
    if (terrainGuideViolatesMeasuredTerrain(nearest.anchor, transformed.edge, measuredTerrain)) {
      unresolved.push(frozenIssue(observation, "measured-terrain-path-review", {
        terrain: nearest.terrain,
        anchor: Object.freeze([...nearest.anchor]),
        edge: transformed.edge,
        distance: Number(nearest.distance.toFixed(3))
      }));
      continue;
    }

    guides.push(Object.freeze({
      value: observation.value,
      edge: transformed.edge,
      sourceAnchor: Object.freeze([...observation.sourceAnchor]),
      terrain: nearest.terrain,
      anchor: Object.freeze([...nearest.anchor]),
      candidate: true,
      sourceTransform: transform,
      snapDistance: Number(nearest.distance.toFixed(3))
    }));
  }

  const ambiguousCount = unresolved.filter((issue) => issue.reason === "ambiguous-source").length;
  const sourceAudit = Object.freeze({
    printedDimensionCount: observations.length,
    terrainGuideCount: guides.length,
    excludedCount: excluded.length,
    ambiguousCount,
    unresolvedCount: unresolved.length
  });

  return Object.freeze({
    page,
    transform,
    guides: Object.freeze(guides),
    excluded: Object.freeze(excluded),
    unresolved: Object.freeze(unresolved),
    sourceAudit,
    readyForConfirmation1: unresolved.length === 0 && guides.length > 0
  });
}
