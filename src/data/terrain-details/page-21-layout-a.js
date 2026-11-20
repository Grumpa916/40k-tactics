export const PAGE_21_LAYOUT_A_DETAILS = Object.freeze({
  page: 21,
  layout: "A",
  // Feature shapes placed inside the verified page-21 Layout A footprints.
  // Dense = blocks LOS. Positions are approximate matches to the companion PDF.
  features: Object.freeze([
    // T1 – defender expansion ruin (upper-left on PDF)
    {
      id: "ruin-t1",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T1",
      points: Object.freeze([
        { x: 10.0, y: 5.0 },
        { x: 18.5, y: 5.0 },
        { x: 18.5, y: 9.0 },
        { x: 14.0, y: 9.0 },
        { x: 14.0, y: 14.5 },
        { x: 10.0, y: 14.5 }
      ])
    },
    // T3 – mid-left light containers
    {
      id: "container-t3",
      type: "light",
      blocksLos: false,
      parentFootprint: "T3",
      points: Object.freeze([
        { x: 8.0, y: 17.0 },
        { x: 13.5, y: 17.0 },
        { x: 13.5, y: 20.0 },
        { x: 10.5, y: 20.0 },
        { x: 10.5, y: 23.5 },
        { x: 8.0, y: 23.5 }
      ])
    },
    // T4 – central-left dense ruin
    {
      id: "ruin-t4",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T4",
      points: Object.freeze([
        { x: 20.0, y: 19.0 },
        { x: 26.0, y: 19.0 },
        { x: 26.0, y: 23.0 },
        { x: 23.0, y: 23.0 },
        { x: 23.0, y: 27.5 },
        { x: 20.0, y: 27.5 }
      ])
    },
    // T6 – large dense ruin (right of center)
    {
      id: "ruin-t6",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T6",
      points: Object.freeze([
        { x: 40.0, y: 29.0 },
        { x: 49.0, y: 29.0 },
        { x: 49.0, y: 33.0 },
        { x: 44.5, y: 33.0 },
        { x: 44.5, y: 38.5 },
        { x: 40.0, y: 38.5 }
      ])
    },
    // T11 – mid-right light terrain
    {
      id: "light-t11",
      type: "light",
      blocksLos: false,
      parentFootprint: "T11",
      points: Object.freeze([
        { x: 34.5, y: 16.0 },
        { x: 40.0, y: 16.0 },
        { x: 40.0, y: 19.0 },
        { x: 36.5, y: 19.0 },
        { x: 36.5, y: 24.0 },
        { x: 34.5, y: 24.0 }
      ])
    },
    // T7 – attacker home area dense ruin
    {
      id: "ruin-t7",
      type: "dense",
      blocksLos: true,
      parentFootprint: "T7",
      points: Object.freeze([
        { x: 49.0, y: 6.5 },
        { x: 54.0, y: 6.5 },
        { x: 54.0, y: 10.0 },
        { x: 51.5, y: 10.0 },
        { x: 51.5, y: 14.5 },
        { x: 49.0, y: 14.5 }
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
