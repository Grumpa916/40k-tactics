export const PAGE_21_LAYOUT_A_DETAILS = Object.freeze({
  page: 21,
  layout: "A",
  // Coordinates are in the same 60×44 inch system used by the rest of the map.
  // These are illustrative starter shapes — replace with measured points from the companion PDF.
  features: Object.freeze([
    {
      id: "ruin-center-1",
      type: "dense",
      parentFootprint: "T5",
      points: Object.freeze([
        { x: 27.5, y: 19.5 },
        { x: 32.8, y: 19.5 },
        { x: 32.8, y: 24.8 },
        { x: 27.5, y: 24.8 }
      ])
    },
    {
      id: "container-left",
      type: "light",
      parentFootprint: "T2",
      points: Object.freeze([
        { x: 12.2, y: 16.0 },
        { x: 16.5, y: 16.0 },
        { x: 16.5, y: 20.5 },
        { x: 12.2, y: 20.5 }
      ])
    },
    {
      id: "barricade-right",
      type: "light",
      parentFootprint: "T11",
      points: Object.freeze([
        { x: 43.0, y: 22.0 },
        { x: 48.5, y: 22.0 },
        { x: 48.5, y: 24.2 },
        { x: 43.0, y: 24.2 }
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
