const esc=value=>String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const n=value=>value==null ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(1);
const when=item=>`${item.round==null?'Round unknown':item.round===0?'Setup':'Round '+item.round}${item.turn==null?'':' · turn '+item.turn}`;
const row=(values,index)=>`<tr${index==null?'':` id="endgame-event-${index}"`}>${values.map((v,i)=>i===0?`<th scope="row">${esc(v)}</th>`:`<td>${esc(v)}</td>`).join('')}</tr>`;
const table=(caption,headers,rows)=>`<div class="endgame-review__table"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;

export function renderEndgameEvidence(review) {
  const evidence=review.evidence, playerName=id=>review.players.find(p=>p.id===id)?.name ?? 'Unknown player';
  const rounds=evidence.rounds.map(r=>`<details><summary>${esc(when(r))} · recorded activity</summary>${table('Both players; missing entries stay unknown',
    ['Player','VP recorded','Actual / expected*','Damage entered','Units lost','Charges passed / attempted','Actions confirmed / attempted'],
    r.players.map(p=>row([playerName(p.playerId),n(p.score),p.comparisons?`${n(p.actual)} / ${n(p.expected)} (${p.comparisons})`:'—',n(p.damage),p.lost.length?p.lost.join(', '):'None recorded',p.charges?`${p.successfulCharges} / ${p.charges}`:'—',p.actions?`${p.completedActions} / ${p.actions}`:'—'])))}</details>`).join('');
  const charges=evidence.charges.map(c=>row([when(c),`${playerName(c.ownerId)} · ${c.unitName}`,c.targetNames.join(', ') || 'Unknown target',c.measuredDistance==null?'—':`${n(c.measuredDistance)}″`,
    c.probability==null?'Not saved':`${Math.round(c.probability*100)}%${c.rerollAvailable?` · assumes ${c.rerollRule ?? 'available'} re-roll on failure`:' · modeled 2D6'}`,c.outcome,
    c.outcome==='failed'?'—':c.followUpAttacks?`${n(c.followUpDamage)} damage · ${c.followUpAttacks} attack(s)`:'No linked Fight attacks recorded'],c.index));
  const actions=evidence.actions.map(a=>row([when(a),`${playerName(a.ownerId)} · ${a.unitName}`,a.mission,a.outcome],a.index));
  const attacks=evidence.attacks.map(a=>row([when(a),a.phase,`${playerName(a.ownerId)} · ${a.attackerName}`,a.targetName,a.weaponName,n(a.actual),n(a.expected),n(a.removed),n(a.excess)],a.index));
  return `<section><h3>Round-by-round review</h3>${rounds || '<p>No round activity recorded yet.</p>'}<p>*Damage comparisons use only attacks with both actual and expected values saved. Entries are observations, not a reconstruction of every action.</p></section>
    <section><h3>Charge decisions and follow-through</h3>${charges.length?table('Saved odds are forecasts, not a record of dice or re-roll use',['When','Charger','Declared targets','Farthest measured','Saved success chance','Outcome','Same-turn Fight into declared targets'],charges):'<p>No charge attempts recorded.</p>'}<p>Declined charges are excluded. Re-roll availability assumes use after failure; actual use and CP spending are not tracked here. Older entries have no saved forecast. Missing follow-up attacks do not prove a unit failed to fight.</p></section>
    <details><summary>Mission action outcomes · ${actions.length}</summary>${actions.length?table('Player-confirmed outcomes; VP awards remain separate',['When','Unit','Mission reference','Review'],actions):'<p>No linked mission actions recorded.</p>'}<p>Unreviewed means no confirmation was entered, not that the action failed.</p></details>
    <details><summary>Attack evidence · ${attacks.length}</summary>${attacks.length?table('Forecasts saved at attack time; never recalculated from the final battlefield',['When','Phase','Attacker','Target','Weapon','Entered damage','Expected damage','Wounds removed','Beyond remaining wounds'],attacks):'<p>No attack results recorded.</p>'}<p>Damage beyond remaining wounds uses the saved target wound total. It does not measure per-model spillover or establish that another legal allocation was available.</p></details>`;
}
