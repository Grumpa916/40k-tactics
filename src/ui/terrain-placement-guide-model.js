import { getEventCompanionPlacementOverlay } from "../data/event-companion-placement-guides.js";
import { terrainGuideCrossesPolygonInterior } from "./terrain-placement-path-safety.js";

export const TERRAIN_BOARD_WIDTH = 60;
export const TERRAIN_BOARD_HEIGHT = 44;

function geometryPoints(shape) {
  return (shape?.points ?? [])
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => [Number(point.x), Number(point.y)]);
}

export function terrainGuideEndpoint(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [0, y];
  if (edge === "right") return [TERRAIN_BOARD_WIDTH, y];
  if (edge === "top") return [x, TERRAIN_BOARD_HEIGHT];
  return [x, 0];
}

export function terrainGuideLabelPosition(anchor, edge) {
  const [edgeX, edgeY] = terrainGuideEndpoint(anchor, edge);
  const x = (Number(anchor[0]) + edgeX) / 2;
  const y = (Number(anchor[1]) + edgeY) / 2;
  if (edge === "left" || edge === "right") return [x, y + 0.7];
  return [x + 0.8, y];
}

function anchorKey(terrain, anchor) {
  return String(terrain ?? "") + "|" + Number(anchor?.[0]) + "|" + Number(anchor?.[1]);
}

function pointName(index) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function groupedMeasurementPoints(overlay) {
  const groups = new Map();
  const terrainCounts = new Map();

  for (const guide of overlay?.guides ?? []) {
    const key = anchorKey(guide.terrain, guide.anchor);
    if (!groups.has(key)) {
      const index = terrainCounts.get(guide.terrain) ?? 0;
      terrainCounts.set(guide.terrain, index + 1);
      groups.set(key, {
        terrain: guide.terrain,
        point: pointName(index),
        anchor: [...guide.anchor],
        edges: []
      });
    }
    const group = groups.get(key);
    if (!group.edges.includes(guide.edge)) group.edges.push(guide.edge);
  }

  return [...groups.values()];
}

export function buildCompleteTerrainPlacementGuides(layout) {
  const overlay = getEventCompanionPlacementOverlay(Number(layout?.page));
  return overlay ? groupedMeasurementPoints(overlay) : [];
}

export function buildCompleteTerrainPlacementOverlay(layout) {
  const page = Number(layout?.page);
  const canonical = getEventCompanionPlacementOverlay(page);
  if (!canonical) {
    return { guides: [], lines: [], measurements: [], anchors: [], callouts: [] };
  }

  const points = groupedMeasurementPoints(canonical);
  const pointByAnchor = new Map(points.map((point) => [anchorKey(point.terrain, point.anchor), point.point]));
  const guides = canonical.guides.map((guide) => ({
    ...guide,
    point: pointByAnchor.get(anchorKey(guide.terrain, guide.anchor)) ?? "A"
  }));

  const anchors = canonical.anchors.map((anchor) => ({
    ...anchor,
    point: pointByAnchor.get(anchorKey(anchor.terrain, [anchor.x, anchor.y])) ?? "A"
  }));

  const measurements = canonical.measurements.map((measurement, index) => ({
    ...measurement,
    terrain: guides[index]?.terrain ?? measurement.terrain,
    point: guides[index]?.point ?? "A"
  }));

  return {
    guides,
    lines: canonical.lines.map((line) => [...line]),
    measurements,
    anchors,
    callouts: []
  };
}

export function terrainGuideCrossesOwnTerrain(layout, guide) {
  const shapePoints = geometryPoints(layout?.terrainGeometry?.[guide?.terrain]);
  if (shapePoints.length < 3) return false;
  return terrainGuideCrossesPolygonInterior(guide.anchor, guide.edge, shapePoints, {
    width: TERRAIN_BOARD_WIDTH,
    height: TERRAIN_BOARD_HEIGHT
  });
}
