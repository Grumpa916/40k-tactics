import { eventCompanionDisplayPercent } from "./event-companion-display-orientation.js";

export const TERRAIN_CALLOUT_WIDTH = 11.5;
export const terrainCalloutHeight = (count) => count === 1 ? 4.4 : 6.5;

function overlaps(a, b) {
  return Math.abs(a.displayX - b.displayX) < TERRAIN_CALLOUT_WIDTH + 0.6
    && Math.abs(a.displayY - b.displayY) < (a.boxHeight + b.boxHeight) / 2 + 0.6;
}

// Only separate boxes visible together when one footprint is focused. Source
// points, values, arrow directions, and measurement lines remain untouched.
export function layoutTerrainCallouts(callouts) {
  const placed = [];
  for (const callout of callouts) {
    const point = eventCompanionDisplayPercent(callout);
    if (!point) continue;
    const boxHeight = terrainCalloutHeight(callout.values?.length ?? callout.lines?.length ?? 0);
    const box = { ...callout, displayX: point.left, displayY: point.top, boxHeight };
    const peers = placed.filter((item) => item.terrain === box.terrain);
    const valid = (candidate) => candidate.displayX >= TERRAIN_CALLOUT_WIDTH / 2
      && candidate.displayX <= 100 - TERRAIN_CALLOUT_WIDTH / 2
      && candidate.displayY >= boxHeight / 2
      && candidate.displayY <= 100 - boxHeight / 2
      && peers.every((peer) => !overlaps(candidate, peer));
    if (!valid(box)) {
      let replacement = null;
      for (let distance = 0.5; distance <= 100 && !replacement; distance += 0.5) {
        for (const [dx, dy] of [[0, distance], [0, -distance], [distance, 0], [-distance, 0]]) {
          const candidate = { ...box, displayX: point.left + dx, displayY: point.top + dy };
          if (valid(candidate)) { replacement = candidate; break; }
        }
      }
      if (replacement) Object.assign(box, replacement);
    }
    placed.push(box);
  }
  return placed;
}

