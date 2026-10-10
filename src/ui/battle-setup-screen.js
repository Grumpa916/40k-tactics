import { COMMAND_TYPES } from "../commands/game-commands.js";
import { SCORING_TIMINGS } from "../rules/mission-definition.js";
import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";
import { renderBattlefieldMap } from "./battlefield-map.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

const MANUAL_TIMINGS = Object.freeze([
  [SCORING_TIMINGS.COMMAND_PHASE, "End of Command phase"],
  [SCORING_TIMINGS.END_OF_TURN, "End of turn"],
  [SCORING_TIMINGS.END_OF_OPPONENT_TURN, "End of opponent's turn"],
  [SCORING_TIMINGS.END_OF_BATTLE, "End of battle"]
]);

export function createBattleSetupScreen(container, {
  session,
  perspectivePlayerId = null,
  missionDefinitions = [],
  secondaryMissionCatalog = []
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") {
    throw new TypeError("A game session is required.");
  }

  let selectedPlayerId = null;
  let message = "";

  function handleChange(event) {
    const target = event.target;
    if (target?.matches?.("[data-setup-secondary-mode]")) {
      if (!target.value) return;
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_SECONDARY_MISSION_MODE, payload: { mode: target.value } });
        message = "Battle-wide secondary mode set to " + target.value + ".";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    if (target?.matches?.("[data-setup-secondary-player]")) {
      selectedPlayerId = target.value;
      message = "";
      render();
    }
  }

  function handleClick(event) {
    const target = event.target?.closest?.("[data-setup-fixed-add]");
    if (!target || !container.contains(target)) return;
    const state = session.getState();
    if (state.battle) {
      message = "Fixed secondary cards must be selected before the battle starts.";
      render();
      return;
    }
    if (state.scoring?.secondaryMissionMode !== "fixed") {
      message = "Choose Fixed mode before selecting Fixed secondary cards.";
      render();
      return;
    }
    const playerId = container.querySelector("[data-setup-secondary-player]")?.value || selectedPlayerId;
    const definitionId = container.querySelector("[data-setup-secondary-definition]")?.value;
    const manualName = String(container.querySelector("[data-setup-secondary-name]")?.value ?? "").trim();
    const manualTiming = container.querySelector("[data-setup-secondary-timing]")?.value;
    const definitions = [
      ...missionDefinitions.filter((item) => item?.category === "secondary"),
      ...secondaryMissionCatalog.filter((item) => item?.category === "secondary" &&
        !missionDefinitions.some((configured) => configured?.id === item.id))
    ];
    const configured = definitions.find((item) => item.id === definitionId);
    const catalog = secondaryMissionCatalog.find((item) => item.id === definitionId && item.category === "secondary");
    const allowedTimings = MANUAL_TIMINGS.map(([timing]) => timing);
    let definition;

    if (configured) {
      if (configured.fixedAvailable === false ||
          (Array.isArray(configured.availableModes) && !configured.availableModes.includes("fixed"))) {
        message = "That secondary card is not available in Fixed mode.";
        render();
        return;
      }
      if ((!Array.isArray(configured.scoringWindows) || configured.scoringWindows.length === 0) &&
          !allowedTimings.includes(manualTiming)) {
        message = "Choose the scoring checkpoint from the physical card before recording it.";
        render();
        return;
      }
      definition = {
        ...configured,
        timing: configured.scoringWindows?.[0]?.timing ?? manualTiming,
        conditions: [],
        manualEntry: true
      };
    } else if (manualName) {
      const normalizedName = manualName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const matchingCatalog = secondaryMissionCatalog.find((item) =>
        item.category === "secondary" &&
        item.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalizedName);
      if (!matchingCatalog?.fixedAvailable) {
        message = "Fixed mode only permits cards marked as Fixed-available in the catalog.";
        render();
        return;
      }
      if ((!Array.isArray(matchingCatalog.scoringWindows) || matchingCatalog.scoringWindows.length === 0) &&
          !allowedTimings.includes(manualTiming)) {
        message = "Choose the scoring checkpoint from the physical card before recording it.";
        render();
        return;
      }
      definition = {
        ...matchingCatalog,
        timing: matchingCatalog.scoringWindows?.[0]?.timing ?? manualTiming,
        conditions: [],
        manualEntry: true
      };
    } else {
      message = "Select a Fixed card from the catalog or enter its printed name.";
      render();
      return;
    }

    if (!playerId) {
      message = "Select the player whose two Fixed cards are being recorded.";
      render();
      return;
    }
    try {
      session.dispatch({ type: COMMAND_TYPES.DRAW_SECONDARY_MISSION, payload: {
        definition, playerId, round: 0, turn: 0
      }});
      selectedPlayerId = playerId;
      message = "Fixed card recorded for " + playerId + ". Select the player's second card, or choose the other player.";
    } catch (error) {
      message = error?.message ?? String(error);
    }
    render();
  }

  function render() {
    const state = session.getState();
    const players = Array.isArray(state.players) ? state.players : [];
    if (!selectedPlayerId || !players.some((player) => player.id === selectedPlayerId)) {
      selectedPlayerId = perspectivePlayerId ?? state.activePlayer ?? players[0]?.id ?? null;
    }
    const mode = state.scoring?.secondaryMissionMode ?? "";
    const history = getSecondaryMissionHistory(state);
    const fixedHistory = history.filter((item) =>
      item.definition?.missionMode === "fixed" && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
    const playerOptions = players.map((player) =>
      '<option value="' + escapeHtml(player.id) + '"' +
      (player.id === selectedPlayerId ? ' selected' : '') + '>' +
      escapeHtml(player.name ?? player.id) + '</option>'
    ).join("");
    const definitions = [
      ...missionDefinitions.filter((item) => item?.category === "secondary"),
      ...secondaryMissionCatalog.filter((item) => item?.category === "secondary" &&
        !missionDefinitions.some((configured) => configured?.id === item.id))
    ];
    const activeForPlayer = new Set(fixedHistory.filter((item) => item.playerId === selectedPlayerId)
      .map((item) => item.definitionId));
    const fixedCount = fixedHistory.filter((item) => item.playerId === selectedPlayerId).length;
    const fixedOptions = '<option value="">Select a Fixed card...</option>' + definitions
      .filter((item) => item.fixedAvailable === true ||
        (Array.isArray(item.availableModes) && item.availableModes.includes("fixed")))
      .filter((item) => !activeForPlayer.has(item.id))
      .map((item) => '<option value="' + escapeHtml(item.id) + '">' +
        escapeHtml(item.name ?? item.id) + '</option>').join("");
    const timingOptions = '<option value="">Choose checkpoint from card...</option>' +
      MANUAL_TIMINGS.map(([value, label]) =>
        '<option value="' + value + '">' + label + '</option>').join("");
    const fixedCardsMarkup = players.length
      ? players.map((player) => {
          const cards = fixedHistory.filter((item) => item.playerId === player.id);
          return '<li><strong>' + escapeHtml(player.name ?? player.id) + '</strong>: ' +
            (cards.length ? cards.map((item) => escapeHtml(item.definition?.name ?? item.definitionId)).join(", ") : "No Fixed cards selected") +
            ' (' + cards.length + '/2)</li>';
        }).join("")
      : '<li>Configure players before selecting Fixed cards.</li>';

    const modeGuidance = mode === "fixed"
      ? '<p>Fixed mode requires two Fixed-available cards per player. They remain active throughout the battle and can score multiple times; each card is capped at 20 VP.</p>'
      : mode === "tactical"
        ? '<p>Tactical cards are drawn manually from the physical deck at the start of each Command phase. Record two new cards for the active player; score or discard them only when the table rules permit.</p>'
        : '<p>Select Fixed or Tactical before the battle. The mode is global for both players.</p>';

    container.innerHTML = '<main class="battle-setup-screen"><header><div class="command-kicker">BATTLE SETUP</div>' +
      '<h1>Mission setup</h1><p>Choose the secondary mission mode before starting the battle.</p></header>' +
      '<section class="battlefield-map-section"><h2>Deployment Planning Map</h2>' +
      renderBattlefieldMap(state, { mode: "planning", perspectivePlayerId: perspectivePlayerId ?? state.activePlayer }) +
      '<p>Planned positions are stored separately from actual deployment and live movement. No starting positions, objective locations, or terrain are assumed when they have not been recorded.</p></section>' +
      '<section><h2>Secondary mission mode</h2><label>Mode<select data-setup-secondary-mode ' +
      (history.length ? 'disabled' : '') + ' required>' +
      '<option value="">Choose Fixed or Tactical...</option>' +
      '<option value="fixed"' + (mode === "fixed" ? ' selected' : '') + '>Fixed</option>' +
      '<option value="tactical"' + (mode === "tactical" ? ' selected' : '') + '>Tactical</option>' +
      '</select></label>' + modeGuidance + '</section>' +
      (mode === "fixed" && !state.battle
        ? '<section><h2>Select Fixed secondary cards</h2>' +
          '<label>Player<select data-setup-secondary-player>' + playerOptions + '</select></label>' +
          '<p>Selected for this player: ' + fixedCount + ' of 2.</p>' +
          (fixedCount < 2 && players.length
            ? '<div class="command-vp-form"><label>Fixed card<select data-setup-secondary-definition>' + fixedOptions + '</select></label>' +
              '<label>Checkpoint if not verified<select data-setup-secondary-timing>' + timingOptions + '</select></label>' +
              '<label>Or type the printed card name<input data-setup-secondary-name maxlength="160" placeholder="Fixed card name"></label>' +
              '<button type="button" data-setup-fixed-add>Record Fixed card</button></div>'
            : '<p>Two Fixed cards have been recorded for this player.</p>') +
          '<h3>Fixed cards selected</h3><ol>' + fixedCardsMarkup + '</ol></section>'
        : mode === "fixed" && state.battle
          ? '<section><p>Fixed cards must be selected before battle start. Existing Fixed cards remain active.</p><ol>' + fixedCardsMarkup + '</ol></section>'
          : '') +
      (message ? '<p role="status">' + escapeHtml(message) + '</p>' : '') +
      '<p>Card rules remain manual-review-only unless their scoring windows are verified from official card text. This screen records the physical cards; it does not award VP.</p></main>';
  }

  container.addEventListener?.("change", handleChange);
  container.addEventListener?.("click", handleClick);
  const unsubscribe = session.subscribe(render);
  render();
  return {
    render,
    destroy() {
      unsubscribe();
      container.removeEventListener?.("change", handleChange);
      container.removeEventListener?.("click", handleClick);
      container.replaceChildren();
    }
  };
}
