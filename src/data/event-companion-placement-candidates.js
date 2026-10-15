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

export const PAGE_25_CANDIDATE_SOURCE_GUIDES = Object.freeze([
  { value: '26"', edge: "left", sourceAnchor: [25.97, 26.50] },
  { value: '26"', edge: "left", sourceAnchor: [25.97, 37.92] },
  { value: '6"', edge: "top", sourceAnchor: [32.97, 38.03] },
  { value: '4"', edge: "top", sourceAnchor: [37.12, 40.03] },
  { value: '15"', edge: "top", sourceAnchor: [38.08, 29.03] },
  { value: '2"', edge: "bottom", sourceAnchor: [39.01, 2.11] },
  { value: '22"', edge: "right", sourceAnchor: [38.08, 29.07] },
  { value: '20"', edge: "right", sourceAnchor: [40.15, 16.50] },
  { value: '20"', edge: "bottom", sourceAnchor: [41.96, 19.95] },
  { value: '19"', edge: "right", sourceAnchor: [40.98, 34.12] },
  { value: '4"', edge: "top", sourceAnchor: [40.89, 40.11] },
  { value: '18"', edge: "right", sourceAnchor: [41.94, 19.95] },
  { value: '2"', edge: "bottom", sourceAnchor: [45.98, 2.04] },
  { value: '14"', edge: "right", sourceAnchor: [45.98, 2.08] },
  { value: '7"', edge: "bottom", sourceAnchor: [50.07, 7.04] },
  { value: '11"', edge: "right", sourceAnchor: [48.90, 38.85] },
  { value: '10"', edge: "right", sourceAnchor: [50.03, 13.04] },
  { value: '10"', edge: "right", sourceAnchor: [50.02, 22.95] },
  { value: '18"', edge: "top", sourceAnchor: [52.04, 26.09] },
  { value: '8"', edge: "right", sourceAnchor: [52.00, 26.08] }
]);

// Page 24 also prints a 7-inch horizontal offset to the diagonal deployment
// boundary and a 9-inch diagonal dimension between deployment-boundary points.
// Neither terminates on a terrain footprint, so both are excluded from this
// terrain-placement candidate.
//
// Page 25 prints six deployment-zone dimensions around the outer red/blue zone
// boundaries: 12 inches at source [12.03,42.97], 20 inches at [19.93,1.06],
// 26 inches at [25.97,45.07], 26 inches at [34.05,-1], 20 inches at
// [40.05,42.97], and 12 inches at [48.07,1.06]. The official page shows these
// terminating on deployment boundaries rather than terrain, so they are excluded.
// The two retained 10-inch official source lines visibly run along the edge of
// their measured footprint in the source artwork; they are recorded as explicit
// source-authoritative path exceptions rather than being rerouted.

const CANDIDATES_BY_PAGE = Object.freeze({
  24: Object.freeze({
    guides: PAGE_24_CANDIDATE_SOURCE_GUIDES,
    sourceAudit: Object.freeze({
      printedDimensionCount: 21,
      terrainGuideCount: 19,
      excludedDeploymentDimensions: Object.freeze(['7"', '9"']),
      ambiguousCount: 0,
      sourcePathExceptions: Object.freeze([])
    })
  }),
  25: Object.freeze({
    guides: PAGE_25_CANDIDATE_SOURCE_GUIDES,
    sourceAudit: Object.freeze({
      printedDimensionCount: 26,
      terrainGuideCount: 20,
      excludedDeploymentDimensions: Object.freeze([
        '12"|left|12.03|42.97',
        '20"|left|19.93|1.06',
        '26"|left|25.97|45.07',
        '26"|right|34.05|-1',
        '20"|right|40.05|42.97',
        '12"|right|48.07|1.06'
      ]),
      ambiguousCount: 0,
      sourcePathExceptions: Object.freeze([
        '10"|50.03|13.04',
        '10"|50.02|22.95'
      ])
    })
  })
});

export function getEventCompanionPlacementCandidate(page) {
  return CANDIDATES_BY_PAGE[Number(page)] ?? null;
}

export function listEventCompanionPlacementCandidatePages() {
  return Object.keys(CANDIDATES_BY_PAGE).map(Number).sort((a, b) => a - b);
}
