// Candidate Event Companion terrain-placement data.
//
// Nothing in this file is production-approved merely because it exists here.
// Candidate pages are shown only by the development verification preview and
// remain blocked from the production overlay until the review-status layer marks
// them APPROVED after the two-step confirmation process.
//
// Printed values and source anchors are transcribed from the official PDF vector
// layer. Candidate generation must not calculate terrain distances from V2
// geometry. Ambiguous source material must stay flagged for review rather than
// being guessed.

export const PAGE_24_CANDIDATE_SOURCE_GUIDES = Object.freeze([
  { value: '5"', edge: "top", sourceAnchor: [44.58, 39.07] },
  { value: '26"', edge: "right", sourceAnchor: [34.02, 40.94] },
  { value: '4"', edge: "right", sourceAnchor: [55.99, 39.05] },
  { value: '19"', edge: "right", sourceAnchor: [41.10, 28.02] },
  { value: '16"', edge: "top", sourceAnchor: [41.10, 28.03] },
  { value: '5"', edge: "right", sourceAnchor: [55.09, 13.03] },
  { value: '4"', edge: "top", sourceAnchor: [15.00, 39.93] },
  { value: '15"', edge: "left", sourceAnchor: [15.01, 39.94] },
  { value: '14"', edge: "bottom", sourceAnchor: [42.69, 14.09] },
  { value: '3"', edge: "top", sourceAnchor: [34.02, 41.03] },
  { value: '8"', edge: "top", sourceAnchor: [24.94, 36.03] },
  { value: '4"', edge: "right", sourceAnchor: [56.14, 32.02] },
  { value: '4"', edge: "right", sourceAnchor: [56.07, 20.94] },
  { value: '5"', edge: "right", sourceAnchor: [54.89, 7.07] },
  { value: '21"', edge: "bottom", sourceAnchor: [56.14, 20.93] },
  { value: '15"', edge: "right", sourceAnchor: [45.08, 27.61] },
  { value: '14"', edge: "bottom", sourceAnchor: [31.20, 13.98] },
  { value: '31"', edge: "left", sourceAnchor: [31.20, 13.98] },
  { value: '27"', edge: "right", sourceAnchor: [33.14, 34.70] }
]);

// Page 24 also prints a 7-inch horizontal offset to the diagonal deployment
// boundary and a 9-inch diagonal dimension between deployment-boundary points.
// Neither terminates on a terrain footprint, so both are excluded from this
// terrain-placement candidate.

const CANDIDATES_BY_PAGE = Object.freeze({
  24: Object.freeze({
    guides: PAGE_24_CANDIDATE_SOURCE_GUIDES,
    sourceAudit: Object.freeze({
      printedDimensionCount: 21,
      terrainGuideCount: 19,
      excludedDeploymentDimensions: Object.freeze(['7"', '9"']),
      ambiguousCount: 0
    })
  })
});

export function getEventCompanionPlacementCandidate(page) {
  return CANDIDATES_BY_PAGE[Number(page)] ?? null;
}

export function listEventCompanionPlacementCandidatePages() {
  return Object.keys(CANDIDATES_BY_PAGE).map(Number).sort((a, b) => a - b);
}
