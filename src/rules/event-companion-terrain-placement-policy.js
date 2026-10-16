export const TERRAIN_PLACEMENT_BOARD = Object.freeze({ width: 60, height: 44 });

const OPPOSITE_EDGE = Object.freeze({
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top"
});

const HORIZONTAL_OPPOSITE_EDGE = Object.freeze({
  left: "right",
  right: "left",
  top: "top",
  bottom: "bottom"
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
    sourceEdgeOverrides: Object.freeze({
      '9"|51.2|22.25': "right",
      '10"|25.95|34.14': "top",
      '17"|35.75|16.86': "bottom",
      '17"|24.23|16.89': "bottom"
    })
  }),
  19: Object.freeze({
    sourceTransform: "rotate180",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({
      '19"|40.91|37': "left"
    })
  }),
  20: Object.freeze({
    sourceTransform: "flipX",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({})
  }),
  21: Object.freeze({
    sourceTransform: "flipX",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({})
  }),
  22: Object.freeze({
    sourceTransform: "flipX",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({})
  }),
  23: Object.freeze({
    sourceTransform: "flipX",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({})
  }),
  24: Object.freeze({
    sourceTransform: "flipX",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({})
  }),
  25: Object.freeze({
    sourceTransform: "flipX",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({})
  }),
  26: Object.freeze({
    // Layout C continues the same PDF source frame as Pages 20-25. Direct
    // source-page audit confirms the 60-inch axis is reversed relative to the
    // existing V2 geometry while the 44-inch axis is already aligned.
    sourceTransform: "flipX",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({})
  }),
  27: Object.freeze({
    // Punishment / Delaying Action Layout A uses the same PDF source frame as
    // the preceding verified layouts: reverse the 60-inch axis while leaving
    // the 44-inch axis and top/bottom edge directions unchanged.
    sourceTransform: "flipX",
    alignSourceToGeometry: true,
    sourceEdgeOverrides: Object.freeze({})
  })
});

const REMAINING_SOURCE_POLICY = Object.freeze({ sourceTransform: "flipX", alignSourceToGeometry: true, sourceEdgeOverrides: Object.freeze({}) });

function normalizedSourceKey(guide) {
  const sourceAnchor = guide?.sourceAnchor ?? [];
  return String(guide?.value ?? "") + "|" + Number(sourceAnchor[0]) + "|" + Number(sourceAnchor[1]);
}

function normalizeCoordinate(value) {
  return Number(Number(value).toFixed(6));
}

export function getEventCompanionTerrainPlacementPolicy(page) {
  if (Number(page) >= 9 && Number(page) <= 17) return REMAINING_SOURCE_POLICY;
  return PAGE_POLICIES[Number(page)] ?? (Number(page) >= 28 && Number(page) <= 53 ? REMAINING_SOURCE_POLICY : DEFAULT_POLICY);
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

  if (transform === "flipX") {
    return Object.freeze({
      point: Object.freeze([
        normalizeCoordinate(TERRAIN_PLACEMENT_BOARD.width - sourcePoint[0]),
        normalizeCoordinate(sourcePoint[1])
      ]),
      edge: HORIZONTAL_OPPOSITE_EDGE[edge] ?? edge
    });
  }

  return Object.freeze({ point: Object.freeze(sourcePoint.map(normalizeCoordinate)), edge });
}

export function transformEventCompanionSourceGuide(page, guide) {
  const policy = getEventCompanionTerrainPlacementPolicy(page);
  const sourceEdge = policy.sourceEdgeOverrides?.[normalizedSourceKey(guide)] ?? guide?.sourceEdge ?? guide?.edge;
  return transformEventCompanionPlacement(guide?.sourceAnchor, sourceEdge, policy.sourceTransform);
}


