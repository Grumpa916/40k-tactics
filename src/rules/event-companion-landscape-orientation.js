// Source: official Event Companion v1.2, battlefield layouts pp. 9–53.
//
// The source catalogue stores stable 60 × 44 game coordinates. Page-specific
// presentation corrections must transform all geometry together: terrain,
// objectives, deployment zones and territory regions. Never rewrite the
// catalogue or flip only the visible terrain layer.
//
// The user's 2026-11-06 iPad comparison identified page 23 as vertically
// inverted. Pages 21 and 22 already have the horizontal correction from PR 556;
// reapplying that reflection would undo the prior fix.
export const EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES = Object.freeze([
  9,11,13,14,16,17,18,20,21,22,24,25,27,28,30,
  32,34,35,36,37,39,41,43,44,46,47,48,49,52,53
]);
export const EVENT_COMPANION_LANDSCAPE_MIRROR_Y_PAGES = Object.freeze([23]);

const MIRROR_X_PAGES = new Set(EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES);
const MIRROR_Y_PAGES = new Set(EVENT_COMPANION_LANDSCAPE_MIRROR_Y_PAGES);
const RESOLVED_LAYOUTS = new WeakMap();
export const isEventCompanionLandscapeMirrored = page => MIRROR_X_PAGES.has(Number(page));
export const isEventCompanionLandscapeVerticallyMirrored = page => MIRROR_Y_PAGES.has(Number(page));

export const mirrorEventCompanionPoint = point =>
  ({ ...point, x: Number((60 - point.x).toFixed(6)) });

export const verticallyMirrorEventCompanionPoint = point =>
  ({ ...point, y: Number((44 - point.y).toFixed(6)) });

function resolvePoint(point, mirrorX, mirrorY) {
  const afterX = mirrorX ? mirrorEventCompanionPoint(point) : { ...point };
  return mirrorY ? verticallyMirrorEventCompanionPoint(afterX) : afterX;
}

export function orientEventCompanionLayoutForLandscape(geometry) {
  const mirrorX = isEventCompanionLandscapeMirrored(geometry?.page);
  const mirrorY = isEventCompanionLandscapeVerticallyMirrored(geometry?.page);
  if (!geometry || (!mirrorX && !mirrorY)) return geometry;
  if (RESOLVED_LAYOUTS.has(geometry)) return RESOLVED_LAYOUTS.get(geometry);

  const reflectAreas = areas => Object.fromEntries(Object.entries(areas ?? {})
    .map(([name, area])=>[name, area?.points
      ? { ...area, points: area.points.map(point=>resolvePoint(point,mirrorX,mirrorY)) }
      : { ...area,
          x: mirrorX ? Number((60-area.x-area.width).toFixed(6)) : area.x,
          y: mirrorY ? Number((44-area.y-area.height).toFixed(6)) : area.y }
    ]));

  const result = Object.freeze({
    ...geometry,
    objectivePositions: Object.fromEntries(Object.entries(geometry.objectivePositions ?? {})
      .map(([name, point])=>[name,resolvePoint(point,mirrorX,mirrorY)])),
    deploymentZones: reflectAreas(geometry.deploymentZones),
    terrainGeometry: reflectAreas(geometry.terrainGeometry),
    // Source guides are snapped to canonical terrain vertices *before* the
    // matching page presentation transform is applied.
    unmirroredSourceGeometry: geometry,
    landscapeMirrorX: mirrorX,
    landscapeMirrorY: mirrorY
  });
  RESOLVED_LAYOUTS.set(geometry,result);
  return result;
}
