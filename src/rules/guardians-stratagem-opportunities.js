import { ADEPTUS_CUSTODES_DETACHMENTS, ADEPTUS_CUSTODES_RULE_SOURCES } from '../data/adeptus-custodes-faction-rules.js';
import { getBattleUnitDatasheet, getCombatFormationRoot, getCombatFormationMembers, hasConfirmedNoRangedWeaponsForFormation } from './battle-unit-reference.js';
import { hasCustodesDetachment, getCustodesKatahState } from './custodes-tactical-advisor.js';
import { getFightEngagementState } from './fight-engagement-state.js';
import { isCombatActivationFinished } from './combat-activation-state.js';
import { isUnitBattleShocked } from './unit-status-summary.js';
import { isRulesPhaseOpening, isRulesPhaseEndConfirmed, rulesContextKey } from './rules-phase-window.js';
import { getRecordedStratagemUses, getStratagemUseBlock, getActiveGuardiansEffects } from './stratagem-use-state.js';
import { getCommandPointBalance } from '../engine/command-points-ledger.js';
import { getEffectiveMovementAction } from '../engine/movement-refinement-transitions.js';

const definitions = [
  ['superhuman-focus','Superhuman Focus',['command','movement','shooting','charge','fight'],'end'],
  ['unlimited-endurance','Unlimited Endurance',['movement'],'own'],
  ['shield-of-honour','Shield of Honour',['fight'],'start'],
  ['prime-target','Prime Target',['shooting'],'own'],
  ['in-auramite-clad','In Auramite Clad',['shooting','fight'],'enemy-attack'],
  ['swift-as-the-eagle','Swift as the Eagle',['movement'],'opponent']
];
const current = (state, event) => event.payload?.round === state.battle?.round && event.payload.turn === state.turn;
const keywords = (state, unit) => getCombatFormationMembers(state, unit).flatMap(member => getBattleUnitDatasheet(state,member)?.keywords ?? []).map(value=>String(value).toLowerCase());
const attacked = (state, id) => (state.history ?? []).some(event => event.type === 'combat.attack_resolved' && current(state,event) && event.payload.phase === state.phase && event.payload.attackerId === id);

export function getGuardiansEnemyOptions(state, playerId, stratagemId) {
  const units=(state.units??[]).filter(unit=>unit.ownerId!==playerId && unit.status==='deployed' && getCombatFormationRoot(state,unit)?.id===unit.id);
  if (stratagemId === 'in-auramite-clad') return units.filter(unit=>{
    const activation=(state.history??[]).findLast(event=>current(state,event) && event.type===(state.phase==='shooting'?'shooting.unit_activated':'fight.unit_activated') && event.payload.unitId===unit.id);
    return (!activation?.payload.actionType || activation.payload.actionType===(state.phase==='shooting'?'shoot':'fight')) && !attacked(state,unit.id) && !isCombatActivationFinished(state,unit.id);
  });
  if (stratagemId === 'swift-as-the-eagle') {
    const latest=(state.history??[]).findLast(event=>current(state,event) && ['unit.normal_move_resolved','unit.advanced','unit.fell_back'].includes(event.type) && !event.payload.movementRefinement);
    return units.filter(unit=>unit.id===latest?.payload.unitId);
  }
  return [];
}

