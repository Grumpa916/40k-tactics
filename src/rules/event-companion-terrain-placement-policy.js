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
  sourceEdgeOverrides: Object.freeze({}),
  mirrorCounterparts: null
});

const PAGE_18_TERRAIN_COUNTERPARTS = Object.freeze({
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
    }),
    mirrorCounterparts: Object.freeze({
      transform: "rotate180",
      terrainMap: PAGE_18_TERRAIN_COUNTERPARTS,
      // Portrait top half corresponds to x > 30 in the internal 60x44 frame.
      targetInternalHalf: "right"
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

export function transformEventCompanionMirrorGuide(page, guide) {
  const policy = getEventCompanionTerrainPlacementPolicy(page);
  const transform = policy.mirrorCounterparts?.transform ?? "identity";
  return transformEventCompanionPlacement(guide?.anchor, guide?.edge, transform);
}
