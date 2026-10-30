import { COMMAND_TYPES } from '../commands/game-commands.js';
import { getBattleRulesReminders, getTargetDefenseReminders, getUnitBattleNote } from '../rules/battle-rules-reminders.js';
import { renderVenatariAbilityControls, readVenatariAbilityForm } from './venatari-ability-controls.js';
import { renderGuardiansStratagemOpportunities, readGuardiansStratagemForm } from './guardians-stratagem-controls.js';
import { getGuardiansStratagemOpportunities } from '../rules/guardians-stratagem-opportunities.js';
import { getCustodesDetachmentRuleReminders, getCustodesDetachmentStratagemReminders } from '../rules/custodes-detachment-rule-reminders.js';
import { renderCustodesDetachmentStratagemControls, readCustodesDetachmentStratagemForm } from './custodes-detachment-stratagem-controls.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const stylesheet=new URL('./styles/rules-reminders.css',import.meta.url).href;
const style=()=>'<link rel="stylesheet" href="'+esc(stylesheet)+'">';
const perspective=(state,id)=>id??state.players?.[0]?.id??state.activePlayer;

function groupEntries(entries) {
  const grouped=new Map();
  for(const entry of entries) {
    const key=entry.limit?entry.ruleId+':'+entry.unitId:entry.ruleId+':'+entry.effect;
    const existing=grouped.get(key);
    if(existing && entry.unitName) existing.unitName=[existing.unitName,entry.unitName].filter(Boolean).join(', ');
    else grouped.set(key,{...entry});
  }
  return [...grouped.values()];
}

