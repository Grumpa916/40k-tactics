import { REMAINING_TERRAIN_MIRROR_POLICIES } from "../data/event-companion-terrain-mirror-policies-remaining.js";
import { transformEventCompanionPlacement } from "./event-companion-terrain-placement-policy.js";

const DEFAULT_MIRROR_POLICY = Object.freeze({
  enabled: false,
  transform: "identity",
  terrainMap: Object.freeze({}),
  targetInternalHalf: null
});

const PAGE_18_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T6", T2: "T12", T3: "T15", T4: "T11",
  T5: "T7", T6: "T1", T7: "T5", T8: "T13",
  T9: "T14", T10: "T16", T11: "T4", T12: "T2",
  T13: "T8", T14: "T9", T15: "T3", T16: "T10"
});

const PAGE_19_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T6", T2: "T7", T3: "T13", T4: "T11",
  T5: "T14", T6: "T1", T7: "T2", T8: "T15",
  T9: "T12", T10: "T16", T11: "T4", T12: "T9",
  T13: "T3", T14: "T5", T15: "T8", T16: "T10"
});

const PAGE_20_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T12", T2: "T11", T3: "T7", T4: "T15",
  T5: "T13", T6: "T16", T7: "T3", T8: "T9",
  T9: "T8", T10: "T14", T11: "T2", T12: "T1",
  T13: "T5", T14: "T10", T15: "T4", T16: "T6"
});

const PAGE_21_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T6", T2: "T7", T3: "T12", T4: "T11",
  T5: "T15", T6: "T1", T7: "T2", T8: "T13",
  T9: "T14", T10: "T16", T11: "T4", T12: "T3",
  T13: "T8", T14: "T9", T15: "T5", T16: "T10"
});

const PAGE_22_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T14", T2: "T15", T3: "T9", T4: "T12",
  T5: "T11", T6: "T13", T7: "T16", T8: "T10",
  T9: "T3", T10: "T8", T11: "T5", T12: "T4",
  T13: "T6", T14: "T1", T15: "T2", T16: "T7"
});

const PAGE_23_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T5", T2: "T6", T3: "T7", T4: "T9",
  T5: "T1", T6: "T2", T7: "T3", T8: "T13",
  T9: "T4", T10: "T16", T11: "T14", T12: "T15",
  T13: "T8", T14: "T11", T15: "T12", T16: "T10"
});

const PAGE_24_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T9", T2: "T6", T3: "T12", T4: "T8",
  T5: "T7", T6: "T2", T7: "T5", T8: "T4",
  T9: "T1", T10: "T16", T11: "T14", T12: "T3",
  T13: "T15", T14: "T11", T15: "T13", T16: "T10"
});

const PAGE_25_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T3", T2: "T10", T3: "T1", T4: "T11",
  T5: "T12", T6: "T15", T7: "T13", T8: "T14",
  T9: "T16", T10: "T2", T11: "T4", T12: "T5",
  T13: "T7", T14: "T8", T15: "T6", T16: "T9"
});

const PAGE_26_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T8", T2: "T3", T3: "T2", T4: "T12",
  T5: "T13", T6: "T7", T7: "T6", T8: "T1",
  T9: "T14", T10: "T15", T11: "T16", T12: "T4",
  T13: "T5", T14: "T9", T15: "T10", T16: "T11"
});

const PAGE_27_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T7", T2: "T9", T3: "T11", T4: "T10",
  T5: "T6", T6: "T5", T7: "T1", T8: "T16",
  T9: "T2", T10: "T4", T11: "T3", T12: "T14",
  T13: "T15", T14: "T12", T15: "T13", T16: "T8"
});

// Mirror augmentation is intentionally separate from the canonical Event
// Companion source policy. A page is first transcribed and verified exactly as
// the official source presents it. Only after that canonical layer is accepted
// may this optional app-only usability layer copy an existing approved value to
// a declared counterpart terrain object.
const PAGE_MIRROR_POLICIES = Object.freeze({
  18: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_18_TERRAIN_COUNTERPARTS,
    targetInternalHalf: "right"
  }),
  19: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_19_TERRAIN_COUNTERPARTS,
    targetInternalHalf: null
  }),
  20: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_20_TERRAIN_COUNTERPARTS,
    targetInternalHalf: null
  }),
  21: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_21_TERRAIN_COUNTERPARTS,
    targetInternalHalf: null
  }),
  22: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_22_TERRAIN_COUNTERPARTS,
    targetInternalHalf: null
  }),
  23: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_23_TERRAIN_COUNTERPARTS,
    targetInternalHalf: null
  }),
  24: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_24_TERRAIN_COUNTERPARTS,
    targetInternalHalf: null
  }),
  25: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_25_TERRAIN_COUNTERPARTS,
    targetInternalHalf: null
  }),
  26: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_26_TERRAIN_COUNTERPARTS,
    // Confirmation 1 accepted the canonical Page 26 source layer. The second
    // review pass copies those exact values onto the eight declared 180-degree
    // terrain counterparts. No distance is calculated or inferred here.
    targetInternalHalf: null
  }),
  27: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_27_TERRAIN_COUNTERPARTS,
    // Confirmation 1 accepted the canonical Page 27 source layer. Confirmation
    // 2 previews only copied source values on the declared rotational terrain
    // counterparts; no new distance values are calculated.
    targetInternalHalf: null
  })
});

export function getEventCompanionTerrainMirrorPolicy(page) {
  return PAGE_MIRROR_POLICIES[Number(page)] ?? REMAINING_TERRAIN_MIRROR_POLICIES[Number(page)] ?? DEFAULT_MIRROR_POLICY;
}

export function transformEventCompanionMirrorGuide(page, guide) {
  const policy = getEventCompanionTerrainMirrorPolicy(page);
  if (!policy.enabled) {
    return Object.freeze({ point: null, edge: guide?.edge });
  }
  return transformEventCompanionPlacement(guide?.anchor, guide?.edge, policy.transform);
}

