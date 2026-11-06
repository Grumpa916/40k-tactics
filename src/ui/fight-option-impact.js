import { isCustodesKatahTimingAvailable } from '../rules/custodes-tactical-advisor.js';
import { isRulesPhaseOpening } from '../rules/rules-phase-window.js';
import { renderAdvisorOptionImpact } from './advisor-option-impact.js';

/**
 * Pull only numerically modeled options from the existing Fight Advisor.
 * These are previews, not rule-use commands. Start-of-phase Ka'tahs must not
 * appear once the window has closed.
 */
export function getFightAbilityImpactPreviews(state, recommendation) {
  if (state?.phase !== 'fight' || !recommendation) return Object.freeze({offensive:null,defensive:null});
  const context = recommendation.custodesFight;
  const playerId = state.units?.find(unit => unit.id === recommendation.unitId)?.ownerId;
  const opening = isRulesPhaseOpening(state);
  const ready = Boolean(context?.katah?.readied);
  const base = context?.baselineExpectedDamage;
  const options = (context?.options ?? [])
    .filter(item => Number.isFinite(item?.expectedDamage) && !item.requiresTableConfirmation)
    .filter(item => !item.requiresKatahUse ||
      ready && isCustodesKatahTimingAvailable(state,item.katahName,playerId) &&
      (item.katahName !== 'Dacatarai' || opening))
    .map(item => Object.freeze({
      id:item.id,label:item.label,expectedDamage:item.expectedDamage,
      cost:item.requiresKatahUse ? 'Spend Ka’tah readiness' : 'Choose when fighting · no CP'
    }))
    .sort((a,b)=>b.expectedDamage-a.expectedDamage || a.label.localeCompare(b.label));
  const offensive = Number.isFinite(base) && options.length
    ? Object.freeze({baseline:base,options:Object.freeze(options)}) : null;

  const defence = recommendation.custodesDefence;
  const defensive = opening && ready && defence?.kaptarisAvailable && recommendation.retaliationEstimateAvailable &&
    Number.isFinite(defence.baselineRetaliationExpectedDamage) && Number.isFinite(defence.kaptarisExpectedDamage)
    ? Object.freeze({baseline:defence.baselineRetaliationExpectedDamage,options:Object.freeze([Object.freeze({
        id:'kaptaris',label:'Kaptaris',expectedDamage:defence.kaptarisExpectedDamage,
        cost:'Start of Fight · spend Ka’tah readiness'
      })])}) : null;

  return Object.freeze({offensive,defensive});
}

export function renderFightAbilityImpact(state, recommendation) {
  const {offensive,defensive}=getFightAbilityImpactPreviews(state,recommendation);
  return (offensive ? renderAdvisorOptionImpact({
    title:'Offensive options · what changes?',
    baseline:offensive.baseline,
    options:offensive.options,
    note:'Each option is compared with the same no-optional-ability baseline. Preview only; no Ka’tah readiness or CP spent.'
  }) : '') +
  (defensive ? renderAdvisorOptionImpact({
    title:'Defensive option · expected return damage',
    baseline:defensive.baseline,
    options:defensive.options,
    lowerIsBetter:true,
    note:'Kaptaris must be declared at the start of Fight. Return damage is an estimate of the strongest known response, not every enemy attack combined.'
  }) : '');
}
