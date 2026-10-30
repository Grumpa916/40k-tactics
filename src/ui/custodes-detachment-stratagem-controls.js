import { getPreternaturalRapidityOpportunities, getLightningWrathOpportunities, getGoldenLightOpportunities } from '../rules/custodes-detachment-stratagem-opportunities.js';
import { getRecordedStratagemUses, isGoldenLightActive } from '../rules/stratagem-use-state.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const check=(name,label)=>`<label class="venatari-confirm"><input type="checkbox" name="${name}" required><span>${label}</span></label>`;

export function renderCustodesDetachmentStratagemControls(state,{playerId,stratagemId}={}) {
  if (stratagemId==='lightning-wrath' && state.phase==='fight') {
    const active=getRecordedStratagemUses(state).filter(use=>use.stratagemId===stratagemId&&use.playerId===playerId&&
      use.round===state.battle?.round&&use.turn===state.turn&&use.phase==='fight' &&
      !(state.history??[]).some(event=>event.type==='fight.unit_activated'&&event.payload?.unitId===use.unitId&&event.payload?.round===use.round&&event.payload?.turn===use.turn));
    if (active.length) return active.map(use=>`<article class="rules-reminder-card is-active"><strong>Lightning Wrath · ${esc(state.units?.find(unit=>unit.id===use.unitId)?.name??use.unitId)}</strong><p>Recorded. This unit’s pile-in move can be up to D3+3 inches.</p><small>${esc(use.cpSpent)} CP spent.</small></article>`).join('');
  }
  if (stratagemId==='golden-light-of-the-moiraides' && state.phase==='movement') {
    const active=getRecordedStratagemUses(state).filter(use=>use.stratagemId===stratagemId&&use.playerId===playerId&&isGoldenLightActive(state,use,use.unitId));
    if (active.length) return active.map(use=>`<article class="rules-reminder-card is-active"><strong>Golden Light of the Moiraides · ${esc(state.units?.find(unit=>unit.id===use.unitId)?.name??use.unitId)}</strong><p>Recorded. Attacks targeting this unit are -1 to Hit and it cannot be targeted by Snap Shooting until the start of your next turn.</p><small>2 CP spent.</small></article>`).join('');
  }
  if (!['preternatural-rapidity','lightning-wrath','golden-light-of-the-moiraides'].includes(stratagemId)) return '';
  if (stratagemId==='preternatural-rapidity' && state.phase==='charge') {
    const active=getRecordedStratagemUses(state).filter(use=>use.stratagemId===stratagemId&&use.playerId===playerId&&
      use.round===state.battle?.round&&use.turn===state.turn&&use.phase==='movement');
    if (active.length) return active.map(use=>`<article class="rules-reminder-card is-active"><strong>Preternatural Rapidity · ${esc(state.units?.find(unit=>unit.id===use.unitId)?.name??use.unitId)}</strong><p>This unit’s Advance does not prevent it from declaring a Charge this turn. ${esc(use.cpSpent)} CP spent.</p></article>`).join('');
  }
  const entries=stratagemId==='preternatural-rapidity'
    ? getPreternaturalRapidityOpportunities(state,{playerId})
    : stratagemId==='lightning-wrath' ? getLightningWrathOpportunities(state,{playerId}) : getGoldenLightOpportunities(state,{playerId});
  if (!entries.length) return stratagemId==='preternatural-rapidity'
    ? '<p>Record an Advance for a Dread Host unit to see its Stratagem opportunity here.</p>'
    : stratagemId==='lightning-wrath' ? '<p>No Dread Host unit is currently eligible to make a pile-in move.</p>' : '<p>No eligible Dread Host unit is currently in Reserves. Choose Golden Light before the unit is placed on the battlefield.</p>';
  const available=entries.filter(entry=>entry.available);
  return `<details class="venatari-ability-controls"><summary>${available.length?'Review & record use':'Review eligibility'}</summary>`+
    `<form data-custodes-detachment-stratagem-form data-detachment-stratagem-id="${esc(stratagemId)}" data-detachment-stratagem-player="${esc(playerId)}">`+
    `<label>${stratagemId==='preternatural-rapidity'?'Advanced unit':stratagemId==='lightning-wrath'?'Unit selected to pile in':'Unit selected to ingress'}<select name="unitId" required>${entries.map(entry=>`<option value="${esc(entry.unitId)}" ${entry===available[0]?'selected ':''}${entry.available?'':'disabled'}>${esc(entry.unitName)}${entry.blockedReason?' · '+esc(entry.blockedReason):''}</option>`).join('')}</select></label>`+
    check('timingConfirmed',stratagemId==='preternatural-rapidity'?'This unit just Advanced; I am using the Stratagem in the Movement phase':stratagemId==='lightning-wrath'?'This unit is now selected to make a pile-in move':'I am using this as the unit is selected to make an ingress move')+
    check('unitLimitConfirmed','No other Stratagem targeted this unit this phase, including one resolved at the table')+
    `<small>${stratagemId==='preternatural-rapidity'?'The app records the CP spend and charge permission. Resolve the Advance and Charge at the table.':stratagemId==='lightning-wrath'?'Roll the D3 and resolve the pile-in at the table; the app records the Stratagem and CP spend.':'Use this before placing the unit. The app records the CP spend and applies -1 to Hit to incoming attack estimates until your next turn. Confirm Snap Shooting restrictions at the table.'}</small>`+
    `<button type="submit" ${available.length?'':'disabled'}>Spend ${entries[0].cpCost} CP · ${esc(entries[0].title)}</button></form></details>`;
}

export function readCustodesDetachmentStratagemForm(form) {
  const checked=name=>form.querySelector(`[name="${name}"]`)?.checked===true;
  return {playerId:form.getAttribute('data-detachment-stratagem-player'),stratagemId:form.getAttribute('data-detachment-stratagem-id'),
    unitId:form.querySelector('[name="unitId"]')?.value,timingConfirmed:checked('timingConfirmed'),unitLimitConfirmed:checked('unitLimitConfirmed')};
}
