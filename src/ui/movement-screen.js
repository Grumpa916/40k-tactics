import { renderMapReserveTray, tappedMapPosition } from './map-reserve-tray.js';
import { attachmentParent } from '../rules/event-preparation.js';
import { createLiveMapView } from './live-map-view.js';
import { renderCombatWorkspace } from './combat-workspace.js';
import { renderMovementAdvisor } from './movement-advisor.js';
import { COMMAND_TYPES } from "../commands/game-commands.js";
import { renderBattlefieldMap } from "./battlefield-map.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function modelsFor(unit) {
  return Array.isArray(unit.models) && unit.models.length
    ? unit.models
    : unit.position ? [{ id: unit.id, position: unit.position }] : [];
}

function movesAtCurrentPositions(unit) {
  return modelsFor(unit).map((model) => ({
    modelId: model.id,
    position: { ...model.position }
  }));
}

function ownerLabel(unit, state, perspectivePlayerId) {
  if (perspectivePlayerId) return unit.ownerId === perspectivePlayerId ? "You" : "Opponent";
  return state.players.find((player) => player.id === unit.ownerId)?.name ?? unit.ownerId ?? "Unknown";
}

const MOVEMENT_LABELS = {
  "unit.normal_move_resolved": "Normal Move recorded",
  "unit.fell_back": "Fall Back recorded",
  "unit.advanced": "Advance recorded",
  "unit.stationary_recorded": "Did Not Move"
};

function movementActionLabel(action) {
  if (!action) return "Select movement";
  const base = MOVEMENT_LABELS[action.type] ?? "Movement recorded";
  const roll = Number(action.payload?.advanceRoll);
  if (action.type === "unit.advanced" && Number.isInteger(roll) && roll >= 1 && roll <= 6) {
    return `${base} · +${roll}\"`;
  }
  return base;
}

