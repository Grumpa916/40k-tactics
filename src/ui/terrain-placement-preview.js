import { enhanceTerrainPlacementMap } from "./terrain-placement-map.js";
import { TERRAIN_PLACEMENT_MAP_STYLES } from "./terrain-placement-map-styles.js";
import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { eventCompanionTerrainPlacementReviewLabel } from "../data/event-companion-placement-review-status.js";
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

  const state = { units: [], battlefieldMap: { missionSetup } };
  mount.setAttribute("data-terrain-placement-map", "");
  mount.innerHTML = '<style>' + TERRAIN_PLACEMENT_MAP_STYLES + '</style>' + renderBattlefieldMap(state, {
    mode: "planning",
    showUnits: false,
    showMeasurements: false,
    showTerrainEdgeMeasurements: false,
    mapLabel: "Terrain placement reference · Event Companion page " + page
  });

  const overlay = enhanceTerrainPlacementMap(page, layout, mount, { allowCandidates: true });

  const reviewLabel = eventCompanionTerrainPlacementReviewLabel(page);
  const guideStatus = overlay?.lines?.length
    ? " · " + overlay.guides.length + " placement guides"
    : " · terrain guides not prepared";
  status.textContent = reviewLabel + " · " + layout.missionA + " ↔ " + layout.missionB + " · Layout " + layout.layout + " · page " + layout.page + " · blue side at bottom" + guideStatus;
}

const pageSelect = document.querySelector("[data-terrain-preview-page]");
const mount = document.querySelector("[data-terrain-preview-map]");
const status = document.querySelector("[data-terrain-preview-status]");
const previous = document.querySelector("[data-terrain-preview-prev]");
const next = document.querySelector("[data-terrain-preview-next]");

const pages = (EVENT_COMPANION_MAP_CATALOG.layouts ?? [])
  .map((item) => Number(item.page))
  .filter((page) => Number.isInteger(page) && page >= 9 && page <= 53)
  .sort((a, b) => a - b);

for (const page of pages) {
  const option = document.createElement("option");
  option.value = String(page);
  option.textContent = "Page " + page + " · " + eventCompanionTerrainPlacementReviewLabel(page);
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
setPage(pages.includes(requestedPage) ? requestedPage : pages[0], { updateUrl: true });
