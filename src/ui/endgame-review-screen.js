import { renderEndgameContext } from './endgame-context-view.js';
import { renderEndgameEvidence } from './endgame-evidence-view.js';
import { unitDisplayLabels } from './map-unit-labels.js';
import { getEndgameReview } from '../rules/endgame-review.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const num = value => value == null ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(1);
const when = item => `${item.round == null ? 'Round unknown' : item.round === 0 ? 'Setup' : 'Round '+item.round}${item.turn == null ? '' : ' · turn '+item.turn}`;
const table = (caption, headers, rows) => `<div class="endgame-review__table"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const row = values => `<tr>${values.map((v,i)=>i===0?`<th scope="row">${esc(v)}</th>`:`<td>${esc(v)}</td>`).join('')}</tr>`;

export function renderEndgameReview(state, { playerId, confirmEnd = false, message = '' } = {}) {
  const review=getEndgameReview(state,{playerId,unitLabels:unitDisplayLabels(state.units ?? [])});
  const playerName=id=>review.players.find(p=>p.id===id)?.name ?? id;
  const totalsKnown=review.players.length===2 && review.players.every(p=>p.total!=null);
  const [first,second]=review.players;
  const result=totalsKnown ? first.total===second.total ? 'Recorded score is tied.' : `${first.total>second.total?first.name:second.name} ${review.complete?'finished ahead':'leads'} by ${Math.abs(first.total-second.total)} recorded VP.` : 'A complete recorded score is not available.';
  const swing=review.largestSwing;
  const scoreRows=review.players.map(p=>row([p.name,num(p.total),num(p.categories.primary),num(p.categories.secondary),num(p.categories.other),num(p.categories.adjustment),num(p.unallocated)]));
  const roundRows=review.rounds.map(r=>row([r.round == null?'Unknown':r.round===0?'Setup':r.round,...r.players.map(p=>p.recorded?num(p.total):'—')]));
  const unitTables=review.players.map(p=>{
    const units=review.units.filter(u=>u.ownerId===p.id);
    return `<details open><summary>${esc(p.name)} · unit contributions</summary>${units.length?table('Recorded contributions; zero counts do not imply poor play',
      ['Unit / status','Damage dealt','Damage received','Destroyed enemies','Charges passed / attempts','Actions confirmed / attempted','Actual / expected*'],
      units.map(u=>row([`${u.name} · ${u.status}`,u.damageEntries?num(u.recordedDamage):'—',u.receivedEntries?num(u.damageReceived):'—',u.attacks?u.kills:'—',u.charges?`${u.charges-u.failedCharges} / ${u.charges}`:'—',u.actions?`${u.completedActions} / ${u.actions}`:'—',u.comparisons?`${num(u.comparableDamage)} / ${num(u.expectedDamage)} (${u.comparisons})`:'—']))):'<p>No units recorded.</p>'}</details>`;
  }).join('');
  const endControls=state.battle?.status==='active'
    ? confirmEnd
      ? '<section class="endgame-review__confirm" aria-label="Confirm end of game"><h3>Finish this game?</h3><p>Record all final Primary, Secondary and other VP before confirming. This marks the battle complete and pauses the clock; it does not calculate or award final points.</p><label><input type="checkbox" data-final-score-confirmed> I have checked both players’ final scores.</label><div><button type="button" data-confirm-end-game disabled>Confirm end game</button><button type="button" data-cancel-end-game>Keep playing</button></div></section>'
      : '<button type="button" data-end-game>End game…</button>'
    : '';
  return `<link rel="stylesheet" href="${new URL('./styles/endgame-review.css',import.meta.url).href}"><article class="endgame-review" data-endgame-review>
    <header><p class="endgame-review__eyebrow">Tactical Advisor · recorded evidence</p><h2>${review.complete?'Endgame review':'Game so far'}</h2><p>${review.complete?'Battle marked complete. Review the recorded result and lessons below.':'This is a provisional review. Opening it does not end the battle.'}</p><div class="endgame-review__actions">${!review.complete?'<button type="button" data-return-current-phase>Return to game</button>':''}${endControls}</div></header>
    ${message?`<p role="alert">${esc(message)}</p>`:''}
    <section><h3>Recorded score</h3><p><strong>${esc(result)}</strong></p>${table('VP totals and available breakdown',['Player','Total','Primary','Secondary','Other awards','Adjustments','Unallocated'],scoreRows)}<p>Other awards include uncategorised VP. Unallocated VP are the difference between the saved total and effective history; they are not assigned to a mission.</p></section>
    <section><h3>Score by round</h3>${roundRows.length?table('Effective recorded VP, with undone entries excluded',['Round',...review.players.map(p=>p.name)],roundRows):'<p>No scoring history recorded yet.</p>'}<p>— means no entry for that player and round, not a confirmed zero.</p></section>
    <section><h3>Lessons to consider · ${esc(playerName(review.playerId) ?? 'your army')}</h3>${review.lessons.length?review.lessons.map(l=>`<article class="endgame-review__lesson"><strong>${esc(l.kind)}</strong><p>${esc(l.evidence)}</p><p>${esc(l.advice)}</p>${l.eventIndices?.length?`<p>Evidence: ${l.eventIndices.map((index,i)=>`<a href="#endgame-event-${index}">entry ${i+1}</a>`).join(' · ')}</p>`:''}</article>`).join(''):'<p>Not enough recorded evidence for specific coaching yet. No mistakes inferred.</p>'}</section>
    ${renderEndgameEvidence(review)}
    ${renderEndgameContext(review)}
    <section><h3>Recorded turning points</h3>${swing?`<p><strong>Largest recorded round scoring gap:</strong> Round ${esc(swing.round)}, ${esc(swing.margin>0?first.name:second.name)} gained ${esc(Math.abs(swing.margin))} VP more than the other player. Only rounds with entries for both players are compared.</p>`:''}<p>These are confirmed destruction events, not proof of what decided the game.</p>${review.moments.length?`<ol>${review.moments.map(m=>`<li><strong>${esc(when(m))}</strong> · ${esc(m.text)}</li>`).join('')}</ol>`:'<p>No combat destruction events recorded.</p>'}</section>
    <section><h3>Unit contributions</h3>${unitTables}<p>Damage is the entered attack result; it can exceed wounds remaining. *Actual / expected compares only attacks with both values saved; the number in brackets is the compared attack count. Declined charges are excluded from attempts. Confirmed mission actions do not automatically imply VP.</p></section>
    <details><summary>Scoring entries</summary>${review.scores.length?table('Effective awards and manual adjustments',['When','Player','Category','VP','Reason'],review.scores.map(s=>row([when(s),playerName(s.playerId),s.category,num(s.amount),s.reason]))):'<p>No scoring entries recorded.</p>'}</details>
    <section><h3>What this review can establish</h3><p>${review.coverage.attacks} attack entries · ${review.coverage.comparisons} saved damage comparisons · ${review.coverage.scoreEntries} effective score entries.</p><ul>${review.evidenceGaps.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></section>
  </article>`;
}

export function createEndgameReviewScreen(container, {session, perspectivePlayerId} = {}) {
  let confirmEnd=false, message='';
  const render=()=>{container.innerHTML=renderEndgameReview(session.getState(),{playerId:perspectivePlayerId ?? session.getState().players?.[0]?.id,confirmEnd,message});};
  function click(event) {
    const link=event.target?.closest?.('a[href^="#endgame-event-"]');
    if(link && container.contains(link)) {
      const target=container.querySelector(link.getAttribute('href'));
      const details=target?.closest?.('details');
      if(details) details.open=true;
    }
    const button=event.target?.closest?.('button');
    if (!button || !container.contains(button)) return;
    if(button.hasAttribute('data-end-game')) {confirmEnd=true;render();container.querySelector('[data-final-score-confirmed]')?.focus?.();}
    if(button.hasAttribute('data-cancel-end-game')) {confirmEnd=false;render();container.querySelector('[data-end-game]')?.focus?.();}
    if(button.hasAttribute('data-confirm-end-game') && confirmEnd && container.querySelector('[data-final-score-confirmed]')?.checked) {
      try {confirmEnd=false;session.dispatch({type:COMMAND_TYPES.COMPLETE_BATTLE,payload:{}});}
      catch(error) {message=error.message;render();}
    }
  }
  function change(event) {
    if(event.target?.hasAttribute?.('data-final-score-confirmed')) {
      const button=container.querySelector('[data-confirm-end-game]');
      if(button) button.disabled=!event.target.checked;
    }
  }
  container.addEventListener('click',click);container.addEventListener('change',change);
  const unsubscribe=session.subscribe(render);render();
  return {render,destroy(){unsubscribe();container.removeEventListener('click',click);container.removeEventListener('change',change);}};
}
