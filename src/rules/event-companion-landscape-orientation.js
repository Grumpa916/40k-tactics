// Source: official Event Companion v1.2, battlefield layouts pp. 9–53.
//
// The physical PDF is portrait (44 × 60). The app's landscape board (60 × 44)
// uses a clockwise quarter-turn of that source. The V1 catalog encoded a
// counter-clockwise visual orientation for these 30 pages (red deployment on
// the left). Correct that reflection *at resolution time* so the immutable
// archived catalog and its audited source coordinates remain unchanged.
//
// Pages not listed already agree with clockwise landscape orientation. This
// list is explicitly page-scoped to avoid reversing previously correct maps.
export const EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES = Object.freeze([
  9,11,13,14,16,17,18,20,21,22,24,25,27,28,30,
  32,34,35,36,37,39,41,43,44,46,47,48,49,52,53
]);

const MIRROR_PAGES = new Set(EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES);
const RESOLVED_LAYOUTS = new WeakMap();
export const isEventCompanionLandscapeMirrored = page => MIRROR_PAGES.has(Number(page));
export const mirrorEventCompanionPoint = point =>
  ({ ...point, x: Number((60 - point.x).toFixed(6)) });

const reflectPoints = area => area?.points
  ? { ...area, points: area.points.map(mirrorEventCompanionPoint) }
  : area;

export function orientEventCompanionLayoutForLandscape(geometry) {
  if (!geometry || !isEventCompanionLandscapeMirrored(geometry.page)) return geometry;
  if (RESOLVED_LAYOUTS.has(geometry)) return RESOLVED_LAYOUTS.get(geometry);
  const reflectAreas = areas => Object.fromEntries(Object.entries(areas ?? {})
    .map(([name,area])=>[name,reflectPoints(area)]));
  const deploymentZones = Object.fromEntries(Object.entries(geometry.deploymentZones ?? {})
    .map(([name,area])=>[name,area?.points
      ? reflectPoints(area)
      : { ...area, x: Number((60 - area.x - area.width).toFixed(6)) }]));
  const result = Object.freeze({
    ...geometry,
    objectivePositions: Object.fromEntries(Object.entries(geometry.objectivePositions ?? {})
      .map(([name,point])=>[name,mirrorEventCompanionPoint(point)])),
    deploymentZones,
    terrainGeometry: reflectAreas(geometry.terrainGeometry),
    // Used only by source-reference placement guides. No model or saved game
    // stores this object: canonical IDs remain unchanged.
    unmirroredSourceGeometry: geometry,
    landscapeMirrorX: true
  });
  RESOLVED_LAYOUTS.set(geometry,result);
  return result;
}
