import { getSmokeAndMirrorsMarkerRemovalOptions } from "../rules/smoke-and-mirrors-removal.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function renderSmokeAndMirrorsRemovalControls(state, {
  playerId,
  unitId,
  perspectivePlayerId = playerId,
  movementCompleted = false
} = {}) {
  if (!playerId || !unitId || movementCompleted !== true) return "";
  const options = getSmokeAndMirrorsMarkerRemovalOptions(state, { playerId, perspectivePlayerId });
  if (!options.length) return "";

  return `<section class="move-marker-removal" data-smoke-decoy-removal>
    <strong>Surveil the Foe · remove operation marker</strong>
    <small>Only confirm after this unit ends a move within range of the marked objective on the physical tabletop. Map distance is advisory.</small>
    <div class="move-actions">${options.map((option) =>
      `<button type="button" data-remove-smoke-decoy="${escapeHtml(option.objectiveId)}" data-marker-owner-player-id="${escapeHtml(option.markerOwnerPlayerId)}">Confirm &amp; remove · ${escapeHtml(option.objectiveName)}</button>`
    ).join("")}</div>
  </section>`;
}