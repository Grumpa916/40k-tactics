import { COMMAND_TYPES } from '../commands/game-commands.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';

function parseSimpleCasualty(button) {
  const slotId = button.getAttribute('data-casualty-slot-id');
  const selection = button.getAttribute('data-casualty-selection');
  return {
    unitId: button.getAttribute('data-unit-id'),
    slotSelections: slotId && selection ? { [slotId]: selection } : {},
    optionalSelections: {}
  };
}

function parseComplexCasualty(editor) {
  const slotSelections = {};
  editor.querySelectorAll('[data-casualty-slot]').forEach((select) => {
    const slotId = select.getAttribute('data-casualty-slot');
    if (slotId && select.value) slotSelections[slotId] = select.value;
  });
  const optionalSelections = {};
  editor.querySelectorAll('[data-casualty-optional]').forEach((input) => {
    const name = input.getAttribute('data-casualty-optional');
    if (name) optionalSelections[name] = Boolean(input.checked);
  });
  return {
    unitId: editor.getAttribute('data-casualty-editor'),
    slotSelections,
    optionalSelections
  };
}

function showError(button, error) {
  const host = button.closest?.('[data-casualty-editor], [data-casualty-controls]')
    ?.querySelector?.('[data-casualty-message]');
  if (host) host.textContent = error?.message ?? String(error);
}

function showGlobalMessage(button, message) {
  const host = button?.closest?.('[data-global-state-controls]')?.querySelector?.('[data-global-state-message]');
  if (host) host.textContent = message ?? '';
}

