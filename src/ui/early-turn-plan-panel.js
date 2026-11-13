import { getEarlyTurnPlan } from '../rules/early-turn-plan.js';
import { getMovementWhatIfPlans } from '../rules/early-turn-movement-options.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const percent=value=>Number.isFinite(value)?Math.round(100*value)+'%':'Unknown';
const damage=value=>Number.isFinite(value)?value.toFixed(1):'Unknown';
let previousState=null,previousKey=null,previousPlan=null,previousMovement=null;

function cachedPlan(state,{unitId,playerId}){
  const key=JSON.stringify([unitId,playerId]);
  if(state!==previousState || key!==previousKey){
    previousState=state;previousKey=key;
    previousPlan=getEarlyTurnPlan(state,{unitId,playerId});
    previousMovement=getMovementWhatIfPlans(state,{unitId,playerId});
  }
  return previousPlan;
}

function renderMovementWhatIf(whatIf) {
  if(!whatIf) return '';
  if(!whatIf.available)
    return '<p class="early-turn-plan__what-if-unavailable">Movement what-if: '+esc(whatIf.reason)+'</p>';
  if(whatIf.options.length<=1)
    return '<p class="early-turn-plan__what-if-unavailable">No distinct hypothetical Normal Move destination was available. Check actual map placement and saved movement speed.</p>';
  const rows=whatIf.options.map(option=>{
    const shot=option.attack;
    const full=shot?.fullAttack;
    return '<div class="early-turn-plan__what-if-row" data-what-if-kind="'+esc(option.kind)+'">'+
      '<strong>'+esc(option.label)+'</strong>'+
      '<small>'+esc(option.travel)+'″ sample · ('+esc(option.position.x)+', '+esc(option.position.y)+') on approximate map</small>'+
      (option.kind==='objective'?
        '<small>Approximate objective-center gap: '+esc(option.destinationDistance)+'″ · OC unverified</small>':'')+
      (shot?
        '<span>Best sampled ranged target: '+esc(shot.targetName)+'</span>'+
        '<span>Shoot only: '+damage(shot.expectedShootingDamage)+' wounds · kill '+percent(shot.shootingKillProbability)+'</span>'+
        (full?.available?
          (full.chargeProbability>0?
            '<span>Conditional Full Attack: kill '+percent(full.destructionProbability)+
              ' · charge '+percent(full.chargeProbability)+
              ' · melee fight-back '+damage(full.retaliationExpectedDamage)+'</span>':
            '<small>Charge outside estimated 2D6 reach from this position; combined result is shooting-only. Other enemy attacks are not estimated.</small>'):
          '<small>Full Attack unavailable: '+esc(full?.reason??'Incomplete data')+'</small>'):
        '<small>Nothing currently in comparable sampled shooting range from this position.</small>')+
    '</div>';
  }).join('');
  return '<details class="early-turn-plan__what-if" data-view-key="early-turn-movement-what-if">'+
    '<summary>Movement what-if · '+esc(whatIf.options.length)+' positions</summary>'+
    '<div class="early-turn-plan__what-if-list">'+rows+'</div></details>';
}

export function renderEarlyTurnPlanPanel(state,{selectedUnitId,playerId}={}){
  if(!selectedUnitId || !['command','movement'].includes(state?.phase)) return '';
  const plan=cachedPlan(state,{unitId:selectedUnitId,playerId});
  const movementPreview=previousMovement;
  if(!plan.available) return '';
  const shot=plan.attack;
  const full=shot?.fullAttack??null;
  const move=plan.movement;
  const movementHeading=move?.objectiveName??move?.objectiveId??move?.targetName??
    (move?.purpose?move.purpose.replaceAll('-',' '):'Tabletop positioning');
  const style=new URL('./styles/early-turn-plan-panel.css',import.meta.url).href;
  return '<link rel="stylesheet" href="'+esc(style)+'">'+
    '<details class="early-turn-plan" data-early-turn-plan data-view-key="early-turn-plan" open>'+
    '<summary><span>TURN PLANNING · '+esc(plan.unitName)+'</span>'+
    '<small>Compare before committing actions</small></summary>'+
    '<div class="early-turn-plan__body">'+
      '<div class="early-turn-plan__option"><strong>A · Full Attack</strong>'+
        (shot
          ? '<span>'+esc(shot.targetName)+' · '+esc(shot.weaponName)+'</span>'+
            (full?.available
              ? '<span>Overall kill chance: '+percent(full.destructionProbability)+
                ' · charge: '+percent(full.chargeProbability)+
                ' · expected wounds removed: '+damage(full.expectedDamage)+'</span>'+
                '<small>Expected fight-back: '+damage(full.retaliationExpectedDamage)+
                ' damage. Unknown is not zero risk.</small>'
              : '<small>Combined estimate unknown: '+esc(full?.reason??'Insufficient information')+'</small>')
          : '<small>No currently comparable ranged target from this map position.</small>')+
      '</div>'+
      '<div class="early-turn-plan__option"><strong>B · Shoot only</strong>'+
        (shot
          ? '<span>'+esc(shot.targetName)+' · '+esc(shot.weaponName)+'</span>'+
            '<span>Single-profile baseline: '+damage(shot.expectedShootingDamage)+
              ' wounds removed · kill chance: '+percent(shot.shootingKillProbability)+'</span>'
          : '<small>Unknown at current range or with saved weapon data. Moving may create an opportunity.</small>')+
      '</div>'+
      '<div class="early-turn-plan__option"><strong>C · Mission positioning</strong>'+
        (move
          ? '<span>'+esc(movementHeading)+'</span><small>'+esc(move.actionHint??move.recommendation??'Confirm the mission objective on the table.')+'</small>'
          : '<small>No verified movement recommendation for this unit; check Primary and active Secondaries.</small>')+
      '</div>'+
      (shot?.objectiveReason?'<p class="early-turn-plan__mission"><strong>Objective context:</strong> '+esc(shot.objectiveReason)+'</p>':'')+
      (plan.alternative?'<p class="early-turn-plan__alternative">Other target to compare: '+esc(plan.alternative.targetName)+'. Confirm weapon and range before committing.</p>':'')+
      renderMovementWhatIf(movementPreview)+
      (plan.loadoutUncertain?'<small class="early-turn-plan__loadout-warning">Saved loadout needs review; speculative damage was withheld.</small>':'')+
      '<details class="early-turn-plan__limitations" data-view-key="early-turn-advisor-limitations">'+
        '<summary>Estimate limitations</summary>'+
        '<div class="early-turn-plan__limitations-body">'+
          '<p>'+esc(plan.assumptions)+'</p>'+
          (movementPreview?.available && movementPreview.options?.length>1
            ?'<p>'+esc(movementPreview.assumptions)+'</p>':'')+
          (plan.limitedWeapons?'<p>Only up to three saved ranged profiles were sampled.</p>':'')+
          '<p>Advisory only; viewing an estimate never records a move, action or VP.</p>'+
        '</div></details>'+
    '</div></details>';
}
