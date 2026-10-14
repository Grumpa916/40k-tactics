import { EVENT_COMPANION_MAP_CATALOG } from "./event-companion-map-catalog.js";

// Terrain-placement transcription for the existing V2 battlefield geometry.
// Source of truth: the official Warhammer 40,000 Event Companion PDF used by
// this project. Printed values are copied from visible source dimensions; they
// are never calculated from V2 geometry.
//
// Pages 12-14 retain their previously approved mappings. Pages 15-18 were
// re-transcribed directly from the PDF vector layer. The PDF vector extraction
// uses the opposite Y direction from V2's 60 x 44 battlefield coordinates, so
// those guides are normalized once here by reflecting Y across the 44-inch
// axis and swapping top/bottom edge references. Deployment-zone dimensions are
// deliberately excluded: this module is for terrain placement only.
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
  { value: '20"', edge: "bottom", sourceAnchor: [20.02, 9.96] },
  { value: '9"',  edge: "right",  sourceAnchor: [50.91, 22.08] }
]);

const PAGE_13_ANCHOR_OVERRIDES = Object.freeze({
  '4"|top':     Object.freeze({ terrain: "T12", anchor: [25.9, 40.0], edge: "top" }),
  '4"|right':   Object.freeze({ terrain: "T8", anchor: [53.0, 40.1], edge: "top" }),
  '7"|bottom':  Object.freeze({ terrain: "T8", anchor: [53.0, 40.1], edge: "right" }),
  '9"|top':     Object.freeze({ terrain: "T12/T13", anchor: [25.9, 33.9], edge: "top" }),
  '9"|right':   Object.freeze({ terrain: "T15", anchor: [51.1, 22.1], edge: "right" }),
  '10"|bottom': Object.freeze({ terrain: "T13", anchor: [19.9, 33.9], edge: "top" }),
  '18"|left':   Object.freeze({ terrain: "T14", anchor: [24.4, 12.6], edge: "left" }),
  '20"|bottom': Object.freeze({ terrain: "T13", anchor: [19.9, 33.9], edge: "left" }),
  '26"|right':  Object.freeze({ terrain: "T12", anchor: [25.9, 40.0], edge: "left" })
});

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

function normalizePdfVectorGuide(guide) {
  const [x, y] = guide.sourceAnchor;
  const edge = guide.edge === "top" ? "bottom" : guide.edge === "bottom" ? "top" : guide.edge;
  return Object.freeze({ ...guide, edge, sourceAnchor: [x, 44 - y] });
}

const PAGE_15_SOURCE_GUIDES = Object.freeze([
  { value: '18"', edge: "bottom", sourceAnchor: [54.02, 17.90] },
  { value: '5"', edge: "right", sourceAnchor: [55.20, 3.99] },
  { value: '4"', edge: "bottom", sourceAnchor: [55.17, 4.01] },
  { value: '22"', edge: "bottom", sourceAnchor: [45.87, 21.99] },
  { value: '7"', edge: "bottom", sourceAnchor: [37.02, 7.00] },
  { value: '5"', edge: "bottom", sourceAnchor: [25.85, 4.92] },
  { value: '9"', edge: "bottom", sourceAnchor: [12.63, 9.16] },
  { value: '24"', edge: "left", sourceAnchor: [24.17, 7.05] },
  { value: '10"', edge: "bottom", sourceAnchor: [4.89, 10.03] },
  { value: '5"', edge: "left", sourceAnchor: [4.89, 9.98] },
  { value: '24.25"', edge: "right", sourceAnchor: [35.64, 27.03] },
  { value: '3"', edge: "bottom", sourceAnchor: [16.78, 3.09] },
  { value: '17"', edge: "top", sourceAnchor: [35.73, 26.99] },
  { value: '6"', edge: "right", sourceAnchor: [54.02, 17.96] },
  { value: '4"', edge: "bottom", sourceAnchor: [43.45, 4.08] },
  { value: '7"', edge: "bottom", sourceAnchor: [24.14, 7.00] },
  { value: '11"', edge: "left", sourceAnchor: [11.09, 5.37] },
  { value: '5"', edge: "left", sourceAnchor: [4.91, 17.06] },
  { value: '15"', edge: "right", sourceAnchor: [44.99, 14.92] },
  { value: '15"', edge: "bottom", sourceAnchor: [44.99, 14.92] },
  { value: '17"', edge: "top", sourceAnchor: [24.28, 27.04] }
].map(normalizePdfVectorGuide));

