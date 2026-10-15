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

const PAGE_19_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T6",
  T2: "T7",
  T3: "T13",
  T4: "T11",
  T5: "T14",
  T6: "T1",
  T7: "T2",
  T8: "T15",
  T9: "T12",
  T10: "T16",
  T11: "T4",
  T12: "T9",
  T13: "T3",
  T14: "T5",
  T15: "T8",
  T16: "T10"
});

const PAGE_20_TERRAIN_COUNTERPARTS = Object.freeze({
  T1: "T12",
  T2: "T11",
  T3: "T7",
  T4: "T15",
  T5: "T13",
  T6: "T16",
  T7: "T3",
  T8: "T9",
  T9: "T8",
  T10: "T14",
  T11: "T2",
  T12: "T1",
  T13: "T5",
  T14: "T10",
  T15: "T4",
  T16: "T6"
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
    // Page 18's accepted pass populated only the previously blank portrait top
    // half. Preserve that exact approved behavior rather than broadening it.
    targetInternalHalf: "right"
  }),
  19: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_19_TERRAIN_COUNTERPARTS,
    // Page 19's canonical layer contains one measured member of every clear
    // 180-degree terrain pair, so all eight previously blank counterparts can
    // receive the unchanged approved measurements. No half-board filter is
    // required because the declared counterpart map itself is unambiguous.
    targetInternalHalf: null
  }),
  20: Object.freeze({
    enabled: true,
    transform: "rotate180",
    terrainMap: PAGE_20_TERRAIN_COUNTERPARTS,
    // Page 20's approved canonical layer likewise measures exactly one member
    // of each clear 180-degree terrain pair. Copy only those approved values to
    // the eight blank counterparts; no new distances are derived.
    targetInternalHalf: null
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
