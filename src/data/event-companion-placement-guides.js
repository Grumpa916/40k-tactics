import { EVENT_COMPANION_MAP_CATALOG } from "./event-companion-map-catalog.js";
import { getEventCompanionExtendedSourceGuides } from "./event-companion-placement-source-guides-extended.js";
import { nearestClearTerrainVertex } from "./terrain-guide-geometry.js";

// Terrain-placement transcription for the existing V2 battlefield geometry.
//
// Source of truth: official Warhammer 40,000 Event Companion.
// Printed values are never calculated. Source anchors identify the terrain-side
// endpoint of an official Event Companion dimension after rotating the portrait
// battlefield into V2's 60 x 44 landscape orientation.
//
// Page 12 remains the hand-verified browser-approved baseline. Pages 13 and 14
// use the same principles: official printed values only, V2 terrain corners for
// rendered anchors, battlefield-edge endpoints only, and direct 180-degree
// counterparts where the official layout establishes rotational symmetry.
const PAGE_12_GUIDES = Object.freeze([
  { value: '9"',  edge: "top",    terrain: "T4",       anchor: [20.6, 34.8], sourceAnchor: [20.60, 34.88] },
  { value: '5"',  edge: "top",    terrain: "T3",       anchor: [36.8, 39.0], sourceAnchor: [36.69, 38.97] },
  { value: '10"', edge: "top",    terrain: "T3/T4",    anchor: [27.8, 33.8], sourceAnchor: [27.92, 33.89] },
  { value: '4"',  edge: "top",    terrain: "T5",       anchor: [43.5, 40.1], sourceAnchor: [43.56, 40.01] },
  { value: '5"',  edge: "top",    terrain: "T1",       anchor: [5.8, 39.0],  sourceAnchor: [5.93, 38.97] },
  { value: '6"',  edge: "left",   terrain: "T1",       anchor: [5.8, 39.0],  sourceAnchor: [5.95, 38.97] },
  { value: '28"', edge: "left",   terrain: "T3/T4",    anchor: [27.8, 33.8], sourceAnchor: [27.92, 33.91] },
  { value: '17"', edge: "left",   terrain: "T14",      anchor: [17.0, 28.1], sourceAnchor: [17.03, 28.08] },
  { value: '16"', edge: "top",    terrain: "T14",      anchor: [17.0, 28.1], sourceAnchor: [16.99, 28.14] },
  { value: '22"', edge: "left",   terrain: "T6",       anchor: [22.1, 14.9], sourceAnchor: [22.00, 15.07] },
  { value: '15"', edge: "bottom", terrain: "T6",       anchor: [22.1, 14.9], sourceAnchor: [22.05, 15.07] },
  { value: '10"', edge: "top",    terrain: "T2",       anchor: [55.1, 34.1], sourceAnchor: [55.13, 33.96] },
  { value: '5"',  edge: "right",  terrain: "T2",       anchor: [55.1, 34.1], sourceAnchor: [55.13, 33.96] },
  { value: '16"', edge: "left",   terrain: "T14",      anchor: [15.7, 21.0], sourceAnchor: [15.82, 20.92] },
  { value: '5"',  edge: "top",    terrain: "T1",       anchor: [17.4, 39.0], sourceAnchor: [17.43, 38.88] },
  { value: '10"', edge: "left",   terrain: "T13",      anchor: [9.9, 26.3],  sourceAnchor: [10.01, 26.31] },
  { value: '5"',  edge: "right",  terrain: "T2",       anchor: [55.1, 27.0], sourceAnchor: [55.13, 27.04] },
  { value: '21"', edge: "left",   terrain: "T6",       anchor: [20.9, 23.0], sourceAnchor: [21.01, 22.91] }
]);

const PAGE_12_MIRROR_ANCHORS = Object.freeze({
  "20.6,34.8": [39.0, 9.0],
  "36.8,39": [22.9, 4.8],
  "27.8,33.8": [31.8, 10.1],
  "43.5,40.1": [16.5, 3.8],
  "5.8,39": [54.1, 5.0],
  "17,28.1": [43.0, 15.9],
  "22.1,14.9": [37.9, 29.0],
  "55.1,34.1": [4.9, 9.9],
  "15.7,21": [44.3, 23.0],
  "17.4,39": [42.4, 5.0],
  "9.9,26.3": [50.1, 17.7],
  "55.1,27": [4.9, 16.9],
  "20.9,23": [38.9, 20.9]
});

