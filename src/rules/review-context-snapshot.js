// Compact immutable evidence captured only at confirmed actions/checkpoints.
export function getReviewContextSnapshot(state) {
  return structuredClone({version:1,round:state.battle?.round ?? null,turn:state.turn ?? null,
    phase:state.phase ?? null,activePlayerId:state.activePlayer ?? state.battle?.activePlayerId ?? null,
    objectives:(state.objectives ?? []).map(o=>({id:o.id,control:o.control ?? null,confirmedAt:o.controlRecordedAt ?? null})),
    units:(state.units ?? []).map(u=>({id:u.id,ownerId:u.ownerId,status:u.status,wounds:u.wounds ?? null,
      models:u.currentStrength ?? null,position:u.position ?? null,battleShocked:u.battleShocked ?? u.battleShock?.active ?? null,
      ...(u.models?.length?{modelPositions:u.models.map(m=>({id:m.id,position:m.position ?? null}))}:{})}))});
}

export function getAttackReviewSnapshot(distribution, target, allocationTargetId) {
  const wounds=target?.wounds;
  const targetWounds=typeof wounds==='number' && Number.isFinite(wounds) && wounds>0 ? wounds : null;
  return {version:1,model:'aggregate-wound-pool',targetId:target.id,targetWounds,
    allocationTargetId:allocationTargetId ?? null,
    destructionProbability:targetWounds==null?null:distribution.outcomes.reduce((n,o)=>n+(o.damage>=targetWounds?o.probability:0),0),
    expectedDamage:distribution.expectedDamage,context:structuredClone(distribution.contextualAbilities ?? {})};
}
