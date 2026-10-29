import { getGuardiansStratagemOpportunities } from '../rules/guardians-stratagem-opportunities.js';
import { getActiveGuardiansEffects } from '../rules/stratagem-use-state.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const check=(name,label)=>`<label class="venatari-confirm"><input type="checkbox" name="${name}" required><span>${label}</span></label>`;

export function renderGuardiansStratagemOpportunities(state,{playerId,unitId=null,stratagemId=null,enemyUnitId=null}={}) {
  const entries=getGuardiansStratagemOpportunities(state,{playerId,unitId,stratagemId});
  const ongoing=!stratagemId && ['shooting','charge'].includes(state.phase)?(state.units??[]).filter(unit=>unit.ownerId===playerId && unit.status==='deployed' && (!unitId||unit.id===unitId)).flatMap(unit=>
    getActiveGuardiansEffects(state,unit.id).filter(use=>use.stratagemId==='unlimited-endurance' && use.unitId===unit.id).map(()=>`<article class="rules-reminder-card is-active"><strong>Unlimited Endurance · ${esc(unit.name)}</strong><p>${state.phase==='shooting'?'Ranged attacks have Assault.':'The recorded Advance does not prevent declaring a charge.'} Active until the end of this turn.</p></article>`)).join(''):'';
  if (!entries.length) return ongoing;
  const groups=new Map();
  for (const entry of entries) {if(!groups.has(entry.stratagemId))groups.set(entry.stratagemId,[]);groups.get(entry.stratagemId).push(entry);}
  const open=stratagemId||entries.some(entry=>entry.window==='start'&&entry.available);
  return ongoing+'<details class="unit-rules-reminders guardians-opportunities"'+(open?' open':'')+'><summary>Guardians stratagem opportunities</summary>'+[...groups.values()].map(options=>{
    const e=options[0], available=options.filter(option=>option.available), active=options.find(option=>option.active);
    const selected=available[0]??e;
    const enemyOptions=selected.enemies;
    const timing={
      'superhuman-focus':'This phase has ended',
      'shield-of-honour':'Start of Fight, before phase actions',
      'in-auramite-clad':'This enemy just selected this target; no attacks have been resolved',
      'unlimited-endurance':'This unit just finished its Advance move',
      'prime-target':'This unit was just selected to shoot; no attacks have been resolved',
      'swift-as-the-eagle':'This enemy just ended its move'
    }[e.stratagemId];
    return `<article class="rules-reminder-card${active?' is-active':''}"><header><strong>${esc(e.title)} · ${e.cpCost} CP</strong><span>${active?'Recorded':available.length?'Opportunity':'Unavailable'}</span></header><small>${esc(e.timing)}</small><p>${esc(e.effect)}</p>`+
      (active?`<p>Recorded for ${esc(active.unitName)}${active.active.enemyUnitId?' against '+esc(state.units.find(u=>u.id===active.active.enemyUnitId)?.name??active.active.enemyUnitId):''}. Resolve conditional effects at the table.</p>`:'')+
      `<details class="venatari-ability-controls"><summary>${available.length?'Review & record use':'Review eligibility'}</summary>`+
      `<form data-guardians-stratagem-form data-guardians-id="${esc(e.stratagemId)}" data-guardians-player="${esc(playerId)}"><label>Friendly unit<select name="unitId" required>${options.map(option=>`<option value="${esc(option.unitId)}" ${option===selected?'selected ':''}${option.available?'':'disabled'}>${esc(option.unitName)}${option.blockedReason?' · '+esc(option.blockedReason):''}</option>`).join('')}</select></label>`+
      (['in-auramite-clad','swift-as-the-eagle'].includes(e.stratagemId)?`<label>Enemy trigger<select name="enemyUnitId" required><option value="">Choose enemy…</option>${enemyOptions.map(enemy=>`<option value="${esc(enemy.id)}" ${enemy.id===enemyUnitId?'selected':''}>${esc(enemy.name)}</option>`).join('')}</select></label>`:'')+
      check('timingConfirmed',timing)+check('unitLimitConfirmed','No other stratagem targeted this unit this phase, including uses resolved only at the table')+
      (e.stratagemId==='swift-as-the-eagle'?check('rangeConfirmed','Enemy ended within 8″; this unit is unengaged, checked at the table')+'<small>Resolve the D3+3″ Normal move at the table. The app records the use and CP; it does not choose the destination.</small>':'')+
      `<button type="submit" ${available.length?'':'disabled'}>Spend ${e.cpCost} CP · ${esc(e.title)}</button></form></details>`+
      (!available.length?'<p>'+esc(selected.blockedReason??'Not available in this window.')+'</p>':'')+
      `<a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener noreferrer">Rule reference</a></article>`;
  }).join('')+'</details>';
}

export function readGuardiansStratagemForm(form) {
  const checked=name=>form.querySelector(`[name="${name}"]`)?.checked===true;
  return {playerId:form.getAttribute('data-guardians-player'),stratagemId:form.getAttribute('data-guardians-id'),
    unitId:form.querySelector('[name="unitId"]')?.value,enemyUnitId:form.querySelector('[name="enemyUnitId"]')?.value||null,
    timingConfirmed:checked('timingConfirmed'),unitLimitConfirmed:checked('unitLimitConfirmed'),rangeConfirmed:checked('rangeConfirmed')};
}
