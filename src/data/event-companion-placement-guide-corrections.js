// Small source-audit corrections for verified Event Companion terrain guides.
// Values in this file must be visibly printed in the official Event Companion;
// they are never calculated from V2 geometry. Anchors may snap an official
// edge measurement to a reproducible corner on the approximate V2 footprint.

const PAGE_18_CORRECTIONS = Object.freeze([
  // Page 18 prints 13" from the lower-left large terrain edge to the bottom
  // battlefield edge. In V2 source coordinates that is the left battlefield
  // edge, so attach the printed value to a reproducible T10 corner on the same
  // x=~13" terrain edge. The displayed value is copied from the source.
  Object.freeze({
    terrain: "T10",
    anchor: Object.freeze([12.9, 15.6]),
    edge: "left",
    value: '13"',
    source: "Event Companion page 18"
  })
]);

const CORRECTIONS_BY_PAGE = Object.freeze({
  18: PAGE_18_CORRECTIONS
});

export function getEventCompanionPlacementGuideCorrections(page) {
  return CORRECTIONS_BY_PAGE[Number(page)] ?? [];
}

export { PAGE_18_CORRECTIONS };
