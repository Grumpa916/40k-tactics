import { getCombatFormationRoot, getCombatFormationMembers } from './battle-unit-reference.js';
import { getLiveUnitVitals } from './live-unit-vitals.js';
import { getChargeOpportunity } from './tactical-charge-opportunity.js';
import { getTargetStrategicContext } from './tactical-target-context.js';
import { getSpatialContext } from './spatial-context.js';
import { getFightEngagementState } from './fight-engagement-state.js';
import { getEffectiveMovementAction } from '../engine/movement-refinement-transitions.js';
import { getCustodesChargeAdvisorContext } from './custodes-tactical-advisor.js';

// Read-only execution context: actual events are authoritative, remaining
// estimates are recomputed on current surviving units. Never replay prior
// Shooting damage into a charge/fight forecast.
const unknown = reason => Object.freeze({available:false,reason});
const memberOf = (state,id) => (state?.units??[]).find(u=>u.id===id);
const sameTurn = (state,event) => event?.payload?.round===state?.battle?.round &&
  event?.payload?.turn===state?.turn;
const currentEvents = state => (state?.history??[]).filter(event=>sameTurn(state,event));
const finite = n => typeof n==='number' && Number.isFinite(n);
const activePhase = phase => ['shooting','charge','fight'].includes(phase);

