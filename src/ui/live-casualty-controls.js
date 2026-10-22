import { COMMAND_TYPES } from '../commands/game-commands.js';

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

export function bindLiveCasualtyControls(container, { session } = {}) {
  if (!container?.addEventListener || !session?.dispatch) return { destroy() {} };

  const onClick = (event) => {
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
