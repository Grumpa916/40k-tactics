// Source: Games Workshop Event Companion v1.2, layouts pp. 9–53.
//
// The immutable V1 catalog is encoded with the same X coordinates but opposite
// vertical handedness from the official PDF when the portrait pages are viewed
// 90° counterclockwise in landscape. The source-confirmed interpretation is
// a Y reflection on *every* 60 × 44 layout, not the mixed X/Y reflection
// previously inferred from deployment-side labels. In particular, the user's
// comparison screenshots show p.21 red lower-left / blue upper-right,
// p.22 red left / blue right, and p.23 red bottom / blue top.
//
// Keep both exported policy accessors for compatibility, but use zero X
// mirrors and a consistent Y mirror across the complete 45-layout pack.
export const EVENT_COMPANION_LANDSCAPE_MIRROR_X_PAGES = Object.freeze([]);
export const EVENT_COMPANION_LANDSCAPE_MIRROR_Y_PAGES = Object.freeze(
  Array.from({length:45},(_,index)=>index+9)
);

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
