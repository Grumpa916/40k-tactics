import { getEventCompanionPlacementOverlay } from "../data/event-companion-placement-guides.js";
import { getSupplementalEventCompanionPlacementOverlay } from "../data/event-companion-placement-guides-supplemental.js";
import { getEventCompanionPlacementCandidate } from "../data/event-companion-placement-candidates.js";
import { isEventCompanionTerrainPlacementApproved } from "../data/event-companion-placement-review-status.js";
import { getEventCompanionPlacementGuideCorrections } from "../data/event-companion-placement-guide-corrections.js";
import {
  getEventCompanionTerrainPlacementPolicy,
  transformEventCompanionSourceGuide
} from "../rules/event-companion-terrain-placement-policy.js";
import {
  getEventCompanionTerrainMirrorPolicy,
  transformEventCompanionMirrorGuide
} from "../rules/event-companion-terrain-mirror-policy.js";
import { terrainGuideViolatesMeasuredTerrain } from "./terrain-placement-path-safety.js";

export const TERRAIN_BOARD_WIDTH = 60;
export const TERRAIN_BOARD_HEIGHT = 44;

function emptyOverlay() {
  return { guides: [], lines: [], measurements: [], anchors: [], callouts: [] };
}

function canonicalSourceOverlayForPage(page) {
  if (!isEventCompanionTerrainPlacementApproved(page)) return null;
  return getEventCompanionPlacementOverlay(Number(page))
    ?? getSupplementalEventCompanionPlacementOverlay(Number(page));
}

function candidateSourceOverlayForPage(page) {
  return getEventCompanionPlacementCandidate(Number(page));
}

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

function sourceAlignedGuide(page, guide, layout) {
  const policy = getEventCompanionTerrainPlacementPolicy(page);
  if (!policy.alignSourceToGeometry) return guide;

  const transformed = transformEventCompanionSourceGuide(page, guide);
  if (!transformed.point) return guide;
  // Audited source edge points must not be moved to a simplified V2 corner.
  if (guide.preserveSourcePoint && layout?.terrainGeometry?.[guide.terrain]) {
    return { ...guide, edge: transformed.edge, anchor: [...transformed.point] };
  }
  const snapped = guide.sourceTerrain && layout?.terrainGeometry?.[guide.sourceTerrain]
    ? { terrain: guide.sourceTerrain, anchor: nearestShapeVertex(layout.terrainGeometry[guide.sourceTerrain], transformed.point) }
    : nearestTerrainVertex(layout, transformed.point);
  return snapped
    ? { ...guide, edge: transformed.edge, ...snapped }
    : { ...guide, edge: transformed.edge };
}

function targetTerrainIsAllowed(layout, terrain, targetInternalHalf) {
  if (!targetInternalHalf) return true;
  const centerX = terrainCenterX(layout, terrain);
  if (targetInternalHalf === "right") return centerX > TERRAIN_BOARD_WIDTH / 2;
  if (targetInternalHalf === "left") return centerX < TERRAIN_BOARD_WIDTH / 2;
  return true;
}

