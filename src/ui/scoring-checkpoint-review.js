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
  if (opportunity.needsObjectiveConfirmation) {
    return `<details open class="checkpoint-mission checkpoint-mission--primary"><summary>Primary · ${esc(primaryName)} · objective confirmation needed</summary><p>Confirm the current objective state above. The app will recalculate the Primary opportunity before any VP are awarded.</p></details>`;
  }
  const evidenceItems=opportunity.evidence.filter(entry=>entry.evidence.count==null||entry.evidence.count>0);
  const label=opportunity.calculatedPoints>0?`Potential ${opportunity.calculatedPoints} VP`:'Possible scoring opportunity';
  return `<details open class="checkpoint-mission checkpoint-mission--primary"><summary>Primary · ${esc(primaryName)} · ${esc(label)}</summary>
    ${evidenceItems.map(entry=>renderConditionEvidence(state,group.playerId,entry.item)).join('')}
    ${renderCheckpointScore(state,group,{category:'primary',definitionId:group.primaryReference.id,definitionName:primaryName,scoringWindows:primaryWindows,victoryPoints:group.primaryReference?.victoryPoints})}
  </details>`;
}

function reviewMissionMarkup(state, group, mission, actions) {
  const opportunity=getMissionReviewOpportunity(state,mission);
  if (!opportunity?.actionable) return '';
  const name=mission.definitionName??mission.definitionId;
  if (opportunity.needsObjectiveConfirmation) {
    return `<details open class="checkpoint-mission"><summary>${esc(name)} · objective confirmation needed</summary><p>Confirm the current objective state above before resolving this scoring opportunity.</p></details>`;
  }
  const status=opportunity.eligible?'Potential completion':'Possible scoring opportunity — confirm on tabletop';
  return `<details open class="checkpoint-mission"><summary>${esc(name)} · ${esc(status)}</summary>${mission.result.rulesVerified===false?'<p>Card reference awaiting official verification. Check the physical card.</p>':''}
      ${(mission.result.scoringWindows??[]).flatMap(window=>(window.tiers??[]).map(tier=>renderConditionEvidence(state,group.playerId,tier))).join('')}
      ${(mission.result.conditions??[]).filter(condition=>condition.eligible||condition.reason!=null||condition.actual==null).map(condition=>`<p>${condition.eligible?'Completed in recorded state':'Tabletop confirmation may be required'} · ${esc(condition.evidence)}${condition.reason?` · ${esc(condition.reason)}`:''}</p>`).join('')}
      ${actions.filter(action=>action.missionInstanceId===mission.instanceId).map(action=>`<p><strong>${action.review?.outcome==='completed'?'Action completion confirmed':'Action attempted — confirm completion below'}</strong> · ${esc(action.unitName)}</p>`).join('')}
      ${renderCheckpointScore(state,group,mission)}
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
    const receipts=scoredCards.map(card=>`<p role="status"><strong>${esc(card.definition?.name??card.definitionId)}: VP recorded.</strong> Removed from active missions.</p>`).join('');
    const actionMarkup=actions.length?`<h4>Verify recorded actions</h4>${actions.map(action=>`<article class="checkpoint-action"><strong>${esc(action.missionName)} · ${esc(action.unitName)}</strong><p>Unit: ${esc(action.unitStatus??'unknown')}${action.objective?' · Objective: '+esc(action.objective.name??action.objective.id):''}</p>
        ${action.review?`<p>Confirmed ${esc(action.review.outcome)}. ${action.review.outcome==='completed'?'Confirm VP in the scoring opportunity above when applicable.':'No completion claimed.'}</p>`:`<div><button type="button" data-action-review="${esc(action.actionKey)}" data-action-player="${esc(group.playerId)}" data-action-checkpoint="${group.checkpoint}" data-action-outcome="completed">Confirm completed</button><button type="button" data-action-review="${esc(action.actionKey)}" data-action-player="${esc(group.playerId)}" data-action-checkpoint="${group.checkpoint}" data-action-outcome="failed">Not completed</button></div>`}</article>`).join('')}`:'';
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
