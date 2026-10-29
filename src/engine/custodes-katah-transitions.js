import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getCombatFormationRoot } from "../rules/battle-unit-reference.js";
import { isRulesPhaseOpening, isRulesPhaseEndConfirmed } from '../rules/rules-phase-window.js';
import {
  getCustodesKatahDefinition,
  getCustodesKatahState,
  isCustodesKatahTimingAvailable
} from "../rules/custodes-tactical-advisor.js";

function unitById(state, unitId) {
  return (Array.isArray(state?.units) ? state.units : []).find((unit) => unit?.id === unitId) ?? null;
}

export function recordCustodesKatahUse(state, { playerId, unitId, katahName } = {}) {
  if (isRulesPhaseEndConfirmed(state)) throw new Error('This phase’s end has been confirmed; use the next appropriate Ka’tah window.');
  if (!state?.battle || state.battle.status !== "active") {
    throw new Error("Martial Ka'tah use can only be recorded during an active battle.");
  }
  const unit = unitById(state, unitId);
  if (!unit || unit.ownerId !== playerId) {
    throw new Error("Choose one of this player's deployed Custodes units.");
  }
  const definition = getCustodesKatahDefinition(katahName);
  if (!definition) throw new RangeError("Choose one of the six Martial Ka'tahs.");
  const root = getCombatFormationRoot(state, unit) ?? unit;
  const readiness = getCustodesKatahState(state, { playerId, unitId: root.id });
  if (!readiness.eligible) throw new Error("This unit is not eligible for Martial Ka'tah.");
  if (!readiness.readied) throw new Error("This unit has already expended its Martial Ka'tah readiness for the current cycle.");
  if (!isCustodesKatahTimingAvailable(state, definition.name, playerId)) {
    throw new Error(`${definition.name} cannot be recorded in the current phase/turn timing.`);
  }
  if (['Dacatarai','Kaptaris'].includes(definition.name) && !isRulesPhaseOpening(state)) {
    throw new Error(`${definition.name} must be chosen at the start of the Fight phase.`);
  }

  return appendHistoryEntry(state, createEvent("custodes.katah_expended", {
    playerId,
    unitId: root.id,
    katahName: definition.name,
    timing: definition.timing,
    effect: definition.effect,
    cycleRound: readiness.cycleRound,
    round: state.battle.round ?? 0,
    turn: state.turn ?? 0,
    phase: state.phase
  }));
}

/**
 * Explicit re-ready hook for reviewed rules such as Master of Ka'tahs or
 * Superhuman Focus. Callers remain responsible for validating the source rule's
 * CP, timing and once-per-round limits before using this transition.
 */
export function recordCustodesKatahReadied(state, { playerId, unitId, source = "reviewed-rule" } = {}) {
  if (!state?.battle || state.battle.status !== "active") {
    throw new Error("Martial Ka'tah readiness can only be recorded during an active battle.");
  }
  const unit = unitById(state, unitId);
  if (!unit || unit.ownerId !== playerId) throw new Error("Choose one of this player's Custodes units.");
  const root = getCombatFormationRoot(state, unit) ?? unit;
  const readiness = getCustodesKatahState(state, { playerId, unitId: root.id });
  if (!readiness.eligible) throw new Error("This unit is not eligible for Martial Ka'tah.");
  if (readiness.readied) throw new Error("This unit is already readied.");

  return appendHistoryEntry(state, createEvent("custodes.katah_readied", {
    playerId,
    unitId: root.id,
    source,
    cycleRound: readiness.cycleRound,
    round: state.battle.round ?? 0,
    turn: state.turn ?? 0,
    phase: state.phase
  }));
}
