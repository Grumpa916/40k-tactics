import { getCombatFormationRoot } from "../rules/battle-unit-reference.js";
import { getMovementStrategicRecommendations } from "../rules/tactical-movement-opportunities.js";

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
  if (option?.objectiveId) return `Objective · ${option.objectiveId}`;
  if (option?.targetName) return `Enemy · ${option.targetName}`;
  return "Flexible board position";
}

function strategicFitLabel(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function renderMovementOption(option, index) {
  const recommended = index === 0;
  return `<article class="move-unit movement-advisor__option${recommended ? " is-selected" : ""}" data-movement-option-rank="${index + 1}">
    <strong>${index + 1}. ${escapeHtml(destinationLabel(option))}${recommended ? " · Recommended" : ""}</strong>
    <span>${escapeHtml(purposeLabel(option.purpose))} · ${escapeHtml(strategicFitLabel(option.score))} relative fit</span>
    <small>${escapeHtml(option.actionHint ?? "Reposition for this strategic purpose")}</small>
    ${option.reason ? `<small>${escapeHtml(option.reason)}</small>` : ""}
  </article>`;
}

export function renderMovementAdvisor(state, { playerId, selectedUnitId = null } = {}) {
  if (!playerId || state?.phase !== "movement") return "";

  let context;
  try {
    context = getMovementStrategicRecommendations(state, { playerId });
  } catch {
    return `<aside class="movement-advisor"><h2>Movement Advisor</h2><p>Strategic movement context is unavailable for the current battle state.</p></aside>`;
  }

  const selectedUnit = (state.units ?? []).find((unit) => unit.id === selectedUnitId) ?? null;
  const selectedRootId = getCombatFormationRoot(state, selectedUnit)?.id ?? selectedUnitId;
  const selected = context.recommendations.find((item) => item.unitId === selectedRootId) ?? context.recommendations[0] ?? null;
  if (!selected) {
    return `<aside class="movement-advisor"><h2>Movement Advisor</h2><p>No deployed formation has a strategic movement recommendation.</p></aside>`;
  }

  const activeMissionText = context.activeSecondaries.length
    ? context.activeSecondaries.map((mission) => `${mission.name}${mission.verified ? "" : " (review only)"}`).join(" · ")
    : "No active secondary cards recorded";
  const top = context.recommendations.slice(0, 3);
  const selectedOptions = [selected, ...(selected.alternatives ?? [])].slice(0, 3);

  return `<aside class="movement-advisor" data-movement-advisor>
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
      <div class="move-units movement-advisor__options">${selectedOptions.map(renderMovementOption).join("")}</div>
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
      <small>Only verified mission text changes movement ranking. Review-only cards remain visible but are not silently scored.</small>
    </details>
    <small>Map distances are approximate. Destination options describe strategic purposes, not exact legal endpoints. The Advisor does not determine legal movement, terrain traversal, line of sight, Advance eligibility, or final objective control.</small>
  </aside>`;
}
