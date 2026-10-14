import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { renderBattlefieldMap } from "./battlefield-map.js";
import {
  buildCompleteTerrainPlacementOverlay,
  TERRAIN_BOARD_WIDTH,
  TERRAIN_BOARD_HEIGHT
} from "./terrain-placement-guide-model.js";

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

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function addCompleteTerrainGuides(page, layout, mount) {
  if (Number(page) < 14 || Number(page) > 53) return;
  const board = mount.querySelector(".battlefield-map__board");
  if (!board) return;

  const overlay = buildCompleteTerrainPlacementOverlay(layout);
  board.querySelector(".battlefield-map__terrain-measurements")?.remove();

  const px = (x) => Number(x) / TERRAIN_BOARD_WIDTH * 100;
  const py = (y) => (TERRAIN_BOARD_HEIGHT - Number(y)) / TERRAIN_BOARD_HEIGHT * 100;
  const parts = [];

  overlay.lines.forEach((line) => {
    parts.push('<line class="battlefield-map__dimension-line" x1="' + px(line[0]) + '" y1="' + py(line[1]) + '" x2="' + px(line[2]) + '" y2="' + py(line[3]) + '"></line>');
  });
  overlay.anchors.forEach((anchor) => {
    parts.push('<circle class="battlefield-map__dimension-anchor" data-placement-anchor="' + escapeXml(anchor.terrain + ':' + anchor.point) + '" cx="' + px(anchor.x) + '" cy="' + py(anchor.y) + '" r=".7"></circle>');
  });

  if (Number(page) === 14) {
    overlay.measurements.forEach((measurement) => {
      parts.push('<text class="battlefield-map__dimension-text" x="' + px(measurement.x) + '" y="' + py(measurement.y) + '" text-anchor="middle">' + escapeXml(measurement.value) + '</text>');
    });
  } else {
    overlay.callouts.forEach((callout) => {
      parts.push(
        '<text class="battlefield-map__dimension-text terrain-point-callout" data-terrain-point="' + escapeXml(callout.terrain + ':' + callout.point) + '" x="' + px(callout.x) + '" y="' + py(callout.y) + '" text-anchor="middle">' + escapeXml(callout.text) + '</text>'
      );
    });
  }

  board.insertAdjacentHTML(
    "beforeend",
    '<svg class="battlefield-map__terrain-measurements" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Complete terrain placement guides: two points and two perpendicular measurements per terrain shape">' + parts.join("") + '</svg>'
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

  addCompleteTerrainGuides(page, layout, mount);
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

function setPage(page, { updateUrl = true } = {}) {
  const safePage = pages.includes(Number(page)) ? Number(page) : pages[0];
  pageSelect.value = String(safePage);
  renderPage(safePage, mount, status);
  previous.disabled = safePage === pages[0];
  next.disabled = safePage === pages[pages.length - 1];

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(safePage));
    window.history.replaceState(null, "", url);
  }
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

const requestedPage = Number(new URL(window.location.href).searchParams.get("page"));
setPage(pages.includes(requestedPage) ? requestedPage : (pages.includes(12) ? 12 : pages[0]), { updateUrl: true });