export function createMovementScreen(container, { session, perspectivePlayerId = null, layoutMode = "tabletop" } = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container element is required.");
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function" || typeof session.dispatch !== "function") {
    throw new TypeError("A dispatchable game session is required.");
  }

  const mapView = createLiveMapView();
  let selectedUnitId = null;
  let errorMessage = "";
  let advanceRoll = null;
  let livePointerDrag = null;

  function movementAction(state, unitId) {
    return state.history.find((event) =>
      ["unit.normal_move_resolved", "unit.fell_back", "unit.advanced", "unit.stationary_recorded"].includes(event.type) &&
      event.payload?.unitId === unitId && event.payload?.turn === state.turn
    ) ?? null;
  }

  function selectUnit(unitId) {
    if (unitId !== selectedUnitId) advanceRoll = null;
    selectedUnitId = unitId;
    errorMessage = "";
  }

  function render() {
    const state = session.getState();
    const playerId = state.activePlayer ?? state.battle?.activePlayerId;
    const eligible = state.units.filter((unit) => unit.ownerId === playerId && unit.status === "deployed");
    const selectable=state.units.filter(unit=>unit.ownerId===playerId && ['deployed','reserves'].includes(unit.status) && !attachmentParent(state,unit));
    if (!selectable.some((unit) => unit.id === selectedUnitId)) {
      selectedUnitId = eligible[0]?.id ?? null;
      advanceRoll = null;
    }
    const selected = eligible.find((unit) => unit.id === selectedUnitId) ?? null;

    const unitCards = eligible.length ? eligible.map((unit) => {
      const action = movementAction(state, unit.id);
      return `<button type="button" class="move-unit${unit.id === selectedUnitId ? " is-selected" : ""}" data-move-unit="${escapeHtml(unit.id)}">
        <strong>${escapeHtml(unit.name)}</strong>
        <span>${escapeHtml(ownerLabel(unit, state, perspectivePlayerId))}</span>
        <small>${escapeHtml(movementActionLabel(action))}</small>
      </button>`;
    }).join("") : "<p>No deployed units are available to move.</p>";

    let editor = "<p>Select a deployed unit to record its movement choice.</p>";
    if (selected) {
      const action = movementAction(state, selected.id);
      const advanceReady = Number.isInteger(advanceRoll) && advanceRoll >= 1 && advanceRoll <= 6;
      editor = `<div class="move-editor">
        <h2>${escapeHtml(selected.name)}</h2>
        ${action
          ? `<p class="move-editor__status"><strong>✓ ${escapeHtml(movementActionLabel(action))}</strong></p>
             <div class="move-actions"><button type="button" data-reset-position>Undo</button></div>`
          : `<div class="move-actions">
               <button type="button" data-move-stationary>Did Not Move</button>
               <button type="button" data-move-save>Normal Move</button>
               <div class="advance-choice">
                 <span>Advance roll: <strong data-advance-roll-value>${advanceReady ? advanceRoll : "—"}</strong></span>
                 <div class="advance-roll-buttons">${[1,2,3,4,5,6].map((value) => `<button type="button" data-advance-roll="${value}" aria-pressed="${value === advanceRoll}" class="${value === advanceRoll ? "is-selected" : ""}"${value === advanceRoll ? ' style="background:#c4e99b;color:#17212b;border-color:#c4e99b;font-weight:800"' : ""}>${value}</button>`).join("")}</div>
                 <button type="button" data-move-advance${advanceReady ? "" : " disabled"}>${advanceReady ? `Advance +${advanceRoll}\"` : "Select roll first"}</button>
               </div>
               <button type="button" data-move-fallback>Fall Back</button>
             </div>`}
      </div>`;
    }

    const reserved=selectable.find(unit=>unit.id===selectedUnitId && unit.status==='reserves');
    if(reserved)editor=`<h2>${escapeHtml(reserved.name)}</h2><p>In reserves</p>`;
    const reserveTray=renderMapReserveTray(state,{selectedUnitId,playerId});
    const advisor=renderMovementAdvisor(state,{playerId,selectedUnitId});
    if (layoutMode === 'tabletop') {
      container.innerHTML = renderCombatWorkspace({state,phase:'movement',perspectivePlayerId:perspectivePlayerId ?? playerId,selectedUnitId,interactivePlayerId:playerId,mapView,
        mapExtra:reserveTray,controls:`<div class="movement-screen">${errorMessage ? `<p class="move-error" role="alert">${escapeHtml(errorMessage)}</p>` : ''}${advisor}${editor}<details><summary>Units · ${eligible.length}</summary><div class="move-units">${unitCards}</div></details></div>`,footer:''});
      mapView.bind(container);
      return;
    }
    container.innerHTML = `<main class="movement-screen">
      <header><div><div class="move-kicker">LIVE BATTLE</div><h1>Movement Phase</h1><p>Round ${escapeHtml(state.battle?.round ?? "—")} · Turn ${escapeHtml(state.turn ?? "—")}</p></div><strong>${eligible.length} deployed units</strong></header>
      <p class="move-note">Map positions are approximate and may be adjusted repeatedly. The app does not enforce movement distance. Each unit still records one gameplay movement choice per turn.</p>
      <section class="battlefield-map-section">
        <div class="move-heading"><h2>Live Battlefield</h2><span>Recorded positions · both armies</span></div>
        ${renderBattlefieldMap(state, { mode: "live", perspectivePlayerId: perspectivePlayerId ?? playerId, interactivePlayerId: playerId, selectedUnitId })}
        ${reserveTray}
        <p>Drag an active player’s marker to place or refine its approximate position. If no movement choice has been recorded yet, the first drag records a Normal Move. Later drags only refine map position.</p>
      </section>
      ${errorMessage ? `<p class="move-error" role="alert">${escapeHtml(errorMessage)}</p>` : ""}
      <section>${advisor}</section>
      <section><div class="move-heading"><h2>Eligible units</h2><span>Active player only</span></div><div class="move-units">${unitCards}</div></section>
      <section>${editor}</section>
    </main>`;
  }

  function handleLivePointerDown(event) {
    const marker = event.target?.closest?.("[data-map-unit-id]");
    if (!marker || !marker.closest?.('[data-map-mode="live"]')) return;
    const state = session.getState();
    const unitId = marker.getAttribute("data-map-unit-id");
    const unit = state.units.find((item) => item.id === unitId);
    if (state.phase !== "movement" || state.battle?.status !== "active") return;
    if (!unit || unit.ownerId !== (state.activePlayer ?? state.battle?.activePlayerId) || unit.status !== "deployed") return;
    const board = marker.closest("[data-battlefield-map-board]");
    if (!board) return;
    livePointerDrag = {
      unitId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, board, marker,
      markerX: parseFloat(marker.style.left) / 100 * 60,
      markerY: 44 - parseFloat(marker.style.top) / 100 * 44,
      left: marker.style.left, top: marker.style.top, moved: false
    };
    selectUnit(unitId);
    marker.classList?.add?.("is-dragging");
    try { marker.setPointerCapture?.(event.pointerId); } catch {}
  }

  function handleLivePointerMove(event) {
    const drag = livePointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 8) drag.moved = true;
    if (!drag.moved) return;
    const rect = drag.board.getBoundingClientRect?.();
    if (!rect || !rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(60, (event.clientX - rect.left) / rect.width * 60));
    const y = Math.max(0, Math.min(44, (1 - (event.clientY - rect.top) / rect.height) * 44));
    event.preventDefault?.();
    drag.marker.style.left = x / 60 * 100 + "%";
    drag.marker.style.top = (44 - y) / 44 * 100 + "%";
  }

  function handleLivePointerUp(event) {
    const drag = livePointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    livePointerDrag = null;
    drag.marker.classList?.remove?.("is-dragging");
    if (!drag.moved) { render(); return; }
    const rect = drag.board.getBoundingClientRect?.();
    if (!rect || !rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(60, (event.clientX - rect.left) / rect.width * 60));
    const y = Math.max(0, Math.min(44, (1 - (event.clientY - rect.top) / rect.height) * 44));
    const dx = x - drag.markerX;
    const dy = y - drag.markerY;
    try {
      const state = session.getState();
      const unit = state.units.find((item) => item.id === drag.unitId);
      if (!unit) throw new Error("Selected unit is no longer available.");
      const moves = modelsFor(unit).map((model) => ({
        modelId: model.id,
        position: {
          x: Math.round(Math.max(0, Math.min(60, model.position.x + dx)) * 10) / 10,
          y: Math.round(Math.max(0, Math.min(44, model.position.y + dy)) * 10) / 10
        }
      }));
      const actionRecorded = Boolean(movementAction(state, unit.id));
      session.dispatch({
        type: actionRecorded ? COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION : COMMAND_TYPES.RESOLVE_NORMAL_MOVE,
        payload: actionRecorded ? { unitId: unit.id, playerId: unit.ownerId, moves } : { unitId: unit.id, moves }
      });
      errorMessage = "";
    } catch (error) {
      errorMessage = error?.message ?? String(error);
    }
    render();
  }

  function handleLivePointerCancel(event) {
    const drag = livePointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    livePointerDrag = null;
    drag.marker.classList?.remove?.("is-dragging");
    drag.marker.style.left = drag.left;
    drag.marker.style.top = drag.top;
    render();
  }

  function handleClick(event) {
    const reserve=event.target?.closest?.('[data-map-reserve-select]');
    if(reserve){selectUnit(reserve.getAttribute('data-map-reserve-select'));render();return;}
    const area=event.target?.closest?.('[data-map-reserve-area]');
    const board=event.target?.closest?.('[data-battlefield-map-board]');
    const state=session.getState();
    const selected=state.units.find(unit=>unit.id===selectedUnitId);
    if(area || (board && selected?.status==='reserves' && !event.target?.closest?.('[data-map-unit-id]') && !event.target?.closest?.('[data-map-objective-id]'))) {
      if(area && selected?.status==='reserves')return;
      try {
        const position=board?tappedMapPosition(event,board):null;
        errorMessage='';
        session.dispatch({type:COMMAND_TYPES.TRANSFER_MAP_RESERVE,payload:{unitId:selectedUnitId,destination:area?'reserves':'battlefield',...(board?{position}:{})}});
      }catch(error){errorMessage=error.message;}
      render();return;
    }
    const mapMarker = event.target?.closest?.("[data-map-unit-id]");
    if (mapMarker && mapMarker.closest?.('[data-map-mode="live"]')) {
      const unitId = mapMarker.getAttribute("data-map-unit-id");
      const state = session.getState();
      const unit = state.units.find((item) => item.id === unitId);
      if (unit?.ownerId === (state.activePlayer ?? state.battle?.activePlayerId) && unit.status === "deployed") {
        selectUnit(unitId);
        render();
      }
      return;
    }

    const button = event.target?.closest?.("button");
    if (!button || button.hasAttribute("data-map-zoom")) return;
    try {
      if (button.dataset.moveUnit) {
        selectUnit(button.dataset.moveUnit);
        render();
        return;
      }
      if (button.hasAttribute("data-advance-roll")) {
        const nextRoll = Number(button.getAttribute("data-advance-roll"));
        if (!Number.isInteger(nextRoll) || nextRoll < 1 || nextRoll > 6) throw new Error("Choose an Advance roll from 1 to 6.");
        advanceRoll = nextRoll;
        errorMessage = "";
        render();
        return;
      }

      const state = session.getState();
      const unit = state.units.find((item) => item.id === selectedUnitId);
      if (!unit) throw new Error("Select a unit before recording movement.");
      const moves = movesAtCurrentPositions(unit);
      if (!moves.length) throw new Error("This unit has no map position yet. Place it on the battlefield map first.");

      if (button.hasAttribute("data-reset-position")) {
        session.dispatch({ type: COMMAND_TYPES.UNDO_MOVEMENT_ACTION, payload: { unitId: unit.id } });
        advanceRoll = null;
      } else if (button.hasAttribute("data-move-save")) {
        session.dispatch({ type: COMMAND_TYPES.RESOLVE_NORMAL_MOVE, payload: { unitId: unit.id, moves } });
        advanceRoll = null;
      } else if (button.hasAttribute("data-move-advance")) {
        if (!Number.isInteger(advanceRoll) || advanceRoll < 1 || advanceRoll > 6) throw new Error("Select the Advance roll (1–6) first.");
        session.dispatch({ type: COMMAND_TYPES.RESOLVE_ADVANCE, payload: { unitId: unit.id, moves, advanceRoll } });
        advanceRoll = null;
      } else if (button.hasAttribute("data-move-stationary")) {
        session.dispatch({ type: COMMAND_TYPES.RECORD_STATIONARY, payload: { unitId: unit.id } });
        advanceRoll = null;
      } else if (button.hasAttribute("data-move-fallback")) {
        session.dispatch({ type: COMMAND_TYPES.RECORD_FALL_BACK, payload: { unitId: unit.id } });
        advanceRoll = null;
      } else {
        return;
      }
      errorMessage = "";
      render();
    } catch (error) {
      errorMessage = error?.message ?? String(error);
      render();
    }
  }

  container.addEventListener("click", handleClick);
  container.addEventListener("pointerdown", handleLivePointerDown);
  container.addEventListener("pointermove", handleLivePointerMove);
  container.addEventListener("pointerup", handleLivePointerUp);
  container.addEventListener("pointercancel", handleLivePointerCancel);
  const unsubscribe = session.subscribe(render);
  render();
  return {
    render,
    destroy() {
      unsubscribe();
      container.removeEventListener("click", handleClick);
      container.removeEventListener("pointerdown", handleLivePointerDown);
      container.removeEventListener("pointermove", handleLivePointerMove);
      container.removeEventListener("pointerup", handleLivePointerUp);
      container.removeEventListener("pointercancel", handleLivePointerCancel);
      container.replaceChildren();
    }
  };
}