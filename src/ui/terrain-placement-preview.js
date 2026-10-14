import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { PAGE_14_SOURCE_GUIDES } from "../data/event-companion-placement-guides.js";
import { renderBattlefieldMap } from "./battlefield-map.js";

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

function addLiteralPage14Guides(page, mount) {
  if (Number(page) !== 14) return;
  const board = mount.querySelector(".battlefield-map__board");
  if (!board) return;

  // Page 14 verification: draw the transcribed Event Companion guides exactly
  // where their source anchors were captured, without snapping or mirroring.
  board.querySelector(".battlefield-map__terrain-measurements")?.remove();

  const px = (x) => Number(x) / 60 * 100;
  const py = (y) => (44 - Number(y)) / 44 * 100;
  const lines = [];
  const anchors = [];
  const labels = [];

  for (const guide of PAGE_14_SOURCE_GUIDES) {
    const anchor = guide.sourceAnchor;
    const [edgeX, edgeY] = endpointFor(anchor, guide.edge);
    const [labelX, labelY] = labelPosition(anchor, guide.edge);
    lines.push('<line class="battlefield-map__dimension-line" x1="' + px(anchor[0]) + '" y1="' + py(anchor[1]) + '" x2="' + px(edgeX) + '" y2="' + py(edgeY) + '"></line>');
    anchors.push('<circle class="battlefield-map__dimension-anchor" cx="' + px(anchor[0]) + '" cy="' + py(anchor[1]) + '" r=".7"></circle>');
    labels.push('<text class="battlefield-map__dimension-text" x="' + px(labelX) + '" y="' + py(labelY) + '" text-anchor="middle">' + guide.value + '</text>');
  }

  board.insertAdjacentHTML("beforeend", '<svg class="battlefield-map__terrain-measurements" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Literal Event Companion Page 14 measurement overlay">' + lines.join("") + anchors.join("") + labels.join("") + '</svg>');
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

  addLiteralPage14Guides(page, mount);
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
