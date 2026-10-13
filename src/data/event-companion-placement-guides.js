// Terrain-placement transcription for the existing V2 battlefield geometry.
//
// Source of truth: official Warhammer 40,000 Event Companion, printed page 12,
// Layout A (Immovable Object vs Unstoppable Force).
//
// `value` and `edge` are transcribed from the printed dimension line.
// `sourceAnchor` records that dimension line's endpoint after rotating the printed
// portrait battlefield into V2's 60 x 44 landscape orientation.
// `anchor` is an existing V2 terrain corner selected only as the reproducible
// on-screen attachment point. Values are never calculated from the V2 geometry.
//
// The six deployment-zone dimensions printed on the same diagram (8, 14 and 19
// inch pairs) are intentionally excluded from Terrain Setup.
const PAGE_12_GUIDES = Object.freeze([
  { value: '9"',  edge: "bottom", terrain: "T12", anchor: [18.5, 9.9], sourceAnchor: [20.59, 9.06] },
  { value: '5"',  edge: "bottom", terrain: "T11", anchor: [36.4, 6.0], sourceAnchor: [36.69, 4.95] },
  { value: '10"', edge: "bottom", terrain: "T10/T11", anchor: [31.8, 10.1], sourceAnchor: [27.91, 10.06] },
  { value: '4"',  edge: "bottom", terrain: "T8", anchor: [42.4, 5.0], sourceAnchor: [43.56, 3.90] },
  { value: '5"',  edge: "bottom", terrain: "T12", anchor: [16.5, 3.8], sourceAnchor: [5.91, 4.95] },
  { value: '6"',  edge: "left",   terrain: "T9", anchor: [4.9, 9.9], sourceAnchor: [5.92, 4.95] },
  { value: '28"', edge: "left",   terrain: "T10/T11", anchor: [31.8, 10.1], sourceAnchor: [27.91, 10.04] },
  { value: '17"', edge: "left",   terrain: "T9", anchor: [16.5, 16.9], sourceAnchor: [17.02, 15.90] },
  { value: '16"', edge: "bottom", terrain: "T9", anchor: [16.5, 16.9], sourceAnchor: [16.98, 15.84] },
  { value: '22"', edge: "left",   terrain: "T4", anchor: [25.1, 30.8], sourceAnchor: [21.99, 28.99] },
  { value: '15"', edge: "top",    terrain: "T4", anchor: [25.1, 30.8], sourceAnchor: [22.04, 28.99] },
  { value: '10"', edge: "bottom", terrain: "T8", anchor: [54.1, 12.1], sourceAnchor: [55.14, 9.99] },
  { value: '5"',  edge: "right",  terrain: "T8", anchor: [54.1, 12.1], sourceAnchor: [55.14, 9.99] },
  { value: '16"', edge: "left",   terrain: "T14", anchor: [15.7, 21.0], sourceAnchor: [15.81, 23.10] },
  { value: '5"',  edge: "bottom", terrain: "T12", anchor: [18.5, 3.8], sourceAnchor: [17.42, 5.04] },
  { value: '10"', edge: "left",   terrain: "T13", anchor: [9.9, 26.3], sourceAnchor: [9.99, 17.69] },
  { value: '5"',  edge: "right",  terrain: "T15", anchor: [51.5, 19.1], sourceAnchor: [55.14, 16.94] },
  { value: '21"', edge: "left",   terrain: "T6", anchor: [20.9, 23.0], sourceAnchor: [21.00, 21.10] }
]);

const PAGE_GUIDES = Object.freeze({
  "12": PAGE_12_GUIDES
});

function endpointFor(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [0, y];
  if (edge === "right") return [60, y];
  if (edge === "top") return [x, 44];
  return [x, 0];
}

function labelPosition(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [Math.max(1.4, x - 1.4), y + 0.7];
  if (edge === "right") return [Math.min(58.6, x + 1.4), y + 0.7];
  if (edge === "top") return [x + 0.8, Math.min(42.8, y + 1.4)];
  return [x + 0.8, Math.max(1.2, y - 1.2)];
}

export function getEventCompanionPlacementOverlay(page) {
  const guides = PAGE_GUIDES[String(page)] ?? [];
  if (!guides.length) return null;

  const lines = guides.map((guide) => {
    const [x, y] = guide.anchor;
    const [edgeX, edgeY] = endpointFor(guide.anchor, guide.edge);
    return [x, y, edgeX, edgeY];
  });

  const measurements = guides.map((guide) => {
    const [x, y] = labelPosition(guide.anchor, guide.edge);
    return { value: guide.value, x, y };
  });

  const seen = new Set();
  const anchors = [];
  for (const guide of guides) {
    const key = guide.anchor.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    anchors.push({ x: guide.anchor[0], y: guide.anchor[1], terrain: guide.terrain });
  }

  return { guides, lines, measurements, anchors };
}

export { PAGE_12_GUIDES };
