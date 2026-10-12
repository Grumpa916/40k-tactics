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
  let firstPlayerId = null;
  let message = "";
  let deploymentPointerDrag = null;

  function playerFor(state) {
    return selectedPlayerId ?? perspectivePlayerId ?? state.activePlayer ?? state.players?.[0]?.id ?? null;
  }

  function render() {
    const state = session.getState();
    const players = Array.isArray(state.players) ? state.players : [];
    const playerId = playerFor(state);
    if (!firstPlayerId || !players.some((player) => player.id === firstPlayerId)) {
      firstPlayerId = state.preGameSetup?.firstPlayerId ?? state.battle?.firstPlayerId ?? state.activePlayer ?? players[0]?.id ?? null;
    }
    const eligible = (state.units ?? []).filter((unit) =>
      unit?.ownerId === playerId && unit.status !== "destroyed");
    if (!eligible.some((unit) => unit.id === selectedUnitId)) {
      selectedUnitId = eligible.find((unit) => !state.battlefieldMap?.actualDeployment?.[unit.id] &&
        !state.battlefieldMap?.declaredReserves?.[unit.id] && unit.status !== "reserves")?.id ?? eligible[0]?.id ?? null;
    }

    const actual = state.battlefieldMap?.actualDeployment ?? {};
    const reserves = state.battlefieldMap?.declaredReserves ?? {};
    const isReserved = (unit) => Boolean(reserves[unit.id] || unit.status === "reserves");
    const deployedCount = eligible.filter((unit) => unit.status === "deployed" && actual[unit.id] && !isReserved(unit)).length;
    const reserveCount = eligible.filter(isReserved).length;
    const unaccounted = eligible.length - deployedCount - reserveCount;
    const accountingByPlayer = players.map((player) => {
      const units = (state.units ?? []).filter((unit) => unit?.ownerId === player.id && unit.status !== "destroyed");
      const deployed = units.filter((unit) => unit.status === "deployed" && actual[unit.id]).length;
      const inReserves = units.filter((unit) => reserves[unit.id]).length;
      return { player, deployed, inReserves, unaccounted: units.length - deployed - inReserves };
    });
    const totalUnaccounted = accountingByPlayer.reduce((sum, item) => sum + item.unaccounted, 0);
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
    const firstPlayerOptions = players.map((player) => '<option value="' + escapeHtml(player.id) + '"' +
      (player.id === firstPlayerId ? " selected" : "") + ">" + escapeHtml(player.name ?? player.id) + "</option>").join("");
    const accountingMarkup = accountingByPlayer.map((item) =>
      '<li><strong>' + escapeHtml(item.player.name ?? item.player.id) + ':</strong> ' +
      item.deployed + ' deployed · ' + item.inReserves + ' in reserves · ' +
      item.unaccounted + ' unaccounted</li>'
    ).join("");

    container.innerHTML = '<main class="deployment-screen"><header><div class="command-kicker">BATTLE SETUP</div>' +
      '<h1>Actual Deployment</h1><p>Record where both armies actually deploy. Planned positions are a guide only and are not copied automatically.</p></header>' +
      '<p class="battlefield-map__notice">The map is approximate context, not a measurement tool. Follow the mission pack and tabletop rules for legal deployment, terrain, and reserve restrictions.</p>' +
      '<section class="battlefield-map-section"><h2>Deployment Map</h2>' +
      renderBattlefieldMap(state, { mode: "deployment", perspectivePlayerId: perspectivePlayerId ?? state.activePlayer ?? players[0]?.id, selectedUnitId }) +
      '<p>Drag any unit marker to its actual starting location. Tap a marker to select it, then tap an empty point as a fallback. Dashed markers are awaiting placement; planned positions are not copied automatically.</p>' +
      '<section class="deployment-reserve-tray" aria-label="Units declared in reserves"><h3>Reserves</h3>' +
      ((state.units ?? []).filter((unit) => unit && unit.status !== "destroyed" && (reserves[unit.id] || unit.status === "reserves")).map((unit) =>
        '<span class="deployment-reserve-tray__unit">' + escapeHtml(unit.name ?? unit.id) + ' · ' +
        escapeHtml(players.find((player) => player.id === unit.ownerId)?.name ?? unit.ownerId) + '</span>'
      ).join("") || '<p>No units declared in reserves.</p>') +
      '</section></section>' +
      '<section class="deployment-controls"><label>Army / player<select data-deployment-player>' + playerOptions + '</select></label>' +
      '<label>Unit to place<select data-deployment-unit><option value="">Select a unit…</option>' + unitOptions + '</select></label>' +
      '<p data-deployment-selected-status>' + escapeHtml(selectedStatus) + '</p>' +
      '<div class="deployment-actions"><button type="button" data-declare-reserve ' + (!selected ? "disabled" : "") + '>Declare selected unit in reserves</button></div></section>' +
      '<section class="deployment-completion"><h2>Deployment checklist</h2><p>' + deployedCount + ' deployed · ' + reserveCount +
      ' declared in reserves · ' + unaccounted + ' not yet accounted for</p>' +
      (unaccounted ? '<p role="status">Account for each non-destroyed unit by recording its actual position or explicitly declaring it in reserves.</p>' :
        '<p role="status">All non-destroyed units for this player are accounted for.</p>') +
      '<h3>Both armies</h3><ul>' + accountingMarkup + '</ul>' +
      '<label>First player<select data-first-player>' + firstPlayerOptions + '</select></label>' +
      '<button type="button" data-start-first-turn ' + (totalUnaccounted ? "disabled" : "") +
      '>Finish deployment and start first turn</button>' +
      (totalUnaccounted ? '<p>Both armies must account for every non-destroyed unit before the first turn can start.</p>' :
        '<p>All units are accounted for. Confirm the first player to begin the battle.</p>') +
      '</section>' + (message ? '<p role="status">' + escapeHtml(message) + '</p>' : "") + '</main>';
  }

  function mapCoordinates(board, x, y) {
    const r=board?.getBoundingClientRect?.();if(!r||!r.width||!r.height)return null;
    return {x:Math.round(Math.max(0,Math.min(60,(x-r.left)/r.width*60))*10)/10,y:Math.round(Math.max(0,Math.min(44,(1-(y-r.top)/r.height)*44))*10)/10};
  }
  function handleDeploymentPointerDown(e) {
    const m=e.target?.closest?.("[data-map-unit-id]");if(!m||!m.closest?.('[data-map-mode="deployment"]'))return;
    const b=m.closest("[data-battlefield-map-board]");if(!b)return;selectedUnitId=m.getAttribute("data-map-unit-id");
    const u=(session.getState().units??[]).find(x=>x.id===selectedUnitId);if(!u?.ownerId||u.status==="destroyed")return;selectedPlayerId=u.ownerId;
    deploymentPointerDrag={unitId:selectedUnitId,playerId:u.ownerId,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,board:b,marker:m,left:m.style.left,top:m.style.top,moved:false};
    m.classList?.add?.("is-dragging");try{m.setPointerCapture?.(e.pointerId);}catch{}
  }
  function handleDeploymentPointerMove(e) {
    const d=deploymentPointerDrag;if(!d||d.pointerId!==e.pointerId)return;
    if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>=8)d.moved=true;if(!d.moved)return;
    const p=mapCoordinates(d.board,e.clientX,e.clientY);if(!p)return;e.preventDefault?.();d.marker.style.left=p.x/60*100+"%";d.marker.style.top=(44-p.y)/44*100+"%";
  }
  function handleDeploymentPointerUp(e) {
    const d=deploymentPointerDrag;if(!d||d.pointerId!==e.pointerId)return;deploymentPointerDrag=null;d.marker.classList?.remove?.("is-dragging");
    if(!d.moved){render();return;}const p=mapCoordinates(d.board,e.clientX,e.clientY);if(!p){render();return;}
    try{session.dispatch({type:COMMAND_TYPES.SET_ACTUAL_DEPLOYMENT_POSITION,payload:{unitId:d.unitId,playerId:d.playerId,position:p}});
      selectedPlayerId=d.playerId;selectedUnitId=d.unitId;message="Actual deployment position saved";}
    catch(err){message=err?.message??String(err);}render();
  }
  function handleDeploymentPointerCancel(e) {
    const d=deploymentPointerDrag;if(!d||d.pointerId!==e.pointerId)return;deploymentPointerDrag=null;d.marker.classList?.remove?.("is-dragging");d.marker.style.left=d.left;d.marker.style.top=d.top;render();
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
    } else if (target?.matches?.("[data-first-player]")) {
      firstPlayerId = target.value || null;
      message = "";
      render();
    }
  }

  function handleClick(event) {
    const marker = event.target?.closest?.("[data-map-unit-id]");
    if (marker && marker.closest?.('[data-map-mode="deployment"]')) {
      selectedUnitId = marker.getAttribute?.("data-map-unit-id") ?? marker.dataset?.mapUnitId ?? null;
      const selectedUnit = (session.getState().units ?? []).find((unit) => unit.id === selectedUnitId);
      if (selectedUnit?.ownerId) selectedPlayerId = selectedUnit.ownerId;
      message = selectedUnitId ? "Selected unit. Drag it to place or reposition it." : "";
      render();
      return;
    }

    const board = event.target?.closest?.("[data-battlefield-map-board]");
    if (board && board.closest?.('[data-map-mode="deployment"]')) {
      const state = session.getState();
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
      const selectedUnit = (state.units ?? []).find((unit) => unit.id === selectedUnitId);
      const playerId = selectedUnit?.ownerId;
      if (!playerId) {
        message = "Could not identify the selected unit owner.";
        render();
        return;
      }
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
      return;
    }

    const startButton = event.target?.closest?.("[data-start-first-turn]");
    if (startButton) {
      const state = session.getState();
      const unaccountedUnits = (state.units ?? []).filter((unit) =>
        unit.status !== "destroyed" &&
        !state.battlefieldMap?.actualDeployment?.[unit.id] &&
        !state.battlefieldMap?.declaredReserves?.[unit.id] && unit.status !== "reserves"
      );
      if (unaccountedUnits.length) {
        message = "Deployment incomplete. Record positions or explicitly declare reserves for all non-destroyed units.";
        render();
        return;
      }
      if (!firstPlayerId) {
        message = "Select the first player before starting the turn.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.START_FIRST_TURN, payload: { activePlayerId: firstPlayerId } });
        session.dispatch({ type: COMMAND_TYPES.CHANGE_PHASE, payload: { phase: "command" } });
        message = "Deployment complete. Round 1, Command phase started.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
    }
  }

  container.addEventListener?.("change", handleChange);
  container.addEventListener?.("click", handleClick);
  container.addEventListener?.("pointerdown", handleDeploymentPointerDown);
  container.addEventListener?.("pointermove", handleDeploymentPointerMove);
  container.addEventListener?.("pointerup", handleDeploymentPointerUp);
  container.addEventListener?.("pointercancel", handleDeploymentPointerCancel);
  const unsubscribe = session.subscribe(render);
  render();
  return {
    render,
    destroy() {
      unsubscribe();
      container.removeEventListener?.("change", handleChange);
      container.removeEventListener?.("click", handleClick);
      container.removeEventListener?.("pointerdown", handleDeploymentPointerDown);
      container.removeEventListener?.("pointermove", handleDeploymentPointerMove);
      container.removeEventListener?.("pointerup", handleDeploymentPointerUp);
      container.removeEventListener?.("pointercancel", handleDeploymentPointerCancel);
      container.replaceChildren();
    }
  };
}
