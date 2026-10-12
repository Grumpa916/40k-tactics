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

function movementFor(unit, model) {
  const raw = model.profile?.characteristics?.movement ??
    model.characteristics?.movement ??
    unit.profile?.characteristics?.movement ??
    unit.characteristics?.movement ??
    unit.movement;
  const match = typeof raw === "string" ? raw.match(/^\s*(\d+(?:\.\d+)?)\s*(?:"|in)?\s*$/i) : null;
  const value = typeof raw === "number" ? raw : match ? Number(match[1]) : NaN;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function ownerLabel(unit, state) {
  return state.players.find((player) => player.id === unit.ownerId)?.name ??
    (unit.ownerId === state.activePlayer ? "You" : "Opponent");
}

export function createMovementScreen(container, { session, perspectivePlayerId = null } = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container element is required.");
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function" || typeof session.dispatch !== "function") {
    throw new TypeError("A dispatchable game session is required.");
  }

  let selectedUnitId = null;
  let errorMessage = "";
  let livePointerDrag = null;

  function render() {
    const state = session.getState();
    const playerId = perspectivePlayerId ?? state.activePlayer;
    const eligible = state.units.filter((unit) => unit.ownerId === playerId &&
      unit.status === "deployed");
    if (!eligible.some((unit) => unit.id === selectedUnitId)) selectedUnitId = eligible[0]?.id ?? null;
    const selected = eligible.find((unit) => unit.id === selectedUnitId) ?? null;
    const alreadyMoved = (unitId) => state.history.some((event) =>
      event.type === "unit.normal_move_resolved" && event.payload?.unitId === unitId &&
      event.payload?.turn === state.turn);
    const alreadyFellBack = (unitId) => state.history.some((event) =>
      event.type === "unit.fell_back" && event.payload?.unitId === unitId &&
      event.payload?.turn === state.turn);
    const actionFor = (unitId) => state.history.find((event) =>
      ["unit.normal_move_resolved", "unit.fell_back", "unit.advanced", "unit.stationary_recorded"].includes(event.type) &&
      event.payload?.unitId === unitId && event.payload?.turn === state.turn);
    const unitCards = eligible.length ? eligible.map((unit) => {
      const moved = alreadyMoved(unit.id);
      const fellBack = alreadyFellBack(unit.id);
      const action = actionFor(unit.id);
      return '<button type="button" class="move-unit' + (unit.id === selectedUnitId ? ' is-selected' : '') +
        '" data-move-unit="' + escapeHtml(unit.id) + '"' + (action ? ' disabled' : '') + '><strong>' +
        escapeHtml(unit.name) + '</strong><span>' + escapeHtml(ownerLabel(unit, state)) + '</span><small>' +
        (action ? ({ "unit.normal_move_resolved": "Normal Move recorded", "unit.fell_back": "Fall Back recorded", "unit.advanced": "Advance recorded", "unit.stationary_recorded": "Remained stationary" }[action.type] ?? "Movement recorded") : "Select movement") +
        '</small></button>';
    }).join('') : '<p>No deployed units are available to move.</p>';
    let editor = '<p>Select a deployed unit to record its movement.</p>';
    if (selected) {
      const models = modelsFor(selected);
      const moved = Boolean(actionFor(selected.id));
      const rows = models.map((model) => {
        const movement = movementFor(selected, model);
        const pos = model.position ?? {};
        return '<div class="move-coordinate-row"><strong>' + escapeHtml(model.name ?? model.id) +
          '</strong><label>X <input type="number" step="0.1" data-move-x="' + escapeHtml(model.id) +
          '" value="' + escapeHtml(pos.x) + '" required></label><label>Y <input type="number" step="0.1" data-move-y="' +
          escapeHtml(model.id) + '" value="' + escapeHtml(pos.y) + '" required></label><span>' +
          (movement == null ? 'Movement stat missing' : 'Move up to ' + movement + '"') + '</span></div>';
      }).join('');
      const valid = models.length > 0 && models.every((model) => movementFor(selected, model) != null &&
        Number.isFinite(model.position?.x) && Number.isFinite(model.position?.y));
      editor = '<div class="move-editor"><h2>' + escapeHtml(selected.name) + '</h2>' +
        (models.length ? '<p>Enter each model’s destination coordinates. The app checks each displacement against its Movement characteristic; tabletop distances and terrain remain authoritative.</p>' +
          '<div class="move-coordinate-list">' + rows + '</div>' :
          '<p>This unit has no recorded battlefield position. Add positions before recording a Normal Move.</p>') +
        '<label>Advance roll (1–6) <input type="number" min="1" max="6" step="1" data-advance-roll value="1" required></label>' +
        '<div class="move-actions"><button type="button" data-move-save ' + (moved || !valid ? 'disabled' : '') +
          '>Record Normal Move</button><button type="button" data-move-advance ' + (moved || !valid ? 'disabled' : '') +
          '>Record Advance</button><button type="button" data-move-fallback ' +
          (moved ? 'disabled' : '') + '>Record Fall Back</button><button type="button" data-move-stationary ' +
          (moved ? 'disabled' : '') + '>Remain Stationary</button></div></div>';
    }
    container.innerHTML = '<main class="movement-screen"><header><div><div class="move-kicker">LIVE BATTLE</div><h1>Movement Phase</h1><p>Round ' +
      escapeHtml(state.battle?.round ?? '—') + ' · Turn ' + escapeHtml(state.turn ?? '—') +
      '</p></div><strong>' + eligible.length + ' deployed units</strong></header>' +
      '<p class="move-note">Map coordinates are approximate. Record movement after checking tabletop distances, coherency, terrain, and applicable rules. Each unit records one movement choice per turn: Normal Move, Advance, Fall Back, or Remain Stationary.</p>' +
      '<section class="battlefield-map-section"><div class="move-heading"><h2>Live Battlefield</h2><span>Recorded positions · both armies</span></div>' +
      renderBattlefieldMap(state, { mode: "live", perspectivePlayerId: playerId, selectedUnitId }) +
      '<p>Move markers are a visual reference. Use the movement controls below to record rule-aware model destinations.</p></section>' +
      (errorMessage ? '<p class="move-error" role="alert">' + escapeHtml(errorMessage) + '</p>' : '') +
      '<section><div class="move-heading"><h2>Eligible units</h2><span>Active player only</span></div><div class="move-units">' +
      unitCards + '</div></section><section>' + editor + '</section></main>';
  }

  function handleLivePointerDown(e) {
    const m=e.target?.closest?.('[data-map-unit-id]');if(!m||!m.closest?.('[data-map-mode="live"]'))return;
    const s=session.getState(),id=m.getAttribute("data-map-unit-id"),u=s.units.find(x=>x.id===id);
    if(!u||u.ownerId!==(perspectivePlayerId??s.activePlayer)||u.status!=="deployed")return;
    const b=m.closest("[data-battlefield-map-board]");if(!b)return;
    livePointerDrag={unitId:id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,board:b,marker:m,
      markerX:parseFloat(m.style.left)/100*60,markerY:44-parseFloat(m.style.top)/100*44,left:m.style.left,top:m.style.top,moved:false};
    selectedUnitId=id;m.classList?.add?.("is-dragging");try{m.setPointerCapture?.(e.pointerId);}catch{}
  }
  function handleLivePointerMove(e) {
    const d=livePointerDrag;if(!d||d.pointerId!==e.pointerId)return;
    if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>=8)d.moved=true;if(!d.moved)return;
    const r=d.board.getBoundingClientRect?.();if(!r||!r.width||!r.height)return;
    const x=Math.max(0,Math.min(60,(e.clientX-r.left)/r.width*60)),y=Math.max(0,Math.min(44,(1-(e.clientY-r.top)/r.height)*44));
    e.preventDefault?.();d.marker.style.left=x/60*100+"%";d.marker.style.top=(44-y)/44*100+"%";
  }

  function handleLivePointerUp(event) {
    const drag=livePointerDrag;if(!drag||drag.pointerId!==event.pointerId)return;livePointerDrag=null;drag.marker.classList?.remove?.("is-dragging");
    if(!drag.moved){render();return;}
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
      const models = modelsFor(unit);
      const moves = models.map((model) => ({
        modelId: model.id,
        position: {
          x: Math.round(Math.max(0, Math.min(60, model.position.x + dx)) * 10) / 10,
          y: Math.round(Math.max(0, Math.min(44, model.position.y + dy)) * 10) / 10
        }
      }));
      session.dispatch({ type: COMMAND_TYPES.RESOLVE_NORMAL_MOVE, payload: { unitId: unit.id, moves } });
      errorMessage = "";
    } catch (error) {
      errorMessage = error?.message ?? String(error);
    }
    render();
  }

  function handleLivePointerCancel(e) {
    const d=livePointerDrag;if(!d||d.pointerId!==e.pointerId)return;livePointerDrag=null;d.marker.classList?.remove?.("is-dragging");d.marker.style.left=d.left;d.marker.style.top=d.top;render();
  }

  function handleClick(event) {
    const mapMarker = event.target?.closest?.("[data-map-unit-id]");
    if (mapMarker && mapMarker.closest?.('[data-map-mode="live"]')) {
      const unitId = mapMarker.getAttribute("data-map-unit-id");
      const state = session.getState();
      const unit = state.units.find((item) => item.id === unitId);
      if (unit?.ownerId === (perspectivePlayerId ?? state.activePlayer) &&
          unit.status === "deployed") {
        selectedUnitId = unitId;
        errorMessage = "";
        render();
      }
      return;
    }
    const target = event.target?.closest?.("button");
    if (!target) return;
    try {
      if (target.dataset.moveUnit) {
        selectedUnitId = target.dataset.moveUnit;
        errorMessage = "";
        render();
      } else if (target.hasAttribute("data-move-save")) {
        const state = session.getState();
        const unit = state.units.find((item) => item.id === selectedUnitId);
        if (!unit) throw new Error("Select a unit before recording movement.");
        const models = modelsFor(unit);
        const moves = models.map((model) => {
          const x = container.querySelector('[data-move-x="' + model.id.replaceAll('"', '\\"') + '"]');
          const y = container.querySelector('[data-move-y="' + model.id.replaceAll('"', '\\"') + '"]');
          if (!x || !y || x.value.trim() === "" || y.value.trim() === "") throw new Error("Enter X and Y coordinates for every model.");
          return { modelId: model.id, position: { x: Number(x.value), y: Number(y.value) } };
        });
        session.dispatch({ type: COMMAND_TYPES.RESOLVE_NORMAL_MOVE, payload: { unitId: unit.id, moves } });
        errorMessage = "";
        render();
      } else if (target.hasAttribute("data-move-advance")) {
        const state = session.getState();
        const unit = state.units.find((item) => item.id === selectedUnitId);
        if (!unit) throw new Error("Select a unit before recording an Advance.");
        const advanceRoll = Number(container.querySelector("[data-advance-roll]")?.value);
        const models = modelsFor(unit);
        const moves = models.map((model) => {
          const modelX = Array.from(container.querySelectorAll("[data-move-x]")).find((input) => input.dataset.moveX === model.id);
          const modelY = Array.from(container.querySelectorAll("[data-move-y]")).find((input) => input.dataset.moveY === model.id);
          if (!modelX || !modelY || modelX.value.trim() === "" || modelY.value.trim() === "") throw new Error("Enter X and Y coordinates for every model.");
          return { modelId: model.id, position: { x: Number(modelX.value), y: Number(modelY.value) } };
        });
        session.dispatch({ type: COMMAND_TYPES.RESOLVE_ADVANCE, payload: { unitId: unit.id, moves, advanceRoll } });
        errorMessage = "";
        render();
      } else if (target.hasAttribute("data-move-stationary")) {
        session.dispatch({ type: COMMAND_TYPES.RECORD_STATIONARY, payload: { unitId: selectedUnitId } });
        errorMessage = "";
        render();
      } else if (target.hasAttribute("data-move-fallback")) {
        session.dispatch({ type: COMMAND_TYPES.RECORD_FALL_BACK, payload: { unitId: selectedUnitId } });
        errorMessage = "";
        render();
      }
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
  return { render, destroy() { unsubscribe(); container.removeEventListener("click", handleClick); container.removeEventListener("pointerdown", handleLivePointerDown); container.removeEventListener("pointermove", handleLivePointerMove); container.removeEventListener("pointerup", handleLivePointerUp); container.removeEventListener("pointercancel", handleLivePointerCancel); container.replaceChildren(); } };
}