export function getGuardiansStratagemOpportunities(state, {playerId,unitId=null,stratagemId=null}={}) {
  if (state.battle?.status!=='active' || !hasCustodesDetachment(state,playerId,'Guardians of the Throne')) return [];
  const own=(state.activePlayer??state.battle.activePlayerId)===playerId;
  const focus=unitId && getCombatFormationRoot(state,state.units?.find(unit=>unit.id===unitId));
  const units=(state.units??[]).filter(unit=>unit.ownerId===playerId && unit.status==='deployed' && getCombatFormationRoot(state,unit)?.id===unit.id &&
    (!focus || unit.id===focus.id) && keywords(state,unit).includes('adeptus custodes'));
  const engaged=new Set(getFightEngagementState(state).engagedUnitIds);
  const catalog=ADEPTUS_CUSTODES_DETACHMENTS.find(item=>item.name==='Guardians of the Throne');
  const entries=[];
  for (const [id,name,phases,window] of definitions) {
    if (stratagemId && id!==stratagemId || !phases.includes(state.phase)) continue;
    if (window==='own'&&!own || window==='opponent'&&own || id==='in-auramite-clad'&&state.phase==='shooting'&&own) continue;
    const rule=catalog.stratagems.find(item=>item.name===name);
    for (const unit of units) {
      const keys=keywords(state,unit);
      let reason=null;
      if (id==='superhuman-focus') {
        const readiness=getCustodesKatahState(state,{playerId,unitId:unit.id});
        if (!readiness.eligible || readiness.readied) continue;
        if (getRecordedStratagemUses(state).some(use=>use.stratagemId===id && use.playerId===playerId && use.unitId===unit.id && use.round===state.battle.round)) reason='This unit was already re-readied with Superhuman Focus this round.';
      }
      if (id==='shield-of-honour') {
        if (!keys.some(key=>['infantry','mounted'].includes(key))) continue;
        if (!isRulesPhaseOpening(state)) reason='The start-of-Fight window has passed.';
      }
      if (id==='in-auramite-clad' && keys.includes('custodian wardens')) continue;
      // The reviewed Warden sheet uses its unit name separately from keywords.
      if (id==='in-auramite-clad' && getCombatFormationMembers(state,unit).some(member=>(getBattleUnitDatasheet(state,member)?.abilities??[]).some(a=>a.name==='Living Fortress'))) continue;
      if (id==='unlimited-endurance') {
        const move=getEffectiveMovementAction(state,unit.id);
        if (move?.movementType!=='advance' || move.baseEvent.payload.round!==state.battle.round) continue;
        const latestMove=(state.history??[]).findLast(event=>current(state,event) && ['unit.normal_move_resolved','unit.advanced','unit.fell_back','unit.stationary_recorded'].includes(event.type));
        if (latestMove?.payload.unitId!==unit.id) reason='Use just after this unit’s Advance, before another unit moves.';
      }
      if (id==='prime-target') {
        const activation=(state.history??[]).findLast(event=>current(state,event) && event.type==='shooting.unit_activated' && event.payload.unitId===unit.id);
        if (hasConfirmedNoRangedWeaponsForFormation(state,unit) || activation?.payload.actionType && activation.payload.actionType!=='shoot' || attacked(state,unit.id)||isCombatActivationFinished(state,unit.id)) reason='Use when selected to shoot, before recording attacks.';
      }
      if (id==='swift-as-the-eagle') {
        if (!keys.includes('trusted sentinel')) continue;
        if (engaged.has(unit.id)) reason='This unit has a recorded engagement.';
      }
      const enemies=getGuardiansEnemyOptions(state,playerId,id);
      if (['in-auramite-clad','swift-as-the-eagle'].includes(id) && !enemies.length) reason=id==='swift-as-the-eagle'?'Record the triggering enemy move first.':'No enemy attack remains in its target-selection window.';
      reason ??= getStratagemUseBlock(state,{playerId,unitId:unit.id,stratagemId:id});
      if (isRulesPhaseEndConfirmed(state) && id!=='superhuman-focus') reason='The end-of-phase window has been confirmed.';
      if (isUnitBattleShocked(unit) || getCombatFormationMembers(state,unit).some(isUnitBattleShocked)) reason='Battle-shocked units cannot receive stratagems.';
      if (!reason && getCommandPointBalance(state,playerId)<rule.cpCost) reason='Needs '+rule.cpCost+' CP.';
      const active=getActiveGuardiansEffects(state,unit.id).find(use=>use.stratagemId===id);
      entries.push({stratagemId:id,title:name,playerId,unitId:unit.id,unitName:unit.name,cpCost:rule.cpCost,
        timing:rule.timing,effect:rule.description,window,enemies,available:!reason,blockedReason:reason,active,
        sourceUrl:ADEPTUS_CUSTODES_RULE_SOURCES.currentReference,contextKey:rulesContextKey(state)});
    }
  }
  return entries;
}
