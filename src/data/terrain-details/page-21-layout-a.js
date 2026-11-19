export const PAGE_21_LAYOUT_A_DETAILS = Object.freeze({
  page: 21,
  layout: "A",
  // Approximate feature shapes based on Event Companion PDF page 21 Layout A.
  // Coordinates are in the same 60×44 inch system. These sit inside the existing
  // terrain footprints and are meant as a closer visual match for testing.
  features: Object.freeze([
    // Dense ruin near defender expansion (upper-left area of PDF)
    {
      id: "ruin-defender-expansion",
      type: "dense",
      parentFootprint: "T1",
      points: Object.freeze([
        { x: 9.5, y: 8.0 },
        { x: 14.5, y: 8.0 },
        { x: 14.5, y: 13.5 },
        { x: 9.5, y: 13.5 }
      ])
    },
    // Light containers / barricade mid-left
    {
      id: "container-mid-left",
      type: "light",
      parentFootprint: "T3",
      points: Object.freeze([
        { x: 12.0, y: 18.0 },
        { x: 17.5, y: 18.0 },
        { x: 17.5, y: 22.5 },
        { x: 12.0, y: 22.5 }
      ])
    },
    // Central dense ruin
    {
      id: "ruin-center",
      type: "dense",
      parentFootprint: "T6",
      points: Object.freeze([
        { x: 28.0, y: 19.0 },
        { x: 34.0, y: 19.0 },
        { x: 34.0, y: 25.0 },
        { x: 28.0, y: 25.0 }
      ])
    },
    // Light barricade upper-right of center
    {
      id: "barricade-upper-right",
      type: "light",
      parentFootprint: "T8",
      points: Object.freeze([
        { x: 38.0, y: 22.0 },
        { x: 44.0, y: 22.0 },
        { x: 44.0, y: 25.0 },
        { x: 38.0, y: 25.0 }
      ])
    },
    // Dense ruin near attacker home (lower-right)
    {
      id: "ruin-attacker-home",
      type: "dense",
      parentFootprint: "T12",
      points: Object.freeze([
        { x: 46.0, y: 28.0 },
        { x: 52.0, y: 28.0 },
        { x: 52.0, y: 34.0 },
        { x: 46.0, y: 34.0 }
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
