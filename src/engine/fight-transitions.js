import { finishCombatActivation } from "./combat-activation-transitions.js";
import { UNIT_STATUS } from "../state/unit.js";
import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";
import { getFightCandidates } from "../rules/fight-candidates.js";
import { getCombatFormationRoot } from "../rules/battle-unit-reference.js";
import { changePhase } from "./state-transitions.js";

function ownerId(state, unitId) {
  return state.units.find((unit) => unit.id === unitId)?.ownerId ?? null;
}

// Chargers and other Fights First units are selected first. Each step alternates,
// starting with the non-active player when that player still has a unit in the step.
export function nextFightSelection(state, candidates = getFightCandidates(state)) {
  const active = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const other = (state.players ?? []).find((player) => player.id !== active)?.id ?? null;
  const step = candidates.fightsFirst.length ? "fightsFirst" : "normal";
  const remaining = step === "fightsFirst" ? candidates.fightsFirst : candidates.normal;
  if (!other) return { step, playerId: active, unitIds: remaining };
  const activations = (state.history ?? []).filter((event) =>
    event?.type === "fight.unit_activated" &&
    event?.payload?.turn === state.turn &&
    (event?.payload?.actionType ?? "fight") === "fight" &&
    Boolean(event?.payload?.fightsFirst) === (step === "fightsFirst")
  );
  const initial = new Set([...remaining, ...activations.map((event) => event.payload.unitId)]);
  const left = new Set(initial);
  const has = (playerId) => [...left].some((id) => ownerId(state, id) === playerId);
  let picker = has(other) ? other : active;
  for (const event of activations) {
    if (!has(picker)) picker = picker === active ? other : active;
    left.delete(event.payload.unitId);
    const switched = picker === active ? other : active;
    picker = has(switched) ? switched : picker;
  }
  if (!has(picker)) picker = picker === active ? other : active;
  return { step, playerId: picker, unitIds: remaining.filter((id) => ownerId(state, id) === picker) };
}

function assertFightPickOrder(state, unit, candidates, tabletopConfirmed) {
  if (candidates.fightsFirst.length > 0 && !candidates.fightsFirst.includes(unit.id)) {
    throw new Error("Fights First candidates must be activated before normal Fight candidates.");
  }
  const next = nextFightSelection(state, candidates);
  if (next.playerId && unit.ownerId !== next.playerId) {
    throw new Error("Players alternate Fight selections. The other player chooses the next unit.");
  }
  const isCandidate = candidates.fightsFirst.includes(unit.id) || candidates.normal.includes(unit.id);
  if (!tabletopConfirmed && !isCandidate) {
    throw new Error("Unit is not an available Fight candidate.");
  }
}

export function recordFightActivation(state, {
  unitId,
  actionType = "fight",
  tabletopConfirmed = false
} = {}) {
  if (!unitId) throw new TypeError("Fight activation unit id is required.");
  if (!new Set(["fight", "not_fight"]).has(actionType)) {
    throw new RangeError("Fight activation action type must be fight or not_fight.");
  }
  if (!state.battle || state.battle.status !== "active") throw new Error("Battle must be active.");
  if (state.phase !== "fight") throw new Error("Fight activations may only be recorded in the Fight phase.");

  const unit = state.units.find((item) => item.id === unitId);
  if (!unit) throw new Error("Fight activation unit not found: " + unitId);
  if (unit.status !== UNIT_STATUS.DEPLOYED) {
    throw new Error("Fight activation unit must be deployed.");
  }
  if (getCombatFormationRoot(state, unit)?.id !== unit.id) {
    throw new Error("Fight activations must be recorded for the combat formation, not an attached member.");
  }
  if (!unit.ownerId) throw new Error("Fight activation unit must have an owner.");
  if (state.players.length > 0 && !state.players.some((player) => player.id === unit.ownerId)) {
    throw new Error("Fight activation unit owner must be a player in the game.");
  }

  if (state.history.some((event) =>
    event.type === "fight.unit_activated" &&
    event.payload?.unitId === unitId &&
    event.payload?.turn === state.turn
  )) {
    throw new Error("A unit can be activated to fight only once per turn.");
  }

  const candidates = getFightCandidates(state);
  const isCandidate = candidates.fightsFirst.includes(unitId) || candidates.normal.includes(unitId);
  if (!tabletopConfirmed && !isCandidate) {
    throw new Error("Unit is not an available Fight candidate.");
  }

  if (actionType === "fight") assertFightPickOrder(state, unit, candidates, tabletopConfirmed);

  const event = createEvent("fight.unit_activated", {
    unitId,
    playerId: unit.ownerId,
    round: state.battle.round,
    turn: state.turn,
    fightsFirst: candidates.fightsFirst.includes(unitId),
    actionType,
    tabletopConfirmed: tabletopConfirmed === true
  });
  return appendHistoryEntry(state, event);
}

export function completeFightPhase(state, { confirmRemaining = false } = {}) {
  if (state.phase !== "fight") throw new Error("End Fight during the Fight phase.");
  let next = state;
  if (confirmRemaining) {
    // Explicit confirmation records each remaining inferred candidate as not fighting.
    // Tabletop-only eligibility is never invented during phase completion.
    let candidates = getFightCandidates(next);
    for (const id of [...candidates.fightsFirst, ...candidates.normal]) {
      next = recordFightActivation(next, { unitId:id, actionType:"not_fight" });
    }
  }
  const activations = next.history.filter(event => event.type === "fight.unit_activated" &&
    event.payload?.round === next.battle.round && event.payload?.turn === next.turn &&
    (event.payload?.actionType ?? "fight") === "fight");
  for (const activation of activations) next = finishCombatActivation(next, { unitId:activation.payload.unitId });
  return changePhase(next, { phase:"end_turn" });
}