function renderEntry(entry, state) {
  const active = isActiveEffect(entry);
  const chosenEffect = entry.choices?.find(choice => choice.id === entry.used?.choice)?.effect;
  const context=' data-rule-id="'+esc(entry.ruleId)+'" data-rule-unit="'+esc(entry.unitId??'')+'" data-rule-player="'+esc(entry.playerId)+'"';
  const actions=entry.used?'':entry.katahChoices?entry.katahChoices.map(choice=>'<button type="button" data-record-katah-reminder'+context+' data-katah-name="'+esc(choice.id)+'">'+esc(choice.label)+'</button>').join(''):entry.choices?entry.choices.map(choice=>'<button type="button" data-record-rule-use'+context+' data-rule-choice="'+esc(choice.id)+'">Mark used · '+esc(choice.label)+'</button>').join(''):
    entry.action?'<button type="button" data-record-rule-use'+context+'>'+esc(entry.action)+'</button>':'';
  return '<article class="rules-reminder-card'+(active?' is-active':entry.used?' is-used':'')+'"><header><strong>'+esc(entry.title)+'</strong>'+
    (entry.limit?'<span>'+(active?'Active this phase':entry.used?'Used':'Available')+'</span>':'')+'</header>'+
    (entry.unitName?'<small>'+esc(entry.unitName)+'</small>':'')+'<small>'+esc(entry.timing??'')+(entry.cpCost?' · '+entry.cpCost+' CP':'')+'</small>'+
    '<p>'+esc(active?chosenEffect??entry.effect:entry.used?'This limited ability has already been used.':entry.effect)+'</p>'+(entry.used?'<p class="rules-reminder-used">Recorded in round '+esc(entry.used.round)+' · '+esc(entry.used.phase)+(entry.used.choice?' · '+esc(entry.choices?.find(choice=>choice.id===entry.used.choice)?.label??entry.used.choice):'')+'</p>':'')+
    (entry.used?.actualWounds !== undefined?'<p>'+esc(state.units?.find(unit=>unit.id===entry.used.targetId)?.name??entry.used.targetId)+' · '+esc(entry.used.actualWounds)+' wounds lost recorded</p>':'')+
    (entry.used?.cpSpent !== undefined?'<p>'+esc(entry.used.cpSpent)+' CP spent</p>':'')+
    (actions?'<div class="rules-reminder-actions">'+actions+'</div>':'')+renderVenatariAbilityControls(state, entry)+
    '<a href="'+esc(entry.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Rule reference</a></article>';
}

const isActiveEffect = entry => Boolean(entry.used && entry.duration === 'phase' && entry.activeThisPhase);

function renderDetachmentStratagemReminders(state,playerId) {
  const entries=getCustodesDetachmentStratagemReminders(state,{playerId});
  if(!entries.length)return '';
  return '<details class="unit-rules-reminders" data-view-key="detachment-stratagem-windows"><summary>Detachment Stratagems · current phase · '+entries.length+'</summary>'+entries.map(entry=>
    '<article class="rules-reminder-card"><header><strong>'+esc(entry.detachmentName)+' · '+esc(entry.title)+' · '+esc(entry.cpCost)+' CP</strong><span>'+(entry.affordable?'Check trigger':'Needs more CP')+'</span></header>'+
    '<small>'+esc(entry.timing)+'</small><p>'+esc(entry.effect)+'</p><small>Confirm the exact trigger, target eligibility, and phase limits in the rule reference; enough CP does not by itself make this Stratagem usable.</small>'+
    (entry.title==='Preternatural Rapidity'?renderCustodesDetachmentStratagemControls(state,{playerId,stratagemId:'preternatural-rapidity'}):'')+
    '<a href="'+esc(entry.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Rule reference</a></article>'
  ).join('')+'</details>';
}

export function renderUnitRulesReminders(state,{perspectivePlayerId=null,selectedUnitId=null}={}) {
  const playerId=perspective(state,perspectivePlayerId);
  const entries=groupEntries(getBattleRulesReminders(state,{playerId,unitId:selectedUnitId}).filter(entry=>!entry.used||isActiveEffect(entry)));
  const detachmentEntries=getCustodesDetachmentRuleReminders(state,{playerId,unitId:selectedUnitId});
  const stratagemEntries=getCustodesDetachmentStratagemReminders(state,{playerId});
  const stratagemHtml=renderDetachmentStratagemReminders(state,playerId);
  const note=selectedUnitId?getUnitBattleNote(state,selectedUnitId):'';
  const guardians=renderGuardiansStratagemOpportunities(state,{playerId,unitId:selectedUnitId});
  if(!entries.length&&!detachmentEntries.length&&!note)return guardians||stratagemHtml?style()+guardians+stratagemHtml:'';
  const opening=entries.some(entry=>entry.kind==='decision');
  return style()+'<details class="unit-rules-reminders" data-view-key="unit-rules-reminders"'+(opening?' open':'')+'><summary>Rules reminders · '+(entries.length+detachmentEntries.length+stratagemEntries.length)+'</summary>'+
    (note?'<div class="rules-personal-note"><strong>My notes</strong><p>'+esc(note)+'</p></div>':'')+
    entries.map(entry=>renderEntry(entry,state)).join('')+detachmentEntries.map(entry=>renderEntry(entry,state)).join('')+'</details>'+guardians+stratagemHtml;
}

export function renderTargetDefenseReminders(state,options={}) {
  const entries=getTargetDefenseReminders(state,options);
  const target=state.units?.find(unit=>unit.id===(options.allocationTargetId??options.targetUnitId));
  const note=target?getUnitBattleNote(state,target.id):'';
  const detachmentEntries=target?getCustodesDetachmentRuleReminders(state,{playerId:target.ownerId,unitId:target.id}):[];
  const guardians=target?renderGuardiansStratagemOpportunities(state,{playerId:target.ownerId,unitId:target.id,stratagemId:'in-auramite-clad',enemyUnitId:options.attackerId}):'';
  if(!entries.length&&!detachmentEntries.length&&!note)return guardians?style()+guardians:'';
  return style()+'<section class="rules-target-defense" aria-label="Target defensive rules" data-target-defense-reminders><h2>Target defenses · '+esc(target?.name??'Selected unit')+'</h2><ul>'+
    entries.map(entry=>'<li'+(entry.conditional?' class="is-conditional"':'')+'><strong>'+esc(entry.title)+'</strong><span>'+esc(entry.effect)+'</span></li>').join('')+
    detachmentEntries.map(entry=>'<li class="is-conditional"><strong>'+esc(entry.title)+'</strong><span>'+esc(entry.effect)+'</span></li>').join('')+'</ul>'+
    (note?'<div class="rules-personal-note"><strong>Unit notes</strong><p>'+esc(note)+'</p></div>':'')+'</section>'+guardians;
}

export function renderRulesReminderDialog(state,{playerId,unitId=null,draft=null,message='',canUndo=false}={}) {
  const entries=groupEntries(getBattleRulesReminders(state,{playerId}));
  const detachmentEntries=getCustodesDetachmentRuleReminders(state,{playerId});
  const units=state.units??[];
  const active=entries.filter(entry=>!entry.used||isActiveEffect(entry)),used=entries.filter(entry=>entry.used&&!isActiveEffect(entry));
  return style()+'<div class="rules-reminder-backdrop" data-rules-backdrop><section class="rules-reminder-dialog" role="dialog" aria-modal="true" aria-labelledby="rules-reminder-title">'+
    '<header class="rules-reminder-heading"><h2 id="rules-reminder-title">Rules &amp; unit notes</h2><button type="button" data-close-rules-reminders>Close</button></header>'+
    '<p class="rules-reminder-phase">Current phase: '+esc(state.phase)+' · '+active.length+' current reminders</p>'+
    '<p class="rules-reminder-help">Confirm distances and rule conditions at the table. “Mark used” tracks a tabletop declaration. Venatari controls update recorded wounds, reserves and the CP cost you confirm; CP confirmation and Re-ready buttons also update their recorded resources.</p>'+
    (message?'<p role="status">'+esc(message)+'</p>':'')+
    (canUndo?'<button type="button" data-undo-rule-use>Undo last reminder use</button>':'')+
    '<div class="rules-reminder-list">'+(active.map(entry=>renderEntry(entry,state)).join('')+detachmentEntries.map(entry=>renderEntry(entry,state)).join('')||'<p>No faction reminders are due in this phase.</p>')+'</div>'+
    (used.length?'<details><summary>Used abilities · '+used.length+'</summary>'+used.map(entry=>renderEntry(entry,state)).join('')+'</details>':'')+
    renderGuardiansStratagemOpportunities(state,{playerId})+renderDetachmentStratagemReminders(state,playerId)+
    '<form class="rules-unit-note-editor" data-save-unit-rules-note><h3>My unit notes</h3><label>Unit<select data-rules-note-unit>'+units.map(unit=>'<option value="'+esc(unit.id)+'"'+(unit.id===unitId?' selected':'')+'>'+esc((state.players?.find(p=>p.id===unit.ownerId)?.name??unit.ownerId)+' · '+unit.name)+'</option>').join('')+'</select></label>'+
    '<label>Notes<textarea data-unit-rules-note maxlength="2000" rows="4" placeholder="A reminder for this unit…">'+esc(draft??getUnitBattleNote(state,unitId))+'</textarea></label><button type="submit"'+(!unitId?' disabled':'')+'>Save unit notes</button></form></section></div>';
}

export function createRulesReminderController(container,{session,perspectivePlayerId=null}={}) {
  let open=false,unitId=null,message='',returnFocus=null;
  const drafts=new Map();
  const captureDraft=()=>{const field=container.querySelector?.('[data-unit-rules-note]');if(field&&unitId)drafts.set(unitId,field.value);};
  function refresh({capture=true}={}) {
    const host=container.querySelector?.('[data-rules-reminder-host]');
    if(!host)return;
    if(capture)captureDraft();
    const state=session.getState(),playerId=perspective(state,perspectivePlayerId);
    const entries=groupEntries(getBattleRulesReminders(state,{playerId}).filter(entry=>!entry.used||isActiveEffect(entry)));
    const guardiansCount=new Set(getGuardiansStratagemOpportunities(state,{playerId}).filter(entry=>entry.available||entry.active).map(entry=>entry.stratagemId)).size;
    const detachmentCount=getCustodesDetachmentRuleReminders(state,{playerId}).length;
    const stratagemCount=getCustodesDetachmentStratagemReminders(state,{playerId}).length;
    for(const button of container.querySelectorAll?.('[data-toggle-rules-reminders]')??[]) {
      button.textContent='Rules · '+(entries.length+detachmentCount+stratagemCount+guardiansCount);button.setAttribute('aria-expanded',String(open));
      button.hidden=state.battle?.status!=='active';
    }
    if(!state.units?.some(unit=>unit.id===unitId))unitId=state.units?.find(unit=>unit.ownerId===playerId)?.id??state.units?.[0]?.id??null;
    if(state.battle?.status!=='active')open=false;
    const scroll=container.querySelector?.('.rules-reminder-dialog')?.scrollTop??0;
    host.innerHTML=open?renderRulesReminderDialog(state,{playerId,unitId,draft:drafts.get(unitId),message,canUndo:session.getLastCorrection?.()?.label==='rule reminder use'}):'';
    const dialog=container.querySelector?.('.rules-reminder-dialog');if(dialog)dialog.scrollTop=scroll;
  }
  function close(){captureDraft();open=false;refresh();returnFocus?.focus?.();}
  function click(event) {
    const toggle=event.target?.closest?.('[data-toggle-rules-reminders]');
    if(toggle){event.preventDefault?.();returnFocus=toggle;open=!open;refresh();if(open)container.querySelector?.('[data-close-rules-reminders]')?.focus?.();return;}
    if(event.target?.closest?.('[data-close-rules-reminders]')||event.target===container.querySelector?.('[data-rules-backdrop]')){close();return;}
    const katah=event.target?.closest?.('[data-record-katah-reminder]');
    if(katah){try{message='Ka’tah use recorded.';session.dispatch({type:COMMAND_TYPES.RECORD_CUSTODES_KATAH_USE,payload:{playerId:katah.getAttribute('data-rule-player'),unitId:katah.getAttribute('data-rule-unit'),katahName:katah.getAttribute('data-katah-name')}});}catch(error){message=error.message;open=true;}refresh();return;}
    const use=event.target?.closest?.('[data-record-rule-use]');
    if(use){
      try{message='Rule use recorded.';session.dispatch({type:COMMAND_TYPES.RECORD_RULES_REMINDER_USE,payload:{playerId:use.getAttribute('data-rule-player'),unitId:use.getAttribute('data-rule-unit')||null,ruleId:use.getAttribute('data-rule-id'),choice:use.getAttribute('data-rule-choice')||null}});}
      catch(error){message=error.message;open=true;}
      refresh();return;
    }
    if(event.target?.closest?.('[data-undo-rule-use]')){session.undoLastAction?.();message='Reminder use undone.';refresh();}
  }
  function input(event){if(event.target?.hasAttribute?.('data-unit-rules-note')&&unitId)drafts.set(unitId,event.target.value);}
  function change(event){if(!event.target?.hasAttribute?.('data-rules-note-unit'))return;captureDraft();unitId=event.target.value;message='';const field=container.querySelector?.('[data-unit-rules-note]');if(field)field.value=drafts.get(unitId)??getUnitBattleNote(session.getState(),unitId);event.target.blur?.();}
  function submit(event){
    if(event.target?.hasAttribute?.('data-guardians-stratagem-form')) {
      event.preventDefault?.();
      try {session.dispatch({type:COMMAND_TYPES.RECORD_GUARDIANS_STRATAGEM_USE,payload:readGuardiansStratagemForm(event.target)});message='Guardians stratagem recorded; CP updated.';}
      catch(error){message=error.message;open=true;}
      refresh();return;
    }
    if(event.target?.hasAttribute?.('data-venatari-ability-form')) {
      event.preventDefault?.();
      try {session.dispatch({type:COMMAND_TYPES.RECORD_VENATARI_ABILITY_USE,payload:readVenatariAbilityForm(event.target)});message='Venatari ability recorded.';}
      catch(error){message=error.message;open=true;}
      refresh();return;
    }
    if(event.target?.hasAttribute?.('data-custodes-detachment-stratagem-form')) {
      event.preventDefault?.();
      try {session.dispatch({type:COMMAND_TYPES.RECORD_CUSTODES_DETACHMENT_STRATAGEM_USE,payload:readCustodesDetachmentStratagemForm(event.target)});message='Preternatural Rapidity recorded; 1 CP spent. This unit can charge after its Advance this turn.';}
      catch(error){message=error.message;open=true;}
      refresh();return;
    }
    if(!event.target?.hasAttribute?.('data-save-unit-rules-note'))return;event.preventDefault?.();captureDraft();const unit=session.getState().units?.find(unit=>unit.id===unitId);try{message='Unit notes saved.';session.dispatch({type:COMMAND_TYPES.SET_UNIT_BATTLE_NOTE,payload:{playerId:unit?.ownerId,unitId,note:drafts.get(unitId)??''}});}catch(error){message=error.message;}refresh();}
  function keydown(event){if(!open)return;if(event.key==='Escape'){event.preventDefault?.();close();return;}if(event.key==='Tab'){const dialog=container.querySelector?.('.rules-reminder-dialog');const items=[...(dialog?.querySelectorAll?.('button:not([disabled]),select,textarea,input,a[href],summary')??[])];const first=items[0],last=items.at(-1),active=container.ownerDocument?.activeElement;if(event.shiftKey&&active===first){event.preventDefault();last?.focus?.();}else if(!event.shiftKey&&active===last){event.preventDefault();first?.focus?.();}}}
  container.addEventListener?.('click',click);container.addEventListener?.('input',input);container.addEventListener?.('change',change);container.addEventListener?.('submit',submit);container.addEventListener?.('keydown',keydown);
  return {refresh,destroy(){for(const [name,fn] of [['click',click],['input',input],['change',change],['submit',submit],['keydown',keydown]])container.removeEventListener?.(name,fn);}};
}
