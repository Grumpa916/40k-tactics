import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { getBattleRosterUnit, getBattleUnitDatasheet } from '../rules/battle-unit-reference.js';
import { getCasualtyLoadoutState, normalizeCasualtySelectionName } from '../rules/live-casualty-loadout.js';

// The battle roster is a snapshot. Preserve the paid unit's points on its first
// model; the remaining model records are free bookkeeping children.
export function splitCustodesTerminators(state,{playerId,unitId,woundsByModel}={}) {
  const unit=state.units.find(item=>item.id===unitId&&item.ownerId===playerId);
  const roster=state.armyRosters?.[playerId];
  const rosterUnit=getBattleRosterUnit(state,unit);
  if(!unit||!rosterUnit) throw new Error('A saved battle roster is needed to split this unit.');
  const models=Number(unit.currentStrength??unit.metadata?.currentModelCount??unit.metadata?.modelCount);
  if(!Number.isInteger(models)||models<2) throw new Error('The unit needs at least two surviving models.');
  const profile=getBattleUnitDatasheet(state,unit);
  const perModel=Number(profile?.characteristics?.Wounds??profile?.characteristics?.wounds);
  if(!Number.isInteger(perModel)||perModel<1) throw new Error('Confirm the model wound characteristic before splitting.');
  if(!Array.isArray(woundsByModel)||woundsByModel.length!==models||
    woundsByModel.some(value=>!Number.isInteger(value)||value<1||value>perModel))
    throw new Error('Enter current wounds for each surviving model, from 1 to '+perModel+'.');

  const active=getCasualtyLoadoutState(state,unit)?.activeSelections??{};
  const splitItems=items=>(items??[]).map(item=>{
    const name=normalizeCasualtySelectionName(item.selectionName??item.sourceName??item.name);
    const amount=active[name]??item.quantity;
    if(!Number.isInteger(amount)||amount<models||amount%models!==0)
      throw new Error('Mixed or uncertain wargear needs model-level assignment before splitting: '+(item.name??item.selectionName??'unknown selection')+'.');
    return {...item,quantity:amount/models};
  });
  const equippedWeapons=splitItems(rosterUnit.equippedWeapons);
  const equippedWargear=splitItems(rosterUnit.equippedWargear);
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
    const position=unit.position&&Number.isFinite(unit.position.x)&&Number.isFinite(unit.position.y)
      ? {x:Math.max(0,Math.min(60,Math.round((unit.position.x+(index%2?1:-1)*Math.ceil(index/2)*.6)*10)/10)),
        y:Math.max(0,Math.min(44,Math.round((unit.position.y+(index%2?.4:-.4)*Math.ceil(index/2))*10)/10))}
      : unit.position;
    children.push({...unit,id,name:unit.name+' '+(index+1),position,
      models:Array.isArray(unit.models)&&unit.models[index]?[unit.models[index]]:[],
      wounds:woundsByModel[index],startingWounds:perModel,startingStrength:1,currentStrength:1,
      metadata:{...unit.metadata,rosterUnitId:rosterId,modelCount:1,currentModelCount:1,
        splitOriginId:origin,splitModelNumber:index+1},
      liveWargear:{source:'unleash-the-lions',modelsRemaining:1,
        activeSelections:Object.fromEntries(Object.entries(active).map(([name,quantity])=>[name,quantity/models]))}
    });
    snapshots.push({...rosterUnit,id:rosterId,name:unit.name+' '+(index+1),modelCount:1,
      attachedLeaderIds:[],attachedToBodyguardId:null,
      equippedWeapons:equippedWeapons.map(item=>({...item})),
      equippedWargear:equippedWargear.map(item=>({...item})),
      ...(index>0?{points:0,totalPoints:0}:{}),
      splitOriginId:originalRosterId});
  }
  const next={...state,units:state.units.flatMap(item=>item.id===unitId?children:[item]),
    armyRosters:{...state.armyRosters,[playerId]:{...roster,
      units:roster.units.flatMap(item=>item.id===originalRosterId?snapshots:[item])}}};
  return appendHistoryEntry(next,createEvent('custodes.terminators_split',{
    playerId,unitId,unitIds:children.map(child=>child.id),woundsByModel:[...woundsByModel],
    originalModels:models,cpSpent:1,round:state.battle.round,turn:state.turn,phase:state.phase
  }));
}
