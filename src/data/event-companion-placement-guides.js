import { EVENT_COMPANION_SOURCE_PLACEMENT_GUIDES } from "./event-companion-placement-source-guides.js";
import { EVENT_COMPANION_MAP_CATALOG } from "./event-companion-map-catalog.js";

// Terrain-placement transcription for the existing V2 battlefield geometry.
//
// Source of truth: official Warhammer 40,000 Event Companion.
// Printed values are never calculated. Source anchors identify the terrain-side
// endpoint of the official dimension line after rotating the portrait battlefield
// into V2's 60 x 44 landscape orientation. The generic path first identifies the
// nearest V2 terrain boundary, then uses a reproducible corner on that same piece.
//
// Page 12 remains the hand-verified baseline approved in browser testing.
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

const MIRROR_EDGE = Object.freeze({ left: "right", right: "left", top: "bottom", bottom: "top" });

function page12MirroredGuide(guide) {
  const exactCounterpart = PAGE_12_MIRROR_ANCHORS[guide.anchor.join(",")];
  const anchor = exactCounterpart ?? [60 - guide.anchor[0], 44 - guide.anchor[1]];
  return { ...guide, terrain: "mirror:" + guide.terrain, edge: MIRROR_EDGE[guide.edge], anchor, mirrored: true };
}

const PAGE_12_COMPLETE_GUIDES = Object.freeze([
  ...PAGE_12_GUIDES,
  ...PAGE_12_GUIDES.map(page12MirroredGuide)
]);

function terrainVertices(geometry) {
  const vertices = [];
  for (const [terrain, shape] of Object.entries(geometry?.terrainGeometry ?? {})) {
    for (const point of shape?.points ?? []) {
      if (!Number.isFinite(Number(point?.x)) || !Number.isFinite(Number(point?.y))) continue;
      vertices.push({ terrain, anchor: [Number(point.x), Number(point.y)] });
    }
  }
  return vertices;
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
  const points = (shape?.points ?? [])
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => [Number(point.x), Number(point.y)]);
  if (!points.length) return Infinity;
  if (points.length === 1) return distanceSquared(sourceAnchor, points[0]);
  let best = Infinity;
  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    best = Math.min(best, pointToSegmentDistanceSquared(sourceAnchor, start, end));
  }
  return best;
}

function snapToTerrainBoundaryVertex(sourceAnchor, geometry) {
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

  let bestAnchor = null;
  let bestVertexDistance = Infinity;
  for (const point of bestShape.points ?? []) {
    const anchor = [Number(point.x), Number(point.y)];
    if (!anchor.every(Number.isFinite)) continue;
    const vertexDistance = distanceSquared(sourceAnchor, anchor);
    if (vertexDistance < bestVertexDistance) {
      bestAnchor = anchor;
      bestVertexDistance = vertexDistance;
    }
  }
  return bestAnchor ? {
    terrain: bestTerrain,
    anchor: bestAnchor,
    sourceBoundaryDistance: Math.sqrt(bestBoundaryDistance)
  } : null;
}

function resolveGenericGuides(page, geometry) {
  const sourceGuides = EVENT_COMPANION_SOURCE_PLACEMENT_GUIDES[String(page)] ?? [];
  if (!sourceGuides.length || !geometry?.terrainGeometry) return [];

  const resolved = [];

  for (const guide of sourceGuides) {
    const snapped = snapToTerrainBoundaryVertex(guide.sourceAnchor, geometry);
    if (!snapped) continue;
    resolved.push({ ...guide, terrain: snapped.terrain, anchor: snapped.anchor, sourceBoundaryDistance: snapped.sourceBoundaryDistance });
  }

  // Event Companion terrain layouts are rotationally paired across the battlefield.
  // Reuse each official printed value on its 180-degree counterpart so every
  // terrain piece has a practical setup reference. No mirrored distance is calculated.
  for (const guide of sourceGuides) {
    const mirroredSourceAnchor = [60 - guide.sourceAnchor[0], 44 - guide.sourceAnchor[1]];
    const snapped = snapToTerrainBoundaryVertex(mirroredSourceAnchor, geometry);
    if (!snapped) continue;
    resolved.push({
      ...guide,
      sourceAnchor: mirroredSourceAnchor,
      terrain: snapped.terrain,
      edge: MIRROR_EDGE[guide.edge],
      anchor: snapped.anchor,
      sourceBoundaryDistance: snapped.sourceBoundaryDistance,
      mirrored: true
    });
  }

  return resolved;
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
  if (edge === "left") return [1.6, Math.max(1.2, Math.min(42.8, y + 0.7))];
  if (edge === "right") return [58.4, Math.max(1.2, Math.min(42.8, y + 0.7))];
  if (edge === "top") return [Math.max(1.8, Math.min(58.2, x + 0.8)), 42.6];
  return [Math.max(1.8, Math.min(58.2, x + 0.8)), 1.6];
}

function geometryForPage(page) {
  return (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((layout) => Number(layout?.page) === Number(page)) ?? null;
}

export function getEventCompanionPlacementOverlay(page, geometry = null) {
  const activeGeometry = geometry ?? geometryForPage(page);
  const guides = Number(page) === 12
    ? PAGE_12_COMPLETE_GUIDES
    : resolveGenericGuides(page, activeGeometry);

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

export { PAGE_12_GUIDES, PAGE_12_COMPLETE_GUIDES, resolveGenericGuides, terrainVertices };