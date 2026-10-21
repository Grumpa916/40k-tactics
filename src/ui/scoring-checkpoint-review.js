import { getMissionActionReviews } from '../rules/mission-action-state.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const checkpointLabels={'command-phase':'End of own Command','end-of-turn':'End of own turn','end-of-opponent-turn':"End of opponent's turn"};
export function renderScoringCheckpointGroups(state, reminder) {
  return (reminder.groups??[]).map(group=>{
    const missions=[...group.review.primary,...group.review.secondary];
    const actions=getMissionActionReviews(state,{playerId:group.playerId,checkpoint:group.checkpoint});
    const primaryName=typeof group.primaryReference==='string'
      ? group.primaryReference
      : group.primaryReference?.name??group.primaryReference?.title??null;
    const primaryWindows=group.primaryScoringWindows??[];
    const primaryDue=primaryName&&primaryWindows.length
      ? `<details open class="checkpoint-mission checkpoint-mission--primary"><summary>Primary · ${esc(primaryName)} · score now</summary>${primaryWindows.map(window=>`<p><strong>${esc(window.when)}</strong></p>${(window.items??[]).map(item=>`<p>${esc(item.vp)} VP · ${esc(item.summary)}</p>`).join('')}`).join('')}</details>`
      : '';
    const secondaryDue=missions.map(mission=>`<details open class="checkpoint-mission"><summary>${esc(mission.definitionName??mission.definitionId)} · score now</summary>${mission.result.rulesVerified===false?'<p>Card reference awaiting official verification. Check the physical card.</p>':''}
        ${(mission.result.scoringWindows??[]).flatMap(window=>(window.tiers??[]).map(tier=>`<p>${esc(tier.vp)} VP · ${esc(tier.summary)}</p>`)).join('')}
        ${(mission.result.referenceNotes??[]).map(note=>`<p>${esc(note)}</p>`).join('')}
      </details>`).join('');
    return `<section class="checkpoint-player"><h3>${esc(group.playerName)} · ${esc(checkpointLabels[group.checkpoint])}</h3>
      ${primaryDue}${secondaryDue}${!primaryDue&&!secondaryDue?'<p>No Primary or Secondary mission scores are due at this checkpoint.</p>':''}
      ${actions.length?`<h4>Verify recorded actions</h4>${actions.map(action=>`<article class="checkpoint-action"><strong>${esc(action.missionName)} · ${esc(action.unitName)}</strong><p>Unit: ${esc(action.unitStatus??'unknown')}${action.objective?' · Objective: '+esc(action.objective.name??action.objective.id):''}</p>
        ${action.review?`<p>Confirmed ${esc(action.review.outcome)}. ${action.review.outcome==='completed'?'Review the mission score separately.':'No completion claimed.'}</p>`:`<div><button type="button" data-action-review="${esc(action.actionKey)}" data-action-player="${esc(group.playerId)}" data-action-checkpoint="${group.checkpoint}" data-action-outcome="completed">Confirm completed</button><button type="button" data-action-review="${esc(action.actionKey)}" data-action-player="${esc(group.playerId)}" data-action-checkpoint="${group.checkpoint}" data-action-outcome="failed">Not completed</button></div>`}</article>`).join('')}`:''}
      <button type="button" data-review-scoring data-scoring-player="${esc(group.playerId)}" data-scoring-checkpoint="${group.checkpoint}">Review ${esc(group.playerName)} scoring</button>
    </section>`;
  }).join('');
}
export function bindScoringActionReview(container, session, onError) {
  container.querySelectorAll?.('[data-action-review]').forEach(button=>button.addEventListener('click',()=>{
    try { session.dispatch({type:'mission_action.review',payload:{actionKey:button.getAttribute('data-action-review'),playerId:button.getAttribute('data-action-player'),checkpoint:button.getAttribute('data-action-checkpoint'),outcome:button.getAttribute('data-action-outcome')}}); }
    catch(error){onError(error?.message??String(error));}
  }));
}
