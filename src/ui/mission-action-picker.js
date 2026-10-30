import { getMissionActionOptions } from '../rules/mission-action-state.js';
import { getDeathTrapTerrainOptions } from '../rules/death-trap-state.js';
import { getSmokeAndMirrorsObjectiveOptions } from '../rules/smoke-and-mirrors-state.js';
import { getTriangulationObjectiveOptions } from '../rules/triangulation-state.js';
import {
  getLocateAndDenyCentralObjectiveOptions,
  getLocateAndDenyMarkerRemovalOptions,
  getLocateAndDenySetup,
  getLocateAndDenyTerrainOptions
} from '../rules/locate-and-deny-state.js';
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
  let locateSetupTerrain=new Set();
  let expectedLocateSetupCount=5;
  let renderState=null;
  let options=[];
  return {
    render(state,unitId,customActions=[]) {
      renderState=state;
      options=getMissionActionOptions(state);
      if (!options.length) options=customActions.map(item=>({...item,timings:['end-of-turn']}));
      const unitKey=[state.battle?.round,state.turn,unitId].join(':');
      if (unit!==unitKey || !options.some(item=>item.id===selected)) {
        unit=unitKey; selected=options.length===1?options[0].id:''; confirmed=false; objective=''; terrainArea=''; timing=''; locateSetupTerrain=new Set();
      }
      const option=options.find(item=>item.id===selected);
      const isDeathTrap=option?.definitionId==='primary-death-trap';
      const isSmokeAndMirrors=option?.definitionId==='primary-smoke-and-mirrors';
      const isTriangulation=option?.definitionId==='primary-triangulation';
      const isLocateAndDeny=option?.definitionId==='primary-locate-and-deny';
      const playerId=state.activePlayer ?? state.battle?.activePlayerId ?? null;
      const locateSetup=isLocateAndDeny ? getLocateAndDenySetup(state,{playerId}) : null;
      const locateSetupMode=isLocateAndDeny && locateSetup?.setupComplete!==true;
      expectedLocateSetupCount=locateSetup?.expectedMarkerCount??5;
      const deathTrapTerrain=isDeathTrap ? getDeathTrapTerrainOptions(state,{playerId}).filter(item=>!item.trapped && item.boobyTrapEligibleByGeometry!==false) : [];
      const smokeObjectives=isSmokeAndMirrors ? getSmokeAndMirrorsObjectiveOptions(state,{playerId}) : [];
      const triangulationObjectives=isTriangulation ? getTriangulationObjectiveOptions(state,{playerId}) : [];
      const locateObjectives=isLocateAndDeny && !locateSetupMode ? getLocateAndDenyCentralObjectiveOptions(state,{playerId}) : [];
      const locateMarkers=isLocateAndDeny && !locateSetupMode ? getLocateAndDenyMarkerRemovalOptions(state,{playerId}) : [];
      const locateSetupOptions=locateSetupMode ? getLocateAndDenyTerrainOptions(state,{playerId}).filter(item=>item.eligible) : [];
      if (isDeathTrap && terrainArea && !deathTrapTerrain.some(item=>item.terrainAreaId===terrainArea)) terrainArea='';
      if (isSmokeAndMirrors && objective && !smokeObjectives.some(item=>item.objectiveId===objective)) objective='';
      if (isTriangulation && objective && !triangulationObjectives.some(item=>item.objectiveId===objective)) objective='';
      if (isLocateAndDeny && !locateSetupMode && objective && !locateObjectives.some(item=>item.objectiveId===objective)) objective='';
      if (isLocateAndDeny && !locateSetupMode && terrainArea && !locateMarkers.some(item=>item.terrainAreaId===terrainArea)) terrainArea='';
      if (locateSetupMode) {
        const validSetupIds=new Set(locateSetupOptions.map(item=>item.terrainAreaId));
        locateSetupTerrain=new Set([...locateSetupTerrain].filter(id=>validSetupIds.has(id)));
      }
      const allowedTimings=timingsFor(option);
      if (option && (!timing || !allowedTimings.includes(timing))) timing=allowedTimings.length===1?allowedTimings[0]:(allowedTimings.includes(option.fallbackTiming)?option.fallbackTiming:allowedTimings[0]);
      const actionReminder=locateSetupMode
        ? '<div class="mission-action-picker__reminder"><strong>Record Locate and Deny setup</strong><span>Tap the terrain areas where you already placed your operation markers on the physical battlefield. This records setup only and does not activate this unit.</span></div>'
        : option?.actionSummary
          ? `<div class="mission-action-picker__reminder"><strong>Action reminder</strong><span>${esc(option.actionSummary)}</span></div>`
          : option?.instanceId && option?.knownShootingAction===false
            ? '<div class="mission-action-picker__warning"><strong>Check the physical card</strong><span>This active mission is not recorded as a known Shooting-phase Action. Continue only if the card says this unit can perform an Action now.</span></div>'
            : '';
      const timingControl=option?.instanceId && !isDeathTrap && !locateSetupMode
        ? allowedTimings.length===1
          ? `<div class="mission-action-picker__timing"><span>Scoring check</span><strong>${esc(labels[allowedTimings[0]])}</strong><small>Set automatically from the active mission.</small></div>`
          : `<label class="mission-action-picker__field"><span>Scoring check</span><select data-action-timing>${allowedTimings.map(id=>`<option value="${id}" ${id===timing?'selected':''}>${esc(labels[id])}</option>`).join('')}</select><small>This mission has more than one valid scoring window.</small></label>`
        : '';
      const confirmationText=option?.knownShootingAction===false
        ? 'Physical card confirms this is a Shooting-phase Action'
        : 'Action requirements met';
      const targetControl=locateSetupMode
        ? `<div class="mission-action-picker__field mission-action-picker__setup"><span>Operation marker terrain areas · ${locateSetupTerrain.size}/${expectedLocateSetupCount}</span><div class="mission-action-picker__setup-grid">${locateSetupOptions.map(item=>`<button type="button" data-locate-setup-terrain="${esc(item.terrainAreaId)}" aria-pressed="${String(locateSetupTerrain.has(item.terrainAreaId))}" class="${locateSetupTerrain.has(item.terrainAreaId)?'is-selected':''}">${esc(item.label)}</button>`).join('')}</div><small>Select exactly ${expectedLocateSetupCount}. Terrain wholly within your deployment zone is excluded automatically.</small></div>`
        : isDeathTrap
          ? `<label class="mission-action-picker__field"><span>Terrain area to trap</span><select data-action-terrain><option value="">Choose terrain area…</option>${deathTrapTerrain.map(item=>`<option value="${esc(item.terrainAreaId)}" ${item.terrainAreaId===terrainArea?'selected':''}>${esc(item.label)}</option>`).join('')}</select><small>Choose the Event Companion terrain area receiving the operation marker. Already trapped areas and terrain known to be wholly inside your deployment zone are hidden.</small></label>`
          : isSmokeAndMirrors
            ? `<label class="mission-action-picker__field"><span>Objective to Decoy</span><select data-action-objective><option value="">Choose eligible objective…</option>${smokeObjectives.map(item=>`<option value="${esc(item.objectiveId)}" ${item.objectiveId===objective?'selected':''}>${esc(item.name)} · ${item.enemyTerritory?'enemy territory · ':''}${item.recurringVpIfDecoyed} VP/turn</option>`).join('')}</select><small>Your home objective, active Decoys and objectives already selected for another Decoy attempt this turn are hidden.</small></label>`
            : isTriangulation
              ? `<label class="mission-action-picker__field"><span>Objective to Triangulate</span><select data-action-objective><option value="">Choose eligible objective…</option>${triangulationObjectives.map(item=>`<option value="${esc(item.objectiveId)}" ${item.objectiveId===objective?'selected':''}>${esc(item.name)}${item.controlledByPlayer?' · currently controlled':''}</option>`).join('')}</select><small>Your home objective and objectives already triangulated are hidden. Confirm this unit is within range on the tabletop.</small></label>`
              : isLocateAndDeny
                ? `<label class="mission-action-picker__field"><span>Central objective for Sensor Sweep</span><select data-action-objective><option value="">Choose central objective…</option>${locateObjectives.map(item=>`<option value="${esc(item.objectiveId)}" ${item.objectiveId===objective?'selected':''}>${esc(item.name)}</option>`).join('')}</select><small>Confirm this unit is within range on the physical tabletop.</small></label><label class="mission-action-picker__field"><span>Operation marker to remove</span><select data-action-terrain><option value="">Choose remaining marker…</option>${locateMarkers.map(item=>`<option value="${esc(item.terrainAreaId)}" ${item.terrainAreaId===terrainArea?'selected':''}>${esc(item.label)}</option>`).join('')}</select><small>The selected marker is removed only if Sensor Sweep completes at end of turn.</small></label>`
                : `<label class="mission-action-picker__field"><span>Objective used for this Action <small>(optional)</small></span><select data-action-objective><option value="">No objective selected</option>${(state.objectives??[]).map(item=>`<option value="${esc(item.id)}" ${item.id===objective?'selected':''}>${esc(item.name??item.id)}</option>`).join('')}</select></label>`;
      const completionNote=locateSetupMode
        ? '<p class="mission-action-picker__note">Setup capture can be corrected until the first Sensor Sweep is started. The physical marker placement remains authoritative.</p>'
        : isDeathTrap
          ? '<p class="mission-action-picker__note">Booby Trap completes immediately. Recording it marks this terrain area as trapped for the rest of the battle; VP is still confirmed at the scoring checkpoint.</p>'
          : isSmokeAndMirrors
            ? '<p class="mission-action-picker__note">Decoy completes at the end of your turn only if this unit controls the selected objective. Once completion is confirmed, that objective remains Decoyed and scores on later turns until its operation marker is removed.</p>'
            : isTriangulation
              ? '<p class="mission-action-picker__note">Triangulate completes at the end of your turn only if this unit controls the selected objective. Once completion is confirmed, that objective remains triangulated for the rest of the battle. Starting the Action spends the once-per-turn use even if it fails.</p>'
              : isLocateAndDeny
                ? '<p class="mission-action-picker__note">Sensor Sweep completes at the end of your turn only if this unit controls the selected central objective. A completed review removes the selected operation marker. Starting the Action spends the once-per-turn use even if it fails.</p>'
                : '<p class="mission-action-picker__note">This records the Action attempt only. Completion and VP are confirmed later at the scoring checkpoint.</p>';
      const linkedFields=option?.instanceId
        ? locateSetupMode
          ? `${actionReminder}${targetControl}${completionNote}`
          : `${actionReminder}${timingControl}${targetControl}
          <label class="mission-action-picker__confirm"><input type="checkbox" data-action-rules-confirmed ${confirmed?'checked':''}><span><strong>${confirmationText}</strong><small>${option?.knownShootingAction===false?'Confirm this against the physical mission card.':'Confirm the unit satisfies the card’s Action requirements.'}</small></span></label>
          ${completionNote}`
        : option?'<p class="mission-action-picker__note">Custom action · no mission card linked.</p>':'';
      const scoringHref=new URL('./styles/scoring-checkpoints.css',import.meta.url).href;
      const pickerHref=new URL('./styles/mission-action-picker.css',import.meta.url).href;
      const targetReady=locateSetupMode
        ? locateSetupTerrain.size===expectedLocateSetupCount
        : isDeathTrap ? !!terrainArea : isSmokeAndMirrors ? !!objective : isTriangulation ? !!objective : isLocateAndDeny ? !!objective && !!terrainArea : true;
      const buttonLabel=locateSetupMode?'Record marker setup':'Record Action attempt';
      return `<link rel="stylesheet" href="${scoringHref}"><link rel="stylesheet" href="${pickerHref}"><div class="shoot-tabletop__action-picker mission-action-picker"><label class="mission-action-picker__field"><span>Mission Action</span><select data-choice-action><option value="">Choose mission…</option>${options.map(item=>`<option value="${esc(item.id)}" ${item.id===selected?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label>
        ${!options.length?'<p class="mission-action-picker__note">No active mission Actions are available. Select cards in Command before linking an Action.</p>':''}
        ${linkedFields}
        <button type="button" data-choice-action-confirm ${selected && targetReady && (locateSetupMode||!option?.instanceId||confirmed)?'':'disabled'}>${buttonLabel}</button></div>`;
    },
    bind(container,onSubmit,rerender) {
      container.querySelector('[data-choice-action]')?.addEventListener('change',event=>{selected=event.target.value;timing='';confirmed=false;objective='';terrainArea='';locateSetupTerrain=new Set();rerender();});
      container.querySelector('[data-action-timing]')?.addEventListener('change',event=>{timing=event.target.value;confirmed=false;rerender();});
      container.querySelector('[data-action-objective]')?.addEventListener('change',event=>{objective=event.target.value;rerender();});
      container.querySelector('[data-action-terrain]')?.addEventListener('change',event=>{terrainArea=event.target.value;rerender();});
      container.querySelectorAll?.('[data-locate-setup-terrain]')?.forEach(button=>button.addEventListener('click',()=>{
        const id=button.getAttribute('data-locate-setup-terrain');
        if(!id)return;
        if(locateSetupTerrain.has(id)) locateSetupTerrain.delete(id);
        else if(locateSetupTerrain.size<expectedLocateSetupCount) locateSetupTerrain.add(id);
        rerender();
      }));
      container.querySelector('[data-action-rules-confirmed]')?.addEventListener('change',event=>{confirmed=event.target.checked;rerender();});
      container.querySelector('[data-choice-action-confirm]')?.addEventListener('click',()=>{
        const option=options.find(item=>item.id===selected);
        const isDeathTrap=option?.definitionId==='primary-death-trap';
        const isSmokeAndMirrors=option?.definitionId==='primary-smoke-and-mirrors';
        const isTriangulation=option?.definitionId==='primary-triangulation';
        const isLocateAndDeny=option?.definitionId==='primary-locate-and-deny';
        if(!option)return;
        const playerId=renderState?.activePlayer??renderState?.battle?.activePlayerId??null;
        const locateSetup=isLocateAndDeny&&renderState?getLocateAndDenySetup(renderState,{playerId}):null;
        const locateSetupMode=isLocateAndDeny&&locateSetup?.setupComplete!==true;
        if(locateSetupMode){
          if(locateSetupTerrain.size!==(locateSetup?.expectedMarkerCount??5))return;
          onSubmit({actionId:option.definitionId??option.id,missionInstanceId:option.instanceId??null,reviewTiming:'end-of-turn',rulesConfirmed:true,locateSetupOnly:true,locateMarkerSetupTerrainAreaIds:[...locateSetupTerrain]});
          return;
        }
        if((option.instanceId&&!confirmed)||(isDeathTrap&&!terrainArea)||(isSmokeAndMirrors&&!objective)||(isTriangulation&&!objective)||(isLocateAndDeny&&(!objective||!terrainArea)))return;
        const allowedTimings=timingsFor(option);
        const reviewTiming=allowedTimings.includes(timing)?timing:allowedTimings[0];
        onSubmit({actionId:option.definitionId??option.id,missionInstanceId:option.instanceId??null,reviewTiming,objectiveId:objective||null,terrainAreaId:terrainArea||null,rulesConfirmed:confirmed});
      });
    }
  };
}