import { COMMAND_TYPES } from "../commands/game-commands.js";
import { SCORING_TIMINGS } from "../rules/mission-definition.js";
import { getSecondaryMissionHistory, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";
import { getPreGameAbilityRules, getPreGameProcedureSteps } from "../rules/pre-game-procedure.js";
import { evaluatePreGameReadiness } from "../rules/pre-game-readiness.js";
import { renderBattlefieldMap } from "./battlefield-map.js";
import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { getLayoutOptionsForForceDispositions } from "../rules/event-companion-map-catalog.js";

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
  let selectedPlanUnitId = null;
  let message = "";

  function handleChange(event) {
    const target = event.target;
    if (target?.matches?.("[data-event-companion-disposition]")) {
      const state = session.getState();
      const current = state.battlefieldMap?.missionSetup ?? {};
      const kind = target.getAttribute("data-event-companion-disposition");
      const myDisposition = kind === "my" ? (target.value || null) : (current.myDisposition ?? null);
      const opponentDisposition = kind === "opponent" ? (target.value || null) : (current.opponentDisposition ?? null);
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP, payload: {
          myDisposition, opponentDisposition, layout: "A"
        }});
        message = myDisposition && opponentDisposition
          ? "Primary Missions resolved. Choose battlefield layout A, B, or C."
          : "Select the other army’s Force Disposition to resolve both Primary Missions.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
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
    const layoutButton = event.target?.closest?.("[data-event-companion-layout]");
    if (layoutButton) {
      const layout = layoutButton.getAttribute("data-event-companion-layout");
      const setup = session.getState().battlefieldMap?.missionSetup;
      if (!setup?.myDisposition || !setup?.opponentDisposition) {
        message = "Choose both Force Dispositions before selecting a layout.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP, payload: {
          myDisposition: setup.myDisposition, opponentDisposition: setup.opponentDisposition, layout
        }});
        message = "Layout " + layout + " selected. Geometry will be connected to the map in the next step.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    const mapUnit = event.target?.closest?.("[data-map-unit-id]");
    if (mapUnit && mapUnit.closest?.('[data-map-mode="planning"]')) {
      selectedPlanUnitId = mapUnit.getAttribute?.("data-map-unit-id") ?? mapUnit.dataset?.mapUnitId ?? null;
      message = selectedPlanUnitId ? "Selected planned unit. Tap an empty point on the map to reposition it." : "";
      render();
      return;
    }
    const mapBoard = event.target?.closest?.("[data-battlefield-map-board]");
    if (mapBoard && mapBoard.closest?.('[data-map-mode="planning"]')) {
      const state = session.getState();
      const playerId = perspectivePlayerId ?? state.activePlayer ?? state.players?.[0]?.id ?? null;
      if (!selectedPlanUnitId) {
        message = "Select one of your units before placing it on the planning map.";
        render();
        return;
      }
      const rect = mapBoard.getBoundingClientRect?.();
      if (!rect || !rect.width || !rect.height || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
        message = "Map position could not be measured. Use the coordinate fallback when available.";
        render();
        return;
      }
      const x = Math.round(Math.max(0, Math.min(60, (event.clientX - rect.left) / rect.width * 60)) * 10) / 10;
      const y = Math.round(Math.max(0, Math.min(44, (1 - (event.clientY - rect.top) / rect.height) * 44)) * 10) / 10;
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_DEPLOYMENT_PLAN_POSITION, payload: {
          unitId: selectedPlanUnitId, playerId, position: { x, y }
        }});
        message = "Planned position recorded. Select another unit or move this marker.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    const clearPlan = event.target?.closest?.("[data-clear-deployment-plan]");
    if (clearPlan) {
      const state = session.getState();
      const playerId = perspectivePlayerId ?? state.activePlayer ?? state.players?.[0]?.id ?? null;
      try {
        session.dispatch({ type: COMMAND_TYPES.CLEAR_DEPLOYMENT_PLAN, payload: { playerId } });
        selectedPlanUnitId = null;
        message = "Your deployment plan was cleared.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    const selectPlan = event.target?.closest?.("[data-planning-unit-select]");
    if (selectPlan) {
      selectedPlanUnitId = selectPlan.value || null;
      message = selectedPlanUnitId ? "Unit selected. Tap the map to set its planned position." : "";
      render();
      return;
    }
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
    const readiness = evaluatePreGameReadiness(state);
    const procedureSteps = getPreGameProcedureSteps();
    const abilityRules = getPreGameAbilityRules();
    const preGameMarkup = `<section class="pre-game-checklist"><h2>Pre-game checklist</h2>
      <p>These prompts are fixed by the ruleset, not configured separately for each battle. Follow the selected mission's instructions for exact timing and exceptions.</p>
      <h3>State readiness</h3><ul>${readiness.checks.map((check) =>
        `<li><strong>${check.status === "complete" ? "Ready: " : "Check: "}${escapeHtml(check.label)}</strong> — ${escapeHtml(check.detail)}</li>`).join("")}</ul>
      <h3>Standard procedure reminders</h3><ol>${procedureSteps.map((step) =>
        `<li><strong>${escapeHtml(step.title)}</strong> — ${escapeHtml(step.detail)}</li>`).join("")}</ol>
      <h3>Conditional ability prompts</h3>${abilityRules.map((rule) =>
        `<article data-pre-game-ability="${escapeHtml(rule.id)}"><h4>${escapeHtml(rule.name)}</h4>
        <p><strong>Timing:</strong> ${escapeHtml(rule.timing === "deployment" ? "During deployment" : "Resolve pre-battle abilities")}</p>
        <p><strong>Applies when:</strong> ${escapeHtml(rule.appliesWhen)}</p>
        ${rule.procedure ? `<p>${escapeHtml(rule.procedure)}</p>` : ""}
        ${rule.choices ? `<ul>${rule.choices.map((choice) => `<li>${escapeHtml(choice)}</li>`).join("")}</ul>` : ""}
        ${rule.scoutMove ? `<p><strong>Scout move:</strong> ${escapeHtml(rule.scoutMove.maximumDistance)} ${escapeHtml(rule.scoutMove.afterMoving)}</p>` : ""}
        <p>Check the physical unit ability and mission instructions; the map does not validate legality.</p></article>`).join("")}
      </section>`;

    const missionSetup = state.battlefieldMap?.missionSetup ?? {};
    const layoutOptions = missionSetup.myDisposition && missionSetup.opponentDisposition
      ? getLayoutOptionsForForceDispositions(missionSetup.myDisposition, missionSetup.opponentDisposition)
      : null;
    const missionSetupMarkup = '<section class="event-companion-mission-setup"><h2>Primary Missions &amp; Battlefield</h2>' +
      '<p>Choose each army’s Force Disposition. The app resolves both Primary Missions using the verified Event Companion matrix.</p>' +
      '<div class="command-vp-form"><label>Your army Force Disposition<select data-event-companion-disposition="my" ' +
      (state.battle && state.battle.status !== "setup" ? "disabled" : "") + '>' +
      '<option value="">Choose disposition...</option>' + EVENT_COMPANION_MAP_CATALOG.forceDispositions.map((item) =>
        '<option value="' + escapeHtml(item) + '"' + (item === missionSetup.myDisposition ? ' selected' : '') + '>' + escapeHtml(item) + '</option>').join("") +
      '</select></label><label>Opponent Force Disposition<select data-event-companion-disposition="opponent" ' +
      (state.battle && state.battle.status !== "setup" ? "disabled" : "") + '>' +
      '<option value="">Choose disposition...</option>' + EVENT_COMPANION_MAP_CATALOG.forceDispositions.map((item) =>
        '<option value="' + escapeHtml(item) + '"' + (item === missionSetup.opponentDisposition ? ' selected' : '') + '>' + escapeHtml(item) + '</option>').join("") +
      '</select></label></div>' +
      (layoutOptions ? '<div class="event-companion-missions"><p><strong>Your Primary Mission:</strong> ' + escapeHtml(layoutOptions.myMission) +
        '</p><p><strong>Opponent Primary Mission:</strong> ' + escapeHtml(layoutOptions.opponentMission) + '</p>' +
        '<h3>Choose battlefield layout</h3><div role="group" aria-label="Battlefield layout choices">' +
        layoutOptions.layouts.map((item) => '<button type="button" data-event-companion-layout="' + item.layout + '" aria-pressed="' +
          (item.layout === missionSetup.layout ? 'true' : 'false') + '"' +
          (state.battle && state.battle.status !== "setup" ? " disabled" : "") + '>Layout ' + item.layout +
          ' · p. ' + item.page + (item.layout === missionSetup.layout ? ' — Selected' : '') + '</button>').join("") +
        '</div><p>Source pages refer to the official Event Companion. Terrain geometry will be drawn on the map in the next implementation step.</p></div>' :
        '<p>Choose both dispositions to reveal the two Primary Missions and three available layouts.</p>') +
      '</section>';
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
      preGameMarkup +
      missionSetupMarkup +
      '<section class="battlefield-map-section"><h2>Deployment Planning Map</h2>' +
      '<label>Unit to plan<select data-planning-unit-select><option value="">Select your unit…</option>' +
      (state.units ?? []).filter((unit) => unit?.ownerId === (perspectivePlayerId ?? state.activePlayer ?? players[0]?.id) && unit.status !== "destroyed")
        .map((unit) => '<option value="' + escapeHtml(unit.id) + '"' + (unit.id === selectedPlanUnitId ? ' selected' : '') + '>' + escapeHtml(unit.name ?? unit.id) + '</option>').join("") +
      '</select></label><p>Select a unit, then tap the map to record or reposition its intended starting point. Planned positions remain separate from actual deployment and live movement.</p>' +
      renderBattlefieldMap(state, { mode: "planning", perspectivePlayerId: perspectivePlayerId ?? state.activePlayer ?? players[0]?.id }) +
      '<button type="button" data-clear-deployment-plan>Clear my planned positions</button>' +
      '<p>No starting positions, objective locations, or terrain are assumed when they have not been recorded.</p></section>' +
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
