const numeric = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const frame = p => ({round:Number.isInteger(p.round) ? p.round : null, turn:Number.isInteger(p.turn) ? p.turn : null});
const probability = n => numeric(n) && n <= 1;

// Only recorded history is evidence; final positions and current weapons are never replayed.
export function getEndgameEvidence(state, scores = [], unitLabels = new Map()) {
  const history = Array.isArray(state.history) ? state.history : [];
  const units = new Map((state.units ?? []).filter(Boolean).map(u => [u.id,u]));
  const name = id => unitLabels.get(id) ?? units.get(id)?.name ?? id ?? 'Unknown unit';
  const attacks = history.flatMap((event,index) => {
    if (event?.type !== 'combat.attack_resolved') return [];
    const p=event.payload ?? {}, delta=p.stateDelta?.target;
    const sourceId=p.sourceAttackerId ?? p.attackerId, targetId=delta?.unitId ?? p.allocationTargetId ?? p.targetId;
    const actual=numeric(p.actualDamage) ? p.actualDamage : null;
    const expected=numeric(p.expectedDamage) ? p.expectedDamage : null;
    const removed=numeric(delta?.woundsBefore) && numeric(delta?.woundsAfter) && delta.woundsAfter <= delta.woundsBefore
      ? delta.woundsBefore-delta.woundsAfter : null;
    return [{...frame(p), index, attackerId:p.attackerId, declaredTargetId:p.targetId, sourceId, targetId,
      ownerId:units.get(sourceId)?.ownerId ?? null, targetOwnerId:units.get(targetId)?.ownerId ?? null,
      attackerName:name(sourceId), targetName:name(targetId), weaponName:p.weaponName ?? p.weaponId ?? 'Unknown weapon',
      phase:p.phase ?? 'combat', actual, expected, removed,
      excess:actual != null && numeric(delta?.woundsBefore) && delta?.woundsAfter === 0 ? Math.max(0,actual-delta.woundsBefore) : 0,
      destroyed:delta?.statusAfter === 'destroyed' && !!delta.statusBefore && delta.statusBefore !== 'destroyed'}];
  });
  const charges=history.flatMap((event,index) => {
    const p=event?.payload ?? {};
    if (event?.type !== 'charge.outcome_recorded' || !['successful','failed'].includes(p.outcome)) return [];
    const targets=Array.isArray(p.targetIds) ? p.targetIds : [];
    const s=p.reviewSnapshot;
    const saved=s?.version === 1 && probability(s.successProbability) && probability(s.baseProbability) && numeric(s.measuredDistance);
    const distances=targets.map(id=>p.measuredDistances?.[id]);
    const measuredDistance=distances.length && distances.every(numeric) ? Math.max(...distances) : null;
    const followUp=attacks.filter(a=>p.outcome === 'successful' && Number.isInteger(p.round) && Number.isInteger(p.turn) &&
      a.index > index && a.round === p.round && a.turn === p.turn && a.phase === 'fight' && a.attackerId === p.unitId && targets.includes(a.declaredTargetId));
    return [{...frame(p), index, unitId:p.unitId, unitName:name(p.unitId), ownerId:units.get(p.unitId)?.ownerId ?? p.playerId ?? null,
      targetNames:targets.map(name), outcome:p.outcome, measuredDistance,
      probability:saved ? s.successProbability : null, baseProbability:saved ? s.baseProbability : null,
      rerollAvailable:saved && s.rerollAvailable === true, rerollRule:saved ? s.rerollRule : null,
      followUpAttacks:followUp.length, followUpDamage:followUp.some(a=>a.actual!=null) ? followUp.reduce((n,a)=>n+(a.actual ?? 0),0) : null}];
  });
  const reviews=new Map(history.filter(e=>e?.type === 'mission_action.reviewed').map(e=>[e.payload?.actionKey,e.payload]));
  const actions=history.flatMap((event,index)=>{
    const p=event?.payload ?? {};
    if (event?.type !== 'shooting.unit_activated' || !p.missionInstanceId) return [];
    const result=reviews.get([p.round,p.turn,p.unitId].join(':'));
    return [{...frame(p),index,unitId:p.unitId,unitName:name(p.unitId),ownerId:units.get(p.unitId)?.ownerId ?? p.playerId ?? null,
      mission:p.missionName ?? p.missionInstanceId,outcome:['completed','failed'].includes(result?.outcome) ? result.outcome : 'unreviewed'}];
  });
  const roundKeys=[...new Set([...scores,...attacks,...charges,...actions,...history.filter(e=>e?.type==='unit.casualty_recorded').map(e=>frame(e.payload ?? {}))].map(e=>e.round))].sort((a,b)=>(a ?? Infinity)-(b ?? Infinity));
  const rounds=roundKeys.map(round=>({round,players:(state.players ?? []).map(player=>{
    const own=attacks.filter(a=>a.round === round && a.ownerId === player.id);
    const pairs=own.filter(a=>a.actual!=null && a.expected!=null);
    const scored=scores.filter(s=>s.round === round && s.playerId === player.id);
    const attempted=charges.filter(c=>c.round === round && c.ownerId === player.id);
    const work=actions.filter(a=>a.round === round && a.ownerId === player.id);
    return {playerId:player.id,score:scored.length ? scored.reduce((n,s)=>n+s.amount,0) : null,
      primary:scored.filter(s=>s.category==='primary').reduce((n,s)=>n+s.amount,0),
      secondary:scored.filter(s=>s.category==='secondary').reduce((n,s)=>n+s.amount,0),
      damage:own.some(a=>a.actual!=null) ? own.reduce((n,a)=>n+(a.actual ?? 0),0) : null,
      comparisons:pairs.length,actual:pairs.reduce((n,a)=>n+a.actual,0),expected:pairs.reduce((n,a)=>n+a.expected,0),
      lost:attacks.filter(a=>a.round===round && a.targetOwnerId===player.id && a.destroyed).map(a=>a.targetName),
      charges:attempted.length,successfulCharges:attempted.filter(c=>c.outcome==='successful').length,
      actions:work.length,completedActions:work.filter(a=>a.outcome==='completed').length};
  })}));
  return {attacks,charges,actions,rounds};
}

