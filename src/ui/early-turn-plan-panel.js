import { getEarlyTurnPlan } from '../rules/early-turn-plan.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const percent=value=>Number.isFinite(value)?Math.round(100*value)+'%':'Unknown';
const damage=value=>Number.isFinite(value)?value.toFixed(1):'Unknown';
let previousState=null,previousKey=null,previousPlan=null;

function cachedPlan(state,{unitId,playerId}){
  const key=JSON.stringify([unitId,playerId]);
  if(state!==previousState || key!==previousKey){
    previousState=state;previousKey=key;
    previousPlan=getEarlyTurnPlan(state,{unitId,playerId});
  }
  return previousPlan;
}

export function renderEarlyTurnPlanPanel(state,{selectedUnitId,playerId}={}){
  if(!selectedUnitId || !['command','movement'].includes(state?.phase)) return '';
  const plan=cachedPlan(state,{unitId:selectedUnitId,playerId});
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
              ? '<span>Conditional kill: '+percent(full.destructionProbability)+
                ' · charge: '+percent(full.chargeProbability)+
                ' · combined damage: '+damage(full.expectedDamage)+'</span>'+
                '<small>Expected fight-back: '+damage(full.retaliationExpectedDamage)+
                ' damage. Unknown is not zero risk.</small>'
              : '<small>Combined estimate unknown: '+esc(full?.reason??'Insufficient information')+'</small>')
          : '<small>No currently comparable ranged target from this map position.</small>')+
      '</div>'+
      '<div class="early-turn-plan__option"><strong>B · Shoot only</strong>'+
        (shot
          ? '<span>'+esc(shot.targetName)+' · '+esc(shot.weaponName)+'</span>'+
            '<span>Single-profile baseline: '+damage(shot.expectedShootingDamage)+
              ' damage · kill: '+percent(shot.shootingKillProbability)+'</span>'
          : '<small>Unknown at current range or with saved weapon data. Moving may create an opportunity.</small>')+
      '</div>'+
      '<div class="early-turn-plan__option"><strong>C · Mission positioning</strong>'+
        (move
          ? '<span>'+esc(movementHeading)+'</span><small>'+esc(move.actionHint??move.recommendation??'Confirm the mission objective on the table.')+'</small>'
          : '<small>No verified movement recommendation for this unit; check Primary and active Secondaries.</small>')+
      '</div>'+
      (shot?.objectiveReason?'<p class="early-turn-plan__mission"><strong>Objective context:</strong> '+esc(shot.objectiveReason)+'</p>':'')+
      (plan.alternative?'<p class="early-turn-plan__alternative">Other target to compare: '+esc(plan.alternative.targetName)+'. Confirm weapon and range before committing.</p>':'')+
      '<small class="early-turn-plan__caution">'+esc(plan.assumptions)+
      (plan.limitedWeapons?' Only up to three saved ranged profiles were sampled.':'')+
      (plan.loadoutUncertain?' Saved loadout needs review; speculative damage was withheld.':'')+
      ' This is guidance, not a selected action or a scoring award.</small>'+
    '</div></details>';
}
