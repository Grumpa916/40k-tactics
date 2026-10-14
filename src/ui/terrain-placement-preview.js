import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { renderBattlefieldMap } from "./battlefield-map.js";

// Page 14 browser-verification mapping. Values are copied from the Event
// Companion; only their attachment to useful V2 terrain corners is manual.
// This preview lets us validate the mapping before promoting it to shared data.
const PAGE_14_MANUAL_GUIDES = Object.freeze([
  { value: '7"',  edge: "left",   anchor: [6.9, 39.0], terrain: "T1" },
  { value: '5"',  edge: "top",    anchor: [6.9, 39.0], terrain: "T1" },
  { value: '8"',  edge: "left",   anchor: [6.9, 27.4], terrain: "T1" },
  { value: '27"', edge: "left",   anchor: [27.0, 33.9], terrain: "T8" },
  { value: '15"', edge: "top",    anchor: [27.0, 33.9], terrain: "T8" },
  { value: '4"',  edge: "top",    anchor: [41.1, 42.0], terrain: "T2" },
  { value: '19"', edge: "left",   anchor: [18.6, 27.0], terrain: "T4" },
  { value: '24"', edge: "left",   anchor: [24.2, 17.2], terrain: "T7" },
  { value: '8"',  edge: "bottom", anchor: [24.2, 17.2], terrain: "T7" },
  { value: '28"', edge: "right",  anchor: [36.0, 15.0], terrain: "T12" },
  { value: '7"',  edge: "right",  anchor: [51.9, 37.7], terrain: "T10" },
  { value: '17"', edge: "right",  anchor: [44.1, 27.0], terrain: "T9" },
  { value: '16"', edge: "bottom", anchor: [44.1, 27.0], terrain: "T9" },
  { value: '15"', edge: "right",  anchor: [44.0, 17.0], terrain: "T9" },
  { value: '12"', edge: "bottom", anchor: [46.1, 16.6], terrain: "T13" },
  { value: '2"',  edge: "bottom", anchor: [46.1, 5.0], terrain: "T13" },
  { value: '5"',  edge: "bottom", anchor: [53.2, 5.0], terrain: "T13" },
  { value: '2"',  edge: "right",  anchor: [53.2, 5.0], terrain: "T13" }
]);

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

function addManualPage14Guides(page, mount) {
  if (Number(page) !== 14) return;
  const board = mount.querySelector(".battlefield-map__board");
  if (!board) return;

  board.querySelector(".battlefield-map__terrain-measurements")?.remove();

  const px = (x) => Number(x) / 60 * 100;
  const py = (y) => (44 - Number(y)) / 44 * 100;
  const parts = [];

  for (const guide of PAGE_14_MANUAL_GUIDES) {
    const [x, y] = guide.anchor;
    const [edgeX, edgeY] = endpointFor(guide.anchor, guide.edge);
    const [labelX, labelY] = labelPosition(guide.anchor, guide.edge);
    parts.push('<line class="battlefield-map__dimension-line" x1="' + px(x) + '" y1="' + py(y) + '" x2="' + px(edgeX) + '" y2="' + py(edgeY) + '"></line>');
    parts.push('<circle class="battlefield-map__dimension-anchor" cx="' + px(x) + '" cy="' + py(y) + '" r=".7"></circle>');
    parts.push('<text class="battlefield-map__dimension-text" x="' + px(labelX) + '" y="' + py(labelY) + '" text-anchor="middle">' + guide.value + '</text>');
  }

  board.insertAdjacentHTML("beforeend", '<svg class="battlefield-map__terrain-measurements" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Manually mapped Event Companion Page 14 terrain placement guides">' + parts.join("") + '</svg>');
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

  addManualPage14Guides(page, mount);
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