export function getEvidenceLessons(evidence, playerId) {
  const lessons=[];
  const risky=evidence.charges.filter(c=>c.ownerId===playerId && c.probability!=null && c.probability<0.5);
  if(risky.length) lessons.push({kind:'Charge planning',
    evidence:`${risky.length} recorded charge attempt(s) had a saved modeled success chance below 50%; ${risky.filter(c=>c.outcome==='failed').length} failed.`,
    advice:'Before relying on a charge for your plan, choose a fallback if it fails. A risky charge may still be the right mission decision.',
    eventIndices:risky.map(c=>c.index)});
  const excess=evidence.attacks.filter(a=>a.ownerId===playerId && a.targetOwnerId && a.targetOwnerId!==playerId && a.excess>0);
  if(excess.length) lessons.push({kind:'Attack allocation',
    evidence:`${excess.reduce((n,a)=>n+a.excess,0)} entered damage exceeded the target’s remaining wounds across ${excess.length} attack result(s).`,
    advice:'Check whether fewer attacks could reliably finish a target before allocating the rest. This is a planning prompt, not proof that legal split attacks or a better target were available.',
    eventIndices:excess.map(a=>a.index)});
  const failed=evidence.actions.filter(a=>a.ownerId===playerId && a.outcome==='failed');
  if(failed.length) lessons.push({kind:'Mission action follow-through',
    evidence:`${failed.length} mission action(s) were explicitly reviewed as failed.`,
    advice:'Review how you protected action units until their completion checkpoint. The record does not establish why they failed or how many VP could have been earned.',
    eventIndices:failed.map(a=>a.index)});
  return lessons;
}
