import { rulesContextKey } from './rules-phase-window.js';
import { getCombatFormationRoot } from './battle-unit-reference.js';

const rootId = (state, id) => getCombatFormationRoot(state, state.units?.find(unit => unit.id === id))?.id ?? id;
export function getRecordedStratagemUses(state) {
  return (state.history ?? []).flatMap(event => {
    const p = event.payload ?? {};
    if (event.type === 'custodes.guardians_stratagem_used') return [p];
    if (event.type === 'custodes.detachment_stratagem_used') return [p];
    if (event.type === 'rules.reminder_used' && ['superhuman-focus','swift-ruin'].includes(p.ruleId)) {
      return [{...p, stratagemId:p.ruleId === 'swift-ruin' ? 'rapid-ingress' : p.ruleId}];
    }
    return [];
  });
}

export function isGoldenLightActive(state,useOrEvent,unitId=null) {
  const use=useOrEvent?.payload??useOrEvent;
  if (use?.stratagemId!=='golden-light-of-the-moiraides' || state?.battle?.status!=='active' ||
      !Number.isInteger(use.turn) || !Number.isInteger(state.turn) || state.turn<use.turn) return false;
  const usedRoot=rootId(state,use.unitId), targetRoot=rootId(state,unitId??use.unitId);
  if (!usedRoot || usedRoot!==targetRoot) return false;
  const activePlayer=state.activePlayer??state.battle?.activePlayerId;
  return !(state.turn>use.turn && activePlayer===use.playerId);
}

export function getActiveCustodesDetachmentStratagemUse(state,{unitId,stratagemId}={}) {
  if (!unitId || !stratagemId) return null;
  return getRecordedStratagemUses(state).find(use=>use.stratagemId===stratagemId&&
    (stratagemId==='golden-light-of-the-moiraides' ? isGoldenLightActive(state,use,unitId) :
      use.round===state.battle?.round&&use.turn===state.turn&&rootId(state,use.unitId)===rootId(state,unitId)))??null;
}

export function getStratagemUseBlock(state, {playerId, unitId, stratagemId}) {
  const uses = getRecordedStratagemUses(state).filter(use => use.playerId === playerId && use.contextKey === rulesContextKey(state));
  if (uses.some(use => use.stratagemId === stratagemId)) return 'Already used this stratagem in this phase.';
  if (uses.some(use => rootId(state, use.unitId) === rootId(state, unitId))) return 'This unit already received a stratagem this phase.';
  return null;
}

export function getActiveGuardiansEffects(state, unitId) {
  const root = rootId(state, unitId);
  return getRecordedStratagemUses(state).filter(use => {
    if (rootId(state, use.unitId) !== root || use.round !== state.battle?.round || use.turn !== state.turn) return false;
    if (use.stratagemId === 'unlimited-endurance') return true;
    if (use.stratagemId === 'preternatural-rapidity') {
      return state.phase === 'charge' && (state.activePlayer ?? state.battle?.activePlayerId) === use.playerId;
    }
    if (use.stratagemId === 'lightning-wrath') {
      return state.phase === 'fight' && !(state.history ?? []).some(event => event.type === 'fight.unit_activated' &&
        event.payload?.unitId === use.unitId && event.payload?.round === use.round && event.payload?.turn === use.turn);
    }
    if (use.contextKey !== rulesContextKey(state)) return false;
    if (use.stratagemId === 'in-auramite-clad') {
      return !(state.history ?? []).some(event => event.type === 'combat.activation_finished' &&
        event.payload?.unitId === use.enemyUnitId && event.payload.round === use.round &&
        event.payload.turn === use.turn && event.payload.phase === use.phase);
    }
    if (use.stratagemId==='prime-target') return !(state.history??[]).some(event=>event.type==='combat.activation_finished' && event.payload?.unitId===use.unitId && event.payload.round===use.round && event.payload.turn===use.turn && event.payload.phase===use.phase);
    return use.stratagemId==='shield-of-honour';
  });
}
