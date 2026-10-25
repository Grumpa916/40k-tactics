import { getSecondaryMissionHistory } from '../rules/secondary-mission-lifecycle.js';
import { evaluateScoringCheckpoint } from '../engine/scoring-check-coordinator.js';
import { renderCheckpointScore, renderConditionEvidence, bindCheckpointScores } from './checkpoint-score-controls.js';
import { getMissionActionReviews } from '../rules/mission-action-state.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const checkpointLabels={'command-phase':'End of own Command','end-of-turn':'End of own turn','end-of-opponent-turn':"End of opponent's turn"};
export function renderScoringCheckpointGroups(state, reminder) {
  return (reminder.groups??[]).map(group=>{
    const liveReview=evaluateScoringCheckpoint(state,{checkpoint:group.checkpoint,scoringPlayerId:group.playerId,activePlayerId:reminder.activePlayerId});
    const missions=[...group.review.primary,...liveReview.secondary];
    const actions=getMissionActionReviews(state,{playerId:group.playerId,checkpoint:group.checkpoint});
    const primaryName=typeof group.primaryReference==='string'
      ? group.primaryReference
      : group.primaryReference?.name??group.primaryReference?.title??null;
    const primaryWindows=group.primaryScoringWindows??[];
    const primaryDue=primaryName&&primaryWindows.length
      ? `<details open class="checkpoint-mission checkpoint-mission--primary"><summary>Primary · ${esc(primaryName)} · score now</summary>${primaryWindows.map(window=>`<p><strong>${esc(window.when)}</strong></p>${(window.items??[]).map(item=>renderConditionEvidence(state,group.playerId,item)).join('')}`).join('')}${renderCheckpointScore(state,group,{category:'primary',definitionId:group.primaryReference.id,definitionName:primaryName,scoringWindows:primaryWindows,victoryPoints:group.primaryReference?.victoryPoints})}</details>`
      : '';
    const scoredCards=getSecondaryMissionHistory(state,group.playerId).filter(card=>card.status==='scored' && card.scoredTurn===state.turn && card.scoredRound===state.battle?.round);
    const receipts=scoredCards.map(card=>`<p role="status"><strong>${esc(card.definition?.name??card.definitionId)}: VP recorded.</strong> Removed from active missions.</p>`).join('');
    const secondaryDue=missions.map(mission=>`<details open class="checkpoint-mission"><summary>${esc(mission.definitionName??mission.definitionId)} · score now</summary>${mission.result.rulesVerified===false?'<p>Card reference awaiting official verification. Check the physical card.</p>':''}
        ${(mission.result.scoringWindows??[]).flatMap(window=>(window.tiers??[]).map(tier=>renderConditionEvidence(state,group.playerId,tier))).join('')}
        ${(mission.result.conditions??[]).map(condition=>`<p>${condition.eligible?'Completed in recorded state':'Not completed in recorded state'} · ${esc(condition.evidence)}</p>`).join('')}
        ${actions.filter(action=>action.missionInstanceId===mission.instanceId).map(action=>`<p><strong>${action.review?.outcome==='completed'?'Action completion confirmed':action.review?.outcome==='failed'?'Action not completed':'Action attempted — confirm completion below'}</strong> · ${esc(action.unitName)}</p>`).join('')}
        ${renderCheckpointScore(state,group,mission)}
        ${(mission.result.referenceNotes??[]).map(note=>`<p>${esc(note)}</p>`).join('')}
      </details>`).join('');
    return `<section class="checkpoint-player"><h3>${esc(group.playerName)} · ${esc(checkpointLabels[group.checkpoint])}</h3>
      ${receipts}${primaryDue}${secondaryDue}${!primaryDue&&!secondaryDue?'<p>No Primary or Secondary mission scores are due at this checkpoint.</p>':''}
      ${actions.length?`<h4>Verify recorded actions</h4>${actions.map(action=>`<article class="checkpoint-action"><strong>${esc(action.missionName)} · ${esc(action.unitName)}</strong><p>Unit: ${esc(action.unitStatus??'unknown')}${action.objective?' · Objective: '+esc(action.objective.name??action.objective.id):''}</p>
        ${action.review?`<p>Confirmed ${esc(action.review.outcome)}. ${action.review.outcome==='completed'?'Confirm VP on the mission card above.':'No completion claimed.'}</p>`:`<div><button type="button" data-action-review="${esc(action.actionKey)}" data-action-player="${esc(group.playerId)}" data-action-checkpoint="${group.checkpoint}" data-action-outcome="completed">Confirm completed</button><button type="button" data-action-review="${esc(action.actionKey)}" data-action-player="${esc(group.playerId)}" data-action-checkpoint="${group.checkpoint}" data-action-outcome="failed">Not completed</button></div>`}</article>`).join('')}`:''}
      ${primaryDue || secondaryDue ? `<button type="button" data-review-scoring data-scoring-player="${esc(group.playerId)}" data-scoring-checkpoint="${group.checkpoint}">${group.playerName === 'You' ? 'Review my scoring' : 'Review ' + esc(group.playerName) + ' scoring'}</button>` : ''}
    </section>`;
  }).join('');
}
export function bindScoringActionReview(container, session, onError) {
  bindCheckpointScores(container,session,onError);
  container.querySelectorAll?.('[data-action-review]').forEach(button=>button.addEventListener('click',()=>{
    try { session.dispatch({type:'mission_action.review',payload:{actionKey:button.getAttribute('data-action-review'),playerId:button.getAttribute('data-action-player'),checkpoint:button.getAttribute('data-action-checkpoint'),outcome:button.getAttribute('data-action-outcome')}}); }
    catch(error){onError(error?.message??String(error));}
  }));
}
