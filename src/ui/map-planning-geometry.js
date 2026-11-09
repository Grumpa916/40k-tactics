export const BOARD_WIDTH = 60;
export const BOARD_HEIGHT = 44;
const MM_PER_INCH = 25.4;
const EPSILON = 0.00001;

const board = [
  { x: 0, y: 0 }, { x: BOARD_WIDTH, y: 0 },
  { x: BOARD_WIDTH, y: BOARD_HEIGHT }, { x: 0, y: BOARD_HEIGHT }
];

export function baseDimensions(width, length) {
  const w = Number(width);
  const l = length === '' || length == null ? w : Number(length);
  if (![w, l].every(value => Number.isFinite(value) && value >= 1 && value <= 400)) return null;
  return { width: w / MM_PER_INCH, length: l / MM_PER_INCH };
}

export function clampToBoard(point) {
  return {
    x: Math.min(BOARD_WIDTH, Math.max(0, point.x)),
    y: Math.min(BOARD_HEIGHT, Math.max(0, point.y))
  };
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function edges(points) {
  return points.map((start, index) => [start, points[(index + 1) % points.length]]);
}

function contains(point, polygon) {
  let inside = false;
  for (const [a, b] of edges(polygon)) {
    const edge = { x: b.x - a.x, y: b.y - a.y };
    const delta = { x: point.x - a.x, y: point.y - a.y };
    if (Math.abs(cross(edge, delta)) < EPSILON &&
        point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x) &&
        point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y)) return true;
    if ((a.y > point.y) !== (b.y > point.y) &&
        point.x < a.x + (point.y - a.y) * edge.x / edge.y) inside = !inside;
  }
  return inside;
}

/** Cast just to either side of each corner so shadows follow the actual footprint edges. */
export function planningVisibility(origin, blockers) {
  const containing = blockers.find(shape => contains(origin, shape.points));
  if (containing) return { points: [], containing: containing.name };

  const eye = {
    x: Math.max(EPSILON, Math.min(BOARD_WIDTH - EPSILON, origin.x)),
    y: Math.max(EPSILON, Math.min(BOARD_HEIGHT - EPSILON, origin.y))
  };
  const polygons = [board, ...blockers.map(shape => shape.points)];
  const segments = polygons.flatMap(edges);
  const angles = polygons.flatMap(polygon => polygon.flatMap(point => {
    const angle = Math.atan2(point.y - eye.y, point.x - eye.x);
    return [angle - EPSILON, angle, angle + EPSILON];
  })).sort((a, b) => a - b);

  const points = angles.map(angle => {
    const ray = { x: Math.cos(angle), y: Math.sin(angle) };
    let nearest = Infinity;
    for (const [start, end] of segments) {
      const edge = { x: end.x - start.x, y: end.y - start.y };
      const delta = { x: start.x - eye.x, y: start.y - eye.y };
      const denominator = cross(ray, edge);
      if (Math.abs(denominator) < 1e-12) continue;
      const distance = cross(delta, edge) / denominator;
      const alongEdge = cross(delta, ray) / denominator;
      if (distance > 0 && alongEdge >= 0 && alongEdge <= 1) nearest = Math.min(nearest, distance);
    }
    return Number.isFinite(nearest)
      ? clampToBoard({ x: eye.x + ray.x * nearest, y: eye.y + ray.y * nearest })
      : null;
  }).filter(Boolean);
  return { points, containing: null };
}