const PAGE_16_SOURCE_GUIDES = Object.freeze([
  { value: '24.25"', edge: "right", sourceAnchor: [35.92, 17.03] },
  { value: '17"', edge: "top", sourceAnchor: [35.83, 26.97] },
  { value: '16"', edge: "bottom", sourceAnchor: [46.05, 16.03] },
  { value: '14"', edge: "right", sourceAnchor: [46.01, 16.03] },
  { value: '5"', edge: "bottom", sourceAnchor: [56.15, 5.02] },
  { value: '4"', edge: "right", sourceAnchor: [56.15, 5.07] },
  { value: '8"', edge: "top", sourceAnchor: [53.12, 36.00] },
  { value: '7"', edge: "right", sourceAnchor: [53.08, 36.02] },
  { value: '5"', edge: "bottom", sourceAnchor: [44.58, 5.05] },
  { value: '17"', edge: "top", sourceAnchor: [51.28, 26.97] },
  { value: '4"', edge: "top", sourceAnchor: [47.19, 40.00] },
  { value: '4"', edge: "bottom", sourceAnchor: [23.94, 3.92] },
  { value: '9"', edge: "bottom", sourceAnchor: [32.10, 8.92] },
  { value: '24"', edge: "left", sourceAnchor: [24.00, 3.94] },
  { value: '23"', edge: "right", sourceAnchor: [36.94, 4.01] },
  { value: '4"', edge: "bottom", sourceAnchor: [36.94, 3.93] },
  { value: '17"', edge: "top", sourceAnchor: [24.39, 27.05] },
  { value: '14"', edge: "bottom", sourceAnchor: [40.15, 14.01] },
  { value: '9"', edge: "right", sourceAnchor: [51.37, 26.93] }
].map(normalizePdfVectorGuide));

const PAGE_17_SOURCE_GUIDES = Object.freeze([
  { value: '24.25"', edge: "right", sourceAnchor: [35.75, 27.05] },
  { value: '11"', edge: "right", sourceAnchor: [49.10, 6.94] },
  { value: '17"', edge: "top", sourceAnchor: [35.75, 27.04] },
  { value: '4"', edge: "bottom", sourceAnchor: [48.97, 3.79] },
  { value: '10"', edge: "right", sourceAnchor: [50.19, 15.98] },
  { value: '11"', edge: "right", sourceAnchor: [49.02, 40.01] },
  { value: '24"', edge: "right", sourceAnchor: [35.84, 5.01] },
  { value: '5"', edge: "bottom", sourceAnchor: [35.89, 4.98] },
  { value: '11"', edge: "bottom", sourceAnchor: [41.09, 11.09] },
  { value: '17"', edge: "top", sourceAnchor: [24.19, 27.12] },
  { value: '2"', edge: "top", sourceAnchor: [33.96, 41.95] },
  { value: '2"', edge: "top", sourceAnchor: [41.04, 41.99] },
  { value: '19"', edge: "right", sourceAnchor: [41.01, 41.99] },
  { value: '16"', edge: "bottom", sourceAnchor: [43.04, 15.98] },
  { value: '11"', edge: "right", sourceAnchor: [49.04, 29.96] },
  { value: '10"', edge: "right", sourceAnchor: [50.05, 27.62] },
  { value: '10"', edge: "bottom", sourceAnchor: [55.11, 9.81] },
  { value: '19"', edge: "right", sourceAnchor: [41.13, 11.09] },
  { value: '5"', edge: "bottom", sourceAnchor: [32.01, 4.98] },
  { value: '4"', edge: "top", sourceAnchor: [46.33, 40.07] }
].map(normalizePdfVectorGuide));

const PAGE_18_SOURCE_GUIDES = Object.freeze([
  { value: '24.25"', edge: "right", sourceAnchor: [35.89, 26.98] },
  { value: '5"', edge: "right", sourceAnchor: [55.08, 18.51] },
  { value: '9"', edge: "right", sourceAnchor: [51.20, 22.25] },
  { value: '4"', edge: "bottom", sourceAnchor: [41.05, 4.00] },
  { value: '19"', edge: "right", sourceAnchor: [41.09, 4.00] },
  { value: '14"', edge: "bottom", sourceAnchor: [45.08, 13.98] },
  { value: '17"', edge: "bottom", sourceAnchor: [35.75, 16.86] },
  { value: '10"', edge: "top", sourceAnchor: [25.95, 34.14] },
  { value: '26"', edge: "right", sourceAnchor: [34.01, 39.07] },
  { value: '5"', edge: "top", sourceAnchor: [33.98, 39.07] },
  { value: '17"', edge: "bottom", sourceAnchor: [24.23, 16.89] },
  { value: '4"', edge: "top", sourceAnchor: [40.20, 39.96] },
  { value: '4"', edge: "top", sourceAnchor: [47.10, 39.94] },
  { value: '5"', edge: "right", sourceAnchor: [55.08, 6.96] },
  { value: '7"', edge: "bottom", sourceAnchor: [55.11, 6.96] },
  { value: '15"', edge: "right", sourceAnchor: [45.09, 13.98] }
].map(normalizePdfVectorGuide));

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

