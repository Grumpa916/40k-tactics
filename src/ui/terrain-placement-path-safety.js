const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 44;
const SAMPLE_COUNT = 600;

function pointOnSegment(point, start, end, epsilon = 1e-7) {
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

export function terrainGuideCrossesPolygonInterior(anchor, edge, polygon, {
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT
} = {}) {
  const endpoint = endpointFor(anchor, edge, width, height);
  const dx = endpoint[0] - anchor[0];
  const dy = endpoint[1] - anchor[1];

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
