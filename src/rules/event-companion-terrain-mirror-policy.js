import { transformEventCompanionPlacement } from "./event-companion-terrain-placement-policy.js";

const DEFAULT_MIRROR_POLICY = Object.freeze({
  enabled: false,
  transform: "identity",
  terrainMap: Object.freeze({}),
  targetInternalHalf: null
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
    // Portrait top half corresponds to x > 30 in the internal 60x44 frame.
    targetInternalHalf: "right"
  })
});

export function getEventCompanionTerrainMirrorPolicy(page) {
  return PAGE_MIRROR_POLICIES[Number(page)] ?? DEFAULT_MIRROR_POLICY;
}

export function transformEventCompanionMirrorGuide(page, guide) {
  const policy = getEventCompanionTerrainMirrorPolicy(page);
  if (!policy.enabled) {
    return Object.freeze({ point: null, edge: guide?.edge });
  }
  return transformEventCompanionPlacement(guide?.anchor, guide?.edge, policy.transform);
}
