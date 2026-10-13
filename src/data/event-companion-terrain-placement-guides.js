// Verified terrain-placement guide segments reproduced from the official 2026-27
// Warhammer 40,000 Event Companion, page 12 (Layout A).
//
// The PDF board is portrait (44 x 60). These coordinates are normalized directly
// onto the V2 60 x 44 battlefield without deriving or rounding any printed
// distance values. Every segment has one endpoint on a battlefield edge and one
// endpoint at the placement point used by the source diagram.

const PAGE_12_GUIDES = Object.freeze([
  Object.freeze([60, 15.101, 47.642, 15.101]),
  Object.freeze([60, 26.908, 53.253, 26.908]),
  Object.freeze([60, 20.468, 46.279, 20.468]),
  Object.freeze([46.376, 44, 46.376, 40.438]),
  Object.freeze([60, 31.944, 54.679, 31.944]),
  Object.freeze([60, 4.336, 53.253, 4.336]),
  Object.freeze([53.25, 0, 53.25, 4.344]),
  Object.freeze([46.312, 0, 46.312, 20.468]),
  Object.freeze([38.319, 12.478, 38.319, 0]),
  Object.freeze([38.394, 12.449, 60, 12.449]),
  Object.freeze([20.472, 0, 20.472, 16.122]),
  Object.freeze([0, 16.161, 20.472, 16.161]),
  Object.freeze([60, 40.438, 46.376, 40.438]),
  Object.freeze([28.502, 11.591, 28.502, 0]),
  Object.freeze([60, 12.776, 53.128, 12.776]),
  Object.freeze([35.883, 7.325, 35.883, 0]),
  Object.freeze([36.895, 44, 36.895, 40.438]),
  Object.freeze([31.229, 0, 31.229, 15.402])
]);

export const EVENT_COMPANION_TERRAIN_PLACEMENT_GUIDES = Object.freeze({
  "12": PAGE_12_GUIDES
});

export function getEventCompanionTerrainPlacementLines(page) {
  const lines = EVENT_COMPANION_TERRAIN_PLACEMENT_GUIDES[String(Number(page))] ?? [];
  return lines.map((line) => [...line]);
}
