import { getLayoutOptionsForForceDispositions } from "../rules/event-companion-map-catalog.js";
import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function openAttribute(openStates, key, defaultOpen = false) {
  return (openStates?.[key] ?? defaultOpen) ? " open" : "";
}

function missionTimingLabel(timing) {
  return ({
    "command-phase": "End of Command phase",
    "end-of-turn": "End of turn",
    "end-of-opponent-turn": "End of opponent's turn",
    "end-of-battle": "End of battle"
  })[timing] ?? "Timing not configured";
}

function getPrimaryMissionNames(state, players, perspectivePlayerId, missionDefinitions) {
  const myPlayerId = perspectivePlayerId ?? players[0]?.id ?? null;
  const opponentPlayerId = players.find((player) => player.id !== myPlayerId)?.id ?? null;
  const setup = state.battlefieldMap?.missionSetup ?? {};
  let resolved = null;
  if (setup.myDisposition && setup.opponentDisposition) {
    try {
      resolved = getLayoutOptionsForForceDispositions(setup.myDisposition, setup.opponentDisposition);
    } catch {
      resolved = null;
    }
  }
  const definitionFor = (playerId) => missionDefinitions.find((definition) =>
    definition?.category === "primary" &&
    (definition?.playerId === playerId || definition?.ownerId === playerId));
  return {
    myPlayerId,
    opponentPlayerId,
    myName: resolved?.myMission ?? definitionFor(myPlayerId)?.name ?? null,
    opponentName: resolved?.opponentMission ?? definitionFor(opponentPlayerId)?.name ?? null,
    myDefinition: definitionFor(myPlayerId) ?? null,
    opponentDefinition: definitionFor(opponentPlayerId) ?? null
  };
}

function renderPrimaryPlayer(state, player, playerId, missionName, definition, sideLabel, openStates, setup) {
  if (!player) return "";
  const key = "mission-primary-player-" + player.id;
  const name = missionName ?? "Primary Mission not selected";
  const detail = [
    definition?.timing ? "Scoring: " + missionTimingLabel(definition.timing) : "",
    Number.isFinite(definition?.victoryPoints) ? "Configured award: " + definition.victoryPoints + " VP" : "",
    sideLabel === "You" && setup.myDisposition ? "Disposition: " + setup.myDisposition : "",
    sideLabel === "Opponent" && setup.opponentDisposition ? "Disposition: " + setup.opponentDisposition : "",
    setup.layout ? "Battlefield layout " + setup.layout : ""
  ].filter(Boolean);
  return '<details class="battle-mission-summary__player" data-mission-summary-key="' + escapeHtml(key) + '"' +
    openAttribute(openStates, key) + '><summary><span>' + escapeHtml(sideLabel) + '</span><strong>' +
    escapeHtml(name) + '</strong></summary><div class="battle-mission-summary__detail">' +
    (detail.length ? '<p>' + detail.map(escapeHtml).join(" · ") + '</p>' : '<p>Check the selected mission card for its exact scoring timing and conditions.</p>') +
    '<p>Scoring must be checked against the mission rules and battlefield state; this summary does not award VP.</p>' +
    '</div></details>';
}

