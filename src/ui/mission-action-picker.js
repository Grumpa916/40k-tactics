import { getMissionActionOptions } from '../rules/mission-action-state.js';
import { getDeathTrapTerrainOptions } from '../rules/death-trap-state.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const labels={'command-phase':'End of own Command phase','end-of-turn':'End of own turn','end-of-opponent-turn':"End of opponent's turn"};
const validTiming=id=>Object.prototype.hasOwnProperty.call(labels,id);
function timingsFor(option) {
  const timings=[...new Set((option?.timings??[]).filter(validTiming))];
  if (timings.length) return timings;
  return [validTiming(option?.fallbackTiming)?option.fallbackTiming:'end-of-turn'];
}
export function createMissionActionPicker() {
  let unit=null, selected='', timing='', confirmed=false, objective='', terrainArea='';
  let options=[];
  return {
    render(state,unitId,customActions=[]) {
      options=getMissionActionOptions(state);
      if (!options.length) options=customActions.map(item=>({...item,timings:['end-of-turn']}));
      const unitKey=[state.battle?.round,state.turn,unitId].join(':');
      if (unit!==unitKey || !options.some(item=>item.id===selected)) {
        unit=unitKey; selected=options.length===1?options[0].id:''; confirmed=false; objective=''; terrainArea=''; timing='';
      }
      const option=options.find(item=>item.id===selected);
      const isDeathTrap=option?.definitionId==='primary-death-trap';
      const playerId=state.activePlayer ?? state.battle?.activePlayerId ?? null;
      const deathTrapTerrain=isDeathTrap ? getDeathTrapTerrainOptions(state,{playerId}).filter(item=>!item.trapped) : [];
      if (isDeathTrap && terrainArea && !deathTrapTerrain.some(item=>item.terrainAreaId===terrainArea)) terrainArea='';
      const allowedTimings=timingsFor(option);
      if (option && (!timing || !allowedTimings.includes(timing))) timing=allowedTimings.length===1?allowedTimings[0]:(allowedTimings.includes(option.fallbackTiming)?option.fallbackTiming:allowedTimings[0]);
      const actionReminder=option?.actionSummary
        ? `<div class="mission-action-picker__reminder"><strong>Action reminder</strong><span>${esc(option.actionSummary)}</span></div>`
        : option?.instanceId && option?.knownShootingAction===false
          ? '<div class="mission-action-picker__warning"><strong>Check the physical card</strong><span>This active mission is not recorded as a known Shooting-phase Action. Continue only if the card says this unit can perform an Action now.</span></div>'
          : '';
      const timingControl=option?.instanceId && !isDeathTrap
        ? allowedTimings.length===1
          ? `<div class="mission-action-picker__timing"><span>Scoring check</span><strong>${esc(labels[allowedTimings[0]])}</strong><small>Set automatically from the active mission.</small></div>`
          : `<label class="mission-action-picker__field"><span>Scoring check</span><select data-action-timing>${allowedTimings.map(id=>`<option value="${id}" ${id===timing?'selected':''}>${esc(labels[id])}</option>`).join('')}</select><small>This mission has more than one valid scoring window.</small></label>`
        : '';
      const confirmationText=option?.knownShootingAction===false
        ? 'Physical card confirms this is a Shooting-phase Action'
        : 'Action requirements met';
      const targetControl=isDeathTrap
        ? `<label class="mission-action-picker__field"><span>Terrain area to trap</span><select data-action-terrain><option value="">Choose terrain area…</option>${deathTrapTerrain.map(item=>`<option value="${esc(item.terrainAreaId)}" ${item.terrainAreaId===terrainArea?'selected':''}>${esc(item.label)}</option>`).join('')}</select><small>Choose the Event Companion terrain area receiving the operation marker. Already trapped areas are hidden.</small></label>`
        : `<label class="mission-action-picker__field"><span>Objective used for this Action <small>(optional)</small></span><select data-action-objective><option value="">No objective selected</option>${(state.objectives??[]).map(item=>`<option value="${esc(item.id)}" ${item.id===objective?'selected':''}>${esc(item.name??item.id)}</option>`).join('')}</select></label>`;
      const completionNote=isDeathTrap
        ? '<p class="mission-action-picker__note">Booby Trap completes immediately. Recording it marks this terrain area as trapped for the rest of the battle; VP is still confirmed at the scoring checkpoint.</p>'
        : '<p class="mission-action-picker__note">This records the Action attempt only. Completion and VP are confirmed later at the scoring checkpoint.</p>';
      const linkedFields=option?.instanceId?`${actionReminder}${timingControl}${targetControl}
          <label class="mission-action-picker__confirm"><input type="checkbox" data-action-rules-confirmed ${confirmed?'checked':''}><span><strong>${confirmationText}</strong><small>${option?.knownShootingAction===false?'Confirm this against the physical mission card.':'Confirm the unit satisfies the card’s Action requirements.'}</small></span></label>
          ${completionNote}`:option?'<p class="mission-action-picker__note">Custom action · no mission card linked.</p>':'';
      const scoringHref=new URL('./styles/scoring-checkpoints.css',import.meta.url).href;
      const pickerHref=new URL('./styles/mission-action-picker.css',import.meta.url).href;
      const targetReady=!isDeathTrap || !!terrainArea;
      return `<link rel="stylesheet" href="${scoringHref}"><link rel="stylesheet" href="${pickerHref}"><div class="shoot-tabletop__action-picker mission-action-picker"><label class="mission-action-picker__field"><span>Mission Action</span><select data-choice-action><option value="">Choose mission…</option>${options.map(item=>`<option value="${esc(item.id)}" ${item.id===selected?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label>
        ${!options.length?'<p class="mission-action-picker__note">No active mission Actions are available. Select cards in Command before linking an Action.</p>':''}
        ${linkedFields}
        <button type="button" data-choice-action-confirm ${selected && targetReady && (!option?.instanceId||confirmed)?'':'disabled'}>Record Action attempt</button></div>`;
    },
    bind(container,onSubmit,rerender) {
      container.querySelector('[data-choice-action]')?.addEventListener('change',event=>{selected=event.target.value;timing='';confirmed=false;objective='';terrainArea='';rerender();});
      container.querySelector('[data-action-timing]')?.addEventListener('change',event=>{timing=event.target.value;confirmed=false;rerender();});
      container.querySelector('[data-action-objective]')?.addEventListener('change',event=>{objective=event.target.value;});
      container.querySelector('[data-action-terrain]')?.addEventListener('change',event=>{terrainArea=event.target.value;rerender();});
      container.querySelector('[data-action-rules-confirmed]')?.addEventListener('change',event=>{confirmed=event.target.checked;rerender();});
      container.querySelector('[data-choice-action-confirm]')?.addEventListener('click',()=>{
        const option=options.find(item=>item.id===selected);
        const isDeathTrap=option?.definitionId==='primary-death-trap';
        if (!option || (option.instanceId&&!confirmed) || (isDeathTrap&&!terrainArea)) return;
        const allowedTimings=timingsFor(option);
        const reviewTiming=allowedTimings.includes(timing)?timing:allowedTimings[0];
        onSubmit({actionId:option.definitionId??option.id,missionInstanceId:option.instanceId??null,reviewTiming,objectiveId:objective||null,terrainAreaId:terrainArea||null,rulesConfirmed:confirmed});
      });
    }
  };
}