// Canonical Event Companion terrain-placement source guides that are added
// incrementally after visual verification of the existing V2 battlefield
// geometry. Printed values and source anchors come from the official PDF vector
// layer; no distances are calculated from V2 geometry.

export const PAGE_20_SOURCE_GUIDES = Object.freeze([
  { value: '17"', edge: "bottom", sourceAnchor: [35.87, 16.93] },
  { value: '9"', edge: "right", sourceAnchor: [51.17, 22.00] },
  { value: '22"', edge: "top", sourceAnchor: [51.11, 22.00] },
  { value: '15"', edge: "right", sourceAnchor: [44.98, 28.09] },
  { value: '13"', edge: "top", sourceAnchor: [40.96, 31.03] },
  { value: '9"', edge: "top", sourceAnchor: [27.83, 34.97] },
  { value: '25"', edge: "right", sourceAnchor: [35.00, 38.92] },
  { value: '24.25"', edge: "right", sourceAnchor: [35.89, 16.98] },
  { value: '20"', edge: "right", sourceAnchor: [40.12, 8.98] },
  { value: '10"', edge: "bottom", sourceAnchor: [53.66, 9.98] },
  { value: '17"', edge: "bottom", sourceAnchor: [24.32, 16.98] },
  { value: '9"', edge: "bottom", sourceAnchor: [40.12, 8.96] },
  { value: '7"', edge: "right", sourceAnchor: [54.11, 31.96] },
  { value: '5"', edge: "top", sourceAnchor: [35.01, 38.93] },
  { value: '5"', edge: "top", sourceAnchor: [53.95, 39.00] },
  { value: '22"', edge: "left", sourceAnchor: [22.09, 38.96] },
  { value: '5"', edge: "top", sourceAnchor: [21.98, 38.96] },
  { value: '16"', edge: "top", sourceAnchor: [45.03, 27.98] },
  { value: '5"', edge: "top", sourceAnchor: [42.55, 39.00] }
]);

// The additional printed 9-inch line at approximately source [30,22] measures
// the curved deployment-zone boundary, not a terrain footprint, so it is
// deliberately excluded from the Terrain Setup overlay.

export const PAGE_21_SOURCE_GUIDES = Object.freeze([
  { value: '3"', edge: "bottom", sourceAnchor: [45.44, 3.08] },
  { value: '5"', edge: "right", sourceAnchor: [54.99, 38.98] },
  { value: '7"', edge: "bottom", sourceAnchor: [51.13, 6.97] },
  { value: '19"', edge: "top", sourceAnchor: [47.25, 25.12] },
  { value: '18"', edge: "bottom", sourceAnchor: [41.06, 17.92] },
  { value: '24"', edge: "right", sourceAnchor: [35.96, 4.01] },
  { value: '9"', edge: "right", sourceAnchor: [51.13, 6.97] },
  { value: '22"', edge: "right", sourceAnchor: [37.93, 40.02] },
  { value: '16"', edge: "top", sourceAnchor: [42.17, 28.07] },
  { value: '7"', edge: "right", sourceAnchor: [53.10, 17.04] },
  { value: '4"', edge: "bottom", sourceAnchor: [36.01, 4.01] },
  { value: '17"', edge: "bottom", sourceAnchor: [53.16, 17.09] },
  { value: '19"', edge: "right", sourceAnchor: [41.01, 17.89] },
  { value: '25"', edge: "right", sourceAnchor: [35.02, 29.47] },
  { value: '4"', edge: "top", sourceAnchor: [37.97, 40.00] },
  { value: '5"', edge: "right", sourceAnchor: [55.08, 27.47] },
  { value: '5"', edge: "top", sourceAnchor: [54.99, 39.00] },
  { value: '8"', edge: "bottom", sourceAnchor: [33.05, 7.96] }
]);

// Page 21 also prints two 15-inch deployment-zone dimensions. They describe
// deployment boundaries rather than terrain placement and are deliberately
// excluded from this source layer.

export const PAGE_22_SOURCE_GUIDES = Object.freeze([
  { value: '7"', edge: "right", sourceAnchor: [53.15, 26.40] },
  { value: '6"', edge: "bottom", sourceAnchor: [47.70, 5.89] },
  { value: '19"', edge: "right", sourceAnchor: [41.02, 2.91] },
  { value: '12"', edge: "bottom", sourceAnchor: [36.05, 11.81] },
  { value: '6"', edge: "top", sourceAnchor: [46.02, 37.89] },
  { value: '26"', edge: "right", sourceAnchor: [33.99, 17.88] },
  { value: '20"', edge: "right", sourceAnchor: [40.06, 15.12] },
  { value: '27"', edge: "right", sourceAnchor: [33.01, 31.97] },
  { value: '3"', edge: "bottom", sourceAnchor: [41.07, 2.93] },
  { value: '4"', edge: "top", sourceAnchor: [36.99, 40.09] },
  { value: '3"', edge: "bottom", sourceAnchor: [29.61, 2.93] },
  { value: '8"', edge: "top", sourceAnchor: [41.18, 35.89] },
  { value: '12"', edge: "top", sourceAnchor: [33.01, 31.93] },
  { value: '12"', edge: "bottom", sourceAnchor: [40.08, 12.01] },
  { value: '6"', edge: "top", sourceAnchor: [53.07, 37.99] },
  { value: '23"', edge: "right", sourceAnchor: [36.96, 40.06] }
]);

// Page 22 prints five deployment-zone dimensions that are not terrain-placement
// measurements: the two 18-inch deployment depths, two 15-inch dimensions for
// the lower central deployment shape, and its separate 12-inch horizontal
// offset. Those five values are deliberately excluded from this source layer.

const SUPPLEMENTAL_GUIDES_BY_PAGE = Object.freeze({
  20: PAGE_20_SOURCE_GUIDES,
  21: PAGE_21_SOURCE_GUIDES,
  22: PAGE_22_SOURCE_GUIDES
});

export function getSupplementalEventCompanionPlacementOverlay(page) {
  const guides = SUPPLEMENTAL_GUIDES_BY_PAGE[Number(page)];
  return guides ? { guides } : null;
}
