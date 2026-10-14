import { EVENT_COMPANION_PAGE_MEASUREMENT_VALUES } from "../data/event-companion-page-measurement-values.js";

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

function measurementNumber(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/"$/, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function officialDistanceValue(page, anchor, edge) {
  const officialValues = EVENT_COMPANION_PAGE_MEASUREMENT_VALUES[Number(page)] ?? [];
  if (!officialValues.length) return formatDistance(anchor, edge);

  const target = edgeDistance(anchor, edge);
  let bestValue = officialValues[0];
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const value of officialValues) {
    const numeric = measurementNumber(value);
    if (numeric == null) continue;
    const delta = Math.abs(numeric - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestValue = value;
    }
  }

  return bestValue;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function terrainGuideLabelPosition(anchor, edge, { page = 14 } = {}) {
  const [edgeX, edgeY] = terrainGuideEndpoint(anchor, edge);

  // Preserve the browser-approved Page 14 presentation exactly.
  if (Number(page) === 14) {
    const x = (anchor[0] + edgeX) / 2;
    const y = (anchor[1] + edgeY) / 2;
    if (edge === "left" || edge === "right") return [x, y + 0.7];
    return [x + 0.8, y];
  }

  // Pages 15-53 render paired point callouts instead of individual labels.
  // Keep this fallback close to the edge for non-preview consumers.
  const inset = 1.8;
  if (edge === "left") return [inset, clamp(anchor[1], 1.2, TERRAIN_BOARD_HEIGHT - 1.2)];
  if (edge === "right") return [TERRAIN_BOARD_WIDTH - inset, clamp(anchor[1], 1.2, TERRAIN_BOARD_HEIGHT - 1.2)];
  if (edge === "bottom") return [clamp(anchor[0], 1.2, TERRAIN_BOARD_WIDTH - 1.2), inset];
  return [clamp(anchor[0], 1.2, TERRAIN_BOARD_WIDTH - 1.2), TERRAIN_BOARD_HEIGHT - inset];
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

export function buildCompleteTerrainPlacementGuides(layout) {
  const result = [];
  const page = Number(layout?.page);

  for (const [terrain, shape] of Object.entries(layout?.terrainGeometry ?? {})) {
    const shapePoints = geometryPoints(shape);
    if (shapePoints.length < 2) continue;
    const shapeCenter = centroid(shapePoints);

    if (page === 14) {
      const primaryEdge = primaryEdgeFor(shapePoints);
      const measurementPoints = approvedPage14MeasurementPoints(shapePoints, primaryEdge);
      measurementPoints.forEach((anchor, index) => {
        result.push({
          terrain,
          point: index === 0 ? "A" : "B",
          anchor,
          center: shapeCenter,
          edges: [primaryEdge, approvedPage14PerpendicularEdge(primaryEdge, anchor)]
        });
      });
      continue;
    }

    // Pages 15-53: use two well-separated reproducible corners, then send each
    // corner to its nearest horizontal and nearest vertical battlefield edge.
    const measurementPoints = farthestPair(shapePoints);
    measurementPoints.forEach((anchor, index) => {
      result.push({
        terrain,
        point: index === 0 ? "A" : "B",
        anchor,
        center: shapeCenter,
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
  const callouts = [];
  const page = Number(layout?.page);

  for (const measurementPoint of measurementPoints) {
    const [x, y] = measurementPoint.anchor;
    anchors.push({ terrain: measurementPoint.terrain, point: measurementPoint.point, x, y });

    const pointGuides = [];
    for (const edge of measurementPoint.edges) {
      const [edgeX, edgeY] = terrainGuideEndpoint(measurementPoint.anchor, edge);
      const [labelX, labelY] = terrainGuideLabelPosition(measurementPoint.anchor, edge, { page });
      const value = page >= 15
        ? officialDistanceValue(page, measurementPoint.anchor, edge)
        : formatDistance(measurementPoint.anchor, edge);
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
      measurements.push({ terrain: measurementPoint.terrain, point: measurementPoint.point, value, x: labelX, y: labelY });
    }

    if (page >= 15) {
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
  }

  return { guides, lines, measurements, anchors, callouts };
}