const PAGE_13_SOURCE_GUIDES = Object.freeze([
  { value: '4"',  edge: "top",    sourceAnchor: [43.08, 40.01] },
  { value: '4"',  edge: "left",   sourceAnchor: [4.08, 39.00] },
  { value: '5"',  edge: "top",    sourceAnchor: [36.45, 38.97] },
  { value: '5"',  edge: "left",   sourceAnchor: [5.08, 27.02] },
  { value: '9"',  edge: "top",    sourceAnchor: [20.92, 34.88] },
  { value: '22"', edge: "left",   sourceAnchor: [22.29, 15.07] },
  { value: '7"',  edge: "bottom", sourceAnchor: [22.29, 15.07] },
  { value: '16"', edge: "left",   sourceAnchor: [16.30, 20.92] },
  { value: '4"',  edge: "right",  sourceAnchor: [56.04, 17.96] },
  { value: '26"', edge: "right",  sourceAnchor: [34.04, 27.04] },
  { value: '5"',  edge: "right",  sourceAnchor: [55.14, 34.00] },
  { value: '18"', edge: "right",  sourceAnchor: [42.04, 9.96] },
  { value: '21"', edge: "right",  sourceAnchor: [39.03, 20.98] },
  { value: '15"', edge: "bottom", sourceAnchor: [39.03, 20.98] },
  { value: '10"', edge: "bottom", sourceAnchor: [49.95, 17.95] },
  { value: '11"', edge: "right",  sourceAnchor: [48.97, 31.95] },
  { value: '5"',  edge: "bottom", sourceAnchor: [43.54, 3.99] },
  { value: '15"', edge: "left",   sourceAnchor: [15.08, 28.02] },
  { value: '18"', edge: "left",   sourceAnchor: [18.03, 9.96] },
  { value: '20"', edge: "bottom", sourceAnchor: [20.02, 9.96] }
]);

const PAGE_14_SOURCE_GUIDES = Object.freeze([
  { value: '19"', edge: "left",   sourceAnchor: [19.06, 27.03] },
  { value: '4"',  edge: "top",    sourceAnchor: [43.08, 40.01] },
  { value: '27"', edge: "left",   sourceAnchor: [27.04, 33.98] },
  { value: '15"', edge: "top",    sourceAnchor: [27.04, 33.98] },
  { value: '24"', edge: "left",   sourceAnchor: [23.96, 15.04] },
  { value: '8"',  edge: "bottom", sourceAnchor: [23.96, 15.04] },
  { value: '7"',  edge: "left",   sourceAnchor: [7.01, 38.98] },
  { value: '5"',  edge: "top",    sourceAnchor: [7.01, 38.98] },
  { value: '8"',  edge: "left",   sourceAnchor: [7.99, 27.04] },
  { value: '28"', edge: "right",  sourceAnchor: [32.00, 15.05] },
  { value: '2"',  edge: "bottom", sourceAnchor: [44.00, 2.01] },
  { value: '2"',  edge: "right",  sourceAnchor: [58.02, 9.97] },
  { value: '7"',  edge: "right",  sourceAnchor: [53.00, 34.01] },
  { value: '17"', edge: "right",  sourceAnchor: [43.05, 27.05] },
  { value: '16"', edge: "bottom", sourceAnchor: [43.05, 27.05] },
  { value: '15"', edge: "right",  sourceAnchor: [45.01, 16.99] },
  { value: '5"',  edge: "bottom", sourceAnchor: [54.99, 5.03] },
  { value: '12"', edge: "bottom", sourceAnchor: [48.03, 12.00] }
]);

const MIRROR_EDGE = Object.freeze({ left: "right", right: "left", top: "bottom", bottom: "top" });

function page12MirroredGuide(guide) {
  const exactCounterpart = PAGE_12_MIRROR_ANCHORS[guide.anchor.join(",")];
  const anchor = exactCounterpart ?? [60 - guide.anchor[0], 44 - guide.anchor[1]];
  return {
    ...guide,
    terrain: "mirror:" + guide.terrain,
    edge: MIRROR_EDGE[guide.edge],
    anchor,
    mirrored: true
  };
}

const PAGE_12_COMPLETE_GUIDES = Object.freeze([
  ...PAGE_12_GUIDES,
  ...PAGE_12_GUIDES.map(page12MirroredGuide)
]);

const GENERIC_SOURCE_GUIDES = Object.freeze({
  "13": PAGE_13_SOURCE_GUIDES,
  "14": PAGE_14_SOURCE_GUIDES
});

function shapePoints(shape) {
  return (shape?.points ?? [])
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => [Number(point.x), Number(point.y)]);
}

function distanceSquared(a, b) {
  const dx = Number(a[0]) - Number(b[0]);
  const dy = Number(a[1]) - Number(b[1]);
  return dx * dx + dy * dy;
}

function pointToSegmentDistanceSquared(point, start, end) {
  const px = Number(point[0]);
  const py = Number(point[1]);
  const ax = Number(start[0]);
  const ay = Number(start[1]);
  const bx = Number(end[0]);
  const by = Number(end[1]);
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return distanceSquared(point, start);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return distanceSquared(point, [ax + t * dx, ay + t * dy]);
}

