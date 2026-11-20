export const PAGE_21_LAYOUT_A_DETAILS = Object.freeze({
  page: 21,
  layout: "A",
  // Approximate multi-point feature shapes based on Event Companion PDF page 21 Layout A.
  // Dense features set blocksLos: true so they can interact with line-of-sight tools.
  // Coordinates are in the 60×44 inch system and sit inside the existing footprints.
  features: Object.freeze([
    // Defender expansion ruin (upper-left on PDF) — L-ish ruin
    {
      id: "ruin-defender-expansion",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T1",
      points: Object.freeze([
        { x: 9.0, y: 7.5 },
        { x: 15.5, y: 7.5 },
        { x: 15.5, y: 11.0 },
        { x: 12.5, y: 11.0 },
        { x: 12.5, y: 14.0 },
        { x: 9.0, y: 14.0 }
      ])
    },
    // Mid-left containers / light terrain
    {
      id: "container-mid-left",
      type: "light",
      blocksLos: false,
      parentFootprint: "T3",
      points: Object.freeze([
        { x: 11.5, y: 17.5 },
        { x: 18.0, y: 17.5 },
        { x: 18.0, y: 20.0 },
        { x: 15.0, y: 20.0 },
        { x: 15.0, y: 23.0 },
        { x: 11.5, y: 23.0 }
      ])
    },
    // Central dense ruin
    {
      id: "ruin-center",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T6",
      points: Object.freeze([
        { x: 27.5, y: 18.5 },
        { x: 34.5, y: 18.5 },
        { x: 34.5, y: 22.0 },
        { x: 31.0, y: 22.0 },
        { x: 31.0, y: 25.5 },
        { x: 27.5, y: 25.5 }
      ])
    },
    // Upper-right light barricade / containers
    {
      id: "barricade-upper-right",
      type: "light",
      blocksLos: false,
      parentFootprint: "T8",
      points: Object.freeze([
        { x: 37.5, y: 21.5 },
        { x: 44.5, y: 21.5 },
        { x: 44.5, y: 23.5 },
        { x: 40.0, y: 23.5 },
        { x: 40.0, y: 25.5 },
        { x: 37.5, y: 25.5 }
      ])
    },
    // Attacker home ruin (lower-right)
    {
      id: "ruin-attacker-home",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T12",
      points: Object.freeze([
        { x: 45.5, y: 27.5 },
        { x: 52.5, y: 27.5 },
        { x: 52.5, y: 31.0 },
        { x: 49.0, y: 31.0 },
        { x: 49.0, y: 34.5 },
        { x: 45.5, y: 34.5 }
      ])
    }
  ])
});

export function getTerrainDetailsForGeometry(geometry) {
  if (!geometry) return null;
  if (Number(geometry.page) === 21 && geometry.layout === "A") {
    return PAGE_21_LAYOUT_A_DETAILS;
  }
  return null;
}

/** Returns dense features that should block line of sight for a given geometry. */
export function getLosBlockingFeatures(geometry) {
  const details = getTerrainDetailsForGeometry(geometry);
  if (!details) return [];
  return details.features.filter((f) => f.blocksLos === true);
}