function mirroredCounterpartGuides(page, canonicalGuides, layout) {
  const mirrorPolicy = getEventCompanionTerrainMirrorPolicy(page);
  if (!mirrorPolicy.enabled || !mirrorPolicy.terrainMap) return [];

  const originallyMeasured = new Set(canonicalGuides.map((guide) => guide.terrain));
  const mirrored = [];

  for (const guide of canonicalGuides) {
    const targetTerrain = mirrorPolicy.terrainMap[guide.terrain];
    if (!targetTerrain || originallyMeasured.has(targetTerrain)) continue;
    if (!targetTerrainIsAllowed(layout, targetTerrain, mirrorPolicy.targetInternalHalf)) continue;

    const targetShape = layout?.terrainGeometry?.[targetTerrain];
    const transformed = transformEventCompanionMirrorGuide(page, guide);
    if (!transformed.point) continue;
    const targetAnchor = guide.preserveSourcePoint ? [...transformed.point] : nearestShapeVertex(targetShape, transformed.point);
    if (!targetAnchor) continue;

    mirrored.push({
      ...guide,
      terrain: targetTerrain,
      anchor: targetAnchor,
      edge: transformed.edge,
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

function alignedGuidesForSourceOverlay(page, layout, sourceOverlay, { includeCorrections = false } = {}) {
  if (!sourceOverlay) return [];

  const deduped = new Map();
  for (const guide of sourceOverlay.guides ?? []) {
    const sourceAligned = sourceAlignedGuide(page, guide, layout);
    deduped.set(guideKey(sourceAligned), { ...sourceAligned, anchor: [...sourceAligned.anchor] });
  }

  if (includeCorrections) {
    for (const guide of getEventCompanionPlacementGuideCorrections(page)) {
      deduped.set(guideKey(guide), { ...guide, anchor: [...guide.anchor] });
    }
  }

  return [...deduped.values()];
}

function canonicalGuidesForPage(page, layout) {
  return alignedGuidesForSourceOverlay(page, layout, canonicalSourceOverlayForPage(page), {
    includeCorrections: true
  });
}

function candidateGuidesForPage(page, layout, { includeMirrors = false } = {}) {
  const candidateGuides = alignedGuidesForSourceOverlay(page, layout, candidateSourceOverlayForPage(page));
  if (!includeMirrors || !candidateGuides.length) return candidateGuides;

  const deduped = new Map(candidateGuides.map((guide) => [guideKey(guide), guide]));
  for (const guide of mirroredCounterpartGuides(page, candidateGuides, layout)) {
    deduped.set(guideKey(guide), guide);
  }
  return [...deduped.values()];
}

function guidesForPage(page, layout, { includeMirrors = true } = {}) {
  const canonicalGuides = canonicalGuidesForPage(page, layout);
  if (!includeMirrors || !canonicalGuides.length) return canonicalGuides;

  const deduped = new Map(canonicalGuides.map((guide) => [guideKey(guide), guide]));
  for (const guide of mirroredCounterpartGuides(page, canonicalGuides, layout)) {
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
  const guides = guidesForPage(Number(layout?.page), layout, { includeMirrors: true });
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

function generatedOverlay(layout, guides) {
  const groups = groupedSourcePoints(guides);
  const pointByAnchor = new Map(groups.map((group) => [anchorKey(group.terrain, group.anchor), group.point]));

  const namedGuides = guides.map((guide) => ({
    ...guide,
    point: pointByAnchor.get(anchorKey(guide.terrain, guide.anchor)) ?? "A"
  }));
  const lines = namedGuides.map((guide) => [
    guide.anchor[0],
    guide.anchor[1],
    ...terrainGuideEndpoint(guide.anchor, guide.edge)
  ]);
  const measurements = namedGuides.map((guide) => {
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

  return { guides: namedGuides, lines, measurements, anchors, callouts };
}

export function buildCandidateTerrainPlacementOverlay(layout, { includeMirrors = false } = {}) {
  const page = Number(layout?.page);
  const candidate = candidateSourceOverlayForPage(page);
  if (!candidate) return emptyOverlay();
  return generatedOverlay(layout, candidateGuidesForPage(page, layout, { includeMirrors }));
}

export function buildCanonicalTerrainPlacementOverlay(layout) {
  const page = Number(layout?.page);
  const canonical = canonicalSourceOverlayForPage(page);
  if (!canonical) return emptyOverlay();

  // Pages 12-14 retain their previously approved exact canonical presentation.
  if (page <= 14) return canonicalOverlayWithPointNames(canonical);
  return generatedOverlay(layout, guidesForPage(page, layout, { includeMirrors: false }));
}

export function buildCompleteTerrainPlacementOverlay(layout) {
  const page = Number(layout?.page);
  const canonical = canonicalSourceOverlayForPage(page);
  if (!canonical) return emptyOverlay();

  // Pages 12-14 currently have no mirror augmentation policy, so preserve their
  // exact accepted source overlay until a separate mirror pass is explicitly
  // approved for those layouts.
  if (page <= 14 && !getEventCompanionTerrainMirrorPolicy(page).enabled) {
    return canonicalOverlayWithPointNames(canonical);
  }
  return generatedOverlay(layout, guidesForPage(page, layout, { includeMirrors: true }));
}

export function terrainGuideViolatesOwnTerrain(layout, guide) {
  const measuredTerrainPoints = geometryPoints(layout?.terrainGeometry?.[guide?.terrain]);
  if (measuredTerrainPoints.length < 3) return false;
  return terrainGuideViolatesMeasuredTerrain(guide.anchor, guide.edge, measuredTerrainPoints, {
    width: TERRAIN_BOARD_WIDTH,
    height: TERRAIN_BOARD_HEIGHT
  });
}

// Backward-compatible export retained for existing callers/tests.
export function terrainGuideCrossesOwnTerrain(layout, guide) {
  return terrainGuideViolatesOwnTerrain(layout, guide);
}

