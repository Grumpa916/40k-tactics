import { getPreternaturalRapidityOpportunities, getLightningWrathOpportunities } from '../rules/custodes-detachment-stratagem-opportunities.js';
import { getRecordedStratagemUses } from '../rules/stratagem-use-state.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const check=(name,label)=>`<label class="venatari-confirm"><input type="checkbox" name="${name}" required><span>${label}</span></label>`;

export function renderCustodesDetachmentStratagemControls(state,{playerId,stratagemId}={}) {
  if (stratagemId==='lightning-wrath' && state.phase==='fight') {
    const active=getRecordedStratagemUses(state).filter(use=>use.stratagemId===stratagemId&&use.playerId===playerId&&
      use.round===state.battle?.round&&use.turn===state.turn&&use.phase==='fight' &&
      !(state.history??[]).some(event=>event.type==='fight.unit_activated'&&event.payload?.unitId===use.unitId&&event.payload?.round===use.round&&event.payload?.turn===use.turn));
    if (active.length) return active.map(use=>`<article class="rules-reminder-card is-active"><strong>Lightning Wrath · ${esc(state.units?.find(unit=>unit.id===use.unitId)?.name??use.unitId)}</strong><p>Recorded. This unit’s pile-in move can be up to D3+3 inches.</p><small>${esc(use.cpSpent)} CP spent.</small></article>`).join('');
  }
  if (!['preternatural-rapidity','lightning-wrath'].includes(stratagemId)) return '';
  if (stratagemId==='preternatural-rapidity' && state.phase==='charge') {
    const active=getRecordedStratagemUses(state).filter(use=>use.stratagemId===stratagemId&&use.playerId===playerId&&
      use.round===state.battle?.round&&use.turn===state.turn&&use.phase==='movement');
    if (active.length) return active.map(use=>`<article class="rules-reminder-card is-active"><strong>Preternatural Rapidity · ${esc(state.units?.find(unit=>unit.id===use.unitId)?.name??use.unitId)}</strong><p>This unit’s Advance does not prevent it from declaring a Charge this turn. ${esc(use.cpSpent)} CP spent.</p></article>`).join('');
  }
  const entries=stratagemId==='preternatural-rapidity'
    ? getPreternaturalRapidityOpportunities(state,{playerId})
    : getLightningWrathOpportunities(state,{playerId});
  if (!entries.length) return stratagemId==='preternatural-rapidity'
    ? '<p>Record an Advance for a Dread Host unit to see its Stratagem opportunity here.</p>'
    : '<p>No Dread Host unit is currently eligible to make a pile-in move.</p>';
  const available=entries.filter(entry=>entry.available);
  return `<details class="venatari-ability-controls"><summary>${available.length?'Review & record use':'Review eligibility'}</summary>`+
    `<form data-custodes-detachment-stratagem-form data-detachment-stratagem-id="${esc(stratagemId)}" data-detachment-stratagem-player="${esc(playerId)}">`+
    `<label>${stratagemId==='preternatural-rapidity'?'Advanced unit':'Unit selected to pile in'}<select name="unitId" required>${entries.map(entry=>`<option value="${esc(entry.unitId)}" ${entry===available[0]?'selected ':''}${entry.available?'':'disabled'}>${esc(entry.unitName)}${entry.blockedReason?' · '+esc(entry.blockedReason):''}</option>`).join('')}</select></label>`+
    check('timingConfirmed',stratagemId==='preternatural-rapidity'?'This unit just Advanced; I am using the Stratagem in the Movement phase':'This unit is now selected to make a pile-in move')+
    check('unitLimitConfirmed','No other Stratagem targeted this unit this phase, including one resolved at the table')+
    `<small>${stratagemId==='preternatural-rapidity'?'The app records the CP spend and charge permission. Resolve the Advance and Charge at the table.':'Roll the D3 and resolve the pile-in at the table; the app records the Stratagem and CP spend.'}</small>`+
    `<button type="submit" ${available.length?'':'disabled'}>Spend ${entries[0].cpCost} CP · ${esc(entries[0].title)}</button></form></details>`;
}

export function readCustodesDetachmentStratagemForm(form) {
  const checked=name=>form.querySelector(`[name="${name}"]`)?.checked===true;
  return {playerId:form.getAttribute('data-detachment-stratagem-player'),stratagemId:form.getAttribute('data-detachment-stratagem-id'),
    unitId:form.querySelector('[name="unitId"]')?.value,timingConfirmed:checked('timingConfirmed'),unitLimitConfirmed:checked('unitLimitConfirmed')};
}
