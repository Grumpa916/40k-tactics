import { getCombatFormationRoot } from "../rules/battle-unit-reference.js";
import { getMovementStrategicRecommendations } from "../rules/tactical-movement-opportunities.js";

let highlightEventsBound = false;
let activeHighlight = null;

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function priorityLabel(priority) {
  if (priority >= 5) return "very high";
  if (priority >= 4) return "high";
  if (priority >= 3) return "medium";
  if (priority >= 2) return "low";
  return "minimal";
}

function purposeLabel(purpose) {
  return String(purpose ?? "reposition").replaceAll("-", " ");
}

function destinationLabel(option) {
  if (option?.objectiveId) return `Objective · ${option.objectiveName ?? option.objectiveId}`;
  if (option?.targetName) return `Enemy · ${option.targetName}`;
  if (option?.territoryTarget === "boundary") return "Territory · Boundary";
  if (option?.territoryTarget === "opponent") return "Territory · Opponent";
  return "Flexible board position";
}

function strategicFitLabel(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function highlightDescriptor(option) {
  if (option?.objectiveId) return { kind: "objective", id: option.objectiveId };
  if (option?.targetUnitId) return { kind: "unit", id: option.targetUnitId };
  return { kind: "none", id: "" };
}

function renderMovementOption(option, index, selectedRank) {
  const recommended = index === 0;
  const rank = index + 1;
  const descriptor = highlightDescriptor(option);
  const selected = selectedRank === rank;
  return `<a href="#movement-destination-${rank}" role="button" class="move-unit movement-advisor__option${selected ? " is-selected" : ""}" data-movement-option-rank="${rank}" data-movement-highlight-kind="${escapeHtml(descriptor.kind)}" data-movement-highlight-id="${escapeHtml(descriptor.id)}" aria-pressed="${selected}">
    <strong>${rank}. ${escapeHtml(destinationLabel(option))}${recommended ? " · Recommended" : ""}</strong>
    <span>${escapeHtml(purposeLabel(option.purpose))} · ${escapeHtml(strategicFitLabel(option.score))} relative fit</span>
    <small>${escapeHtml(option.actionHint ?? "Reposition for this strategic purpose")}</small>
    ${option.reason ? `<small>${escapeHtml(option.reason)}</small>` : ""}
  </a>`;
}

function mapRootForAdvisor(aside) {
  return aside?.closest?.(".combat-workspace") ?? aside?.closest?.("main.movement-screen") ?? aside?.parentElement ?? null;
}

function clearHighlight(root) {
  if (!root?.querySelectorAll) return;
  for (const element of root.querySelectorAll(".is-advisor-highlight")) {
    element.classList.remove("is-advisor-highlight");
    element.removeAttribute("aria-current");
  }
}

function findHighlightTarget(root, kind, id) {
  if (!root?.querySelectorAll || !id) return null;
  const attribute = kind === "objective" ? "data-map-objective-id" : kind === "unit" ? "data-map-unit-id" : null;
  if (!attribute) return null;
  return [...root.querySelectorAll(`[${attribute}]`)].find((element) => element.getAttribute(attribute) === id) ?? null;
}

function applyActiveHighlight(aside) {
  if (!aside) return;
  const root = mapRootForAdvisor(aside);
  clearHighlight(root);
  for (const option of aside.querySelectorAll?.("[data-movement-option-rank]") ?? []) {
    const selected = Boolean(activeHighlight && activeHighlight.unitId === aside.getAttribute("data-movement-advisor-unit-id") && Number(option.getAttribute("data-movement-option-rank")) === activeHighlight.rank);
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  }
  if (!activeHighlight || activeHighlight.unitId !== aside.getAttribute("data-movement-advisor-unit-id")) return;
  const target = findHighlightTarget(root, activeHighlight.kind, activeHighlight.id);
  if (!target) return;
  target.classList.add("is-advisor-highlight");
  target.setAttribute("aria-current", "true");
}

function activateHighlightOption(option) {
  const aside = option?.closest?.("[data-movement-advisor]");
  if (!aside) return;
  activeHighlight = {
    unitId: aside.getAttribute("data-movement-advisor-unit-id"),
    rank: Number(option.getAttribute("data-movement-option-rank")),
    kind: option.getAttribute("data-movement-highlight-kind") ?? "none",
    id: option.getAttribute("data-movement-highlight-id") ?? ""
  };
  applyActiveHighlight(aside);
}

function bindHighlightEvents() {
  if (highlightEventsBound || typeof document === "undefined") return;
  highlightEventsBound = true;
  document.addEventListener("click", (event) => {
    const option = event.target?.closest?.("[data-movement-highlight-kind]");
    if (!option) return;
    event.preventDefault();
    activateHighlightOption(option);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== " ") return;
    const option = event.target?.closest?.("[data-movement-highlight-kind]");
    if (!option) return;
    event.preventDefault();
    activateHighlightOption(option);
  });
}

function scheduleHighlightRestore(unitId) {
  if (typeof document === "undefined" || typeof queueMicrotask !== "function") return;
  queueMicrotask(() => {
    const aside = [...document.querySelectorAll?.("[data-movement-advisor]") ?? []]
      .find((element) => element.getAttribute("data-movement-advisor-unit-id") === unitId);
    if (aside) applyActiveHighlight(aside);
  });
}

