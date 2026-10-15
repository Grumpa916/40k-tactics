export const TERRAIN_PLACEMENT_BOARD = Object.freeze({ width: 60, height: 44 });

const OPPOSITE_EDGE = Object.freeze({
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top"
});

const DEFAULT_POLICY = Object.freeze({
  sourceTransform: "identity",
  alignSourceToGeometry: false,
  sourceEdgeOverrides: Object.freeze({})
});

const PAGE_POLICIES = Object.freeze({
  18: Object.freeze({
    sourceTransform: "rotate180",
    alignSourceToGeometry: true,
    // These four rows were edited during visual correction before the source
    // transform rule was understood. Preserve their original PDF-frame edge
    // here as source transcription metadata; the shared transform then rotates
    // point and edge together like every other guide.
    sourceEdgeOverrides: Object.freeze({
      '9"|51.2|22.25': "right",
      '10"|25.95|34.14': "top",
      '17"|35.75|16.86': "bottom",
      '17"|24.23|16.89': "bottom"
    })
  }),
  19: Object.freeze({
    // Page 19 uses the same PDF source-frame orientation as Page 18. The
    // canonical pass rotates source anchor and battlefield edge together before
    // snapping to the already-verified V2 geometry. No mirror augmentation is
    // enabled until this source-only layer is visually accepted.
    sourceTransform: "rotate180",
    alignSourceToGeometry: true,
    // The PDF line at source anchor 40.91,37 leaves the measured terrain toward
    // the opposite battlefield edge. Preserve that source-frame direction here
    // so the shared 180-degree transform produces the outward T10 guide rather
    // than sending the 19-inch line back through the measured terrain.
    sourceEdgeOverrides: Object.freeze({
      '19"|40.91|37': "left"
    })
  })
});

function normalizedSourceKey(guide) {
  const sourceAnchor = guide?.sourceAnchor ?? [];
  return String(guide?.value ?? "") + "|" + Number(sourceAnchor[0]) + "|" + Number(sourceAnchor[1]);
}

function normalizeCoordinate(value) {
  // Coordinate transforms use subtraction on decimal source positions. Trim
  // binary floating-point noise so a source 51.2" point rotated across a 60"
  // board is represented as 8.8 rather than 8.799999999999997. This does not
  // calculate or alter Event Companion measurement values.
  return Number(Number(value).toFixed(6));
}

export function getEventCompanionTerrainPlacementPolicy(page) {
  return PAGE_POLICIES[Number(page)] ?? DEFAULT_POLICY;
}

export function transformEventCompanionPlacement(point, edge, transform = "identity") {
  const sourcePoint = Array.isArray(point) ? [Number(point[0]), Number(point[1])] : null;
  if (!sourcePoint || !sourcePoint.every(Number.isFinite)) {
    return Object.freeze({ point: null, edge });
  }

  if (transform === "rotate180") {
    return Object.freeze({
      point: Object.freeze([
        normalizeCoordinate(TERRAIN_PLACEMENT_BOARD.width - sourcePoint[0]),
        normalizeCoordinate(TERRAIN_PLACEMENT_BOARD.height - sourcePoint[1])
      ]),
      edge: OPPOSITE_EDGE[edge] ?? edge
    });
  }

  return Object.freeze({ point: Object.freeze(sourcePoint.map(normalizeCoordinate)), edge });
}

export function transformEventCompanionSourceGuide(page, guide) {
  const policy = getEventCompanionTerrainPlacementPolicy(page);
  const sourceEdge = policy.sourceEdgeOverrides?.[normalizedSourceKey(guide)] ?? guide?.edge;
  return transformEventCompanionPlacement(guide?.sourceAnchor, sourceEdge, policy.sourceTransform);
}
