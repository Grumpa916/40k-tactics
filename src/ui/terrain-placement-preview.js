import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { renderBattlefieldMap } from "./battlefield-map.js";

// Page 13 includes several official dimensions that were previously snapped to
// unhelpful terrain vertices by the generic placement-guide heuristic. These
// preview-only guides reproduce the printed Event Companion corner pairs so we
// can validate the correct V2 mapping before moving the overrides into the
// shared placement data.
const PAGE_13_VERIFIED_OFFICIAL_GUIDES = Object.freeze([
  { value: '26"', edge: "left",  anchor: [25.9, 40.0], terrain: "T12" },
  { value: '4"',  edge: "top",   anchor: [25.9, 40.0], terrain: "T12" },
  { value: '20"', edge: "left",  anchor: [19.9, 33.9], terrain: "T13" },
  { value: '10"', edge: "top",   anchor: [19.9, 33.9], terrain: "T13" },
  { value: '7"',  edge: "right", anchor: [53.0, 40.1], terrain: "T8" },
  { value: '4"',  edge: "top",   anchor: [53.0, 40.1], terrain: "T8" }
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

function guideEndpoint(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [0, y];
  if (edge === "right") return [60, y];
  if (edge === "top") return [x, 44];
  return [x, 0];
}

function guideLabelPosition(anchor, edge) {
  const [x, y] = anchor;
  if (edge === "left") return [Math.max(1.8, x - 1.8), y + 0.8];
  if (edge === "right") return [Math.min(58.2, x + 1.8), y + 0.8];
  if (edge === "top") return [x + 1.0, Math.min(42.4, y + 1.7)];
  return [x + 1.0, Math.max(1.6, y - 1.6)];
}

function addPage13VerifiedGuides(page, mount) {
  if (Number(page) !== 13) return;
  const board = mount.querySelector(".battlefield-map__board");
  if (!board) return;

  const px = (x) => Number(x) / 60 * 100;
  const py = (y) => (44 - Number(y)) / 44 * 100;
  const parts = [];

  for (const guide of PAGE_13_VERIFIED_OFFICIAL_GUIDES) {
    const [x, y] = guide.anchor;
    const [edgeX, edgeY] = guideEndpoint(guide.anchor, guide.edge);
    const [labelX, labelY] = guideLabelPosition(guide.anchor, guide.edge);
    parts.push('<line class="terrain-preview__verified-line" x1="' + px(x) + '" y1="' + py(y) + '" x2="' + px(edgeX) + '" y2="' + py(edgeY) + '"></line>');
    parts.push('<circle class="terrain-preview__verified-anchor" cx="' + px(x) + '" cy="' + py(y) + '" r=".66"></circle>');
    parts.push('<text class="terrain-preview__verified-text" x="' + px(labelX) + '" y="' + py(labelY) + '" text-anchor="middle">' + guide.value + '</text>');
  }

  board.insertAdjacentHTML("beforeend", '<svg class="terrain-preview__verified-guides" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Verified official Page 13 Event Companion placement guides">' + parts.join("") + '</svg>');
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

  addPage13VerifiedGuides(page, mount);
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
