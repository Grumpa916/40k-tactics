import { getMissionActionOptions } from '../rules/mission-action-state.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const labels={'command-phase':'End of own Command phase','end-of-turn':'End of own turn','end-of-opponent-turn':"End of opponent's turn"};
export function createMissionActionPicker() {
  let unit=null, selected='', timing='', confirmed=false, objective='';
  let options=[];
  return {
    render(state,unitId,customActions=[]) {
      options=getMissionActionOptions(state);
      if (!options.length) options=customActions.map(item=>({...item,timings:['end-of-turn']}));
      const unitKey=[state.battle?.round,state.turn,unitId].join(':');
      if (unit!==unitKey || !options.some(item=>item.id===selected)) {
        unit=unitKey; selected=options.length===1?options[0].id:''; confirmed=false; objective=''; timing='';
      }
      const option=options.find(item=>item.id===selected);
      if (!timing && option) timing=option.timings?.length===1?option.timings[0]:option.fallbackTiming??'end-of-turn';
      return `<link rel="stylesheet" href="${new URL('./styles/scoring-checkpoints.css',import.meta.url).href}"><div class="shoot-tabletop__action-picker"><label>Active mission<select data-choice-action><option value="">Choose mission…</option>${options.map(item=>`<option value="${esc(item.id)}" ${item.id===selected?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label>
        ${!options.length?'<p>No active secondary missions. Select cards in Command before linking an action.</p>':''}
        ${option?.instanceId?`<label>Verify at<select data-action-timing>${Object.entries(labels).map(([id,label])=>`<option value="${id}" ${id===timing?'selected':''}>${label}</option>`).join('')}</select></label>
          <label>Objective (if applicable)<select data-action-objective><option value="">Not linked to an objective</option>${state.objectives.map(item=>`<option value="${esc(item.id)}" ${item.id===objective?'selected':''}>${esc(item.name??item.id)}</option>`).join('')}</select></label>
          <label><input type="checkbox" data-action-rules-confirmed ${confirmed?'checked':''}> I checked that this unit can perform an Action for this card, and confirmed its scoring timing.</label>
          <small>This records an attempt. Confirm completion and score separately at the checkpoint.</small>`:option?'<p>Custom action · no secondary card linked.</p>':''}
        <button type="button" data-choice-action-confirm ${selected && (!option?.instanceId||confirmed)?'':'disabled'}>Record Action attempt</button></div>`;
    },
    bind(container,onSubmit,rerender) {
      container.querySelector('[data-choice-action]')?.addEventListener('change',event=>{selected=event.target.value;timing='';confirmed=false;rerender();});
      container.querySelector('[data-action-timing]')?.addEventListener('change',event=>{timing=event.target.value;confirmed=false;rerender();});
      container.querySelector('[data-action-objective]')?.addEventListener('change',event=>{objective=event.target.value;});
      container.querySelector('[data-action-rules-confirmed]')?.addEventListener('change',event=>{confirmed=event.target.checked;rerender();});
      container.querySelector('[data-choice-action-confirm]')?.addEventListener('click',()=>{
        const option=options.find(item=>item.id===selected);
        if (!option || (option.instanceId&&!confirmed)) return;
        onSubmit({actionId:option.definitionId??option.id,missionInstanceId:option.instanceId??null,reviewTiming:timing||'end-of-turn',objectiveId:objective||null,rulesConfirmed:confirmed});
      });
    }
  };
}
