import { COMMAND_TYPES } from '../commands/game-commands.js';
import { getCombatFormationMembers } from '../rules/battle-unit-reference.js';

const BOARD_WIDTH = 60;
const BOARD_HEIGHT = 44;

function modelsFor(unit) {
  return Array.isArray(unit.models) && unit.models.length
    ? unit.models
    : unit.position ? [{ id: unit.id, position: unit.position }] : [];
}

function clampDelta(formation, dx, dy) {
  const points = formation.flatMap(modelsFor).map(model => model.position)
    .filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y));
  if (!points.length) return { dx, dy };
  return {
    dx: Math.max(-Math.min(...points.map(p => p.x)), Math.min(BOARD_WIDTH - Math.max(...points.map(p => p.x)), dx)),
    dy: Math.max(-Math.min(...points.map(p => p.y)), Math.min(BOARD_HEIGHT - Math.max(...points.map(p => p.y)), dy))
  };
}

// A map position correction is advisory. It never records a Normal Move,
// Charge, or other phase action, and keeps attached formations together.
export function bindLiveMapPositionCorrection(container, session, { phase, onError = () => {} } = {}) {
  let drag = null;
  let suppressClickUntil = 0;
  let suppressedMarker = null;

  function deltaFor(event) {
    const rect = drag.board.getBoundingClientRect?.();
    if (!rect?.width || !rect?.height) return null;
    const state = session.getState();
    const unit = state.units.find(item => item.id === drag.unitId);
    if (!unit) return null;
    const formation = getCombatFormationMembers(state, unit);
    const x = Math.max(0, Math.min(BOARD_WIDTH, (event.clientX - rect.left) / rect.width * BOARD_WIDTH));
    const y = Math.max(0, Math.min(BOARD_HEIGHT, (1 - (event.clientY - rect.top) / rect.height) * BOARD_HEIGHT));
    return { ...clampDelta(formation, x - drag.markerX, y - drag.markerY), formation };
  }

  function down(event) {
    const marker = event.target?.closest?.('[data-map-unit-id]');
    if (!marker || !marker.closest?.('[data-map-mode="live"]')) return;
    const state = session.getState();
    if (state.phase !== phase || state.battle?.status !== 'active') return;
    const unitId = marker.getAttribute('data-map-unit-id');
    const unit = state.units.find(item => item.id === unitId);
    if (!unit || unit.status !== 'deployed' || !unit.ownerId) return;
    const board = marker.closest('[data-battlefield-map-board]');
    if (!board) return;
    const markerX = parseFloat(marker.style.left) / 100 * BOARD_WIDTH;
    const markerY = BOARD_HEIGHT - parseFloat(marker.style.top) / 100 * BOARD_HEIGHT;
    if (!Number.isFinite(markerX) || !Number.isFinite(markerY)) return;
    drag = { unitId, pointerId:event.pointerId, startX:event.clientX, startY:event.clientY,
      marker, board, markerX, markerY, left:marker.style.left, top:marker.style.top, moved:false };
    try { marker.setPointerCapture?.(event.pointerId); } catch {}
  }

  function move(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 8) drag.moved = true;
    if (!drag.moved) return;
    const next = deltaFor(event);
    if (!next) return;
    event.preventDefault?.();
    drag.marker.classList?.add?.('is-dragging');
    drag.marker.style.left = (drag.markerX + next.dx) / BOARD_WIDTH * 100 + '%';
    drag.marker.style.top = (BOARD_HEIGHT - drag.markerY - next.dy) / BOARD_HEIGHT * 100 + '%';
  }

  function up(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag;
    if (current.moved) {
      const next = deltaFor(event);
      current.marker.style.left = current.left;
      current.marker.style.top = current.top;
      if (next) {
        try {
          session.dispatchBatch(next.formation.map(member => ({
            type: COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION,
            payload: { unitId:member.id, playerId:member.ownerId,
              moves:modelsFor(member).map(model => ({ modelId:model.id, position:{
                x:Math.round((model.position.x + next.dx) * 10) / 10,
                y:Math.round((model.position.y + next.dy) * 10) / 10
              } }))
            }
          })));
          suppressedMarker = current.marker;
          suppressClickUntil = Date.now() + 500;
        } catch (error) { onError(error?.message ?? String(error)); }
      }
    }
    current.marker.classList?.remove?.('is-dragging');
    drag = null;
  }

  function cancel(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.marker.style.left = drag.left;
    drag.marker.style.top = drag.top;
    drag.marker.classList?.remove?.('is-dragging');
    drag = null;
  }

  function click(event) {
    if (Date.now() > suppressClickUntil || !suppressedMarker) return;
    if (event.target?.closest?.('[data-map-unit-id]') !== suppressedMarker) return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    suppressClickUntil = 0;
    suppressedMarker = null;
  }

  container.addEventListener?.('pointerdown', down);
  container.addEventListener?.('pointermove', move);
  container.addEventListener?.('pointerup', up);
  container.addEventListener?.('pointercancel', cancel);
  container.addEventListener?.('click', click, true);
  return () => {
    container.removeEventListener?.('pointerdown', down);
    container.removeEventListener?.('pointermove', move);
    container.removeEventListener?.('pointerup', up);
    container.removeEventListener?.('pointercancel', cancel);
    container.removeEventListener?.('click', click, true);
  };
}