function shapeBoundaryDistanceSquared(sourceAnchor, shape) {
  const points = shapePoints(shape);
  if (!points.length) return Infinity;
  let best = Infinity;
  for (let index = 0; index < points.length; index += 1) {
    best = Math.min(best, pointToSegmentDistanceSquared(sourceAnchor, points[index], points[(index + 1) % points.length]));
  }
  return best;
}

function nearestShapeVertex(sourceAnchor, shape) {
  let bestAnchor = null;
  let bestDistance = Infinity;
  for (const anchor of shapePoints(shape)) {
    const candidateDistance = distanceSquared(sourceAnchor, anchor);
    if (candidateDistance < bestDistance) {
      bestAnchor = anchor;
      bestDistance = candidateDistance;
    }
  }
  return bestAnchor;
}

function snapToTerrainVertex(sourceAnchor, geometry, edge, requireClearEdge = false) {
  let bestTerrain = null;
  let bestShape = null;
  let bestBoundaryDistance = Infinity;
  for (const [terrain, shape] of Object.entries(geometry?.terrainGeometry ?? {})) {
    const boundaryDistance = shapeBoundaryDistanceSquared(sourceAnchor, shape);
    if (boundaryDistance < bestBoundaryDistance) {
      bestTerrain = terrain;
      bestShape = shape;
      bestBoundaryDistance = boundaryDistance;
    }
  }
  if (!bestShape) return null;
  const anchor = requireClearEdge
    ? nearestClearTerrainVertex(sourceAnchor, bestShape, edge)
    : nearestShapeVertex(sourceAnchor, bestShape);
  return anchor ? { terrain: bestTerrain, anchor } : null;
}

function geometryForPage(page) {
  return (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((layout) => Number(layout?.page) === Number(page)) ?? null;
}

function dedupeGuides(guides) {
  const seen = new Set();
  return guides.filter((guide) => {
    const key = [guide.terrain, guide.value, guide.edge, guide.anchor[0], guide.anchor[1]].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveGenericGuides(page) {
  const sourceGuides = GENERIC_SOURCE_GUIDES[String(page)] ?? getEventCompanionExtendedSourceGuides(page);
  const geometry = geometryForPage(page);
  if (!sourceGuides.length || !geometry?.terrainGeometry) return [];
  const resolved = [];
  const requireClearEdge = Number(page) >= 15;

  for (const guide of sourceGuides) {
    const snapped = snapToTerrainVertex(guide.sourceAnchor, geometry, guide.edge, requireClearEdge);
    if (snapped) resolved.push({ ...guide, ...snapped });
  }

  for (const guide of sourceGuides) {
    const mirroredSourceAnchor = [60 - guide.sourceAnchor[0], 44 - guide.sourceAnchor[1]];
    const mirroredEdge = MIRROR_EDGE[guide.edge];
    const snapped = snapToTerrainVertex(mirroredSourceAnchor, geometry, mirroredEdge, requireClearEdge);
    if (!snapped) continue;
    resolved.push({
      ...guide,
      sourceAnchor: mirroredSourceAnchor,
      edge: mirroredEdge,
      ...snapped,
      mirrored: true
    });
  }

  return dedupeGuides(resolved);
}

function endpointFor(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [0, y];
  if (edge === "right") return [60, y];
  if (edge === "top") return [x, 44];
  return [x, 0];
}

function labelPosition(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [Math.max(1.4, x - 1.4), y + 0.7];
  if (edge === "right") return [Math.min(58.6, x + 1.4), y + 0.7];
  if (edge === "top") return [x + 0.8, Math.min(42.8, y + 1.4)];
  return [x + 0.8, Math.max(1.2, y - 1.2)];
}

export function getEventCompanionPlacementOverlay(page) {
  const guides = Number(page) === 12 ? PAGE_12_COMPLETE_GUIDES : resolveGenericGuides(page);
  if (!guides.length) return null;

  const lines = guides.map((guide) => {
    const [x, y] = guide.anchor;
    const [edgeX, edgeY] = endpointFor(guide.anchor, guide.edge);
    return [x, y, edgeX, edgeY];
  });

  const measurements = guides.map((guide) => {
    const [x, y] = labelPosition(guide.anchor, guide.edge);
    return { value: guide.value, x, y };
  });

  const seen = new Set();
  const anchors = [];
  for (const guide of guides) {
    const key = guide.anchor.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    anchors.push({ x: guide.anchor[0], y: guide.anchor[1], terrain: guide.terrain });
  }

  return { guides, lines, measurements, anchors };
}

export {
  PAGE_12_GUIDES,
  PAGE_12_COMPLETE_GUIDES,
  PAGE_13_SOURCE_GUIDES,
  PAGE_14_SOURCE_GUIDES
};