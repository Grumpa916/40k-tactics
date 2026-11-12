import { getSpaceMarineStratagemOpportunities } from '../engine/space-marine-stratagem-transitions.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
export function renderSpaceMarineStratagemOpportunities(state,{playerId,unitId=null,livePanel=false}={}){
 const entries=getSpaceMarineStratagemOpportunities(state,{playerId,unitId});
 if(!entries.length)return '';
 const available=entries.filter(e=>e.available).length;
 const html=entries.map(item=>{
  const disabled=!item.available;
  const choice=item.name==='Adaptive Strategy'?
    '<label>Doctrine<select data-marine-stratagem-doctrine style="min-height:44px">'+
    '<option value="assault">Assault Doctrine</option>'+
    '<option value="devastator">Devastator Doctrine</option>'+
    '<option value="tactical">Tactical Doctrine</option></select></label>':'';
  const action=disabled?'<p>'+esc(item.reason)+'</p>':
    '<label style="display:flex;gap:8px;align-items:center;min-height:44px"><input type="checkbox" data-marine-trigger-confirmed>'+
    '<span>I confirmed this Stratagem’s printed timing, trigger and target at the table.</span></label>'+
    choice+
    '<button type="button" data-marine-stratagem-use="'+esc(item.id)+'"'+
    ' data-marine-stratagem-player="'+esc(playerId)+'" data-marine-stratagem-unit="'+esc(unitId??'')+'"'+
    ' style="min-height:44px">Record use · '+esc(item.cpCost)+' CP</button>';
  return '<article data-marine-stratagem-entry class="rules-reminder-card" style="padding:8px;display:grid;gap:6px">'+
    '<strong>'+esc(item.name)+' · '+esc(item.cpCost)+' CP</strong>'+
    '<small>'+esc(item.detachment)+' · '+esc(item.timing)+'</small>'+
    '<p>'+esc(item.description)+'</p>'+action+
    '<small>Source: current 11e independent reference; full official Codex text not yet certified.</small></article>';
 }).join('');
 return '<details class="unit-rules-reminders" data-view-key="marine-stratagems"'+(livePanel&&available?' open':'')+'>'+
  '<summary>Space Marine Stratagems · '+available+' available / '+entries.length+' at this phase</summary>'+
  '<p>Selection is preliminary; CP and phase eligibility are checked. Actual line of sight, target eligibility, special triggers and timing must be confirmed on the tabletop. Effects are recorded, not automatically resolved.</p>'+
  '<div style="display:grid;gap:8px">'+html+'</div></details>';
}