export function getAdaptiveExecutionAdvice(state,{
  unitId,playerId,targetId=null,measuredDistance=null
}={}){
  if(!activePhase(state?.phase) || state?.battle?.status!=='active')
    return unknown('Adaptive execution is available during Shooting, Charge and Fight.');
  const activePlayer=state.activePlayer??state.battle?.activePlayerId;
  if(!playerId || playerId!==activePlayer)
    return unknown('Only the active player may review an offensive turn plan.');
  const selected=memberOf(state,unitId);
  const root=getCombatFormationRoot(state,selected);
  if(!root || root.ownerId!==playerId)
    return unknown('Select one of your deployed formations.');
  const formation=getCombatFormationMembers(state,root);
  const ids=new Set(formation.map(u=>u.id));
  const events=currentEvents(state);
  const fromFormation=id=>ids.has(id);
  const shooting=events.filter(e=>e.type==='combat.attack_resolved' &&
    e.payload?.phase==='shooting' && (fromFormation(e.payload?.attackerId) ||
      fromFormation(e.payload?.sourceAttackerId)));
  const fighting=events.filter(e=>e.type==='combat.attack_resolved' &&
    e.payload?.phase==='fight' && (fromFormation(e.payload?.attackerId) ||
      fromFormation(e.payload?.sourceAttackerId)));
  const charge=[...events].reverse().find(e=>e.type==='charge.outcome_recorded' &&
    fromFormation(e.payload?.unitId))??null;
  const shootingDecision=[...events].reverse().find(e=>e.type==='shooting.unit_activated' &&
    fromFormation(e.payload?.unitId))??null;
  const fightDecision=[...events].reverse().find(e=>e.type==='fight.unit_activated' &&
    fromFormation(e.payload?.unitId))??null;
  const fightFinished=events.some(e=>e.type==='combat.activation_finished' &&
    e.payload?.phase==='fight' && fromFormation(e.payload?.unitId));
  const lastTargetFrom=records=>[...records].reverse().find(e=>e.payload?.targetId)?.payload?.targetId??null;
  const chargeTarget=(charge?.payload?.targetIds??[])[0]??null;
  // The explicit selected target wins; otherwise use the last charge or shot.
  // Do not pretend this is an original pinned turn plan (which is not stored).
  const chosenTarget=targetId??chargeTarget??lastTargetFrom(fighting)??lastTargetFrom(shooting);
  const target=memberOf(state,chosenTarget);
  const targetAlive=Boolean(target && target.ownerId!==playerId && target.status==='deployed');
  const actualDamage=records=>records.reduce((sum,e)=>sum+
    (finite(e.payload?.actualDamage)?Math.max(0,e.payload.actualDamage):0),0);
  const targetDamage=records=>records.filter(e=>
    e.payload?.targetId===chosenTarget || e.payload?.stateDelta?.target?.unitId===chosenTarget)
    .reduce((sum,e)=>sum+(finite(e.payload?.actualDamage)?Math.max(0,e.payload.actualDamage):0),0);
  const fightDone=fighting.length>0;
  const chargeOutcome=charge?.payload?.outcome??null;
  const observedDistance=targetId && finite(measuredDistance) ? measuredDistance :
    finite(charge?.payload?.measuredDistances?.[chosenTarget]) ?
      charge.payload.measuredDistances[chosenTarget] : null;
  const declaredChargeTargets=charge?.payload?.targetIds??[];
  const chargeAppliesToTarget=!charge || declaredChargeTargets.includes(chosenTarget);
  let mappedDistance=null;
  if(targetAlive){
    try {
      const link=getSpatialContext(state,{playerId}).unitProximity.find(p=>
        p.unitId===root.id && p.otherUnitId===chosenTarget);
      mappedDistance=finite(link?.distance)?link.distance:null;
    }catch{}
  }

  let opportunity=null,forecastReason=null,strategic=null;
  if(targetAlive) {
    try {
      strategic=getTargetStrategicContext(state,{
        playerId,attackerId:root.id,targetUnitId:chosenTarget
      });
    }catch{}
  }
  const blocked=chargeOutcome==='failed' || chargeOutcome==='declined';
  const alreadyEngaged=!charge && getFightEngagementState(state).engagedUnitIds.some(id=>ids.has(id));
  const moves=formation.map(member=>getEffectiveMovementAction(state,member.id)?.movementType).filter(Boolean);
  const fellBack=moves.includes('fall_back');
  const advanced=moves.includes('advance');
  let advanceChargePermission=false;
  if(advanced && !charge) {
    try {
      advanceChargePermission=getCustodesChargeAdvisorContext(state,{
        playerId,unitId:root.id,baseProbability:0
      }).advanceChargePermission===true;
    }catch{}
  }
  if(root.status==='destroyed') forecastReason='This formation has been destroyed.';
  else if(!chosenTarget) forecastReason='Select a target or record an attack to evaluate the remaining sequence.';
  else if(!targetAlive) forecastReason='The selected or recorded target is destroyed or no longer available; choose another legal target.';
  else if(fightFinished) forecastReason='Fight activation finished. Do not forecast another attack for this formation.';
  else if(fightDone) forecastReason='Fight damage already recorded. Full-activation melee will not be estimated a second time.';
  else if(blocked) forecastReason='Recorded charge '+chargeOutcome+'; no Fight is forecast from this attempt. Check any separate Engagement eligibility at the table.';
  else if(state.phase==='fight' && !charge) forecastReason='No successful charge recorded for this formation. Use the existing Fight-phase Advisor for any separate engagement.';
  else if(!charge && fellBack) forecastReason='Fell Back: no new Charge is projected.';
  else if(!charge && advanced && !advanceChargePermission) forecastReason='Advanced: no recorded permission to Charge.';
  else if(alreadyEngaged) forecastReason='Formation already engaged: no fresh Charge sequence is projected. Use the Fight-phase Advisor.';
  else if(charge && !chargeAppliesToTarget) forecastReason='This target was not declared in the recorded charge. Review actual Fight eligibility.';
  else{
    try{
      opportunity=getChargeOpportunity(state,{
        playerId,attackerId:root.id,targetUnitId:chosenTarget,
        measuredDistance:observedDistance,mapDistance:mappedDistance
      });
    }catch{
      forecastReason='Missing combat or mission data; remaining attack prediction is unavailable.';
    }
  }
  const melee=opportunity?.projectedFight;
  const counter=opportunity?.projectedCounterFight;
  const afterCharge=chargeOutcome==='successful';
  const remainingForecast=opportunity ? Object.freeze({
    chargeStatus:chargeOutcome,
    chargeProbability:chargeOutcome==='successful'?1:
      blocked?0:opportunity.successProbability??opportunity.mapSuccessProbability??null,
    probabilityBasis:chargeOutcome==='successful'?'recorded-success':
      blocked?'recorded-outcome':opportunity.probabilityBasis,
    measuredDistance:observedDistance,
    mapDistance:mappedDistance,
    fightExpectedDamage:melee?.available && finite(melee.expectedDamage)?melee.expectedDamage:null,
    fightBackExpectedDamage:counter?.available && finite(counter.expectedDamage)?
      counter.expectedDamage:null,
    // Fight prediction is conditional on a successful charge or other genuine
    // Fight eligibility; it is NEVER additive to already-recorded Shooting.
    conditionalFight:true,
    chargeAlreadyResolved:Boolean(charge),
    fightBasis:afterCharge?'current survivors after recorded successful charge':'if Charge succeeds and Fight is eligible'
  }):null;

  const vitals=targetAlive?getLiveUnitVitals(state,target):null;
  return Object.freeze({
    available:true,
    phase:state.phase,
    unitId:root.id,unitName:root.name??root.id,
    targetId:chosenTarget,targetName:target?.name??chosenTarget??null,
    targetStatus:target?.status??null,
    targetWounds:finite(vitals?.wounds)?vitals.wounds:null,
    targetModels:Number.isInteger(vitals?.models)?vitals.models:null,
    source:targetId?'selected-target':chargeTarget?'charge-history':
      (lastTargetFrom(fighting)||lastTargetFrom(shooting))?'attack-history':'none',
    shooting:Object.freeze({
      attacks:shooting.length,
      actualDamage:actualDamage(shooting),
      damageToTarget:targetDamage(shooting),
      actionType:shootingDecision?.payload?.actionType??null
    }),
    charge:Object.freeze({
      outcome:chargeOutcome,
      targetIds:Object.freeze([...declaredChargeTargets]),
      measuredDistance:observedDistance
    }),
    fight:Object.freeze({
      attacks:fighting.length,
      actualDamage:actualDamage(fighting),
      damageToTarget:targetDamage(fighting),
      actionType:fightDecision?.payload?.actionType??null,
      finished:fightFinished
    }),
    remainingForecast,
    forecastReason,
    scoring:strategic?Object.freeze({
      objective:strategic.objectiveSwing?.reason??null,
      potentialFlip:strategic.objectiveSwing?.potentialFlip===true,
      primary:strategic.primary?.reason??null,
      secondary:strategic.secondary?.reason??null
    }):null,
    caveat:'Actual recorded damage and remaining wounds are authoritative for this view. Melee uses the existing approximate strongest-profile baseline; attached-formation weapon allocations may be incomplete. It never replays recorded shots or promises a legal Fight. Confirm charge paths, fight eligibility, model allocation, OC and scoring at the table.'
  });
}
