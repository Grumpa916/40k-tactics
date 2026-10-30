import { getCombatFormationMembers, getCombatFormationRoot, getBattleUnitDatasheet } from './battle-unit-reference.js';
import { isAdeptusCustodesFaction, getRosterDetachmentNames } from './roster-detachment-selection.js';
import { getEffectiveMovementAction } from '../engine/movement-refinement-transitions.js';
import { getCommandPointBalance } from '../engine/command-points-ledger.js';
import { isUnitBattleShocked } from './unit-status-summary.js';
import { getStratagemUseBlock } from './stratagem-use-state.js';

const MOVE_EVENTS = new Set(['unit.normal_move_resolved','unit.advanced','unit.fell_back','unit.stationary_recorded']);
const rootOf = (state, unit) => getCombatFormationRoot(state, unit)?.id ?? unit?.id;
const currentMove = (state,event) => event.payload?.round === state.battle?.round && event.payload?.turn === state.turn;

function hasCustodesKeyword(state, unit) {
  return getCombatFormationMembers(state,unit).some(member =>
    (getBattleUnitDatasheet(state,member)?.keywords ?? []).some(keyword => String(keyword).toLowerCase().includes('adeptus custodes'))
  );
}

export function getPreternaturalRapidityOpportunities(state,{playerId,unitId=null}={}) {
  if (state?.battle?.status !== 'active' || state.phase !== 'movement' || !playerId ||
      (state.activePlayer ?? state.battle?.activePlayerId) !== playerId) return [];
  const roster=state.armyRosters?.[playerId];
  if (!roster || !isAdeptusCustodesFaction(roster.faction) || !getRosterDetachmentNames(roster).includes('Dread Host')) return [];
  const focused=unitId ? state.units?.find(unit=>unit.id===unitId) : null;
  const focusRoot=focused ? rootOf(state,focused) : null;
  const units=(state.units??[]).filter(unit=>unit.ownerId===playerId && unit.status==='deployed' && rootOf(state,unit)===unit.id &&
    (!focusRoot || unit.id===focusRoot) && hasCustodesKeyword(state,unit));
  const latestMove=(state.history??[]).findLast(event=>MOVE_EVENTS.has(event.type) && !event.payload?.movementRefinement && currentMove(state,event));
  return units.flatMap(unit=>{
    const movement=getEffectiveMovementAction(state,unit.id);
    if (movement?.movementType!=='advance' || !currentMove(state,movement.baseEvent)) return [];
    let blockedReason=null;
    if (latestMove?.payload?.unitId!==unit.id) blockedReason='Use immediately after this unit’s Advance, before another unit moves.';
    const members=getCombatFormationMembers(state,unit);
    if (!blockedReason && members.some(isUnitBattleShocked)) blockedReason='Battle-shocked units cannot receive Stratagems.';
    blockedReason ??=getStratagemUseBlock(state,{playerId,unitId:unit.id,stratagemId:'preternatural-rapidity'});
    if (!blockedReason && getCommandPointBalance(state,playerId)<1) blockedReason='Needs 1 CP.';
    return [{stratagemId:'preternatural-rapidity',title:'Preternatural Rapidity',playerId,unitId:unit.id,unitName:unit.name,
      cpCost:1,timing:'Your Movement phase · after this unit Advances',effect:'This Advance does not prevent this unit from declaring a charge this turn.',
      available:!blockedReason,blockedReason,sourceUrl:'https://www.warhammer-community.com/en-gb/articles/joz5iubm/your-first-look-at-13-new-adeptus-custodes-detachments/'}];
  });
}
