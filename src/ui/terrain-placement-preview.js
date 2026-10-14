import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { renderBattlefieldMap } from "./battlefield-map.js";

const BOARD_WIDTH = 60;
const BOARD_HEIGHT = 44;

function normalizePair(a, b) {
  return [String(a ?? ""), String(b ?? "")].sort((left, right) => left.localeCompare(right));
}

function dispositionSetupForLayout(target) {
  const dispositions = EVENT_COMPANION_MAP_CATALOG.forceDispositions ?? [];
  const matrix = EVENT_COMPANION_MAP_CATALOG.forceDispositionMissionMatrix ?? {};
  const targetPair = normalizePair(target.missionA, target.missionB);

  for (const myDisposition of dispositions) {
    for (const opponentDisposition of dispositions) {
      const myMission = matrix[myDisposition]?.[opponentDisposition];
      const opponentMission = matrix[opponentDisposition]?.[myDisposition];
      const pair = normalizePair(myMission, opponentMission);
      if (pair[0] === targetPair[0] && pair[1] === targetPair[1]) {
        return { myDisposition, opponentDisposition, layout: target.layout };
      }
    }
  }
  return null;
}

function geometryPoints(shape) {
  return (shape?.points ?? [])
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => [Number(point.x), Number(point.y)]);
}

function edgeDistance(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return x;
  if (edge === "right") return BOARD_WIDTH - x;
  if (edge === "top") return BOARD_HEIGHT - y;
  return y;
}

function endpointFor(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [0, y];
  if (edge === "right") return [BOARD_WIDTH, y];
  if (edge === "top") return [x, BOARD_HEIGHT];
  return [x, 0];
}

function centroid(points) {
  const total = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

function primaryEdgeFor(points) {
  const center = centroid(points);
  const edges = ["left", "right", "top", "bottom"];
  return edges.sort((a, b) => edgeDistance(center, a) - edgeDistance(center, b))[0];
}

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function farthestPair(points) {
  if (points.length <= 2) return points.slice(0, 2);
  let best = [points[0], points[1]];
  let bestDistance = distanceSquared(best[0], best[1]);
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const candidate = distanceSquared(points[i], points[j]);
      if (candidate > bestDistance) {
        best = [points[i], points[j]];
        bestDistance = candidate;
      }
    }
  }
  return best;
}

function measurementPointsFor(points, primaryEdge) {
  const minimum = Math.min(...points.map((point) => edgeDistance(point, primaryEdge)));
  const nearPrimaryEdge = points.filter((point) => edgeDistance(point, primaryEdge) <= minimum + 2.5);
  if (nearPrimaryEdge.length >= 2) return farthestPair(nearPrimaryEdge);

  return [...points]
    .sort((a, b) => edgeDistance(a, primaryEdge) - edgeDistance(b, primaryEdge))
    .slice(0, 2);
}

function perpendicularEdgeFor(primaryEdge, anchor) {
  const [x, y] = anchor;
  if (primaryEdge === "left" || primaryEdge === "right") {
    return y <= BOARD_HEIGHT / 2 ? "bottom" : "top";
  }
  return x <= BOARD_WIDTH / 2 ? "left" : "right";
}

function formatDistance(anchor, edge) {
  return Math.max(0, Math.round(edgeDistance(anchor, edge))) + '"';
}

function labelPosition(anchor, edge) {
  const [edgeX, edgeY] = endpointFor(anchor, edge);
  const x = (anchor[0] + edgeX) / 2;
  const y = (anchor[1] + edgeY) / 2;
  if (edge === "left" || edge === "right") return [x, y + 0.7];
  return [x + 0.8, y];
}

function completePage14Points(layout) {
  const result = [];
  for (const [terrain, shape] of Object.entries(layout?.terrainGeometry ?? {})) {
    const points = geometryPoints(shape);
    if (points.length < 2) continue;
    const primaryEdge = primaryEdgeFor(points);
    const measurementPoints = measurementPointsFor(points, primaryEdge);
    measurementPoints.forEach((anchor, index) => {
      const perpendicularEdge = perpendicularEdgeFor(primaryEdge, anchor);
      result.push({ terrain, point: index === 0 ? "A" : "B", anchor, edges: [primaryEdge, perpendicularEdge] });
    });
  }
  return result;
}