function tappedBoardPosition(event, board) {
  const rect = board?.getBoundingClientRect?.();
  if (!rect || !rect.width || !rect.height) throw new Error('Battlefield map is not available for placement.');
  const x = Math.max(0, Math.min(60, (event.clientX - rect.left) / rect.width * 60));
  const y = Math.max(0, Math.min(44, (1 - (event.clientY - rect.top) / rect.height) * 44));
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

function positionedModels(unit) {
  if (Array.isArray(unit?.models) && unit.models.length) {
    return unit.models.filter((model) => Number.isFinite(model?.position?.x) && Number.isFinite(model?.position?.y));
  }
  return Number.isFinite(unit?.position?.x) && Number.isFinite(unit?.position?.y)
    ? [{ id: unit.id, position: unit.position }]
    : [];
}

function translatedMoves(unit, target) {
  const models = positionedModels(unit);
  if (!models.length) throw new Error('This unit has no current map position to reposition.');
  const anchor = models.reduce((sum, model) => ({ x: sum.x + model.position.x, y: sum.y + model.position.y }), { x: 0, y: 0 });
  anchor.x /= models.length;
  anchor.y /= models.length;
  const minX = Math.min(...models.map((model) => model.position.x));
  const maxX = Math.max(...models.map((model) => model.position.x));
  const minY = Math.min(...models.map((model) => model.position.y));
  const maxY = Math.max(...models.map((model) => model.position.y));
  const dx = Math.max(-minX, Math.min(60 - maxX, target.x - anchor.x));
  const dy = Math.max(-minY, Math.min(44 - maxY, target.y - anchor.y));
  return models.map((model) => ({
    modelId: model.id,
    position: {
      x: Math.round((model.position.x + dx) * 10) / 10,
      y: Math.round((model.position.y + dy) * 10) / 10
    }
  }));
}

export function bindLiveCasualtyControls(container, { session } = {}) {
  if (!container?.addEventListener || !session?.dispatch) return { destroy() {} };

  let pendingMapUnitId = null;
  let pendingMapMode = null;
  let pendingMapButton = null;

  const clearPendingMap = () => {
    pendingMapUnitId = null;
    pendingMapMode = null;
    pendingMapButton = null;
  };

  const onClick = (event) => {
    const wound = event.target?.closest?.('[data-adjust-unit-wounds]');
    if (wound && container.contains(wound)) {
      try {
        session.dispatch({
          type: COMMAND_TYPES.ADJUST_UNIT_WOUNDS,
          payload: {
            unitId: wound.getAttribute('data-unit-id'),
            amount: Number(wound.getAttribute('data-adjust-unit-wounds'))
          }
        });
      } catch (error) {
        showGlobalMessage(wound, error?.message ?? String(error));
      }
      return;
    }

    const battleShock = event.target?.closest?.('[data-toggle-live-battle-shock]');
    if (battleShock && container.contains(battleShock)) {
      try {
        const unitId = battleShock.getAttribute('data-unit-id');
        const unit = session.getState().units?.find((item) => item.id === unitId);
        if (!unit) throw new Error('Unit not found.');
        session.dispatch({
          type: COMMAND_TYPES.SET_MANUAL_BATTLE_SHOCK,
          payload: { unitId, battleShocked: !isUnitBattleShocked(unit) }
        });
      } catch (error) {
        showGlobalMessage(battleShock, error?.message ?? String(error));
      }
      return;
    }

    const reposition = event.target?.closest?.('[data-live-map-reposition]');
    if (reposition && container.contains(reposition)) {
      pendingMapUnitId = reposition.getAttribute('data-unit-id');
      pendingMapMode = 'reposition';
      pendingMapButton = reposition;
      showGlobalMessage(reposition, 'Tap an empty point on the battlefield map.');
      return;
    }

    const reserveTransfer = event.target?.closest?.('[data-live-reserve-transfer]');
    if (reserveTransfer && container.contains(reserveTransfer)) {
      const destination = reserveTransfer.getAttribute('data-live-reserve-transfer');
      const unitId = reserveTransfer.getAttribute('data-unit-id');
      if (destination === 'battlefield') {
        pendingMapUnitId = unitId;
        pendingMapMode = 'deploy';
        pendingMapButton = reserveTransfer;
        showGlobalMessage(reserveTransfer, 'Tap an empty point on the battlefield map.');
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.TRANSFER_MAP_RESERVE, payload: { unitId, destination: 'reserves' } });
        clearPendingMap();
      } catch (error) {
        showGlobalMessage(reserveTransfer, error?.message ?? String(error));
      }
      return;
    }

    const board = event.target?.closest?.('[data-battlefield-map-board]');
    if (board && pendingMapUnitId && !event.target?.closest?.('[data-map-unit-id], [data-map-objective-id]')) {
      try {
        const position = tappedBoardPosition(event, board);
        const state = session.getState();
        const unit = state.units?.find((item) => item.id === pendingMapUnitId);
        if (!unit) throw new Error('Unit not found.');
        if (pendingMapMode === 'deploy') {
          session.dispatch({
            type: COMMAND_TYPES.TRANSFER_MAP_RESERVE,
            payload: { unitId: unit.id, destination: 'battlefield', position }
          });
        } else {
          session.dispatch({
            type: COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION,
            payload: { unitId: unit.id, playerId: unit.ownerId, moves: translatedMoves(unit, position) }
          });
        }
        clearPendingMap();
      } catch (error) {
        showGlobalMessage(pendingMapButton, error?.message ?? String(error));
      }
      return;
    }

    const undo = event.target?.closest?.('[data-undo-casualty]');
    if (undo && container.contains(undo)) {
      try {
        session.dispatch({
          type: COMMAND_TYPES.UNDO_UNIT_CASUALTY,
          payload: { unitId: undo.getAttribute('data-unit-id') }
        });
      } catch (error) {
        showError(undo, error);
      }
      return;
    }

    const simple = event.target?.closest?.('[data-record-casualty]');
    if (simple && container.contains(simple)) {
      try {
        session.dispatch({ type: COMMAND_TYPES.RECORD_UNIT_CASUALTY, payload: parseSimpleCasualty(simple) });
      } catch (error) {
        showError(simple, error);
      }
      return;
    }

    const submit = event.target?.closest?.('[data-submit-casualty]');
    if (!submit || !container.contains(submit)) return;
    const editor = submit.closest?.('[data-casualty-editor]');
    if (!editor) return;
    try {
      session.dispatch({ type: COMMAND_TYPES.RECORD_UNIT_CASUALTY, payload: parseComplexCasualty(editor) });
    } catch (error) {
      showError(submit, error);
    }
  };

  container.addEventListener('click', onClick);
  return { destroy: () => container.removeEventListener('click', onClick) };
}