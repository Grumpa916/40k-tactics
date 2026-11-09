import { getAdaptiveExecutionAdvice } from '../rules/adaptive-execution-advisor.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const percent=value=>Number.isFinite(value)?Math.round(value*100)+'%':'Unknown';
const number=value=>Number.isFinite(value)?value.toFixed(1):'Unknown';

let priorState=null,priorKey=null,priorResult=null;
function adviceFor(state,options) {
  const key=JSON.stringify(options);
  if(priorState!==state || priorKey!==key){
    priorState=state;priorKey=key;
    priorResult=getAdaptiveExecutionAdvice(state,options);
  }
  return priorResult;
}

export function renderAdaptiveExecutionPanel(state,{
  selectedUnitId,playerId,targetId=null,measuredDistance=null
}={}) {
  if(!['shooting','charge','fight'].includes(state?.phase) || !selectedUnitId) return '';
  const advice=adviceFor(state,{unitId:selectedUnitId,playerId,targetId,measuredDistance});
  if(!advice.available) return '';
  const target=advice.targetName;
  const forecast=advice.remainingForecast;
  const outcome=advice.charge.outcome;
  const shot=advice.shooting;
  const fight=advice.fight;
  const loading=forecast?.chargeProbability===0 && !forecast.chargeAlreadyResolved
    ? '<small>Charge outside estimated 2D6 reach; no charge-linked Fight is included. Other threats remain unknown.</small>'
    : forecast ? [
    '<span>Remaining Fight, if eligible: '+number(forecast.fightExpectedDamage)+' baseline damage</span>',
    '<span>Enemy melee return: '+number(forecast.fightBackExpectedDamage)+
      ' (unknown is not safe)</span>'
  ].join('') : '<small>'+esc(advice.forecastReason??'Remaining forecast unavailable')+'</small>';
  const chargeText=outcome
    ? (outcome==='successful'?'Successful (recorded)':outcome==='failed'?'Failed (recorded)':'Declined (recorded)')+
      (advice.charge.measuredDistance!=null?' · '+esc(advice.charge.measuredDistance)+'″ measured':'')
    : forecast
      ? 'Unresolved · '+
        (forecast.probabilityBasis==='measured' && forecast.measuredDistance!=null
          ? esc(forecast.measuredDistance)+'″ measured · ':'')+
        percent(forecast.chargeProbability)+
        (forecast.probabilityBasis==='measured'?' success':' from approximate map')
      : 'Unresolved · measure or select a target';
  const compact=[shot.attacks?'Shoot '+shot.attacks+' · '+number(shot.actualDamage)+' dmg':'Shoot —',
    outcome?'Charge '+outcome:'Charge —',
    fight.attacks?'Fight '+fight.attacks+' · '+number(fight.actualDamage)+' dmg':'Fight —'].join(' | ');
  const style=new URL('./styles/adaptive-execution-panel.css',import.meta.url).href;
  return '<link rel="stylesheet" href="'+esc(style)+'">'+
    '<details data-adaptive-execution data-view-key="adaptive-execution" class="adaptive-execution">'+
      '<summary><strong>ADAPTIVE EXECUTION · '+esc(advice.unitName)+'</strong>'+
        '<small>'+esc(compact)+'</small></summary>'+
      '<div class="adaptive-execution__body">'+
        '<div class="adaptive-execution__step"><b>1 · Shooting</b>'+
          (shot.attacks?'<span>'+shot.attacks+' weapon attack(s) · '+number(shot.actualDamage)+
            ' actual damage'+(target?' · '+number(shot.damageToTarget)+' against selected target':'')+'</span>':
          '<small>'+(shot.actionType && shot.actionType!=='shoot'?
            'Recorded '+esc(shot.actionType.replaceAll('_',' ')):'No shooting damage recorded for this formation')+'</small>')+'</div>'+
        '<div class="adaptive-execution__step"><b>2 · Charge</b><span>'+esc(chargeText)+'</span></div>'+
        '<div class="adaptive-execution__step"><b>3 · Fight</b>'+
          (fight.attacks?'<span>'+fight.attacks+' attack(s) · '+number(fight.actualDamage)+
            ' actual damage</span>':'<small>No Fight attacks recorded for this formation</small>')+
          (fight.finished?'<small>Fight activation finished.</small>':'')+'</div>'+
        '<div class="adaptive-execution__remaining"><strong>'+esc(target?'Current target · '+target:'Remaining opportunity')+'</strong>'+
          (target?(advice.targetStatus==='destroyed'
            ? '<span>Target destroyed (recorded) · review actual objective control and scoring.</span>'
            : '<span>Current wounds: '+(advice.targetWounds??'Unknown')+
              ' · surviving models: '+(advice.targetModels??'Unknown')+'</span>'):'')+
          (!fight.finished&&!fight.attacks?loading:
            '<small>Recorded Fight results replace the original full-activation estimate; no second full attack is assumed.</small>')+
          (forecast?.conditionalFight && !outcome?
            '<small>Conditional on a legal Charge and Fight; exact eligibility must be confirmed.</small>':'')+
        '</div>'+
        (advice.scoring?.objective?
          '<p class="adaptive-execution__scoring"><strong>Objective-control outlook:</strong> '+esc(advice.scoring.objective)+'</p>':'')+
        '<small class="adaptive-execution__note">'+esc(advice.caveat)+
          ' No original plan was saved as a game event; the selected unit and actual combat history drive this live continuation.</small>'+
      '</div>'+
    '</details>';
}
