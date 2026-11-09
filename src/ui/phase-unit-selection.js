import { getCombatFormationRootId } from '../rules/battle-unit-reference.js';

// View-only selection shared by the battle shell's mounted phase screens.
// Never dispatch commands or serialize this into a saved game.
function turnScope(state) {
  return [
    state?.battle?.id ?? null,
    state?.battle?.round ?? null,
    state?.turn ?? null,
    state?.activePlayer ?? state?.battle?.activePlayerId ?? null
  ];
}

function sameScope(left, right) {
  return left?.length === right?.length && left.every((value, index) => value === right[index]);
}

export function createPhaseUnitSelection() {
  let selected = null;
  const listeners = new Set();
  const notify = () => { for (const listener of listeners) listener(selected?.unitId ?? null); };

  const validSelection = state => {
    if (!selected) return null;
    if (!sameScope(selected.scope, turnScope(state))) {
      selected = null; // Never leak one turn's unit into another player's turn.
      return null;
    }
    const unit = (state?.units ?? []).find(unit => unit?.id === selected.unitId);
    if (!unit || !['deployed', 'reserves'].includes(unit.status)) {
      selected = null; // Destroyed, removed or missing units cannot stay selected.
      return null;
    }
    const currentRootId = getCombatFormationRootId(state, unit.id);
    if (currentRootId !== selected.unitId) {
      const root = (state.units ?? []).find(entry => entry?.id === currentRootId);
      if (!root || !['deployed', 'reserves'].includes(root.status)) {
        selected = null;
        return null;
      }
      selected.unitId = currentRootId;
    }
    return selected.unitId;
  };

  return {
    get(state, { eligibleIds = null } = {}) {
      const id = validSelection(state);
      return id && (eligibleIds == null || new Set(eligibleIds).has(id)) ? id : null;
    },
    select(state, unitId, { eligibleIds = null } = {}) {
      if (!unitId) return false;
      const unit = (state?.units ?? []).find(item => item?.id === unitId);
      if (!unit || !['deployed', 'reserves'].includes(unit.status)) return false;
      const rootId = getCombatFormationRootId(state, unitId);
      const root = (state.units ?? []).find(item => item.id === rootId);
      if (!root || !['deployed', 'reserves'].includes(root.status)) return false;
      if (eligibleIds != null && !new Set(eligibleIds).has(rootId)) return false;
      const changed = selected?.unitId !== rootId || !sameScope(selected.scope, turnScope(state));
      selected = { unitId:rootId, scope:turnScope(state) };
      if (changed) notify();
      return true;
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    clear() { if (selected) { selected = null; notify(); } }
  };
}
