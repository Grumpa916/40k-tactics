import { getSecondaryMissionIntelligence } from "../rules/secondary-mission-intelligence.js";

const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderLiveTacticalPanel(state, { playerId } = {}) {
  const secondaries = renderSecondaryList(state, playerId);
  return '<aside class="live-tactical-panel"><section class="live-tactical-panel__secondaries"><h3>Secondary Missions</h3>' + secondaries + '</section></aside>';
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

export function bindLiveTacticalPanel(container, { onSelectSecondary } = {}) {
  container.querySelectorAll?.("[data-select-for-secondary]").forEach(btn => {
    btn.addEventListener("click", () => onSelectSecondary?.(btn.getAttribute("data-select-for-secondary")));
  });
}
