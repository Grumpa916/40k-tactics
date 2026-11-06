import { getAttackDamageForecast } from './attack-damage-forecast.js';
import { getCombatFormationRoot } from './battle-unit-reference.js';
import { getGuardiansStratagemOpportunities } from './guardians-stratagem-opportunities.js';
import { rulesContextKey } from './rules-phase-window.js';
import { isGoldenLightActive } from './stratagem-use-state.js';
import { getCustodesKatahState } from './custodes-tactical-advisor.js';
import { isRulesPhaseOpening } from './rules-phase-window.js';

const isTemporaryDefence = (event, state, target, attacker) => {
  const payload = event?.payload ?? {};
  const targetRoot = getCombatFormationRoot(state, target) ?? target;
  const attackerRoot = getCombatFormationRoot(state, attacker) ?? attacker;
  if (event.type==='custodes.detachment_stratagem_used' && payload.stratagemId==='golden-light-of-the-moiraides') {
    return isGoldenLightActive(state,event,target.id) &&
      (getCombatFormationRoot(state,state.units?.find(unit=>unit.id===payload.unitId))?.id??payload.unitId)===targetRoot.id;
  }
  const currentTurn = payload.round === state.battle?.round && payload.turn === state.turn;
  if (!currentTurn) return false;
  if (event.type === 'custodes.guardians_stratagem_used') {
    return payload.contextKey === rulesContextKey(state) && payload.stratagemId === 'in-auramite-clad' &&
      (getCombatFormationRoot(state, state.units?.find(unit => unit.id === payload.unitId))?.id ?? payload.unitId) === targetRoot.id &&
      payload.enemyUnitId === attackerRoot.id;
  }
  if (event.type === 'custodes.katah_expended') {
    return payload.phase === 'fight' && payload.katahName === 'Kaptaris' && payload.unitId === targetRoot.id && state.phase === 'fight';
  }
  return event.type === 'rules.reminder_used' && payload.ruleId === 'moment-shackle' &&
    payload.contextKey === rulesContextKey(state) && payload.choice === 'save' && payload.unitId === target.id;
};

function withPreviewAuramite(state, target, attacker) {
  if (!target || !attacker || !['shooting', 'fight'].includes(state.phase)) return null;
  const targetRoot = getCombatFormationRoot(state, target) ?? target;
  const attackerRoot = getCombatFormationRoot(state, attacker) ?? attacker;
  const opportunity = getGuardiansStratagemOpportunities(state, {
    playerId: target.ownerId,
    unitId: targetRoot.id,
    stratagemId: 'in-auramite-clad'
  }).find(item => item.available && item.enemies.some(enemy => enemy.id === attackerRoot.id));
  if (!opportunity) return null;
  return {
    ...state,
    history: [...(state.history ?? []), {
      type: 'custodes.guardians_stratagem_used',
      payload: {
        playerId: target.ownerId,
        unitId: targetRoot.id,
        stratagemId: 'in-auramite-clad',
        enemyUnitId: attackerRoot.id,
        round: state.battle?.round,
        turn: state.turn,
        phase: state.phase,
        contextKey: rulesContextKey(state)
      }
    }]
  };
}

function withPreviewKaptaris(state, target) {
  if (state?.phase !== 'fight' || !isRulesPhaseOpening(state)) return null;
  const targetRoot = getCombatFormationRoot(state, target) ?? target;
  const readiness = getCustodesKatahState(state, {playerId:target.ownerId,unitId:targetRoot.id});
  if (!readiness.readied) return null;
  return {
    ...state,
    history: [...(state.history ?? []), {
      type:'custodes.katah_expended',
      payload:{
        playerId:target.ownerId,unitId:targetRoot.id,katahName:'Kaptaris',
        cycleRound:readiness.cycleRound,round:state.battle?.round,
        turn:state.turn,phase:'fight'
      }
    }]
  };
}

/** Compare an incoming attack with its recorded, temporary defensive effects. */
export function getIncomingDamageComparison(state, { attackerId, targetId, weapon } = {}) {
  const attacker = state?.units?.find(unit => unit?.id === attackerId);
  const target = state?.units?.find(unit => unit?.id === targetId);
  if (!attacker || !target || !weapon) return null;

  const current = getAttackDamageForecast(state, { attackerId, targetId, weapon });
  if (!current) return null;

  const withoutTemporaryDefences = {
    ...state,
    history: (state.history ?? []).filter(event => !isTemporaryDefence(event, state, target, attacker))
  };
  const activeBaseline = getAttackDamageForecast(withoutTemporaryDefences, { attackerId, targetId, weapon });
  const activeRules = current.appliedRules.filter(rule => !(activeBaseline?.appliedRules ?? []).includes(rule));
  if (activeRules.length) {
    return Object.freeze({
      before: activeBaseline?.expectedDamage ?? current.expectedDamage,
      after: current.expectedDamage,
      effects: Object.freeze(activeRules),
      mode: 'active',
      forecast: current
    });
  }

  const previews = [];
  for (const [id,label,nextState,cost] of [
    ['in-auramite-clad','In Auramite Clad',withPreviewAuramite(state,target,attacker),'1 CP · confirm attack trigger'],
    ['kaptaris','Kaptaris',withPreviewKaptaris(state,target),'Spend Ka’tah readiness · start of Fight']
  ]) {
    if (!nextState) continue;
    const preview = getAttackDamageForecast(nextState, { attackerId, targetId, weapon });
    const newRules = (preview?.appliedRules ?? []).filter(rule => !(current.appliedRules ?? []).includes(rule));
    if (!preview || !newRules.length || !Number.isFinite(preview.expectedDamage)) continue;
    previews.push(Object.freeze({
      id,label,cost,before:current.expectedDamage,after:preview.expectedDamage,
      effects:Object.freeze(newRules)
    }));
  }
  const first = previews[0] ?? null;
  return Object.freeze({
    before: first ? current.expectedDamage : null,
    after: first?.after ?? current.expectedDamage,
    effects: first?.effects ?? Object.freeze([]),
    mode: first ? 'preview' : 'current',
    previews: Object.freeze(previews),
    forecast: current
  });
}
