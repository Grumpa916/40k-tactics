import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { UNIT_STATUS } from '../state/unit.js';
import { getTyranidWargearRuleSet } from '../data/tyranid-wargear-rules.js';
import { getBattleRosterUnit } from '../rules/battle-unit-reference.js';
import {
  getCasualtyLoadoutState,
  normalizeCasualtySelectionName
} from '../rules/live-casualty-loadout.js';

function decrement(values, selectionName, amount = 1) {
  const key = normalizeCasualtySelectionName(selectionName);
  if (!key || !Number.isInteger(amount) || amount <= 0) return;
  const before = values[key] ?? 0;
  if (before < amount) throw new Error('Casualty loadout quantity is inconsistent for ' + selectionName + '.');
  values[key] = before - amount;
}

function cloneLiveWargear(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    ...value,
    activeSelections: value.activeSelections ? { ...value.activeSelections } : undefined,
    undoSnapshot: value.undoSnapshot ? {
      ...value.undoSnapshot,
      liveWargearBefore: cloneLiveWargear(value.undoSnapshot.liveWargearBefore)
    } : null
  };
}

export function recordUnitCasualty(state, {
  unitId,
  slotSelections = {},
  optionalSelections = {}
} = {}) {
  if (!unitId) throw new TypeError('A unit id is required to record a casualty.');
  if (!state?.battle || state.battle.status !== 'active') {
    throw new Error('Casualties can only be recorded during an active battle.');
  }
  const unit = (state.units ?? []).find((item) => item.id === unitId);
  if (!unit) throw new Error('Casualty unit not found: ' + unitId);
  if (unit.status !== UNIT_STATUS.DEPLOYED) {
    throw new Error('Only a deployed unit can record a model casualty.');
  }

  const casualty = getCasualtyLoadoutState(state, unit);
  if (!casualty?.canRecordCasualty) {
    throw new Error('This unit does not have another multi-model casualty to record.');
  }
  const rosterUnit = getBattleRosterUnit(state, unit);
  const ruleSet = getTyranidWargearRuleSet(rosterUnit?.datasheetId);
  const activeSelections = { ...casualty.activeSelections };
  const removedSelections = [];

  // Fixed per-model equipment always leaves with the removed model.
  for (const item of ruleSet?.fixed ?? []) {
    if (!item?.perModel) continue;
    decrement(activeSelections, item.name, item.perModel);
    removedSelections.push(item.name);
  }

  // Each per-model slot loses exactly the selection carried by the removed
  // model. Homogeneous slots are automatic; mixed slots require one table-side tap.
  for (const slot of ruleSet?.slots ?? []) {
    if (!slot?.perModel) continue;
    const active = (slot.choices ?? []).filter((choice) =>
      (activeSelections[normalizeCasualtySelectionName(choice.name)] ?? 0) > 0
    );
    if (!active.length) continue;
    let chosen = active[0];
    if (active.length > 1) {
      const requested = slotSelections?.[slot.id];
      chosen = active.find((choice) => normalizeCasualtySelectionName(choice.name) === normalizeCasualtySelectionName(requested));
      if (!chosen) throw new Error('Choose which ' + slot.id + ' loadout was on the removed model.');
    }
    decrement(activeSelections, chosen.name, slot.perModel);
    removedSelections.push(chosen.name);
  }

  for (const item of ruleSet?.optional ?? []) {
    if (!item?.perModel) continue;
    const key = normalizeCasualtySelectionName(item.name);
    const quantity = activeSelections[key] ?? 0;
    if (!quantity) continue;
    const maxForCurrentModels = casualty.currentModels * item.perModel;
    const automatic = item.allOrNone || quantity >= maxForCurrentModels;
    let removed = automatic;
    if (!automatic) {
      if (!Object.hasOwn(optionalSelections ?? {}, item.name)) {
        throw new Error('Confirm whether the removed model had ' + item.name + '.');
      }
      removed = optionalSelections[item.name] === true;
    }
    if (removed) {
      decrement(activeSelections, item.name, item.perModel);
      removedSelections.push(item.name);
    }
  }

  const modelsBefore = casualty.currentModels;
  const modelsAfter = modelsBefore - 1;
  const statusBefore = unit.status;
  const statusAfter = modelsAfter <= 0 ? UNIT_STATUS.DESTROYED : statusBefore;
  const undoSnapshot = {
    hadCurrentStrength: Object.hasOwn(unit, 'currentStrength'),
    currentStrengthBefore: unit.currentStrength,
    statusBefore,
    liveWargearBefore: cloneLiveWargear(unit.liveWargear)
  };
  const unitAfter = {
    ...unit,
    currentStrength: modelsAfter,
    status: statusAfter,
    liveWargear: {
      ...(unit.liveWargear ?? {}),
      source: 'tabletop-casualty-tracking',
      modelsRemaining: modelsAfter,
      activeSelections,
      undoSnapshot
    }
  };
  const event = createEvent('unit.casualty_recorded', {
    unitId,
    playerId: unit.ownerId,
    modelsBefore,
    modelsAfter,
    removedSelections,
    activeSelectionsAfter: activeSelections,
    statusBefore,
    statusAfter,
    round: state.battle.round ?? 0,
    turn: state.turn ?? 0,
    phase: state.phase ?? null
  });
  return appendHistoryEntry({
    ...state,
    units: state.units.map((item) => item.id === unitId ? unitAfter : item)
  }, event);
}

export function undoUnitCasualty(state, { unitId } = {}) {
  if (!unitId) throw new TypeError('A unit id is required to undo a casualty.');
  const unit = (state.units ?? []).find((item) => item.id === unitId);
  if (!unit) throw new Error('Casualty unit not found: ' + unitId);
  const snapshot = unit?.liveWargear?.undoSnapshot;
  if (!snapshot) throw new Error('No recorded casualty is available to undo for this unit.');

  const modelsBeforeUndo = unit.currentStrength;
  const restoredLiveWargear = cloneLiveWargear(snapshot.liveWargearBefore);
  const unitAfter = {
    ...unit,
    status: snapshot.statusBefore,
    ...(restoredLiveWargear ? { liveWargear: restoredLiveWargear } : {})
  };
  if (!restoredLiveWargear) delete unitAfter.liveWargear;
  if (snapshot.hadCurrentStrength) unitAfter.currentStrength = snapshot.currentStrengthBefore;
  else delete unitAfter.currentStrength;

  const restored = getCasualtyLoadoutState({ ...state, units: state.units.map((item) => item.id === unitId ? unitAfter : item) }, unitAfter);
  const event = createEvent('unit.casualty_undone', {
    unitId,
    playerId: unit.ownerId,
    modelsBefore: modelsBeforeUndo,
    modelsAfter: restored?.currentModels ?? null,
    round: state.battle?.round ?? 0,
    turn: state.turn ?? 0,
    phase: state.phase ?? null
  });
  return appendHistoryEntry({
    ...state,
    units: state.units.map((item) => item.id === unitId ? unitAfter : item)
  }, event);
}
