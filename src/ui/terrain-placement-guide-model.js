import { getEventCompanionPlacementOverlay } from "../data/event-companion-placement-guides.js";
import { getEventCompanionPlacementGuideCorrections } from "../data/event-companion-placement-guide-corrections.js";
import { terrainGuideCrossesPolygonInterior } from "./terrain-placement-path-safety.js";

export const TERRAIN_BOARD_WIDTH = 60;
export const TERRAIN_BOARD_HEIGHT = 44;

const PAGE_18_OPPOSITE_EDGE = Object.freeze({
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top"
});

const PAGE_18_TERRAIN_MIRRORS = Object.freeze({
  T1: "T6",
  T2: "T12",
  T3: "T15",
  T4: "T11",
  T5: "T7",
  T6: "T1",
  T7: "T5",
  T8: "T13",
  T9: "T14",
  T10: "T16",
  T11: "T4",
  T12: "T2",
  T13: "T8",
  T14: "T9",
  T15: "T3",
  T16: "T10"
});

const PAGE_18_SOURCE_EDGE_RESTORES = Object.freeze({
  '9"|51.2|22.25': "right",
  '10"|25.95|34.14': "top",
  '17"|35.75|16.86': "bottom",
  '17"|24.23|16.89': "bottom"
});

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

function centroid(points) {
  if (!points.length) return [TERRAIN_BOARD_WIDTH / 2, TERRAIN_BOARD_HEIGHT / 2];
  const total = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function distanceSquared(a, b) {
  const dx = Number(a?.[0]) - Number(b?.[0]);
  const dy = Number(a?.[1]) - Number(b?.[1]);
  return dx * dx + dy * dy;
}

function nearestTerrainVertex(layout, target) {
  let bestTerrain = null;
  let bestAnchor = null;
  let bestDistance = Infinity;

  for (const [terrain, shape] of Object.entries(layout?.terrainGeometry ?? {})) {
    for (const anchor of geometryPoints(shape)) {
      const candidateDistance = distanceSquared(target, anchor);
      if (candidateDistance < bestDistance) {
        bestTerrain = terrain;
        bestAnchor = anchor;
        bestDistance = candidateDistance;
      }
    }
  }

  return bestTerrain && bestAnchor ? { terrain: bestTerrain, anchor: [...bestAnchor] } : null;
}

function nearestShapeVertex(shape, target) {
  let bestAnchor = null;
  let bestDistance = Infinity;
  for (const anchor of geometryPoints(shape)) {
    const candidateDistance = distanceSquared(target, anchor);
    if (candidateDistance < bestDistance) {
      bestAnchor = anchor;
      bestDistance = candidateDistance;
    }
  }
  return bestAnchor ? [...bestAnchor] : null;
}

function terrainCenterX(layout, terrain) {
  return centroid(geometryPoints(layout?.terrainGeometry?.[terrain]))[0];
}

function page18OriginalSourceEdge(guide) {
  const sourceAnchor = guide?.sourceAnchor ?? [];
  const key = String(guide?.value ?? "") + "|" + Number(sourceAnchor[0]) + "|" + Number(sourceAnchor[1]);
  return PAGE_18_SOURCE_EDGE_RESTORES[key] ?? guide?.edge;
}

function page18SourceAlignedGuide(guide, layout) {
  const sourceAnchor = guide?.sourceAnchor;
  if (!Array.isArray(sourceAnchor) || sourceAnchor.length !== 2) return guide;
  if (!Number.isFinite(Number(sourceAnchor[0])) || !Number.isFinite(Number(sourceAnchor[1]))) return guide;

  // Page 18's PDF-extracted source coordinate frame is 180 degrees opposite
  // the already-verified V2 terrain geometry. Rotate the placement point AND
  // its battlefield-edge direction together, then snap the point to the
  // nearest reproducible V2 terrain vertex. Never rotate one without the other.
  const correctedSourcePoint = [
    TERRAIN_BOARD_WIDTH - Number(sourceAnchor[0]),
    TERRAIN_BOARD_HEIGHT - Number(sourceAnchor[1])
  ];
  const originalSourceEdge = page18OriginalSourceEdge(guide);
  const correctedEdge = PAGE_18_OPPOSITE_EDGE[originalSourceEdge] ?? originalSourceEdge;
  const snapped = nearestTerrainVertex(layout, correctedSourcePoint);
  return snapped ? { ...guide, edge: correctedEdge, ...snapped } : { ...guide, edge: correctedEdge };
}

function page18MirroredCounterpartGuides(sourceGuides, layout) {
  const originallyMeasured = new Set(sourceGuides.map((guide) => guide.terrain));
  const mirrored = [];

  for (const guide of sourceGuides) {
    const targetTerrain = PAGE_18_TERRAIN_MIRRORS[guide.terrain];
    if (!targetTerrain || originallyMeasured.has(targetTerrain)) continue;

    // The requested counterparts are the currently blank terrain shapes on
    // the top half of the portrait Event Companion view. In V2's 60x44 source
    // coordinate frame those counterparts have centers on the x > 30 side.
    if (terrainCenterX(layout, targetTerrain) <= TERRAIN_BOARD_WIDTH / 2) continue;

    const targetShape = layout?.terrainGeometry?.[targetTerrain];
    const rotatedPoint = [
      TERRAIN_BOARD_WIDTH - Number(guide.anchor[0]),
      TERRAIN_BOARD_HEIGHT - Number(guide.anchor[1])
    ];
    const targetAnchor = nearestShapeVertex(targetShape, rotatedPoint);
    if (!targetAnchor) continue;

    mirrored.push({
      ...guide,
      terrain: targetTerrain,
      anchor: targetAnchor,
      edge: PAGE_18_OPPOSITE_EDGE[guide.edge] ?? guide.edge,
      mirrored: true,
      mirroredFromTerrain: guide.terrain,
      mirroredFromAnchor: [...guide.anchor]
    });
  }

  return mirrored;
}

function anchorKey(terrain, anchor) {
  return String(terrain ?? "") + "|" + Number(anchor?.[0]) + "|" + Number(anchor?.[1]);
}

function guideKey(guide) {
  return [
    String(guide?.terrain ?? ""),
    Number(guide?.anchor?.[0]),
    Number(guide?.anchor?.[1]),
    String(guide?.edge ?? ""),
    String(guide?.value ?? "")
  ].join("|");
}

function pointName(index) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function sourceGuidesForPage(page, layout) {
  const canonical = getEventCompanionPlacementOverlay(Number(page));
  if (!canonical) return [];

  const deduped = new Map();
  for (const guide of canonical.guides ?? []) {
    const sourceAligned = Number(page) === 18 ? page18SourceAlignedGuide(guide, layout) : guide;
    deduped.set(guideKey(sourceAligned), { ...sourceAligned, anchor: [...sourceAligned.anchor] });
  }
  for (const guide of getEventCompanionPlacementGuideCorrections(page)) {
    deduped.set(guideKey(guide), { ...guide, anchor: [...guide.anchor] });
  }

  const officialGuides = [...deduped.values()];
  if (Number(page) !== 18) return officialGuides;

  // Page 18 user-approved usability rule: reuse the existing approved values
  // on clear 180-degree counterpart terrain shapes that currently have no
  // measurements. No value is calculated or altered, and mirrored copies use
  // the same visual treatment as their source guides.
  for (const guide of page18MirroredCounterpartGuides(officialGuides, layout)) {
    deduped.set(guideKey(guide), guide);
  }
  return [...deduped.values()];
}

function groupedSourcePoints(guides) {
  const groups = new Map();
  const terrainCounts = new Map();

  for (const guide of guides) {
    const key = anchorKey(guide.terrain, guide.anchor);
    if (!groups.has(key)) {
      const index = terrainCounts.get(guide.terrain) ?? 0;
      terrainCounts.set(guide.terrain, index + 1);
      groups.set(key, {
        terrain: guide.terrain,
        point: pointName(index),
        anchor: [...guide.anchor],
        guides: []
      });
    }
    groups.get(key).guides.push(guide);
  }

  return [...groups.values()];
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
  const pointIndex = Math.max(0, String(point ?? "A").charCodeAt(0) - "A".charCodeAt(0));
  const tangentSign = pointIndex % 2 === 0 ? -1 : 1;
  const outward = 4.0;
  const tangent = 1.1 * tangentSign;

  return [
    clamp(anchor[0] + ux * outward + tangentX * tangent, 4.6, TERRAIN_BOARD_WIDTH - 4.6),
    clamp(anchor[1] + uy * outward + tangentY * tangent, 3.0, TERRAIN_BOARD_HEIGHT - 3.0)
  ];
}

export function buildCompleteTerrainPlacementGuides(layout) {
  const guides = sourceGuidesForPage(Number(layout?.page), layout);
  return groupedSourcePoints(guides).map((group) => ({
    terrain: group.terrain,
    point: group.point,
    anchor: [...group.anchor],
    edges: group.guides.map((guide) => guide.edge),
    values: group.guides.map((guide) => guide.value)
  }));
}

function canonicalOverlayWithPointNames(canonical) {
  const groups = groupedSourcePoints(canonical.guides ?? []);
  const pointByAnchor = new Map(groups.map((group) => [anchorKey(group.terrain, group.anchor), group.point]));
  const guides = (canonical.guides ?? []).map((guide) => ({
    ...guide,
    point: pointByAnchor.get(anchorKey(guide.terrain, guide.anchor)) ?? "A"
  }));
  const anchors = (canonical.anchors ?? []).map((anchor) => ({
    ...anchor,
    point: pointByAnchor.get(anchorKey(anchor.terrain, [anchor.x, anchor.y])) ?? "A"
  }));
  const measurements = (canonical.measurements ?? []).map((measurement, index) => ({
    ...measurement,
    terrain: guides[index]?.terrain ?? measurement.terrain,
    point: guides[index]?.point ?? "A"
  }));

  return {
    guides,
    lines: (canonical.lines ?? []).map((line) => [...line]),
    measurements,
    anchors,
    callouts: []
  };
}

export function buildCompleteTerrainPlacementOverlay(layout) {
  const page = Number(layout?.page);
  const canonical = getEventCompanionPlacementOverlay(page);
  if (!canonical) {
    return { guides: [], lines: [], measurements: [], anchors: [], callouts: [] };
  }

  // Pages 12-14 retain their previously approved exact overlay presentation.
  if (page <= 14) return canonicalOverlayWithPointNames(canonical);

  // Pages 15+ begin with strictly source-defined values. Page 18 additionally
  // reuses those approved values on clear blank rotational counterparts by the
  // explicit user-approved mirror rule above; the copied values are unchanged.
  const sourceGuides = sourceGuidesForPage(page, layout);
  const groups = groupedSourcePoints(sourceGuides);
  const pointByAnchor = new Map(groups.map((group) => [anchorKey(group.terrain, group.anchor), group.point]));

  const guides = sourceGuides.map((guide) => ({
    ...guide,
    point: pointByAnchor.get(anchorKey(guide.terrain, guide.anchor)) ?? "A"
  }));
  const lines = guides.map((guide) => [
    guide.anchor[0],
    guide.anchor[1],
    ...terrainGuideEndpoint(guide.anchor, guide.edge)
  ]);
  const measurements = guides.map((guide) => {
    const [x, y] = terrainGuideLabelPosition(guide.anchor, guide.edge);
    return {
      terrain: guide.terrain,
      point: guide.point,
      value: guide.value,
      x,
      y
    };
  });
  const anchors = groups.map((group) => ({
    terrain: group.terrain,
    point: group.point,
    x: group.anchor[0],
    y: group.anchor[1]
  }));

  const callouts = groups.map((group) => {
    const shapeCenter = centroid(geometryPoints(layout?.terrainGeometry?.[group.terrain]));
    const [x, y] = calloutPosition(group.anchor, shapeCenter, group.point);
    const orderedGuides = [...group.guides].sort((left, right) => {
      const leftHorizontal = left.edge === "left" || left.edge === "right";
      const rightHorizontal = right.edge === "left" || right.edge === "right";
      if (leftHorizontal === rightHorizontal) return 0;
      return leftHorizontal ? -1 : 1;
    });
    return {
      terrain: group.terrain,
      point: group.point,
      x,
      y,
      anchorX: group.anchor[0],
      anchorY: group.anchor[1],
      lines: orderedGuides.map((guide) => calloutArrow(guide.edge, guide.value)),
      values: orderedGuides.map((guide) => guide.value),
      edges: orderedGuides.map((guide) => guide.edge)
    };
  });

  return { guides, lines, measurements, anchors, callouts };
}

export function terrainGuideCrossesOwnTerrain(layout, guide) {
  const shapePoints = geometryPoints(layout?.terrainGeometry?.[guide?.terrain]);
  if (shapePoints.length < 3) return false;
  return terrainGuideCrossesPolygonInterior(guide.anchor, guide.edge, shapePoints, {
    width: TERRAIN_BOARD_WIDTH,
    height: TERRAIN_BOARD_HEIGHT
  });
}