function renderSecondaryPlayer(state, player, playerId, sideLabel, openStates) {
  if (!player) return "";
  const history = getSecondaryMissionHistory(state, playerId);
  const active = history.filter((item) => item.status === SECONDARY_MISSION_STATUS.ACTIVE);
  const key = "mission-secondary-player-" + player.id;
  const cards = active.length ? active.map((item) => {
    const definition = item.definition ?? {};
    const cardKey = "mission-secondary-card-" + item.instanceId;
    const windows = Array.isArray(definition.scoringWindows) ? definition.scoringWindows : [];
    const timing = windows.length
      ? windows.map((window) => missionTimingLabel(window.timing) +
        (Number.isInteger(window.minRound) ? " (from Round " + window.minRound + ")" : "")).join(" · ")
      : definition.timing ? missionTimingLabel(definition.timing) : "Scoring timing not configured";
    const description = definition.description ?? definition.summary ?? "";
    const rulesNote = definition.rulesVerified === true
      ? "Reference marked reviewed; confirm the physical card and actual battlefield conditions."
      : "Rules text or scoring criteria are not fully verified in the app. Check the printed card.";
    const scoring = windows.flatMap((window) => (window.tiers ?? []).map((tier) =>
      '<li><strong>' + escapeHtml(tier.vp) + ' VP:</strong> ' + escapeHtml(tier.summary) + '</li>')).join("");
    return '<details class="battle-mission-summary__card" data-mission-summary-key="' + escapeHtml(cardKey) + '"' +
      openAttribute(openStates, cardKey) + '><summary>' + escapeHtml(definition.name ?? item.definitionId) +
      '<span class="battle-context__badge">' + escapeHtml(item.status) + '</span></summary>' +
      '<div class="battle-mission-summary__detail"><p>' + escapeHtml(timing) + '</p>' +
      (description ? '<p>' + escapeHtml(description) + '</p>' : '') +
      (scoring ? '<ul>' + scoring + '</ul>' : '') +
      '<p>' + escapeHtml(rulesNote) + '</p></div></details>';
  }).join("") : '<p class="battle-context__empty">No active secondary missions are recorded for this player.</p>';
  const mode = state.scoring?.secondaryMissionMode;
  return '<details class="battle-mission-summary__player" data-mission-summary-key="' + escapeHtml(key) + '"' +
    openAttribute(openStates, key) + '><summary><span>' + escapeHtml(sideLabel) + '</span><strong>' +
    active.length + ' active card' + (active.length === 1 ? '' : 's') + '</strong>' +
    (mode ? '<span class="battle-context__badge">' + escapeHtml(mode) + '</span>' : '') + '</summary>' +
    '<div class="battle-mission-summary__detail">' + cards + '</div></details>';
}

/**
 * Compact, persistent mission context for the active battle workspace.
 * Both mission categories and each player's details can collapse independently.
 */
export function renderPersistentMissionSummary(state = {}, {
  perspectivePlayerId = null,
  missionDefinitions = [],
  openStates = {}
} = {}) {
  const players = Array.isArray(state.players) ? state.players : [];
  const yourPlayerId = perspectivePlayerId ?? players[0]?.id ?? null;
  const yourPlayer = players.find((player) => player.id === yourPlayerId) ?? null;
  const opponent = players.find((player) => player.id !== yourPlayerId) ?? null;
  const setup = state.battlefieldMap?.missionSetup ?? {};
  const primary = getPrimaryMissionNames(state, players, perspectivePlayerId, missionDefinitions);
  const knownPrimaryCount = Number(Boolean(primary.myName)) + Number(Boolean(primary.opponentName));
  const secondaryHistory = getSecondaryMissionHistory(state);
  const activeCount = (playerId) => secondaryHistory.filter((item) =>
    item.playerId === playerId && item.status === SECONDARY_MISSION_STATUS.ACTIVE).length;
  const mySecondaryCount = activeCount(primary.myPlayerId);
  const opponentSecondaryCount = activeCount(primary.opponentPlayerId);

  const primaryContent = renderPrimaryPlayer(state, yourPlayer, primary.myPlayerId, primary.myName,
    primary.myDefinition, "You", openStates, setup) +
    renderPrimaryPlayer(state, opponent, primary.opponentPlayerId, primary.opponentName,
      primary.opponentDefinition, "Opponent", openStates, setup);
  const secondaryContent = renderSecondaryPlayer(state, yourPlayer, primary.myPlayerId, "You", openStates) +
    renderSecondaryPlayer(state, opponent, primary.opponentPlayerId, "Opponent", openStates);
  const primaryKey = "mission-section-primary";
  const secondaryKey = "mission-section-secondary";
  return '<section class="battle-mission-summary" aria-label="Persistent mission summary">' +
    '<details class="battle-mission-summary__section" data-mission-summary-key="' + primaryKey + '"' +
    openAttribute(openStates, primaryKey) + '><summary><span>Primary Missions</span><span class="battle-context__count">' +
    knownPrimaryCount + ' assigned</span></summary><div class="battle-mission-summary__section-content">' +
    (primaryContent || '<p class="battle-context__empty">Add players to review Primary Missions.</p>') + '</div></details>' +
    '<details class="battle-mission-summary__section" data-mission-summary-key="' + secondaryKey + '"' +
    openAttribute(openStates, secondaryKey) + '><summary><span>Secondary Missions</span>' +
    '<span class="battle-context__count">You ' + mySecondaryCount + ' · Opponent ' + opponentSecondaryCount +
    '</span></summary><div class="battle-mission-summary__section-content">' +
    (secondaryContent || '<p class="battle-context__empty">Add players to review Secondary Missions.</p>') + '</div></details>' +
    '</section>';
}
