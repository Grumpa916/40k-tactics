import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { renderBattlefieldMap } from "./battlefield-map.js";
import {
  buildCompleteTerrainPlacementOverlay
} from "./terrain-placement-guide-model.js";
import {
  EVENT_COMPANION_DISPLAY_WIDTH,
  EVENT_COMPANION_DISPLAY_HEIGHT,
  orientEventCompanionPoint,
  orientEventCompanionLine,
  orientEventCompanionEdge,
  eventCompanionDisplayPercent
} from "./event-companion-display-orientation.js";

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

function arrowForEdge(edge, value) {
  if (edge === "left") return "← " + value;
  if (edge === "right") return value + " →";
  if (edge === "top") return "↑ " + value;
  return "↓ " + value;
}

function orientExistingPercentOverlay(board) {
  const overlay = board.querySelector(".battlefield-map__terrain-measurements");
  if (!overlay) return;

  const rotatePercent = (x, y) => [Number(y), 100 - Number(x)];
  overlay.querySelectorAll("line").forEach((line) => {
    const start = rotatePercent(line.getAttribute("x1"), line.getAttribute("y1"));
    const end = rotatePercent(line.getAttribute("x2"), line.getAttribute("y2"));
    line.setAttribute("x1", start[0]);
    line.setAttribute("y1", start[1]);
    line.setAttribute("x2", end[0]);
    line.setAttribute("y2", end[1]);
  });
  overlay.querySelectorAll("circle").forEach((circle) => {
    const point = rotatePercent(circle.getAttribute("cx"), circle.getAttribute("cy"));
    circle.setAttribute("cx", point[0]);
    circle.setAttribute("cy", point[1]);
  });
  overlay.querySelectorAll("text").forEach((text) => {
    const point = rotatePercent(text.getAttribute("x"), text.getAttribute("y"));
    text.setAttribute("x", point[0]);
    text.setAttribute("y", point[1]);
  });
}

function orientRenderedMap(layout, mount) {
  const board = mount.querySelector(".battlefield-map__board");
  const geometry = board?.querySelector(".battlefield-map__geometry");
  if (!board || !geometry) return;

  board.classList.add("battlefield-map__board--event-companion-blue-bottom");
  board.dataset.eventCompanionOrientation = "blue-bottom";
  geometry.setAttribute("viewBox", "0 0 44 60");

  geometry.querySelectorAll(".battlefield-map__terrain[data-terrain]").forEach((polygon) => {
    const source = layout.terrainGeometry?.[polygon.dataset.terrain];
    const points = (source?.points ?? [])
      .map((point) => orientEventCompanionPoint(point))
      .filter(Boolean)
      .map((point) => point.x + "," + (EVENT_COMPANION_DISPLAY_HEIGHT - point.y))
      .join(" ");
    if (points) polygon.setAttribute("points", points);
  });

  geometry.querySelectorAll(".battlefield-map__zone[data-zone]").forEach((polygon) => {
    const source = layout.deploymentZones?.[polygon.dataset.zone];
    const points = (source?.points ?? [])
      .map((point) => orientEventCompanionPoint(point))
      .filter(Boolean)
      .map((point) => point.x + "," + (EVENT_COMPANION_DISPLAY_HEIGHT - point.y))
      .join(" ");
    if (points) polygon.setAttribute("points", points);
  });

  mount.querySelectorAll(".battlefield-map__objective--layout[data-layout-objective]").forEach((objective) => {
    const source = layout.objectivePositions?.[objective.dataset.layoutObjective];
    const percent = eventCompanionDisplayPercent(source);
    if (!percent) return;
    objective.style.left = percent.left + "%";
    objective.style.top = percent.top + "%";
  });

  orientExistingPercentOverlay(board);
}

