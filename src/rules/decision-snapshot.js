/**
 * Lightweight decision snapshot for post-game review.
 * Captures what was done and what the advisor said at the moment of action.
 * Does not reconstruct map state or grade the decision.
 */

export function buildDecisionSnapshot(state, {
  unitId,
  actionType,
  targetId = null,
  weaponName = null,
  advisorNote = null,
  expectedDamage = null,
  position = null
} = {}) {
  const unit = (state.units ?? []).find(u => u.id === unitId);
  if (!unit) return null;
  return {
    version: 1,
    round: state.battle?.round ?? null,
    turn: state.turn ?? null,
    phase: state.phase ?? null,
    unitId,
    unitName: unit.name ?? unitId,
    ownerId: unit.ownerId,
    actionType,
    targetId,
    weaponName,
    advisorNote,
    expectedDamage,
    position: position ?? unit.position ?? null,
    recordedAt: new Date().toISOString()
  };
}

export function getDecisionSnapshots(state) {
  return (state.history ?? [])
    .filter(e => e.type === "decision.snapshot")
    .map(e => e.payload ?? {});
}
