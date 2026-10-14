import { getEventCompanionPlacementOverlay } from "../data/event-companion-placement-guides.js";
import {
  outwardPerpendicularEdges,
  terrainGuideCrossesPolygonInterior
} from "./terrain-placement-path-safety.js";

export const TERRAIN_BOARD_WIDTH = 60;
export const TERRAIN_BOARD_HEIGHT = 44;

function geometryPoints(shape) {
  return (shape?.points ?? [])
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => [Number(point.x), Number(point.y)]);
}

function edgeDistance(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return x;
  if (edge === "right") return TERRAIN_BOARD_WIDTH - x;
  if (edge === "top") return TERRAIN_BOARD_HEIGHT - y;
  return y;
}

export function terrainGuideEndpoint(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [0, y];
  if (edge === "right") return [TERRAIN_BOARD_WIDTH, y];
  if (edge === "top") return [x, TERRAIN_BOARD_HEIGHT];
  return [x, 0];
}

function centroid(points) {
  const total = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function farthestPair(points) {
  if (points.length <= 2) return points.slice(0, 2);
  let best = [points[0], points[1]];
  let bestDistance = distanceSquared(best[0], best[1]);
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const candidate = distanceSquared(points[i], points[j]);
      if (candidate > bestDistance) {
        best = [points[i], points[j]];
        bestDistance = candidate;
      }
    }
  }
  return best;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function terrainGuideLabelPosition(anchor, edge) {
  const [edgeX, edgeY] = terrainGuideEndpoint(anchor, edge);
  const x = (Number(anchor[0]) + edgeX) / 2;
  const y = (Number(anchor[1]) + edgeY) / 2;
  if (edge === "left" || edge === "right") return [x, y + 0.7];
  return [x + 0.8, y];
}

function anchorKey(terrain, anchor) {
  return String(terrain ?? "") + "|" + Number(anchor?.[0]) + "|" + Number(anchor?.[1]);
}

function pointName(index) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function groupedMeasurementPoints(overlay) {
  const groups = new Map();
  const terrainCounts = new Map();

  for (const guide of overlay?.guides ?? []) {
    const key = anchorKey(guide.terrain, guide.anchor);
    if (!groups.has(key)) {
      const index = terrainCounts.get(guide.terrain) ?? 0;
      terrainCounts.set(guide.terrain, index + 1);
      groups.set(key, {
        terrain: guide.terrain,
        point: pointName(index),
        anchor: [...guide.anchor],
        edges: []
      });
    }
    const group = groups.get(key);
    if (!group.edges.includes(guide.edge)) group.edges.push(guide.edge);
  }

  return [...groups.values()];
}

function measurementNumber(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/"$/, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function sameAxis(left, right) {
  const leftHorizontal = left === "left" || left === "right";
  const rightHorizontal = right === "left" || right === "right";
  return leftHorizontal === rightHorizontal;
}

// Complete placement guides use only values that are already present in the
// PDF-backed terrain-only transcription for this page. The V2 geometry chooses
// the reproducible corner/edge pairing; it never invents a displayed value.
function verifiedDistanceValue(page, terrain, anchor, edge) {
  const canonical = getEventCompanionPlacementOverlay(Number(page));
  const sourceGuides = (canonical?.guides ?? [])
    .filter((guide) => measurementNumber(guide.value) != null);
  if (!sourceGuides.length) return null;

  const sameTerrainAxis = sourceGuides.filter((guide) => guide.terrain === terrain && sameAxis(guide.edge, edge));
  const sameAxisGuides = sourceGuides.filter((guide) => sameAxis(guide.edge, edge));
  const candidates = sameTerrainAxis.length
    ? sameTerrainAxis
    : (sameAxisGuides.length ? sameAxisGuides : sourceGuides);

  const target = edgeDistance(anchor, edge);
  let bestGuide = candidates[0];
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const guide of candidates) {
    const numeric = measurementNumber(guide.value);
    if (numeric == null) continue;
    const delta = Math.abs(numeric - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestGuide = guide;
    }
  }
  return bestGuide?.value ?? null;
}

function calloutArrow(edge, value) {
  if (edge === "left") return "← " + value;
  if (edge === "right") return value + " →";
  if (edge === "top") return "↑ " + value;
  return "↓ " + value;
}

function calloutPosition(anchor, shapeCenter, point) {
  let dx = anchor[0] - shapeCenter[0];
  let dy = anchor[1] - shapeCenter[1];
  let length = Math.hypot(dx, dy);

  if (length < 0.001) {
    dx = anchor[0] <= TERRAIN_BOARD_WIDTH / 2 ? -1 : 1;
    dy = anchor[1] <= TERRAIN_BOARD_HEIGHT / 2 ? -1 : 1;
    length = Math.hypot(dx, dy);
  }

  const ux = dx / length;
  const uy = dy / length;
  const tangentX = -uy;
  const tangentY = ux;
  const tangentSign = point === "B" ? 1 : -1;
  const outward = 4.0;
  const tangent = 1.1 * tangentSign;

  return [
    clamp(anchor[0] + ux * outward + tangentX * tangent, 4.6, TERRAIN_BOARD_WIDTH - 4.6),
    clamp(anchor[1] + uy * outward + tangentY * tangent, 3.0, TERRAIN_BOARD_HEIGHT - 3.0)
  ];
}

