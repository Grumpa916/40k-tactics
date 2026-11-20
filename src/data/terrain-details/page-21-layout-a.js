export const PAGE_21_LAYOUT_A_DETAILS = Object.freeze({
  page: 21,
  layout: "A",
  // Visual estimates matching companion PDF page 21 Layout A feature positions.
  // Dense features block LOS. All points in 60×44 catalog coordinates.
  features: Object.freeze([
    // Top-left EF ruin (defender expansion area)
    {
      id: "ef-defender",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T1",
      points: Object.freeze([
        { x: 9.5, y: 4.5 },
        { x: 17.0, y: 4.5 },
        { x: 17.0, y: 8.5 },
        { x: 13.0, y: 8.5 },
        { x: 13.0, y: 13.0 },
        { x: 9.5, y: 13.0 }
      ])
    },
    // Upper-right GH ruin
    {
      id: "gh-upper-right",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T6",
      points: Object.freeze([
        { x: 41.0, y: 29.5 },
        { x: 48.5, y: 29.5 },
        { x: 48.5, y: 33.5 },
        { x: 44.5, y: 33.5 },
        { x: 44.5, y: 38.0 },
        { x: 41.0, y: 38.0 }
      ])
    },
    // Center AB ruin
    {
      id: "ab-center",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T4",
      points: Object.freeze([
        { x: 20.5, y: 19.5 },
        { x: 25.5, y: 19.5 },
        { x: 25.5, y: 23.0 },
        { x: 23.0, y: 23.0 },
        { x: 23.0, y: 27.0 },
        { x: 20.5, y: 27.0 }
      ])
    },
    // Mid-right light terrain (containers/barricade)
    {
      id: "light-mid-right",
      type: "light",
      blocksLos: false,
      parentFootprint: "T11",
      points: Object.freeze([
        { x: 35.0, y: 16.5 },
        { x: 40.0, y: 16.5 },
        { x: 40.0, y: 19.5 },
        { x: 37.0, y: 19.5 },
        { x: 37.0, y: 23.5 },
        { x: 35.0, y: 23.5 }
      ])
    },
    // Bottom-right EF ruin (attacker home)
    {
      id: "ef-attacker",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T7",
      points: Object.freeze([
        { x: 49.5, y: 6.0 },
        { x: 54.0, y: 6.0 },
        { x: 54.0, y: 10.0 },
        { x: 51.5, y: 10.0 },
        { x: 51.5, y: 14.0 },
        { x: 49.5, y: 14.0 }
      ])
    },
    // Lower-left GH/CD area
    {
      id: "gh-lower-left",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T2",
      points: Object.freeze([
        { x: 6.0, y: 29.0 },
        { x: 11.0, y: 29.0 },
        { x: 11.0, y: 33.0 },
        { x: 8.5, y: 33.0 },
        { x: 8.5, y: 37.0 },
        { x: 6.0, y: 37.0 }
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

export function getLosBlockingFeatures(geometry) {
  const details = getTerrainDetailsForGeometry(geometry);
  if (!details) return [];
  return details.features.filter((f) => f.blocksLos === true);
}
