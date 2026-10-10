import { COMMAND_TYPES } from "../commands/game-commands.js";
import { renderBattlefieldMap } from "./battlefield-map.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function createDeploymentScreen(container, {
  session,
  perspectivePlayerId = null
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" ||
      typeof session.subscribe !== "function" || typeof session.dispatch !== "function") {
    throw new TypeError("A dispatchable game session is required.");
  }

  let selectedPlayerId = null;
  let selectedUnitId = null;
  let message = "";

  function playerFor(state) {
    return selectedPlayerId ?? perspectivePlayerId ?? state.activePlayer ?? state.players?.[0]?.id ?? null;
  }

  function render() {
    const state = session.getState();
    const players = Array.isArray(state.players) ? state.players : [];
    const playerId = playerFor(state);
    const eligible = (state.units ?? []).filter((unit) =>
      unit?.ownerId === playerId && unit.status !== "destroyed");
    if (!eligible.some((unit) => unit.id === selectedUnitId)) {
      selectedUnitId = eligible.find((unit) => !state.battlefieldMap?.actualDeployment?.[unit.id] &&
        !state.battlefieldMap?.declaredReserves?.[unit.id])?.id ?? eligible[0]?.id ?? null;
    }

    const actual = state.battlefieldMap?.actualDeployment ?? {};
    const reserves = state.battlefieldMap?.declaredReserves ?? {};
    const deployedCount = eligible.filter((unit) => unit.status === "deployed" && actual[unit.id]).length;
    const reserveCount = eligible.filter((unit) => reserves[unit.id]).length;
    const unaccounted = eligible.length - deployedCount - reserveCount;
    const playerOptions = players.map((player) => '<option value="' + escapeHtml(player.id) + '"' +
      (player.id === playerId ? " selected" : "") + ">" + escapeHtml(player.name ?? player.id) + "</option>").join("");
    const unitOptions = eligible.map((unit) => {
      const status = actual[unit.id] ? "Deployed" : reserves[unit.id] ? "Declared reserve" : "Not recorded";
      return '<option value="' + escapeHtml(unit.id) + '"' +
        (unit.id === selectedUnitId ? " selected" : "") + ">" + escapeHtml(unit.name ?? unit.id) +
        " — " + status + "</option>";
    }).join("");
    const selected = eligible.find((unit) => unit.id === selectedUnitId);
    const selectedStatus = selected ? actual[selected.id] ? "Currently deployed" :
      reserves[selected.id] ? "Declared in reserves" : "Not yet accounted for" : "No unit selected";

    container.innerHTML = '<main class="deployment-screen"><header><div class="command-kicker">BATTLE SETUP</div>' +
      '<h1>Actual Deployment</h1><p>Record where both armies actually deploy. Planned positions are a guide only and are not copied automatically.</p></header>' +
      '<p class="battlefield-map__notice">The map is approximate context, not a measurement tool. Follow the mission pack and tabletop rules for legal deployment, terrain, and reserve restrictions.</p>' +
      '<section class="battlefield-map-section"><h2>Deployment Map</h2>' +
      renderBattlefieldMap(state, { mode: "deployment", perspectivePlayerId: playerId }) +
      '<p>Select a player and unit, then tap the map to place or correct its actual starting position. Select a unit marker and tap a new point to reposition it.</p></section>' +
      '<section class="deployment-controls"><label>Army / player<select data-deployment-player>' + playerOptions + '</select></label>' +
      '<label>Unit to place<select data-deployment-unit><option value="">Select a unit…</option>' + unitOptions + '</select></label>' +
      '<p data-deployment-selected-status>' + escapeHtml(selectedStatus) + '</p>' +
      '<div class="deployment-actions"><button type="button" data-declare-reserve ' + (!selected ? "disabled" : "") + '>Declare selected unit in reserves</button></div></section>' +
      '<section class="deployment-completion"><h2>Deployment checklist</h2><p>' + deployedCount + ' deployed · ' + reserveCount +
      ' declared in reserves · ' + unaccounted + ' not yet accounted for</p>' +
      (unaccounted ? '<p role="status">Before starting the first turn, account for each non-destroyed unit by recording its actual position or explicitly declaring it in reserves.</p>' :
        '<p role="status">All non-destroyed units for this player are accounted for.</p>') +
      '</section>' + (message ? '<p role="status">' + escapeHtml(message) + '</p>' : "") + '</main>';
  }

  function handleChange(event) {
    const target = event.target;
    if (target?.matches?.("[data-deployment-player]")) {
      selectedPlayerId = target.value || null;
      selectedUnitId = null;
      message = "";
      render();
    } else if (target?.matches?.("[data-deployment-unit]")) {
      selectedUnitId = target.value || null;
      message = selectedUnitId ? "Unit selected. Tap the map to record its actual position." : "";
      render();
    }
  }

  function handleClick(event) {
    const marker = event.target?.closest?.("[data-map-unit-id]");
    if (marker && marker.closest?.('[data-map-mode="deployment"]')) {
      selectedUnitId = marker.getAttribute?.("data-map-unit-id") ?? marker.dataset?.mapUnitId ?? null;
      message = selectedUnitId ? "Selected unit. Tap the map to reposition it." : "";
      render();
      return;
    }

    const board = event.target?.closest?.("[data-battlefield-map-board]");
    if (board && board.closest?.('[data-map-mode="deployment"]')) {
      const state = session.getState();
      const playerId = playerFor(state);
      if (!selectedUnitId) {
        message = "Select a unit before placing it on the map.";
        render();
        return;
      }
      const rect = board.getBoundingClientRect?.();
      if (!rect || !rect.width || !rect.height ||
          !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
        message = "The map position could not be measured.";
        render();
        return;
      }
      const position = {
        x: Math.round(Math.max(0, Math.min(60, (event.clientX - rect.left) / rect.width * 60)) * 10) / 10,
        y: Math.round(Math.max(0, Math.min(44, (1 - (event.clientY - rect.top) / rect.height) * 44)) * 10) / 10
      };
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_ACTUAL_DEPLOYMENT_POSITION, payload: {
          unitId: selectedUnitId, playerId, position
        }});
        message = "Actual deployment position recorded.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }

    const reserveButton = event.target?.closest?.("[data-declare-reserve]");
    if (reserveButton) {
      const state = session.getState();
      try {
        session.dispatch({ type: COMMAND_TYPES.DECLARE_UNIT_RESERVE, payload: {
          unitId: selectedUnitId, playerId: playerFor(state)
        }});
        message = "Unit explicitly declared in reserves.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
    }
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
