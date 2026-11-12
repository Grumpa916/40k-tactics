import { renderMapReserveTray } from './map-reserve-tray.js';
import { deploymentUnits, formationFor } from '../rules/event-preparation.js';
import { deploymentWorkspaceSummary, deploymentWorkspaceIssues } from '../rules/deployment-workspace.js';
import { getSecondaryMissionMode } from '../rules/secondary-mission-lifecycle.js';
import { getDeploymentTransports, getDeploymentTransportChoices, getDeploymentTransportOccupancy } from '../rules/deployment-transport-eligibility.js';
export const escapeDeploymentText = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const esc=escapeDeploymentText;


function renderTransportAssignments(state,open) {
  const transports=getDeploymentTransports(state);
  if(!transports.length)return '';
  const passengers=deploymentUnits(state).filter(unit=>!transports.some(t=>t.id===unit.id) &&
    (getDeploymentTransportChoices(state,unit).length || formationFor(state,unit).kind==='embarked'));
  const capacity=transports.map(t=>{
    const slots=getDeploymentTransportOccupancy(state,t);
    return '<p>'+esc(t.name)+' · '+(slots?slots.used+' / '+slots.capacity+' spaces used':'capacity not yet verified — tabletop review required')+'</p>';
  }).join('');
  const controls=passengers.map(unit=>{
    const selected=formationFor(state,unit).transportId??'';
    const choices=getDeploymentTransportChoices(state,unit);
    const current=selected && !choices.some(t=>t.id===selected)
      ? '<option value="'+esc(selected)+'" selected disabled>Current assignment invalid — select another</option>' : '';
    return '<label>'+esc(unit.name)+'<select data-deploy-transport="'+esc(unit.id)+'">'+
      '<option value="">Not embarked</option>'+current+
      choices.map(t=>'<option value="'+esc(t.id)+'"'+(selected===t.id?' selected':'')+'>'+esc(t.name)+'</option>').join('')+
      '</select></label>';
  }).join('');
  return '<details data-deploy-transports'+(open?' open':'')+'><summary>Transport assignments</summary>'+
    '<p>Only eligible carriers and passengers are selectable. Full attached units count toward capacity. Confirm datasheet exceptions on the tabletop.</p>'+
    capacity+(controls||'<p>No eligible passengers currently fit. Check each transport’s capacity and roster.</p>')+'</details>';
}

function armySummaryMarkup(state,summary) {
  const {player,units,unplaced,needsReserveReview}=summary;
  return `<section class="deploy-army deploy-army--summary"><h2>${esc(player.name)}</h2><p>${units.length-unplaced.length} assigned · ${unplaced.length} awaiting placement</p>
    ${needsReserveReview?`<aside class="deploy-warning">Check reserve limits and applicable exceptions on the tabletop.<button type="button" data-deploy-review="${esc(player.id)}">Reserve review confirmed</button></aside>`:state.preparation?.reserveReview?.[player.id]?'<small>Reserve review recorded ✓</small>':''}</section>`;
}
export function renderDeployBeginView(state,{selectedUnitId=null,message='',rolesOpen=false,transportsOpen=false,checklistOpen=false,reference=null}={}) {
  const summaries=deploymentWorkspaceSummary(state), issues=deploymentWorkspaceIssues(state), players=state.players??[];
  const rolesMissing=!state.preGameSetup?.attackerPlayerId||!state.preparation?.firstPlayerId;
  const style=new URL('./styles/deploy-begin.css',import.meta.url).href;
  return `<link rel="stylesheet" href="${style}"><main class="deploy-begin">
    <div class="deploy-begin__workspace"><section class="deploy-begin__map"><div data-deploy-map></div>${renderMapReserveTray(state,{selectedUnitId})}</section>
    <aside class="deploy-begin__panel"><div class="deploy-begin__scroll">
    <details data-deploy-roles${rolesOpen||rolesMissing?' open':''}><summary>Attacker &amp; first player</summary>${[['attacker','Attacker',state.preGameSetup?.attackerPlayerId],['first-player','First player',state.preparation?.firstPlayerId]].map(([action,label,selected])=>`<fieldset><legend>${label}</legend>${players.map(player=>`<button type="button" data-deploy-role="${action}" data-deploy-player="${esc(player.id)}" aria-pressed="${selected===player.id}">${esc(player.name)}</button>`).join('')}</fieldset>`).join('')}</details>
    <button type="button" data-deploy-reference="secondaries">Secondary choices · ${players.map(player=>esc(getSecondaryMissionMode(state,player.id)??'Choose mode')).join(' / ')}</button>
    ${summaries.map(summary=>armySummaryMarkup(state,summary)).join('')}
    ${renderTransportAssignments(state,transportsOpen)}
    <details data-deploy-checklist${checklistOpen?' open':''}><summary>Tabletop setup order · reference</summary><ol><li>Confirm missions and battlefield layout.</li><li>Set up terrain; determine attacker and defender.</li><li>Reveal secondary choices and battle formations, including transports and reserves.</li><li>Deploy armies, then resolve redeployment rules.</li><li>Determine first turn; resolve Scouts and other pre-battle rules.</li></ol><p>Follow the mission pack at the table. These are reminders, not separate app checkpoints.</p></details>
    </div><footer><p role="status">${esc(message)}</p>${issues.length?`<details class="deploy-missing"><summary>${issues.length} setup item${issues.length===1?'':'s'} remaining</summary><ul>${issues.map(issue=>`<li>${esc(issue)}</li>`).join('')}</ul></details>`:''}<button type="button" data-deploy-begin${issues.length?' disabled':''}>Deployment complete · Begin battle</button></footer></aside></div>
    ${reference?`<div class="deploy-reference-overlay"><section role="dialog" aria-modal="true" aria-label="${reference==='terrain'?'Terrain setup':'Secondary choices'}"><header><h2>${reference==='terrain'?'Terrain setup':'Secondary choices'}</h2><button type="button" data-deploy-close-reference>Back to deployment</button></header><div data-deploy-reference-content></div></section></div>`:''}</main>`;
}