function addCompleteTerrainGuides(page, layout, mount) {
  if (Number(page) < 14 || Number(page) > 53) return null;
  const board = mount.querySelector(".battlefield-map__board");
  if (!board) return null;

  const overlay = buildCompleteTerrainPlacementOverlay(layout);
  board.querySelector(".battlefield-map__terrain-measurements")?.remove();

  const px = (x) => Number(x) / EVENT_COMPANION_DISPLAY_WIDTH * 100;
  const py = (y) => (EVENT_COMPANION_DISPLAY_HEIGHT - Number(y)) / EVENT_COMPANION_DISPLAY_HEIGHT * 100;
  const parts = [];

  overlay.lines.forEach((line, index) => {
    const guide = overlay.guides[index] ?? {};
    const oriented = orientEventCompanionLine(line);
    if (!oriented) return;
    parts.push(
      '<line class="battlefield-map__dimension-line" data-terrain="' + escapeXml(guide.terrain ?? "") + '" data-terrain-point="' + escapeXml((guide.terrain ?? "") + ':' + (guide.point ?? "")) + '" x1="' + px(oriented[0]) + '" y1="' + py(oriented[1]) + '" x2="' + px(oriented[2]) + '" y2="' + py(oriented[3]) + '"></line>'
    );
  });
  overlay.anchors.forEach((anchor) => {
    const oriented = orientEventCompanionPoint(anchor);
    if (!oriented) return;
    parts.push(
      '<circle class="battlefield-map__dimension-anchor" data-terrain="' + escapeXml(anchor.terrain) + '" data-placement-anchor="' + escapeXml(anchor.terrain + ':' + anchor.point) + '" cx="' + px(oriented.x) + '" cy="' + py(oriented.y) + '" r=".7"></circle>'
    );
  });

  if (Number(page) === 14) {
    overlay.measurements.forEach((measurement) => {
      const oriented = orientEventCompanionPoint(measurement);
      if (!oriented) return;
      parts.push('<text class="battlefield-map__dimension-text" x="' + px(oriented.x) + '" y="' + py(oriented.y) + '" text-anchor="middle">' + escapeXml(measurement.value) + '</text>');
    });
  } else {
    overlay.callouts.forEach((callout) => {
      const orientedCallout = orientEventCompanionPoint(callout);
      const orientedAnchor = orientEventCompanionPoint({ x: callout.anchorX, y: callout.anchorY });
      if (!orientedCallout || !orientedAnchor) return;
      const x = px(orientedCallout.x);
      const y = py(orientedCallout.y);
      const anchorX = px(orientedAnchor.x);
      const anchorY = py(orientedAnchor.y);
      const boxWidth = 11.5;
      const boxHeight = 6.5;
      const horizontalEdge = orientEventCompanionEdge(callout.verticalEdge);
      const verticalEdge = orientEventCompanionEdge(callout.horizontalEdge);
      const horizontalText = arrowForEdge(horizontalEdge, callout.verticalValue);
      const verticalText = arrowForEdge(verticalEdge, callout.horizontalValue);
      parts.push(
        '<g class="terrain-point-callout" data-terrain="' + escapeXml(callout.terrain) + '" data-terrain-point="' + escapeXml(callout.terrain + ':' + callout.point) + '">' +
          '<line x1="' + anchorX + '" y1="' + anchorY + '" x2="' + x + '" y2="' + y + '" stroke="#b8c5cf" stroke-width=".7" stroke-dasharray="2 1.5" vector-effect="non-scaling-stroke"></line>' +
          '<rect x="' + (x - boxWidth / 2) + '" y="' + (y - boxHeight / 2) + '" width="' + boxWidth + '" height="' + boxHeight + '" rx="1.1" fill="#101820" fill-opacity=".94" stroke="#f6d783" stroke-width=".7" vector-effect="non-scaling-stroke"></rect>' +
          '<text class="battlefield-map__dimension-text" x="' + x + '" y="' + (y - 0.75) + '" text-anchor="middle">' + escapeXml(horizontalText) + '</text>' +
          '<text class="battlefield-map__dimension-text" x="' + x + '" y="' + (y + 1.7) + '" text-anchor="middle">' + escapeXml(verticalText) + '</text>' +
        '</g>'
      );
    });
  }

  board.insertAdjacentHTML(
    "beforeend",
    '<svg class="battlefield-map__terrain-measurements" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Complete terrain placement guides: two points and two perpendicular measurements per terrain shape">' + parts.join("") + '</svg>'
  );
  return overlay;
}

