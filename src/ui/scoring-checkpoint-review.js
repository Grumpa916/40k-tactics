import { getSecondaryMissionHistory } from '../rules/secondary-mission-lifecycle.js';
import { evaluateScoringCheckpoint } from '../engine/scoring-check-coordinator.js';
import { renderCheckpointScore, renderConditionEvidence, bindCheckpointScores } from './checkpoint-score-controls.js';
import { getMissionActionReviews } from '../rules/mission-action-state.js';
import { getPrimaryCheckpointOpportunity, getMissionReviewOpportunity } from '../application/scoring-checkpoint-opportunities.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const checkpointLabels={'command-phase':'End of own Command','end-of-turn':'End of own turn','end-of-opponent-turn':"End of opponent's turn"};

function primaryOpportunityMarkup(state, group) {
  const opportunity=getPrimaryCheckpointOpportunity(state,group);
  if (!opportunity?.actionable) return '';
  const primaryName=typeof group.primaryReference==='string'
    ? group.primaryReference
    : group.primaryReference?.name??group.primaryReference?.title??null;
  if (!primaryName) return '';
  const primaryWindows=group.primaryScoringWindows??[];
  const evidenceItems=opportunity.evidence??[];
  const estimateLabel=opportunity.calculatedPoints>0?`Recorded estimate ${opportunity.calculatedPoints} VP`:'Manual tabletop scoring';
  const objectiveNote=opportunity.needsObjectiveConfirmation
    ? '<p><strong>Objective snapshot is not current.</strong> You may update it above for Advisor accuracy, or score directly from the tabletop.</p>'
    : '';
  return `<details open class="checkpoint-mission checkpoint-mission--primary"><summary>Primary · ${esc(primaryName)} · ${esc(estimateLabel)}</summary>
    ${objectiveNote}
    ${evidenceItems.map(entry=>renderConditionEvidence(state,group.playerId,entry.item)).join('')}
    ${renderCheckpointScore(state,group,{category:'primary',definitionId:group.primaryReference.id,definitionName:primaryName,scoringWindows:primaryWindows,victoryPoints:group.primaryReference?.victoryPoints,calculatedPoints:opportunity.calculatedPoints,calculatedPartial:opportunity.estimate?.partial===true})}
  </details>`;
}

function reviewMissionMarkup(state, group, mission, actions) {
  const opportunity=getMissionReviewOpportunity(state,mission,group.playerId);
  if (!opportunity?.actionable) return '';
  const name=mission.definitionName??mission.definitionId;
  const status=opportunity.calculatedPoints>0
    ? `Recorded estimate ${opportunity.calculatedPoints} VP`
    : 'Manual tabletop scoring';
  const evidence=opportunity.estimate?.evidence??[];
  const missionForScore={
    ...mission,
    calculatedPoints:opportunity.calculatedPoints,
    calculatedPartial:opportunity.estimate?.partial===true
  };
  const objectiveNote=opportunity.needsObjectiveConfirmation
    ? '<p><strong>Objective snapshot is not current.</strong> Update it if useful, or score directly from the tabletop.</p>'
    : '';
  return `<details open class="checkpoint-mission"><summary>${esc(name)} · ${esc(status)}</summary>${mission.result.rulesVerified===false?'<p>Card reference awaiting official verification. Check the physical card before confirming the award.</p>':''}
      ${objectiveNote}
      ${evidence.map(entry=>renderConditionEvidence(state,group.playerId,entry.tier)).join('')}
      ${(mission.result.conditions??[]).map(condition=>`<p>${condition.eligible?'Completed in recorded state':'Recorded state does not confirm completion'} · ${esc(condition.evidence)}${condition.reason?` · ${esc(condition.reason)}`:''}</p>`).join('')}
      ${actions.filter(action=>action.missionInstanceId===mission.instanceId).map(action=>`<p><strong>${action.review?.outcome==='completed'?'Action completion confirmed':'Action recorded'}</strong> · ${esc(action.unitName)}</p>`).join('')}
      ${renderCheckpointScore(state,group,missionForScore)}
      ${(mission.result.referenceNotes??[]).map(note=>`<p>${esc(note)}</p>`).join('')}
    </details>`;
}

export function renderScoringCheckpointGroups(state, reminder) {
  return (reminder.groups??[]).map(group=>{
    const liveReview=evaluateScoringCheckpoint(state,{checkpoint:group.checkpoint,scoringPlayerId:group.playerId,activePlayerId:reminder.activePlayerId});
    const missions=[...group.review.primary,...liveReview.secondary];
    const actions=getMissionActionReviews(state,{playerId:group.playerId,checkpoint:group.checkpoint})
      .filter(action=>!action.review||action.review.outcome==='completed');
    const primaryDue=primaryOpportunityMarkup(state,group);
    const missionDue=missions.map(mission=>reviewMissionMarkup(state,group,mission,actions)).join('');
    const scoredCards=getSecondaryMissionHistory(state,group.playerId).filter(card=>card.status==='scored' && card.scoredTurn===state.turn && card.scoredRound===state.battle?.round);
    const receipts=scoredCards.map(card=>`<p role="status"><strong>${esc(card.definition?.name??card.definitionId)}: VP recorded.</strong> Card lifecycle updated.</p>`).join('');
    const actionMarkup=actions.length?`<h4>Recorded mission actions</h4>${actions.map(action=>`<article class="checkpoint-action"><strong>${esc(action.missionName)} · ${esc(action.unitName)}</strong><p>Unit: ${esc(action.unitStatus??'unknown')}${action.objective?' · Objective: '+esc(action.objective.name??action.objective.id):''}</p>
        ${action.review?`<p>Recorded review: ${esc(action.review.outcome)}.</p>`:`<div><button type="button" data-action-review="${esc(action.actionKey)}" data-action-player="${esc(group.playerId)}" data-action-checkpoint="${group.checkpoint}" data-action-outcome="completed">Mark completed</button><button type="button" data-action-review="${esc(action.actionKey)}" data-action-player="${esc(group.playerId)}" data-action-checkpoint="${group.checkpoint}" data-action-outcome="failed">Mark not completed</button></div>`}</article>`).join('')}`:'';
    const anyLive=Boolean(primaryDue||missionDue||actionMarkup);
    return `<section class="checkpoint-player"><h3>${esc(group.playerName)} · ${esc(checkpointLabels[group.checkpoint])}</h3>
      ${receipts}${primaryDue}${missionDue}${actionMarkup}${!anyLive?'<p>No scoring opportunity remains after the latest confirmation.</p>':''}
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