function obstacleSafeMeasurementPoints(shapePoints) {
  const candidates = shapePoints
    .map((anchor) => ({
      anchor,
      edges: outwardPerpendicularEdges(anchor, shapePoints, {
        width: TERRAIN_BOARD_WIDTH,
        height: TERRAIN_BOARD_HEIGHT
      })
    }))
    .filter((candidate) => Array.isArray(candidate.edges) && candidate.edges.length === 2);

  if (candidates.length < 2) return [];
  const selectedAnchors = farthestPair(candidates.map((candidate) => candidate.anchor));
  return selectedAnchors.map((anchor) => candidates.find((candidate) => candidate.anchor === anchor));
}

export function buildCompleteTerrainPlacementGuides(layout) {
  const page = Number(layout?.page);
  const canonical = getEventCompanionPlacementOverlay(page);
  if (!canonical) return [];

  // Pages 12-14 were already visually approved with their explicit source
  // mappings. Do not regenerate or reformat them while restoring later pages.
  if (page <= 14) return groupedMeasurementPoints(canonical);

  const result = [];
  for (const [terrain, shape] of Object.entries(layout?.terrainGeometry ?? {})) {
    const shapePoints = geometryPoints(shape);
    if (shapePoints.length < 2) continue;
    const shapeCenter = centroid(shapePoints);
    const safePoints = obstacleSafeMeasurementPoints(shapePoints);
    if (safePoints.length < 2) continue;

    safePoints.forEach((measurementPoint, index) => {
      result.push({
        terrain,
        point: index === 0 ? "A" : "B",
        anchor: measurementPoint.anchor,
        center: shapeCenter,
        edges: measurementPoint.edges
      });
    });
  }

  return result;
}

function canonicalOverlayWithPointNames(canonical) {
  const points = groupedMeasurementPoints(canonical);
  const pointByAnchor = new Map(points.map((point) => [anchorKey(point.terrain, point.anchor), point.point]));
  const guides = canonical.guides.map((guide) => ({
    ...guide,
    point: pointByAnchor.get(anchorKey(guide.terrain, guide.anchor)) ?? "A"
  }));
  const anchors = canonical.anchors.map((anchor) => ({
    ...anchor,
    point: pointByAnchor.get(anchorKey(anchor.terrain, [anchor.x, anchor.y])) ?? "A"
  }));
  const measurements = canonical.measurements.map((measurement, index) => ({
    ...measurement,
    terrain: guides[index]?.terrain ?? measurement.terrain,
    point: guides[index]?.point ?? "A"
  }));

  return {
    guides,
    lines: canonical.lines.map((line) => [...line]),
    measurements,
    anchors,
    callouts: []
  };
}

export function buildCompleteTerrainPlacementOverlay(layout) {
  const page = Number(layout?.page);
  const canonical = getEventCompanionPlacementOverlay(page);
  if (!canonical) {
    return { guides: [], lines: [], measurements: [], anchors: [], callouts: [] };
  }

  if (page <= 14) return canonicalOverlayWithPointNames(canonical);

  const measurementPoints = buildCompleteTerrainPlacementGuides(layout);
  const guides = [];
  const lines = [];
  const measurements = [];
  const anchors = [];
  const callouts = [];

  for (const measurementPoint of measurementPoints) {
    const [x, y] = measurementPoint.anchor;
    anchors.push({ terrain: measurementPoint.terrain, point: measurementPoint.point, x, y });

    const pointGuides = [];
    for (const edge of measurementPoint.edges) {
      const value = verifiedDistanceValue(page, measurementPoint.terrain, measurementPoint.anchor, edge);
      if (!value) continue;
      const [edgeX, edgeY] = terrainGuideEndpoint(measurementPoint.anchor, edge);
      const [labelX, labelY] = terrainGuideLabelPosition(measurementPoint.anchor, edge);
      const guide = {
        terrain: measurementPoint.terrain,
        point: measurementPoint.point,
        anchor: measurementPoint.anchor,
        edge,
        value
      };
      guides.push(guide);
      pointGuides.push(guide);
      lines.push([x, y, edgeX, edgeY]);
      measurements.push({
        terrain: measurementPoint.terrain,
        point: measurementPoint.point,
        value,
        x: labelX,
        y: labelY
      });
    }

    const horizontal = pointGuides.find((guide) => guide.edge === "left" || guide.edge === "right");
    const vertical = pointGuides.find((guide) => guide.edge === "top" || guide.edge === "bottom");
    if (horizontal && vertical) {
      const [calloutX, calloutY] = calloutPosition(
        measurementPoint.anchor,
        measurementPoint.center,
        measurementPoint.point
      );
      callouts.push({
        terrain: measurementPoint.terrain,
        point: measurementPoint.point,
        x: calloutX,
        y: calloutY,
        anchorX: x,
        anchorY: y,
        centerX: measurementPoint.center[0],
        centerY: measurementPoint.center[1],
        horizontalEdge: horizontal.edge,
        verticalEdge: vertical.edge,
        horizontalValue: horizontal.value,
        verticalValue: vertical.value,
        horizontalText: calloutArrow(horizontal.edge, horizontal.value),
        verticalText: calloutArrow(vertical.edge, vertical.value),
        text: calloutArrow(horizontal.edge, horizontal.value) + "  " + calloutArrow(vertical.edge, vertical.value)
      });
    }
  }

  return { guides, lines, measurements, anchors, callouts };
}

export function terrainGuideCrossesOwnTerrain(layout, guide) {
  const shapePoints = geometryPoints(layout?.terrainGeometry?.[guide?.terrain]);
  if (shapePoints.length < 3) return false;
  return terrainGuideCrossesPolygonInterior(guide.anchor, guide.edge, shapePoints, {
    width: TERRAIN_BOARD_WIDTH,
    height: TERRAIN_BOARD_HEIGHT
  });
}