function enableTerrainFocus(page, mount) {
  if (Number(page) < 15 || Number(page) > 53) return;
  const board = mount.querySelector(".battlefield-map__board");
  const mapRoot = mount.querySelector(".battlefield-map");
  if (!board || !mapRoot) return;

  const terrainShapes = [...board.querySelectorAll(".battlefield-map__terrain[data-terrain]")];
  const guideLines = [...board.querySelectorAll(".battlefield-map__dimension-line[data-terrain]")];
  const anchors = [...board.querySelectorAll(".battlefield-map__dimension-anchor[data-terrain]")];
  const callouts = [...board.querySelectorAll(".terrain-point-callout[data-terrain]")];
  if (!terrainShapes.length) return;

  const controls = document.createElement("div");
  controls.className = "terrain-focus-controls";
  controls.innerHTML = '<span data-terrain-focus-status>Tap a terrain footprint to show its four placement measurements.</span><button type="button" data-terrain-show-all>Show all</button>';
  mapRoot.insertBefore(controls, board);

  const focusStatus = controls.querySelector("[data-terrain-focus-status]");
  const showAllButton = controls.querySelector("[data-terrain-show-all]");
  let focusedTerrain = null;
  let showAll = false;

  function applyFocus() {
    guideLines.forEach((element) => {
      element.style.display = showAll || (focusedTerrain && element.dataset.terrain === focusedTerrain) ? "" : "none";
    });
    callouts.forEach((element) => {
      element.style.display = showAll || (focusedTerrain && element.dataset.terrain === focusedTerrain) ? "" : "none";
    });
    anchors.forEach((element) => {
      const active = showAll || (focusedTerrain && element.dataset.terrain === focusedTerrain);
      element.style.display = "";
      element.style.opacity = active ? "1" : ".38";
    });
    terrainShapes.forEach((shape) => {
      shape.classList.toggle("is-measurement-focused", !showAll && focusedTerrain === shape.dataset.terrain);
    });

    if (showAll) {
      focusStatus.textContent = "Showing all terrain measurements.";
      showAllButton.textContent = "Hide all";
    } else if (focusedTerrain) {
      focusStatus.textContent = "Showing four placement measurements for " + focusedTerrain + ". Tap another terrain footprint to switch.";
      showAllButton.textContent = "Show all";
    } else {
      focusStatus.textContent = "Tap a terrain footprint to show its four placement measurements.";
      showAllButton.textContent = "Show all";
    }
  }

  function focusTerrain(name) {
    focusedTerrain = name;
    showAll = false;
    applyFocus();
  }

  terrainShapes.forEach((shape) => {
    const terrainName = shape.dataset.terrain;
    shape.setAttribute("role", "button");
    shape.setAttribute("tabindex", "0");
    shape.setAttribute("aria-label", "Show placement measurements for " + terrainName);
    shape.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      focusTerrain(terrainName);
    });
    shape.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      focusTerrain(terrainName);
    });
  });

  showAllButton.addEventListener("click", () => {
    if (showAll) {
      showAll = false;
      focusedTerrain = null;
    } else {
      showAll = true;
      focusedTerrain = null;
    }
    applyFocus();
  });

  applyFocus();
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

  orientRenderedMap(layout, mount);
  addCompleteTerrainGuides(page, layout, mount);
  enableTerrainFocus(page, mount);
  status.textContent = layout.missionA + " ↔ " + layout.missionB + " · Layout " + layout.layout + " · page " + layout.page + " · blue side at bottom";
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
