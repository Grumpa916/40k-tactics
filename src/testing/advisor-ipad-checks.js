import { getEarlyTurnPlan } from '../rules/early-turn-plan.js';
import { getMovementWhatIfPlans } from '../rules/early-turn-movement-options.js';
import { getAdaptiveExecutionAdvice } from '../rules/adaptive-execution-advisor.js';
import { renderEarlyTurnPlanPanel } from '../ui/early-turn-plan-panel.js';
import { renderAdaptiveExecutionPanel } from '../ui/adaptive-execution-panel.js';

const item=(label,passes,detail)=>Object.freeze({
  label,passes:Boolean(passes),detail:String(detail??'')
});

/**
 * Runs the real Advisor engines and real renderers against a temporary fixture.
 * A green result means the computed expectation passed, not that live Safari
 * layout, legibility, or real battle command/drag workflows were certified.
 */
export function inspectAdvisorIpadScenario(state,{scenarioId='planning',measuredDistance=7}={}){
  const owner='p1',unitId='a',targetId='b';
  const early=['command','movement'].includes(state?.phase);
  const plan=early?getEarlyTurnPlan(state,{unitId,playerId:owner}):null;
  const movement=early?getMovementWhatIfPlans(state,{unitId,playerId:owner}):null;
  const execution=!early?getAdaptiveExecutionAdvice(state,{
    unitId,playerId:owner,targetId,measuredDistance
  }):null;
  const html=early
    ?renderEarlyTurnPlanPanel(state,{selectedUnitId:unitId,playerId:owner})
    :renderAdaptiveExecutionPanel(state,{
      selectedUnitId:unitId,playerId:owner,targetId,measuredDistance
    });
  const checks=[];
  if(scenarioId==='planning'){
    checks.push(
      item('Command plan available',plan?.available,'Must run before the Shooting phase.'),
      item('Attack opportunity identified',Boolean(plan?.attack),'Saved weapon and current target should support a comparison.'),
      item('Three choices rendered',/A · Full Attack/.test(html)&&/B · Shoot only/.test(html)&&/C · Mission positioning/.test(html),
        'Inspect all three cards in the right panel.'),
      item('Movement what-if expandable',/Movement what-if/.test(html),'Open the disclosure using one finger.')
    );
  }else if(scenarioId==='movement'){
    const hold=movement?.options?.find(option=>option.kind==='hold');
    const staged=movement?.options?.find(option=>option.kind==='enemy');
    checks.push(
      item('Movement options available',movement?.available && movement.options.length>=2,'Up to three positions are sampled.'),
      item('Initial hold is out of range',hold?.attack===null,'The initial enemy is farther than the saved gun range.'),
      item('Move opens shooting opportunity',Boolean(staged?.attack),'Expected from a hypothetical Normal Move toward the enemy.'),
      item('Move limited to 6 inches',Boolean(staged&&staged.travel<=6),'Attached formation speed or distance limits must be respected.')
    );
  }else if(scenarioId==='shooting'){
    checks.push(
      item('Two separate shots recorded',execution?.shooting?.attacks===2,'Tap Record 3 and Record 2 in the left panel.'),
      item('Actual damage totals five',execution?.shooting?.actualDamage===5,'Expected 3 + 2 = 5 actual damage.'),
      item('Surviving wounds now five',execution?.targetWounds===5,'Enemy status updates without a full-page reload.'),
      item('No duplicate shooting forecast',Boolean(execution?.remainingForecast?.conditionalFight &&
        !Object.hasOwn(execution.remainingForecast,'expectedShootingDamage')),
        'Remaining Charge/Fight should be forecast independently.')
    );
  }else if(scenarioId==='measured'){
    checks.push(
      item('Five actual shooting damage retained',execution?.shooting?.actualDamage===5,'The Charge advisor uses recorded Shooting.'),
      item('Measured distance in forecast',execution?.remainingForecast?.measuredDistance===measuredDistance,
        'Change the measured distance selector to watch charge chances update.'),
      item('Exact distance probability basis',execution?.remainingForecast?.probabilityBasis==='measured',
        'Do not show an approximate map estimate when measurement is provided.'),
      item('Distance visible to tester',html.includes(String(measuredDistance)+'″ measured'),
        'The panel displays the selected number of inches.')
    );
  }else if(scenarioId==='success'){
    checks.push(
      item('Successful charge retained',execution?.charge?.outcome==='successful','Read the recorded result, not a projected roll.'),
      item('Charge chance replaced with actual success',execution?.remainingForecast?.chargeProbability===1,
        'No success probability is applied again after a successful charge.'),
      item('Fight is still conditional on legality',execution?.remainingForecast?.conditionalFight===true,
        'Remaining melee baseline is advisory, not a confirmed attack.'),
      item('Target remains at five wounds',execution?.targetWounds===5,'Prior shooting is not replayed.')
    );
  }else if(scenarioId==='failed'){
    checks.push(
      item('Failed charge retained',execution?.charge?.outcome==='failed','Result should appear explicitly as failed.'),
      item('No charge-linked Fight forecast',execution?.remainingForecast===null,
        'Do not predict a successful charge after a recorded failure.'),
      item('Reason explains why',/Recorded charge failed/.test(execution?.forecastReason??''),'Separate legal Fight engagements need their own review.')
    );
  }else if(scenarioId==='fight'){
    checks.push(
      item('Fight damage recorded',execution?.fight?.actualDamage===3,'One synthetic Fight result of 3 actual damage.'),
      item('Fight activation finished',execution?.fight?.finished===true,'The action is no longer pending.'),
      item('Enemy at two wounds',execution?.targetWounds===2,'Shooting 5 + Fight 3 leaves 2 wounds.'),
      item('No second full Fight prediction',execution?.remainingForecast===null,'No double counting.')
    );
  }else if(scenarioId==='destroyed'){
    checks.push(
      item('Recorded target destroyed',execution?.targetStatus==='destroyed','A target at zero wounds should be marked destroyed.'),
      item('No remaining target Fight forecast',execution?.remainingForecast===null,'Destroyed targets are not eligible.'),
      item('Manual objective review shown',/review actual objective control/.test(html),
        'The app must not automatically award VP.')
    );
  }else if(scenarioId==='opponent'){
    checks.push(
      item('Own-turn offensive advice unavailable',execution?.available===false,'The opponent is the active player.'),
      item('Offensive adaptive panel hidden',!html.includes('data-adaptive-execution'),
        'Do not show your offensive execution controls on the opponent turn.')
    );
  }
  return Object.freeze({
    phase:state.phase,
    scenarioId,
    html,
    plan,
    movement,
    execution,
    checks:Object.freeze(checks),
    passed:checks.filter(check=>check.passes).length,
    total:checks.length
  });
}
