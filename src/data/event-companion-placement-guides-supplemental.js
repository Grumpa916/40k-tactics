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

export function getSupplementalEventCompanionPlacementOverlay(page) {
  if (Number(page) !== 20) return null;
  return { guides: PAGE_20_SOURCE_GUIDES };
}
