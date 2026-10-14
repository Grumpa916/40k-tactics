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

function primaryEdgeFor(points) {
  const center = centroid(points);
  return ["left", "right", "top", "bottom"]
    .sort((a, b) => edgeDistance(center, a) - edgeDistance(center, b))[0];
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

// Page 14 was visually approved with this edge-biased point selection.
// Keep it stable while later pages use a less cluttered nearest-edge strategy.
function approvedPage14MeasurementPoints(points, primaryEdge) {
  const minimum = Math.min(...points.map((point) => edgeDistance(point, primaryEdge)));
  const nearPrimaryEdge = points.filter((point) => edgeDistance(point, primaryEdge) <= minimum + 2.5);
  if (nearPrimaryEdge.length >= 2) return farthestPair(nearPrimaryEdge);
  return [...points]
    .sort((a, b) => edgeDistance(a, primaryEdge) - edgeDistance(b, primaryEdge))
    .slice(0, 2);
}

function approvedPage14PerpendicularEdge(primaryEdge, anchor) {
  const [x, y] = anchor;
  if (primaryEdge === "left" || primaryEdge === "right") {
    return y <= TERRAIN_BOARD_HEIGHT / 2 ? "bottom" : "top";
  }
  return x <= TERRAIN_BOARD_WIDTH / 2 ? "left" : "right";
}

function nearestHorizontalEdge(anchor) {
  return anchor[0] <= TERRAIN_BOARD_WIDTH / 2 ? "left" : "right";
}

function nearestVerticalEdge(anchor) {
  return anchor[1] <= TERRAIN_BOARD_HEIGHT / 2 ? "bottom" : "top";
}

function formatDistance(anchor, edge) {
  return Math.max(0, Math.round(edgeDistance(anchor, edge))) + '"';
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function labelLaneKey(terrain, point, edge) {
  const text = String(terrain ?? "terrain") + "|" + String(point ?? "A") + "|" + String(edge ?? "left");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash * 31) + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function terrainGuideLabelPosition(anchor, edge, { page = 14, terrain = "terrain", point = "A" } = {}) {
  const [edgeX, edgeY] = terrainGuideEndpoint(anchor, edge);

  // Preserve the browser-approved Page 14 presentation exactly.
  if (Number(page) === 14) {
    const x = (anchor[0] + edgeX) / 2;
    const y = (anchor[1] + edgeY) / 2;
    if (edge === "left" || edge === "right") return [x, y + 0.7];
    return [x + 0.8, y];
  }

  // Pages 15-53 can contain many complete four-guide terrain measurements.
  // Keep the battlefield interior readable by moving labels into narrow lanes
  // just inside the perimeter while leaving every guide line and anchor intact.
  const laneKey = labelLaneKey(terrain, point, edge);
  const offsets = [-1.35, -0.65, 0.65, 1.35];
  const offset = offsets[laneKey % offsets.length];
  const inset = 1.8;

  if (edge === "left") {
    return [inset, clamp(anchor[1] + offset, 1.2, TERRAIN_BOARD_HEIGHT - 1.2)];
  }
  if (edge === "right") {
    return [TERRAIN_BOARD_WIDTH - inset, clamp(anchor[1] + offset, 1.2, TERRAIN_BOARD_HEIGHT - 1.2)];
  }
  if (edge === "bottom") {
    return [clamp(anchor[0] + offset, 1.2, TERRAIN_BOARD_WIDTH - 1.2), inset];
  }
  return [clamp(anchor[0] + offset, 1.2, TERRAIN_BOARD_WIDTH - 1.2), TERRAIN_BOARD_HEIGHT - inset];
}

export function buildCompleteTerrainPlacementGuides(layout) {
  const result = [];
  const page = Number(layout?.page);

  for (const [terrain, shape] of Object.entries(layout?.terrainGeometry ?? {})) {
    const shapePoints = geometryPoints(shape);
    if (shapePoints.length < 2) continue;

    if (page === 14) {
      const primaryEdge = primaryEdgeFor(shapePoints);
      const measurementPoints = approvedPage14MeasurementPoints(shapePoints, primaryEdge);
      measurementPoints.forEach((anchor, index) => {
        result.push({
          terrain,
          point: index === 0 ? "A" : "B",
          anchor,
          edges: [primaryEdge, approvedPage14PerpendicularEdge(primaryEdge, anchor)]
        });
      });
      continue;
    }

    // Pages 15-53: use two well-separated reproducible corners, then send each
    // corner to its nearest horizontal and nearest vertical battlefield edge.
    // This preserves the approved 2-points x 2-perpendicular-guides structure
    // while minimizing long crossings and label collisions on denser layouts.
    const measurementPoints = farthestPair(shapePoints);
    measurementPoints.forEach((anchor, index) => {
      result.push({
        terrain,
        point: index === 0 ? "A" : "B",
        anchor,
        edges: [nearestHorizontalEdge(anchor), nearestVerticalEdge(anchor)]
      });
    });
  }

  return result;
}

export function buildCompleteTerrainPlacementOverlay(layout) {
  const measurementPoints = buildCompleteTerrainPlacementGuides(layout);
  const guides = [];
  const lines = [];
  const measurements = [];
  const anchors = [];
  const page = Number(layout?.page);

  for (const measurementPoint of measurementPoints) {
    const [x, y] = measurementPoint.anchor;
    anchors.push({ terrain: measurementPoint.terrain, point: measurementPoint.point, x, y });
    for (const edge of measurementPoint.edges) {
      const [edgeX, edgeY] = terrainGuideEndpoint(measurementPoint.anchor, edge);
      const [labelX, labelY] = terrainGuideLabelPosition(measurementPoint.anchor, edge, {
        page,
        terrain: measurementPoint.terrain,
        point: measurementPoint.point
      });
      const value = formatDistance(measurementPoint.anchor, edge);
      guides.push({
        terrain: measurementPoint.terrain,
        point: measurementPoint.point,
        anchor: measurementPoint.anchor,
        edge,
        value
      });
      lines.push([x, y, edgeX, edgeY]);
      measurements.push({ terrain: measurementPoint.terrain, point: measurementPoint.point, value, x: labelX, y: labelY });
    }
  }

  return { guides, lines, measurements, anchors };
}
