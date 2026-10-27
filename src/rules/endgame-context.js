const finite=n=>typeof n==='number' && Number.isFinite(n);
const timing=p=>({round:Number.isInteger(p.round)?p.round:null,turn:Number.isInteger(p.turn)?p.turn:null,phase:p.phase ?? null});
export function getEndgameContext(state,unitLabels=new Map()) {
  const history=state.history ?? [],units=new Map((state.units ?? []).map(u=>[u.id,u]));
  const name=id=>unitLabels.get(id) ?? units.get(id)?.name ?? id ?? 'Unknown';
  const reversed=new Set(),stacks=new Map();
  history.forEach((e,index)=>{
    const p=e?.payload ?? {};
    if(e?.type==='unit.casualty_recorded') {if(!stacks.has(p.unitId))stacks.set(p.unitId,[]);stacks.get(p.unitId).push(index);}
    if(e?.type==='unit.casualty_undone') {
      const stack=stacks.get(p.unitId) ?? [];
      const original=p.originalCasualtyEventId?history.findIndex(event=>event?.id===p.originalCasualtyEventId):Number.isInteger(p.originalCasualtyEventIndex)?p.originalCasualtyEventIndex:stack.at(-1);
      if(original!=null && original>=0){reversed.add(original);const i=stack.indexOf(original);if(i>=0)stack.splice(i,1);}
    }
  });
  const objectives=[],snapshots=[],positions=[],losses=[],resources=[],forecasts=[];
  history.forEach((e,index)=>{
    const p=e?.payload ?? {},base={...timing(p),index};
    if(e?.type==='objective.control_recorded')objectives.push({...base,objectiveId:p.id ?? p.objectiveId,before:p.previousControl ?? null,
      after:{controlState:p.controlState,controllerId:p.controllerId,contestingPlayerIds:p.contestingPlayerIds ?? []}});
    if(p.reviewSnapshot?.version===1 && Array.isArray(p.reviewSnapshot.units))snapshots.push({...base,kind:e.type==='turn.phase_changed'?'Phase ending':'Scoring checkpoint',snapshot:p.reviewSnapshot});
    if(e?.type==='battlefield_map.position_adjusted' || ['unit.normal_move_resolved','unit.advanced'].includes(e?.type))positions.push({...base,unitId:p.unitId,unitName:name(p.unitId),kind:e.type==='battlefield_map.position_adjusted'?'Map correction':'Recorded movement',moves:p.moves ?? []});
    if(e?.type==='unit.casualty_recorded' && !reversed.has(index))losses.push({...base,unitId:p.unitId,unitName:name(p.unitId),ownerId:p.playerId ?? units.get(p.unitId)?.ownerId ?? null,
      modelsLost:finite(p.modelsBefore)&&finite(p.modelsAfter)?Math.max(0,p.modelsBefore-p.modelsAfter):null,
      destroyed:p.statusAfter==='destroyed' && p.statusBefore!=='destroyed',source:'Manual casualty',attackerId:null});
    if(e?.type==='combat.attack_resolved'){
      const d=p.stateDelta?.target,id=d?.unitId ?? p.allocationTargetId ?? p.targetId;
      if(d?.statusAfter==='destroyed' && d.statusBefore && d.statusBefore!=='destroyed')losses.push({...base,unitId:id,unitName:name(id),ownerId:units.get(id)?.ownerId ?? null,modelsLost:null,destroyed:true,source:'Combat result',attackerId:p.sourceAttackerId ?? p.attackerId});
      if(p.reviewSnapshot?.version===1 && p.reviewSnapshot.model==='aggregate-wound-pool')forecasts.push({...base,attackerName:name(p.sourceAttackerId ?? p.attackerId),targetName:name(p.reviewSnapshot.targetId),weaponName:p.weaponName ?? p.weaponId ?? 'Unknown',snapshot:p.reviewSnapshot});
    }
    if(e?.type==='command_points.changed' && finite(p.amount))resources.push({...base,playerId:p.playerId,kind:'CP',amount:p.amount,reason:p.reason,note:p.note ?? '',balanceBefore:p.balanceBefore ?? null,balanceAfter:p.balanceAfter ?? null});
    if(e?.type==='custodes.katah_expended')resources.push({...base,playerId:p.playerId,unitName:name(p.unitId),kind:'Ka’tah',amount:null,reason:p.katahName,note:p.effect ?? ''});
    if(e?.type==='custodes.katah_readied')resources.push({...base,playerId:p.playerId,unitName:name(p.unitId),kind:'Readiness restored',amount:null,reason:p.source ?? '',note:''});
    if(e?.type==='faction_ability.decision_recorded')resources.push({...base,playerId:p.playerId,unitName:p.unitId?name(p.unitId):null,kind:'Faction decision',amount:null,reason:p.decisionId ?? 'Recorded decision',note:p.choiceName ?? p.choice ?? ''});
  });
  const resourceTotals=(state.players ?? []).map(player=>{
    const entries=resources.filter(r=>r.playerId===player.id && r.kind==='CP');
    return {playerId:player.id,gained:entries.filter(r=>r.reason==='gain').reduce((n,r)=>n+r.amount,0),
      spent:-entries.filter(r=>r.reason==='spend').reduce((n,r)=>n+r.amount,0),
      adjustments:entries.filter(r=>!['gain','spend'].includes(r.reason)).reduce((n,r)=>n+r.amount,0),
      recorded:entries.length,balance:typeof state.commandPoints?.[player.id]==='number'?state.commandPoints[player.id]:state.commandPoints?.[player.id]?.current ?? null};
  });
  return {objectives,snapshots,positions,losses,resources,resourceTotals,forecasts};
}
