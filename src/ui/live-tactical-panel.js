import { getSecondaryMissionIntelligence } from "../rules/secondary-mission-intelligence.js";
import { selectUnitForSecondary } from "../rules/secondary-selection.js";
import { getLiveUnitVitals } from "../rules/live-unit-vitals.js";
import { unitDisplayLabels } from "./map-unit-labels.js";

const esc = v => String(v ?? "").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """);

export function renderLiveTacticalPanel(state, { playerId, selectedUnitId = null } = {}) {
  const labels = unitDisplayLabels(state.units ?? []);
  const unitCard = selectedUnitId
    ? renderSelectedUnit(state, selectedUnitId, labels)
    : renderUnitFallbackStrip(state, playerId, labels);
  const secondaries = renderSecondaryList(state, playerId);
  return '<aside class="live-tactical-panel" aria-label="Tactical overview">' + unitCard + '<section class="live-tactical-panel__secondaries" aria-label="Secondary missions"><h3>Secondary Missions</h3>' + secondaries + '</section></aside>';
}

function renderSelectedUnit(state, unitId, labels) {
  const unit = (state.units ?? []).find(u => u.id === unitId);
  if (!unit) return "";
  const vitals = getLiveUnitVitals(state, unit);
  const name = labels.get(unit.id) ?? unit.name ?? unit.id;
  const badges = [];
  if (unit.battleShocked) badges.push('<span class="badge is-shock">Battle-shock</span>');
  if (unit.fightsFirst) badges.push('<span class="badge is-ff">Fights First</span>');
  return '<section class="live-tactical-panel__unit"><h3>Selected Unit</h3><div class="live-tactical-panel__unit-card"><strong>' + esc(name) + '</strong><div class="live-tactical-panel__badges">' + (badges.join("") || '<span class="badge is-ready">Ready</span>') + '</div><small>W ' + (vitals.wounds ?? "—") + '/' + (vitals.startingWounds ?? "—") + '</small></div></section>';
}

function renderUnitFallbackStrip(state, playerId, labels) {
  const mine = (state.units ?? []).filter(u => u.ownerId === playerId && u.status === "deployed");
  if (!mine.length) return '<section class="live-tactical-panel__unit"><p>No units deployed.</p></section>';
  const icons = mine.map(u => {
    const name = labels.get(u.id) ?? u.name ?? u.id;
    const shock = u.battleShocked ? " is-shock" : "";
    return '<button type="button" class="live-tactical-panel__unit-icon' + shock + '" data-select-phase-unit="' + esc(u.id) + '" title="' + esc(name) + '">' + esc(name.slice(0, 3)) + '</button>';
  }).join("");
  return '<section class="live-tactical-panel__unit"><h3>My Units</h3><div class="live-tactical-panel__strip">' + icons + '</div></section>';
}

function renderSecondaryList(state, playerId) {
  const cards = getSecondaryMissionIntelligence(state, { playerId });
  if (!cards.length) return "<p>No active secondaries.</p>";
  return cards.map(card => {
    const status = cardStatus(card);
    const reason = shortReason(card);
    return '<button type="button" class="live-tactical-panel__secondary is-' + status + '" data-select-for-secondary="' + esc(card.definitionId) + '"><span>' + esc(card.name) + '</span><span class="live-tactical-panel__pill is-' + status + '">' + statusLabel(status) + '</span><small>' + esc(reason) + '</small></button>';
  }).join("");
}

function cardStatus(card) {
  if (card.scoredThisTurn) return "scored";
  if (!card.eligibleNow || card.choicePending) return "blocked";
  return "achievable";
}

function statusLabel(status) {
  return { scored: "Scored", blocked: "Blocked", achievable: "Achievable" }[status] ?? status;
}

function shortReason(card) {
  if (card.choicePending) return "Choice needed";
  if (!card.eligibleNow) return "Not eligible this turn";
  return card.advice?.split(";")[0] ?? "Review conditions";
}

export function bindLiveTacticalPanel(container, { onSelectUnit, onSelectSecondary } = {}) {
  container.querySelectorAll?.("[data-select-phase-unit]").forEach(btn => {
    btn.addEventListener("click", () => onSelectUnit?.(btn.getAttribute("data-select-phase-unit")));
  });
  container.querySelectorAll?.("[data-select-for-secondary]").forEach(btn => {
    btn.addEventListener("click", () => {
      const defId = btn.getAttribute("data-select-for-secondary");
      onSelectSecondary?.(defId);
    });
  });
}
