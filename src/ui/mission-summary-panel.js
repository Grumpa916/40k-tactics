import { getLayoutOptionsForForceDispositions } from "../rules/event-companion-map-catalog.js";
import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";

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
  let detailed = null;
  if (setup.myDisposition && setup.opponentDisposition) {
    try {
      resolved = getLayoutOptionsForForceDispositions(setup.myDisposition, setup.opponentDisposition);
      detailed = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
    } catch {
      resolved = null;
      detailed = null;
    }
  }
  const definitionFor = (playerId) => missionDefinitions.find((definition) =>
    definition?.category === "primary" &&
    (definition?.playerId === playerId || definition?.ownerId === playerId));
  const combine = (catalogDefinition, configuredDefinition) => catalogDefinition || configuredDefinition
    ? { ...(catalogDefinition ?? {}), ...(configuredDefinition ?? {}) }
    : null;
  const configuredMy = definitionFor(myPlayerId);
  const configuredOpponent = definitionFor(opponentPlayerId);
  return {
    myPlayerId,
    opponentPlayerId,
    myName: detailed?.myMission?.name ?? resolved?.myMission ?? configuredMy?.name ?? null,
    opponentName: detailed?.opponentMission?.name ?? resolved?.opponentMission ?? configuredOpponent?.name ?? null,
    myDefinition: combine(detailed?.myMission, configuredMy),
    opponentDefinition: combine(detailed?.opponentMission, configuredOpponent)
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
  const windows = Array.isArray(definition?.scoring) ? definition.scoring : [];
  const scoring = windows.map((window) =>
    '<li><strong>' + escapeHtml(window.when) + '</strong><ul>' +
    (window.items ?? []).map((item) => '<li><strong>' + escapeHtml(item.vp) + ' VP' + (item.bonus ? ' bonus' : '') + ':</strong> ' + escapeHtml(item.summary) + '</li>').join('') +
    '</ul></li>').join('');
  const setupText = definition?.setup ? '<p><strong>Setup:</strong> ' + escapeHtml(definition.setup) + '</p>' : '';
  const actionText = definition?.action ? '<p><strong>Shooting Action — ' + escapeHtml(definition.action.name) + ':</strong> ' + escapeHtml(definition.action.summary) + '</p>' : '';
  return '<details class="battle-mission-summary__player" data-mission-summary-key="' + escapeHtml(key) + '"' +
    openAttribute(openStates, key) + '><summary><span>' + escapeHtml(sideLabel) + '</span><strong>' +
    escapeHtml(name) + '</strong></summary><div class="battle-mission-summary__detail">' +
    (detail.length ? '<p>' + detail.map(escapeHtml).join(" · ") + '</p>' : '') +
    setupText + actionText +
    (scoring ? '<p><strong>Primary scoring reference</strong></p><ul>' + scoring + '</ul>' : '<p>Check the selected mission card for its exact scoring timing and conditions.</p>') +
    '<p>Primary scoring remains player-confirmed; this reference never awards VP automatically.</p>' +
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
    const mode = getSecondaryMissionMode(state, playerId) ?? definition.missionMode ?? null;
    const allWindows = Array.isArray(definition.scoringWindows) ? definition.scoringWindows : [];
    const windows = allWindows.filter((window) =>
      !mode || !Array.isArray(window.modes) || window.modes.length === 0 || window.modes.includes(mode));
    const timing = windows.length
      ? windows.map((window) => missionTimingLabel(window.timing) +
        (window.modes?.length ? " · " + window.modes.join("/") : "") +
        (Number.isInteger(window.minRound) ? " (from Round " + window.minRound + ")" : "")).join(" · ")
      : definition.timing ? missionTimingLabel(definition.timing) : "Scoring timing not configured";
    const description = definition.description ?? definition.summary ?? "";
    const whenDrawn = definition.whenDrawn
      ? '<p><strong>When drawn:</strong> ' + escapeHtml(definition.whenDrawn) + '</p>'
      : '';
    const missionAction = definition.missionAction;
    const actionTiming = missionAction?.phase === "shooting" ? "Shooting phase" : missionAction?.phase;
    const actionText = missionAction
      ? '<p><strong>' + escapeHtml(missionAction.name ?? "Mission Action") +
        (actionTiming ? " · " + escapeHtml(actionTiming) : "") +
        (missionAction.completion ? " · completes " + escapeHtml(missionAction.completion) : "") +
        ':</strong> ' + escapeHtml(missionAction.summary ?? "") + '</p>'
      : '';
    const referenceNotes = [
      ...(Array.isArray(definition.referenceNotes) ? definition.referenceNotes : []),
      ...(Array.isArray(definition.notes) ? definition.notes : [])
    ].filter((note) => note !== definition.whenDrawn);
    const missionText = referenceNotes.length
      ? '<p><strong>Rules notes</strong></p><ul>' + referenceNotes.map((note) => '<li>' + escapeHtml(note) + '</li>').join('') + '</ul>'
      : '';
    const scoring = windows.map((window) => '<li><strong>' + escapeHtml(missionTimingLabel(window.timing)) +
      (window.modes?.length ? " · " + escapeHtml(window.modes.join("/")) : "") +
      (Number.isInteger(window.minRound) ? " (from Round " + escapeHtml(window.minRound) + ")" : "") +
      '</strong><ul>' + (window.tiers ?? []).map((tier) =>
        '<li><strong>' + escapeHtml(tier.vp) + ' VP' +
        (Number.isInteger(tier.maxVP) ? ' (up to ' + escapeHtml(tier.maxVP) + ' VP)' : '') +
        (tier.relationship === "cumulative" ? ' · cumulative' : tier.relationship === "or" ? ' · OR' : '') +
        ':</strong> ' + escapeHtml(tier.summary) + '</li>').join('') + '</ul></li>').join("");
    return '<details class="battle-mission-summary__card" data-mission-summary-key="' + escapeHtml(cardKey) + '"' +
      openAttribute(openStates, cardKey) + '><summary>' + escapeHtml(definition.name ?? item.definitionId) +
      '<span class="battle-context__badge">' + escapeHtml(item.status) + '</span></summary>' +
      '<div class="battle-mission-summary__detail"><p>' + escapeHtml(timing) + '</p>' +
      (description ? '<p>' + escapeHtml(description) + '</p>' : '') +
      whenDrawn + actionText + missionText +
      (scoring ? '<p><strong>Scoring windows</strong></p><ul>' + scoring + '</ul>' : '') +
      '<p>Scoring remains player-confirmed; this reference does not award VP automatically.</p>' +
      '</div></details>';
  }).join("") : '<p class="battle-context__empty">No active secondary missions are recorded for this player.</p>';
  const mode = getSecondaryMissionMode(state, playerId);
  return '<details class="battle-mission-summary__player" data-mission-summary-key="' + escapeHtml(key) + '"' +
    openAttribute(openStates, key) + '><summary><span>' + escapeHtml(sideLabel) + '</span><strong>' +
    active.length + ' active card' + (active.length === 1 ? '' : 's') + '</strong>' +
    (mode ? '<span class="battle-context__badge">' + escapeHtml(mode) + '</span>' : '') + '</summary>' +
    '<div class="battle-mission-summary__detail">' + cards + '</div></details>';
}

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
  const activeNames = (playerId) => secondaryHistory.filter((item) =>
    item.playerId === playerId && item.status === SECONDARY_MISSION_STATUS.ACTIVE)
    .map((item) => item.definition?.name ?? item.definitionId);
  const mySecondaryNames = activeNames(primary.myPlayerId);
  const opponentSecondaryNames = activeNames(primary.opponentPlayerId);

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
    openAttribute(openStates, primaryKey) + '><summary><span>Primary Missions</span><span class="battle-context__count battle-mission-summary__active-names">You: ' +
    escapeHtml(primary.myName ?? '—') + ' · Opp: ' + escapeHtml(primary.opponentName ?? '—') + '</span></summary><div class="battle-mission-summary__section-content">' +
    (primaryContent || '<p class="battle-context__empty">Add players to review Primary Missions.</p>') + '</div></details>' +
    '<details class="battle-mission-summary__section" data-mission-summary-key="' + secondaryKey + '"' +
    openAttribute(openStates, secondaryKey) + '><summary><span>Secondary Missions</span>' +
    '<span class="battle-context__count battle-mission-summary__active-names">You: ' + escapeHtml(mySecondaryNames.join(', ') || '—') +
    ' · Opp: ' + escapeHtml(opponentSecondaryNames.join(', ') || '—') + '</span></summary><div class="battle-mission-summary__section-content">' +
    (secondaryContent || '<p class="battle-context__empty">Add players to review Secondary Missions.</p>') + '</div></details>' +
    '</section>';
}