const VERIFIED_SOURCE_GUIDES = Object.freeze({
  "13": PAGE_13_SOURCE_GUIDES,
  "14": PAGE_14_SOURCE_GUIDES,
  "15": PAGE_15_SOURCE_GUIDES,
  "16": PAGE_16_SOURCE_GUIDES,
  "17": PAGE_17_SOURCE_GUIDES,
  "18": PAGE_18_SOURCE_GUIDES
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

function snapToTerrainVertex(sourceAnchor, layout) {
  let bestTerrain = null;
  let bestShape = null;
  let bestBoundaryDistance = Infinity;
  for (const [terrain, shape] of Object.entries(layout?.terrainGeometry ?? {})) {
    const boundaryDistance = shapeBoundaryDistanceSquared(sourceAnchor, shape);
    if (boundaryDistance < bestBoundaryDistance) {
      bestTerrain = terrain;
      bestShape = shape;
      bestBoundaryDistance = boundaryDistance;
    }
  }
  if (!bestShape) return null;
  const anchor = nearestShapeVertex(sourceAnchor, bestShape);
  return anchor ? { terrain: bestTerrain, anchor } : null;
}

function geometryForPage(page) {
  return (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((layout) => Number(layout?.page) === Number(page)) ?? null;
}

function resolvedGuideForPage(page, guide, layout) {
  if (Number(page) === 13) {
    const override = PAGE_13_ANCHOR_OVERRIDES[guide.value + "|" + guide.edge];
    if (override) return override;
  }
  return snapToTerrainVertex(guide.sourceAnchor, layout);
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

function resolveVerifiedGuides(page) {
  const sourceGuides = VERIFIED_SOURCE_GUIDES[String(page)] ?? [];
  const layout = geometryForPage(page);
  if (!sourceGuides.length || !layout?.terrainGeometry) return [];
  const resolved = [];
  for (const guide of sourceGuides) {
    const snapped = resolvedGuideForPage(page, guide, layout);
    if (snapped) resolved.push({ ...guide, ...snapped });
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

function labelPosition(anchor, edge, page) {
  const [x, y] = anchor;
  if (Number(page) <= 14) {
    if (edge === "left") return [Math.max(1.4, x - 1.4), y + 0.7];
    if (edge === "right") return [Math.min(58.6, x + 1.4), y + 0.7];
    if (edge === "top") return [x + 0.8, Math.min(42.8, y + 1.4)];
    return [x + 0.8, Math.max(1.2, y - 1.2)];
  }

  const [edgeX, edgeY] = endpointFor(anchor, edge);
  const midX = (x + edgeX) / 2;
  const midY = (y + edgeY) / 2;
  if (edge === "left" || edge === "right") return [midX, midY + 0.7];
  return [midX + 0.8, midY];
}

export function getEventCompanionPlacementOverlay(page) {
  const numericPage = Number(page);
  const guides = numericPage === 12 ? PAGE_12_COMPLETE_GUIDES : resolveVerifiedGuides(numericPage);
  if (!guides.length) return null;

  const lines = guides.map((guide) => {
    const [x, y] = guide.anchor;
    const [edgeX, edgeY] = endpointFor(guide.anchor, guide.edge);
    return [x, y, edgeX, edgeY];
  });

  const measurements = guides.map((guide) => {
    const [x, y] = labelPosition(guide.anchor, guide.edge, numericPage);
    return { terrain: guide.terrain, value: guide.value, x, y };
  });

  const seen = new Set();
  const anchors = [];
  for (const guide of guides) {
    const key = guide.terrain + "|" + guide.anchor.join(",");
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
  PAGE_14_SOURCE_GUIDES,
  PAGE_15_SOURCE_GUIDES,
  PAGE_16_SOURCE_GUIDES,
  PAGE_17_SOURCE_GUIDES,
  PAGE_18_SOURCE_GUIDES
};
