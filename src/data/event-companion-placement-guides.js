import { EVENT_COMPANION_SOURCE_PLACEMENT_GUIDES } from "./event-companion-placement-source-guides.js";

// Terrain-placement transcription for the existing V2 battlefield geometry.
//
// Source of truth: official Warhammer 40,000 Event Companion.
// Printed values are never calculated. Source anchors identify the terrain-side
// endpoint of the official dimension line after rotating the portrait battlefield
// into V2's 60 x 44 landscape orientation. The generic path snaps those source
// anchors to the already-verified V2 terrain geometry before rendering.
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

function snapToTerrainVertex(sourceAnchor, vertices, maxDistance = 0.75) {
  let best = null;
  let bestDistance = Infinity;
  for (const vertex of vertices) {
    const d2 = distanceSquared(sourceAnchor, vertex.anchor);
    if (d2 < bestDistance) {
      best = vertex;
      bestDistance = d2;
    }
  }
  return best && Math.sqrt(bestDistance) <= maxDistance ? best : null;
}

function resolveGenericGuides(page, geometry) {
  const sourceGuides = EVENT_COMPANION_SOURCE_PLACEMENT_GUIDES[String(page)] ?? [];
  if (!sourceGuides.length || !geometry?.terrainGeometry) return [];

  const vertices = terrainVertices(geometry);
  const resolved = [];

  for (const guide of sourceGuides) {
    const snapped = snapToTerrainVertex(guide.sourceAnchor, vertices);
    if (!snapped) continue;
    resolved.push({ ...guide, terrain: snapped.terrain, anchor: snapped.anchor });
  }

  // Event Companion terrain layouts are rotationally paired across the battlefield.
  // Reuse each official printed value on its 180-degree counterpart so every
  // terrain piece has a practical setup reference. No mirrored distance is calculated.
  for (const guide of sourceGuides) {
    const mirroredSourceAnchor = [60 - guide.sourceAnchor[0], 44 - guide.sourceAnchor[1]];
    const snapped = snapToTerrainVertex(mirroredSourceAnchor, vertices);
    if (!snapped) continue;
    resolved.push({
      ...guide,
      sourceAnchor: mirroredSourceAnchor,
      terrain: snapped.terrain,
      edge: MIRROR_EDGE[guide.edge],
      anchor: snapped.anchor,
      mirrored: true
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const guide of resolved) {
    const key = [guide.value, guide.edge, guide.anchor[0], guide.anchor[1]].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(guide);
  }
  return deduped;
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

export function getEventCompanionPlacementOverlay(page, geometry = null) {
  const guides = Number(page) === 12
    ? PAGE_12_COMPLETE_GUIDES
    : resolveGenericGuides(page, geometry);

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

export { PAGE_12_GUIDES, PAGE_12_COMPLETE_GUIDES, resolveGenericGuides };
