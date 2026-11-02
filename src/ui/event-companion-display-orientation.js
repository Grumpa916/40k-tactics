// Keep Event Companion setup maps visually aligned with the canonical live/deployment
// battlefield: 60" wide by 44" high. The renderer still uses its historical 44x60
// intermediate SVG viewBox, so points are scaled into that box without rotating them.
export const EVENT_COMPANION_DISPLAY_WIDTH = 44;
export const EVENT_COMPANION_DISPLAY_HEIGHT = 60;
export const CANONICAL_BATTLEFIELD_WIDTH = 60;
export const CANONICAL_BATTLEFIELD_HEIGHT = 44;

export function orientEventCompanionPoint(point) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    x: x / CANONICAL_BATTLEFIELD_WIDTH * EVENT_COMPANION_DISPLAY_WIDTH,
    y: y / CANONICAL_BATTLEFIELD_HEIGHT * EVENT_COMPANION_DISPLAY_HEIGHT
  };
}

export function orientEventCompanionLine(line) {
  if (!Array.isArray(line) || line.length !== 4) return null;
  const start = orientEventCompanionPoint({ x: line[0], y: line[1] });
  const end = orientEventCompanionPoint({ x: line[2], y: line[3] });
  if (!start || !end) return null;
  return [start.x, start.y, end.x, end.y];
}

export function orientEventCompanionEdge(edge) {
  return edge;
}

export function eventCompanionDisplayPercent(point) {
  const oriented = orientEventCompanionPoint(point);
  if (!oriented) return null;
  return {
    left: oriented.x / EVENT_COMPANION_DISPLAY_WIDTH * 100,
    top: (EVENT_COMPANION_DISPLAY_HEIGHT - oriented.y) / EVENT_COMPANION_DISPLAY_HEIGHT * 100
  };
}
