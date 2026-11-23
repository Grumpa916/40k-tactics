import { createEvent } from '../events/event.js';
import { appendHistoryEntry } from '../state/history.js';
import { recordCommandPointChange, getCommandPointBalance } from '../engine/command-points-ledger.js';
import { adjustUnitWounds } from '../engine/unit-vitals-transitions.js';
import { getLiveUnitVitals } from './live-unit-vitals.js';
import { isUnitBattleShocked } from './unit-status-summary.js';
import { getBattleUnitDatasheet, getCombatFormationRoot } from './battle-unit-reference.js';

// 11th edition Fire Overwatch is one end-of-opponent-Movement decision. The
// approximate map cannot verify visibility, range, engagement or dice.
function reactingPlayerId(state) {
  const active=state?.activePlayer ?? state?.battle?.activePlayerId;
  return (state?.players??[]).find(player=>player.id && player.id!==active)?.id ?? null;
}
function key(state) {
  return [state.battle?.round,state.turn,state.phase,'fire-overwatch'].join(':');
}
function answered(state, triggerKey) {
  return (state.history??[]).some(event=>event.type==='overwatch.interrupt_answered' &&
    event.payload?.triggerKey===triggerKey);
}
export function overwatchUsedThisPhase(state, playerId) {
  return (state.history??[]).some(event=>event.type==='overwatch.interrupt_answered' &&
    event.payload?.decision==='use' && event.payload?.playerId===playerId &&
    event.payload?.round===state.battle?.round && event.payload?.turn===state.turn &&
    event.payload?.phase===state.phase);
}
function keywords(state,unit) {
  return (getBattleUnitDatasheet(state,unit)?.keywords??unit?.keywords??[]).map(value=>String(value).toUpperCase());
}
export function getOverwatchOffer(state) {
  if(state?.battle?.status!=='active' || state.phase!=='movement') return null;
  const playerId=reactingPlayerId(state), active=state.activePlayer??state.battle?.activePlayerId;
  const triggerKey=key(state);
  if(!playerId || answered(state,triggerKey)) return null;
  const firingUnits=(state.units??[]).filter(unit=>unit.ownerId===playerId &&
    unit.status==='deployed' && !isUnitBattleShocked(unit) &&
    !keywords(state,unit).includes('TITANIC') &&
    getCombatFormationRoot(state,unit)?.id===unit.id);
  const targets=(state.units??[]).filter(unit=>unit.ownerId===active && unit.status==='deployed' &&
    getCombatFormationRoot(state,unit)?.id===unit.id);
  if(!firingUnits.length || !targets.length) return null;
  return {playerId,activePlayerId:active,triggerKey,phase:'movement',
    cpAvailable:getCommandPointBalance(state,playerId)>=1,
    firingUnits,targets};
}
function requireOffer(state,triggerKey) {
  const offer=getOverwatchOffer(state);
  if(!offer || offer.triggerKey!==triggerKey) throw new Error('Fire Overwatch is not available for this Movement phase.');
  return offer;
}
export function recordOverwatchUse(state,{
  triggerKey,firingUnitId,targetUnitId,inRangeConfirmed=false,visibilityConfirmed=false,
  unengagedConfirmed=false,timingConfirmed=false,actualDamage=0
}={}) {
  const offer=requireOffer(state,triggerKey);
  if(!offer.cpAvailable) throw new Error('Fire Overwatch needs 1 CP.');
  if(!offer.firingUnits.some(unit=>unit.id===firingUnitId)) throw new Error('Choose an eligible deployed unit to fire.');
  if(!offer.targets.some(unit=>unit.id===targetUnitId)) throw new Error('Choose one deployed enemy target.');
  if(!timingConfirmed || !inRangeConfirmed || !visibilityConfirmed || !unengagedConfirmed)
    throw new Error('Confirm the end-of-Movement timing, unengaged firing unit, and a visible eligible target within 24 inches.');
  if(!Number.isInteger(actualDamage) || actualDamage<0) throw new Error('Damage must be a non-negative whole number.');
  const beforeTarget=state.units.find(unit=>unit.id===targetUnitId);
  const woundsBefore=getLiveUnitVitals(state,beforeTarget).wounds;
  const cp=recordCommandPointChange(state,{playerId:offer.playerId,amount:-1,reason:'spend',note:'Fire Overwatch'});
  const damaged=actualDamage ? adjustUnitWounds(cp,{unitId:targetUnitId,amount:-actualDamage}) : cp;
  const afterTarget=damaged.units.find(unit=>unit.id===targetUnitId);
  const woundsAfter=getLiveUnitVitals(damaged,afterTarget).wounds;
  const exchanged=appendHistoryEntry(damaged,createEvent('combat.attack_resolved',{
    attackerId:firingUnitId,sourceAttackerId:firingUnitId,targetId:targetUnitId,
    weaponName:'Fire Overwatch (weapon not recorded)',weaponId:null,overwatch:true,
    actualDamage:Number.isFinite(woundsBefore)&&Number.isFinite(woundsAfter)?woundsBefore-woundsAfter:actualDamage,
    phase:'movement',round:state.battle.round,turn:state.turn,
    stateDelta:{target:{unitId:targetUnitId,woundsBefore,woundsAfter,
      statusBefore:beforeTarget.status,statusAfter:afterTarget.status}}
  }));
  return appendHistoryEntry(exchanged,createEvent('overwatch.interrupt_answered',{
    decision:'use',playerId:offer.playerId,firingUnitId,targetUnitId,enemyUnitId:targetUnitId,
    moment:'end-movement',triggerKey,round:state.battle.round,turn:state.turn,phase:state.phase,
    recordedCpChange:-1,actualDamage
  }));
}
export function declineOverwatch(state,{triggerKey}={}) {
  const offer=requireOffer(state,triggerKey);
  return appendHistoryEntry(state,createEvent('overwatch.interrupt_answered',{
    decision:'decline',playerId:offer.playerId,moment:'end-movement',triggerKey,
    round:state.battle.round,turn:state.turn,phase:state.phase,recordedCpChange:0
  }));
}
