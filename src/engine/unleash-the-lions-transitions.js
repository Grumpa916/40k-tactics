import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getBattleRosterUnit, getBattleUnitDatasheet, getCombatFormationMembers } from '../rules/battle-unit-reference.js';
import { getCasualtyLoadoutState, normalizeCasualtySelectionName } from '../rules/live-casualty-loadout.js';

// The battle roster is a snapshot. Preserve the paid unit's points on its first
// model; the remaining model records are free bookkeeping children.
export function splitCustodesTerminators(state,{playerId,unitId,woundsByModel,vexillaModelIndex=null}={}) {
  const unit=state.units.find(item=>item.id===unitId&&item.ownerId===playerId);
  const roster=state.armyRosters?.[playerId];
  const rosterUnit=getBattleRosterUnit(state,unit);
  if(!unit||!rosterUnit) throw new Error('A saved battle roster is needed to split this unit.');
  const models=Number(unit.currentStrength??unit.metadata?.currentModelCount??unit.metadata?.modelCount);
  const formation=getCombatFormationMembers(state,unit);
  const attached=formation.filter(member=>member.id!==unitId);
  // Allarus and Aquilon currently allow one attached Leader. Never duplicate
  // mixed-datasheet models by treating the Leader as another Terminator.
  if(attached.length>1) throw new Error('Review multiple attached Leaders before splitting this unit.');
  const leader=attached[0]??null;
  const leaderRoster=leader?getBattleRosterUnit(state,leader):null;
  if(leader&&(!leaderRoster||leaderRoster.attachedToBodyguardId!==rosterUnit.id))
    throw new Error('The attached Leader must have a matching saved bodyguard link.');
  if(leader&&Number(leader.currentStrength??leader.metadata?.currentModelCount??leader.metadata?.modelCount??1)!==1)
    throw new Error('The attached Leader must contain exactly one surviving model.');
  const totalModels=models+(leader?1:0);
  if(!Number.isInteger(models)||models<1||totalModels<2)
    throw new Error('The attached unit needs at least two surviving models.');
  const profile=getBattleUnitDatasheet(state,unit);
  const perModel=Number(profile?.characteristics?.Wounds??profile?.characteristics?.wounds);
  const leaderProfile=leader?getBattleUnitDatasheet(state,leader):null;
  const leaderWounds=leader?Number(leaderProfile?.characteristics?.Wounds??leaderProfile?.characteristics?.wounds):null;
  if(!Number.isInteger(perModel)||perModel<1||(leader&&(!Number.isInteger(leaderWounds)||leaderWounds<1)))
    throw new Error('Confirm every model wound characteristic before splitting.');
  // Input order: bodyguard models first, then the attached Leader. Each has
  // its own wound ceiling; Trajann does not inherit the Allarus profile.
  const woundLimits=[...Array(models).fill(perModel),...(leader?[leaderWounds]:[])];
  if(!Array.isArray(woundsByModel)||woundsByModel.length!==totalModels||
    woundsByModel.some((value,index)=>!Number.isInteger(value)||value<1||value>woundLimits[index]))
    throw new Error('Enter valid current wounds for every surviving model, including the attached Leader last.');

  const active=getCasualtyLoadoutState(state,unit)?.activeSelections??{};
  // Assign models' equipment before the units separate. A single Vexilla
  // belongs to the selected surviving Allarus, never to all three.
  // Other mixed or uncertain equipment still requires an explicit review.
  const splitItems=items=>{
    const result=Array.from({length:models},()=>[]);
    for(const item of items??[]) {
      const name=normalizeCasualtySelectionName(item.selectionName??item.sourceName??item.name);
      const amount=active[name]??item.quantity;
      if(!Number.isInteger(amount)||amount<1)
        throw new Error('Mixed or uncertain wargear needs model-level assignment before splitting: '+(item.name??item.selectionName??'unknown selection')+'.');
      if(name==='vexilla'&&amount===1&&models>1){
        if(!Number.isInteger(vexillaModelIndex)||vexillaModelIndex<1||vexillaModelIndex>models)
          throw new Error('Choose which surviving Terminator model carries the Vexilla before splitting.');
        result[vexillaModelIndex-1].push({...item,quantity:1});
      } else {
        if(amount<models||amount%models!==0)
          throw new Error('Mixed or uncertain wargear needs model-level assignment before splitting: '+(item.name??item.selectionName??'unknown selection')+'.');
        result.forEach(items=>items.push({...item,quantity:amount/models}));
      }
    }
    return result;
  };
  const equippedWeapons=splitItems(rosterUnit.equippedWeapons);
  const equippedWargear=splitItems(rosterUnit.equippedWargear);
  const selectionsFor=index=>Object.fromEntries([
    ...equippedWeapons[index],...equippedWargear[index]
  ].map(item=>[normalizeCasualtySelectionName(item.selectionName??item.sourceName??item.name),item.quantity]));
  const origin=unit.id;
  const originalRosterId=rosterUnit.id;
  const existing=new Set(state.units.map(item=>item.id));
  const children=[];
  const snapshots=[];
  for(let index=0;index<models;index++){
    const id=index===0?unit.id:origin+':lions:'+state.battle.round+':'+state.turn+':'+(index+1);
    if(index>0&&existing.has(id)) throw new Error('A split unit already exists; refresh the battle before trying again.');
    const rosterId=index===0?originalRosterId:originalRosterId+':lions:'+state.battle.round+':'+state.turn+':'+(index+1);
    if(index>0&&roster.units.some(item=>item.id===rosterId)) throw new Error('Split roster identifier already exists.');
    const tracked=Array.isArray(unit.models) ? unit.models[index]?.position : null;
    const position=Number.isFinite(tracked?.x)&&Number.isFinite(tracked?.y) ? {...tracked} :
      unit.position&&Number.isFinite(unit.position.x)&&Number.isFinite(unit.position.y)
      ? {x:Math.max(0,Math.min(60,Math.round((unit.position.x+(index%2?1:-1)*Math.ceil(index/2)*.6)*10)/10)),
        y:Math.max(0,Math.min(44,Math.round((unit.position.y+(index%2?.4:-.4)*Math.ceil(index/2))*10)/10))}
      : unit.position;
    children.push({...unit,id,name:unit.name+' '+(index+1),position,
      models:Array.isArray(unit.models)&&unit.models[index]?[{...unit.models[index],position}]:[],
      wounds:woundsByModel[index],startingWounds:perModel,startingStrength:1,currentStrength:1,
      metadata:{...unit.metadata,rosterUnitId:rosterId,modelCount:1,currentModelCount:1,
        splitOriginId:origin,splitModelNumber:index+1},
      liveWargear:{source:'unleash-the-lions',modelsRemaining:1,
        activeSelections:selectionsFor(index)}
    });
    snapshots.push({...rosterUnit,id:rosterId,name:unit.name+' '+(index+1),modelCount:1,
      attachedLeaderIds:[],attachedToBodyguardId:null,
      equippedWeapons:equippedWeapons[index].map(item=>({...item})),
      equippedWargear:equippedWargear[index].map(item=>({...item})),
      ...(index>0?{points:0,totalPoints:0}:{}),
      splitOriginId:originalRosterId});
  }
  // The Leader is already its own live record and roster snapshot. Keep both
  // intact, remove the attachment link and give it a separate map position.
  const separatelyPlaced=leader?.models?.[0]?.position;
  const leaderPosition=Number.isFinite(separatelyPlaced?.x)&&Number.isFinite(separatelyPlaced?.y) ? {...separatelyPlaced} :
    Number.isFinite(leader?.position?.x)&&Number.isFinite(leader?.position?.y)&&
    (leader.position.x!==unit.position?.x||leader.position.y!==unit.position?.y) ? {...leader.position} :
    unit.position&&Number.isFinite(unit.position.x)&&Number.isFinite(unit.position.y)
    ? {x:Math.max(0,Math.min(60,Math.round((unit.position.x+1.2)*10)/10)),
      y:Math.max(0,Math.min(44,Math.round((unit.position.y+.8)*10)/10))}
    : leader?.position;
  const next={...state,units:state.units.flatMap(item=>{
    if(item.id===unitId) return children;
    if(leader&&item.id===leader.id) return [{...item,position:leaderPosition,
      attachedToUnitId:null,wounds:woundsByModel[models],startingWounds:leaderWounds,
      startingStrength:1,currentStrength:1,
      metadata:{...item.metadata,modelCount:1,currentModelCount:1,
        splitOriginId:origin,splitModelNumber:models+1}}];
    return [item];
  }),
    armyRosters:{...state.armyRosters,[playerId]:{...roster,
      units:roster.units.flatMap(item=>item.id===originalRosterId?snapshots:
        leader&&item.id===leaderRoster.id?[{...item,attachedToBodyguardId:null}]:[item])}}};
  return appendHistoryEntry(next,createEvent('custodes.terminators_split',{
    playerId,unitId,unitIds:[...children.map(child=>child.id),...(leader?[leader.id]:[])],
    leaderUnitIds:leader?[leader.id]:[],woundsByModel:[...woundsByModel],
    originalModels:totalModels,cpSpent:1,vexillaModelIndex,
    round:state.battle.round,turn:state.turn,phase:state.phase
  }));
}