function addCompletePage14Guides(page, layout, mount) {
  if (Number(page) !== 14) return;
  const board = mount.querySelector(".battlefield-map__board");
  if (!board) return;

  board.querySelector(".battlefield-map__terrain-measurements")?.remove();

  const px = (x) => Number(x) / BOARD_WIDTH * 100;
  const py = (y) => (BOARD_HEIGHT - Number(y)) / BOARD_HEIGHT * 100;
  const parts = [];
  const measurementPoints = completePage14Points(layout);

  for (const measurementPoint of measurementPoints) {
    const [x, y] = measurementPoint.anchor;
    for (const edge of measurementPoint.edges) {
      const [edgeX, edgeY] = endpointFor(measurementPoint.anchor, edge);
      const [labelX, labelY] = labelPosition(measurementPoint.anchor, edge);
      parts.push('<line class="battlefield-map__dimension-line" x1="' + px(x) + '" y1="' + py(y) + '" x2="' + px(edgeX) + '" y2="' + py(edgeY) + '"></line>');
      parts.push('<text class="battlefield-map__dimension-text" x="' + px(labelX) + '" y="' + py(labelY) + '" text-anchor="middle">' + formatDistance(measurementPoint.anchor, edge) + '</text>');
    }
    parts.push('<circle class="battlefield-map__dimension-anchor" cx="' + px(x) + '" cy="' + py(y) + '" r=".7"></circle>');
  }

  board.insertAdjacentHTML(
    "beforeend",
    '<svg class="battlefield-map__terrain-measurements" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Page 14 complete terrain placement point guides">' + parts.join("") + '</svg>'
  );
}

function renderPage(page, mount, status) {
  const layout = (EVENT_COMPANION_MAP_CATALOG.layouts ?? []).find((item) => Number(item.page) === Number(page));
  if (!layout) {
    mount.innerHTML = "<p>No verified layout exists for this page.</p>";
    status.textContent = "Page " + page + " unavailable";
    return;
  }

  const missionSetup = dispositionSetupForLayout(layout);
  if (!missionSetup) {
    mount.innerHTML = "<p>Could not resolve the mission pair for this page.</p>";
    status.textContent = "Page " + page + " could not be resolved";
    return;
  }

  const state = {
    units: [],
    battlefieldMap: { missionSetup }
  };

  mount.innerHTML = renderBattlefieldMap(state, {
    mode: "planning",
    showUnits: false,
    showMeasurements: false,
    showTerrainEdgeMeasurements: true,
    mapLabel: "Terrain placement reference · Event Companion page " + page
  });

  addCompletePage14Guides(page, layout, mount);
  status.textContent = layout.missionA + " ↔ " + layout.missionB + " · Layout " + layout.layout + " · page " + layout.page;
}

const pageSelect = document.querySelector("[data-terrain-preview-page]");
const mount = document.querySelector("[data-terrain-preview-map]");
const status = document.querySelector("[data-terrain-preview-status]");
const previous = document.querySelector("[data-terrain-preview-prev]");
const next = document.querySelector("[data-terrain-preview-next]");

const pages = (EVENT_COMPANION_MAP_CATALOG.layouts ?? [])
  .map((item) => Number(item.page))
  .filter((page) => Number.isInteger(page) && page >= 12 && page <= 53)
  .sort((a, b) => a - b);

for (const page of pages) {
  const option = document.createElement("option");
  option.value = String(page);
  option.textContent = "Page " + page;
  pageSelect.append(option);
}

function setPage(page) {
  const safePage = pages.includes(Number(page)) ? Number(page) : pages[0];
  pageSelect.value = String(safePage);
  renderPage(safePage, mount, status);
  previous.disabled = safePage === pages[0];
  next.disabled = safePage === pages[pages.length - 1];
}

pageSelect.addEventListener("change", () => setPage(Number(pageSelect.value)));
previous.addEventListener("click", () => {
  const index = pages.indexOf(Number(pageSelect.value));
  if (index > 0) setPage(pages[index - 1]);
});
next.addEventListener("click", () => {
  const index = pages.indexOf(Number(pageSelect.value));
  if (index >= 0 && index < pages.length - 1) setPage(pages[index + 1]);
});

setPage(pages.includes(12) ? 12 : pages[0]);