export function renderMovementAdvisor(state, { playerId, selectedUnitId = null, perspectivePlayerId = playerId } = {}) {
  if (!playerId || state?.phase !== "movement") return "";

  let context;
  try {
    context = getMovementStrategicRecommendations(state, { playerId, perspectivePlayerId });
  } catch {
    return `<aside class="movement-advisor"><h2>Movement Advisor</h2><p>Strategic movement context is unavailable for the current battle state.</p></aside>`;
  }

  const selectedUnit = (state.units ?? []).find((unit) => unit.id === selectedUnitId) ?? null;
  const selectedRootId = getCombatFormationRoot(state, selectedUnit)?.id ?? selectedUnitId;
  const selected = context.recommendations.find((item) => item.unitId === selectedRootId) ?? context.recommendations[0] ?? null;
  if (!selected) {
    return `<aside class="movement-advisor"><h2>Movement Advisor</h2><p>No deployed formation has a strategic movement recommendation.</p></aside>`;
  }

  if (activeHighlight?.unitId && activeHighlight.unitId !== selected.unitId) activeHighlight = null;
  bindHighlightEvents();
  scheduleHighlightRestore(selected.unitId);

  const activeMissionText = context.activeSecondaries.length
    ? context.activeSecondaries.map((mission) => `${mission.name}${mission.verified ? "" : " (review only)"}`).join(" · ")
    : "No active secondary cards recorded";
  const territoryVerifiedText = context.territorySignal?.missions?.length
    ? `Verified territory ranking: ${context.territorySignal.missions.join(", ")}.`
    : "No verified active secondary currently adds territory-ranking value.";
  const territoryReviewText = context.territorySignal?.reviewOnlyMissions?.length
    ? `Review-only territory context: ${context.territorySignal.reviewOnlyMissions.join(", ")}. These cards do not change the numeric ranking until verified.`
    : "";
  const top = context.recommendations.slice(0, 3);
  const selectedOptions = [selected, ...(selected.alternatives ?? [])].slice(0, 3);
  const selectedRank = activeHighlight?.unitId === selected.unitId ? activeHighlight.rank : null;

  return `<aside class="movement-advisor" data-movement-advisor data-movement-advisor-unit-id="${escapeHtml(selected.unitId)}">
    <style>
      [data-movement-advisor] .movement-advisor__option{color:inherit;text-decoration:none}
      [data-movement-advisor] .movement-advisor__option.is-selected{outline:2px solid #f6d783;outline-offset:1px}
      .battlefield-map__unit.is-advisor-highlight,.battlefield-map__objective.is-advisor-highlight{outline:4px solid #f6d783!important;outline-offset:3px;z-index:9;box-shadow:0 0 0 4px rgba(246,215,131,.28),0 1px 7px #000c!important}
    </style>
    <div class="move-heading">
      <h2>Movement Advisor</h2>
      <span>${escapeHtml(context.strategy.posture)} · ${escapeHtml(priorityLabel(selected.priority))} priority</span>
    </div>
    <p><strong>${escapeHtml(selected.recommendation)}</strong></p>
    <div class="fight-advisory__grid movement-advisor__grid">
      <div><strong>${selected.movement == null ? "—" : `${escapeHtml(selected.movement)}\"`}</strong><span>saved Move</span></div>
      <div><strong>${selected.effectiveOc == null ? "—" : escapeHtml(selected.effectiveOc)}</strong><span>usable OC</span></div>
      <div><strong>${escapeHtml(purposeLabel(selected.purpose))}</strong><span>purpose</span></div>
      <div><strong>${escapeHtml(selected.confidence)}</strong><span>confidence</span></div>
    </div>
    <p>${escapeHtml(selected.actionHint)}</p>
    <details open>
      <summary>Possible destinations · ${selectedOptions.length}</summary>
      <p><small>Ranked for ${escapeHtml(selected.unitName)}. Strategic fit is comparative guidance, not a movement-success probability.</small></p>
      <div class="move-units movement-advisor__options">${selectedOptions.map((option, index) => renderMovementOption(option, index, selectedRank)).join("")}</div>
      <p><small>Tap an objective or enemy option to highlight it. Territory options use the dotted boundary already shown on the map. Highlight only — the unit is not moved and no movement choice is recorded.</small></p>
    </details>
    <details>
      <summary>Why this move?</summary>
      <p>${escapeHtml(selected.reason)}</p>
      <p><small>${escapeHtml(context.strategy.reason)}</small></p>
    </details>
    <details>
      <summary>Move priorities · ${context.recommendations.length}</summary>
      <div class="move-units">${top.map((item, index) => `<button type="button" class="move-unit${item.unitId === selected.unitId ? " is-selected" : ""}" data-move-unit="${escapeHtml(item.unitId)}">
        <strong>${index + 1}. ${escapeHtml(item.unitName)}</strong>
        <span>${escapeHtml(purposeLabel(item.purpose))}</span>
        <small>${escapeHtml(item.recommendation)}</small>
      </button>`).join("")}</div>
    </details>
    <details>
      <summary>Mission context</summary>
      <p>${escapeHtml(activeMissionText)}</p>
      <small>${escapeHtml(territoryVerifiedText)}</small>
      ${territoryReviewText ? `<br><small>${escapeHtml(territoryReviewText)}</small>` : ""}
      <br><small>Only verified mission text changes movement ranking. Review-only cards remain visible but are not silently scored.</small>
    </details>
    <small>Map distances are approximate; territory classification is also advisory. Positions within ±3\" of the dotted territory line remain uncertain. Destination options describe strategic purposes, not exact legal endpoints. The Advisor does not determine legal movement, terrain traversal, line of sight, Advance eligibility, or final objective control.</small>
  </aside>`;
}
