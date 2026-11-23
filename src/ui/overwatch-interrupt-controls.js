import { COMMAND_TYPES } from '../commands/game-commands.js';
import { getOverwatchOffer } from '../rules/overwatch-interrupt.js';
import { unitDisplayLabels } from './map-unit-labels.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

export function renderOverwatchInterrupt(state) {
  const offer=getOverwatchOffer(state);
  if(!offer) return '';
  const labels=unitDisplayLabels(state.units??[],state);
  const label=unit=>esc(labels.get(unit.id)??unit.name??unit.id);
  return '<section class="overwatch-interrupt" data-overwatch-interrupt data-overwatch-key="'+esc(offer.triggerKey)+'">'+
    '<strong>Fire Overwatch · end of opponent Movement</strong>'+
    '<p>At the end of this Movement phase, the reacting player may spend 1 CP to snap shoot one visible eligible enemy unit within 24″. Hits require unmodified 6s; hit re-rolls are not allowed.</p>'+
    '<label>Firing unit<select data-overwatch-unit>'+offer.firingUnits.map(unit=>'<option value="'+esc(unit.id)+'">'+label(unit)+'</option>').join('')+'</select></label>'+
    '<label>Target<select data-overwatch-target>'+offer.targets.map(unit=>'<option value="'+esc(unit.id)+'">'+label(unit)+'</option>').join('')+'</select></label>'+
    '<label>Actual wounds lost by target<input type="number" min="0" step="1" value="0" inputmode="numeric" data-overwatch-damage></label>'+
    '<label><input type="checkbox" data-overwatch-timing> Opponent has finished Movement</label>'+
    '<label><input type="checkbox" data-overwatch-eligible> Firing unit is unengaged; target is visible, eligible and within 24″ on the table</label>'+
    '<button type="button" data-overwatch-use '+(offer.cpAvailable?'':'disabled')+'>Spend 1 CP · record Overwatch</button>'+
    '<button type="button" data-overwatch-decline>Decline Overwatch</button>'+
    '<small>Record the tabletop result. Any entered damage updates the target’s wounds; no damage estimate is applied.</small></section>';
}
export function overwatchInterruptCommand(event) {
  const use=event.target?.closest?.('[data-overwatch-use]');
  const decline=event.target?.closest?.('[data-overwatch-decline]');
  const root=(use??decline)?.closest?.('[data-overwatch-interrupt]');
  if(!root)return null;
  const triggerKey=root.getAttribute('data-overwatch-key');
  if(decline)return {type:COMMAND_TYPES.DECLINE_OVERWATCH,payload:{triggerKey}};
  const eligible=root.querySelector('[data-overwatch-eligible]')?.checked===true;
  return {type:COMMAND_TYPES.RECORD_OVERWATCH,payload:{
    triggerKey,firingUnitId:root.querySelector('[data-overwatch-unit]')?.value,
    targetUnitId:root.querySelector('[data-overwatch-target]')?.value,
    actualDamage:Number(root.querySelector('[data-overwatch-damage]')?.value),
    timingConfirmed:root.querySelector('[data-overwatch-timing]')?.checked===true,
    inRangeConfirmed:eligible,visibilityConfirmed:eligible,unengagedConfirmed:eligible
  }};
}
