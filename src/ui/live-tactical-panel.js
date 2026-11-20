import { getSecondaryMissionIntelligence } from "../rules/secondary-mission-intelligence.js";
import { selectUnitForSecondary } from "../rules/secondary-selection.js";
import { getLiveUnitVitals } from "../rules/live-unit-vitals.js";
import { unitDisplayLabels } from "./map-unit-labels.js";

const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderLiveTacticalPanel(state, { playerId, selectedUnitId = null } = {}) {
  const labels = unitDisplayLabels(state.units ?? []);
  const unitCard = selectedUnitId
    ? renderSelectedUnit(state, selectedUnitId, labels)
    : renderUnitFallbackStrip(state, playerId, labels);
  const secondaries = renderSecondaryList(state, playerId);
  return '<aside class="live-tactical-panel">' + unitCard + '<section class="live-tactical-panel__secondaries"><h3>Secondary Missions</h3>' + secondaries + '</section></aside>';
}

function renderSelectedUnit(state, unitId, labels) {
  const unit = (state.units ?? []).find(u => u.id === unitId);
  if (!unit) return "";
  const vitals = getLiveUnitVitals(state, unit);
  const name = labels.get(unit.id) ?? unit.name ?? unit.id;
  const badges = [];
  if (unit.battleShocked) badges.push('<span class="badge is-shock">Battle-shock</span>');
  if (unit.fightsFirst) badges.push('<span class="badge is-ff">Fights First</span>');
  return '<section class="live-tactical-panel__unit"><h3>Selected Unit</h3><div><strong>' + esc(name) + '</strong>' + (badges.join("") || '<span class="badge is-ready">Ready</span>') + '</div></section>';
}

function renderUnitFallbackStrip(state, playerId, labels) {
  const mine = (state.units ?? []).filter(u => u.ownerId === playerId && u.status === "deployed");
  if (!mine.length) return '<section><p>No units deployed.</p></section>';
  const icons = mine.map(u => {
    const name = labels.get(u.id) ?? u.name ?? u.id;
    return '<button type="button" data-select-phase-unit="' + esc(u.id) + '">' + esc(name.slice(0, 3)) + '</button>';
  }).join("");
  return '<section><h3>My Units</h3><div>' + icons + '</div></section>';
}

function renderSecondaryList(state, playerId) {
  const cards = getSecondaryMissionIntelligence(state, { playerId });
  if (!cards.length) return "<p>No active secondaries.</p>";
  return cards.map(card => {
    const status = cardStatus(card);
    return '<button type="button" class="is-' + status + '" data-select-for-secondary="' + esc(card.definitionId) + '">' + esc(card.name) + ' <span>' + status + '</span></button>';
  }).join("");
}

function cardStatus(card) {
  if (card.scoredThisTurn) return "scored";
  if (!card.eligibleNow || card.choicePending) return "blocked";
  return "achievable";
}

export function bindLiveTacticalPanel(container, { onSelectUnit, onSelectSecondary } = {}) {
  container.querySelectorAll?.("[data-select-phase-unit]").forEach(btn => {
    btn.addEventListener("click", () => onSelectUnit?.(btn.getAttribute("data-select-phase-unit")));
  });
  container.querySelectorAll?.("[data-select-for-secondary]").forEach(btn => {
    btn.addEventListener("click", () => onSelectSecondary?.(btn.getAttribute("data-select-for-secondary")));
  });
}
