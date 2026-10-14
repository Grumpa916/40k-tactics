export const EVENT_COMPANION_DISPLAY_WIDTH = 44;
export const EVENT_COMPANION_DISPLAY_HEIGHT = 60;

export function orientEventCompanionPoint(point) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    x: y,
    y: x
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
  if (edge === "left") return "bottom";
  if (edge === "right") return "top";
  if (edge === "top") return "right";
  if (edge === "bottom") return "left";
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
