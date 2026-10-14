const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 44;
const SAMPLE_COUNT = 600;
const EPSILON = 1e-7;

function pointOnSegment(point, start, end, epsilon = EPSILON) {
  const [px, py] = point;
  const [ax, ay] = start;
  const [bx, by] = end;
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (Math.abs(cross) > epsilon) return false;
  const dot = (px - ax) * (px - bx) + (py - ay) * (py - by);
  return dot <= epsilon;
}

function pointInsidePolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    if (pointOnSegment(point, polygon[j], polygon[i])) return false;
  }

  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function endpointFor(anchor, edge, width, height) {
  const [x, y] = anchor;
  if (edge === "left") return [0, y];
  if (edge === "right") return [width, y];
  if (edge === "top") return [x, height];
  return [x, 0];
}

function distanceToEdge(anchor, edge, width, height) {
  if (edge === "left") return anchor[0];
  if (edge === "right") return width - anchor[0];
  if (edge === "top") return height - anchor[1];
  return anchor[1];
}

function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function segmentOverlapsBoundary(start, end, edgeStart, edgeEnd) {
  const ray = [end[0] - start[0], end[1] - start[1]];
  const lengthSquared = ray[0] * ray[0] + ray[1] * ray[1];
  if (lengthSquared <= EPSILON) return false;

  const startOffset = [edgeStart[0] - start[0], edgeStart[1] - start[1]];
  const endOffset = [edgeEnd[0] - start[0], edgeEnd[1] - start[1]];
  if (Math.abs(cross(ray, startOffset)) > EPSILON || Math.abs(cross(ray, endOffset)) > EPSILON) {
    return false;
  }

  const startT = (startOffset[0] * ray[0] + startOffset[1] * ray[1]) / lengthSquared;
  const endT = (endOffset[0] * ray[0] + endOffset[1] * ray[1]) / lengthSquared;
  const overlapStart = Math.max(0, Math.min(startT, endT));
  const overlapEnd = Math.min(1, Math.max(startT, endT));
  return overlapEnd - overlapStart > EPSILON;
}

function guideOverlapsPolygonBoundary(anchor, endpoint, polygon) {
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    if (segmentOverlapsBoundary(anchor, endpoint, polygon[j], polygon[i])) return true;
  }
  return false;
}

export function terrainGuideCrossesPolygonInterior(anchor, edge, polygon, {
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT
} = {}) {
  const endpoint = endpointFor(anchor, edge, width, height);
  const dx = endpoint[0] - anchor[0];
  const dy = endpoint[1] - anchor[1];

  // A measurement path that rides along the terrain outline is visually buried
  // in the footprint and is not a usable outward guide, even though it does not
  // enter the strict polygon interior.
  if (guideOverlapsPolygonBoundary(anchor, endpoint, polygon)) return true;

  for (let index = 1; index < SAMPLE_COUNT; index += 1) {
    const t = index / SAMPLE_COUNT;
    const point = [anchor[0] + dx * t, anchor[1] + dy * t];
    if (pointInsidePolygon(point, polygon)) return true;
  }
  return false;
}

function safestEdge(anchor, polygon, candidates, width, height) {
  const safe = candidates
    .filter((edge) => !terrainGuideCrossesPolygonInterior(anchor, edge, polygon, { width, height }))
    .sort((left, right) => distanceToEdge(anchor, left, width, height) - distanceToEdge(anchor, right, width, height));
  return safe[0] ?? null;
}

export function outwardPerpendicularEdges(anchor, polygon, {
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT
} = {}) {
  const horizontal = safestEdge(anchor, polygon, ["left", "right"], width, height);
  const vertical = safestEdge(anchor, polygon, ["bottom", "top"], width, height);
  if (!horizontal || !vertical) return null;
  return [horizontal, vertical];
}
