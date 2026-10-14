const BOARD_WIDTH = 60;
const BOARD_HEIGHT = 44;
const EPSILON = 1e-9;

export function terrainShapePoints(shape) {
  return (shape?.points ?? [])
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => [Number(point.x), Number(point.y)]);
}

export function battlefieldEdgeEndpoint(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [0, y];
  if (edge === "right") return [BOARD_WIDTH, y];
  if (edge === "top") return [x, BOARD_HEIGHT];
  return [x, 0];
}

function distanceSquared(a, b) {
  const dx = Number(a[0]) - Number(b[0]);
  const dy = Number(a[1]) - Number(b[1]);
  return dx * dx + dy * dy;
}

function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function pointOnSegment(point, start, end) {
  const segment = [end[0] - start[0], end[1] - start[1]];
  const offset = [point[0] - start[0], point[1] - start[1]];
  if (Math.abs(cross(segment, offset)) > EPSILON) return false;

  const dot = offset[0] * segment[0] + offset[1] * segment[1];
  if (dot < -EPSILON) return false;

  const lengthSquared = segment[0] * segment[0] + segment[1] * segment[1];
  return dot <= lengthSquared + EPSILON;
}

function pointInPolygonInterior(point, polygon) {
  if (polygon.length < 3) return false;

  for (let index = 0; index < polygon.length; index += 1) {
    if (pointOnSegment(point, polygon[index], polygon[(index + 1) % polygon.length])) return false;
  }

  let inside = false;
  const [px, py] = point;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const crosses = (yi > py) !== (yj > py);
    if (!crosses) continue;
    const intersectionX = ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (px < intersectionX) inside = !inside;
  }
  return inside;
}

function intersectionParameter(start, end, edgeStart, edgeEnd) {
  const ray = [end[0] - start[0], end[1] - start[1]];
  const edge = [edgeEnd[0] - edgeStart[0], edgeEnd[1] - edgeStart[1]];
  const denominator = cross(ray, edge);
  if (Math.abs(denominator) <= EPSILON) return null;

  const delta = [edgeStart[0] - start[0], edgeStart[1] - start[1]];
  const t = cross(delta, edge) / denominator;
  const u = cross(delta, ray) / denominator;
  if (t < -EPSILON || t > 1 + EPSILON || u < -EPSILON || u > 1 + EPSILON) return null;
  return Math.max(0, Math.min(1, t));
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
  return overlapEnd - overlapStart > 1e-7;
}

function uniqueSorted(values) {
  return [...values]
    .sort((a, b) => a - b)
    .filter((value, index, sorted) => index === 0 || Math.abs(value - sorted[index - 1]) > 1e-7);
}

export function segmentCrossesTerrainInterior(start, end, shapeOrPoints) {
  const polygon = Array.isArray(shapeOrPoints)
    ? shapeOrPoints
    : terrainShapePoints(shapeOrPoints);
  if (polygon.length < 3) return false;

  const tValues = [0, 1];
  for (let index = 0; index < polygon.length; index += 1) {
    const edgeStart = polygon[index];
    const edgeEnd = polygon[(index + 1) % polygon.length];

    // A guide that runs along the terrain boundary is just as unusable as one
    // that cuts through the interior: the measurement line is visually buried
    // in the footprint instead of leaving cleanly from its chosen corner.
    if (segmentOverlapsBoundary(start, end, edgeStart, edgeEnd)) return true;

    const t = intersectionParameter(start, end, edgeStart, edgeEnd);
    if (t !== null) tValues.push(t);
  }

  const stops = uniqueSorted(tValues);
  for (let index = 0; index < stops.length - 1; index += 1) {
    const low = stops[index];
    const high = stops[index + 1];
    if (high - low <= 1e-7) continue;
    const t = (low + high) / 2;
    const point = [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t
    ];
    if (pointInPolygonInterior(point, polygon)) return true;
  }

  return false;
}

export function nearestClearTerrainVertex(sourceAnchor, shape, edge) {
  const points = terrainShapePoints(shape);
  if (!points.length) return null;

  const clear = points.filter((anchor) => {
    const endpoint = battlefieldEdgeEndpoint(anchor, edge);
    return !segmentCrossesTerrainInterior(anchor, endpoint, points);
  });
  const candidates = clear.length ? clear : points;

  let bestAnchor = null;
  let bestDistance = Infinity;
  for (const anchor of candidates) {
    const candidateDistance = distanceSquared(sourceAnchor, anchor);
    if (candidateDistance < bestDistance) {
      bestAnchor = anchor;
      bestDistance = candidateDistance;
    }
  }
  return bestAnchor;
}
