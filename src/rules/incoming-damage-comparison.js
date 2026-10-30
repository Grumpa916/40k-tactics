import { getAttackDamageForecast } from './attack-damage-forecast.js';
import { getCombatFormationRoot } from './battle-unit-reference.js';
import { getGuardiansStratagemOpportunities } from './guardians-stratagem-opportunities.js';
import { rulesContextKey } from './rules-phase-window.js';
import { isGoldenLightActive } from './stratagem-use-state.js';

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

  const previewState = withPreviewAuramite(state, target, attacker);
  if (previewState) {
    const preview = getAttackDamageForecast(previewState, { attackerId, targetId, weapon });
    const previewRules = (preview?.appliedRules ?? []).filter(rule => !(current.appliedRules ?? []).includes(rule));
    if (preview && previewRules.length) {
      return Object.freeze({
        before: current.expectedDamage,
        after: preview.expectedDamage,
        effects: Object.freeze(previewRules),
        mode: 'preview',
        forecast: current
      });
    }
  }

  return Object.freeze({ before: null, after: current.expectedDamage, effects: Object.freeze([]), mode: 'current', forecast: current });
}
