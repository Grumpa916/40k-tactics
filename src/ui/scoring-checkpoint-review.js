import { getSecondaryMissionHistory } from '../rules/secondary-mission-lifecycle.js';
import { hasEffectiveVictoryPointOpportunity } from '../engine/victory-points-ledger.js';
import { evaluateScoringCheckpoint } from '../engine/scoring-check-coordinator.js';
import { renderCheckpointScore, bindCheckpointScores } from './checkpoint-score-controls.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const checkpointLabels={'command-phase':'End of own Command','end-of-turn':'End of own turn','end-of-opponent-turn':"End of opponent's turn",'end-of-battle':'End of battle'};

function scoringRequirementMarkup(windows = []) {
  const rows = windows.flatMap(window => {
    const entries = [...(window?.items ?? []), ...(window?.tiers ?? [])];
    return entries.map(entry => {
      const vp = Number.isInteger(Number(entry?.vp)) && Number(entry.vp) > 0 ? `<strong>${esc(entry.vp)} VP</strong> · ` : '';
      return `<li>${vp}${esc(entry?.summary ?? 'Review the mission requirement on the physical card.')}</li>`;
    });
  });
  if (!rows.length) return '<p><strong>Scoring requirements:</strong> Review the mission card and agree the completed condition on the tabletop.</p>';
  return `<div class="checkpoint-mission__requirements"><p><strong>Scoring requirements</strong></p><ul>${rows.join('')}</ul></div>`;
}

function primaryOpportunityMarkup(state, group) {
  const primaryName=typeof group.primaryReference==='string'
    ? group.primaryReference
    : group.primaryReference?.name??group.primaryReference?.title??null;
  const primaryWindows=group.primaryScoringWindows??[];
  if (!primaryName || !primaryWindows.length) return '';
  const definitionId=typeof group.primaryReference==='string'
    ? group.primaryReference
    : group.primaryReference?.id??primaryName;
  return `<details open class="checkpoint-mission checkpoint-mission--primary"><summary>Primary · ${esc(primaryName)} · manual scoring</summary>
    ${scoringRequirementMarkup(primaryWindows)}
    ${renderCheckpointScore(state,group,{category:'primary',definitionId,definitionName:primaryName,scoringWindows:primaryWindows,victoryPoints:group.primaryReference?.victoryPoints})}
  </details>`;
}

function reviewMissionMarkup(state, group, mission) {
  const name=mission.definitionName??mission.definitionId;
  const windows=mission.result?.scoringWindows??(mission.result?.scoringWindow?[mission.result.scoringWindow]:mission.scoringWindows??[]);
  return `<details open class="checkpoint-mission"><summary>${mission.category==='primary'?'Primary · ':''}${esc(name)} · manual scoring</summary>
      ${mission.category==='secondary'?'<p>Rules reference comes from supplied card transcription; independent official-card comparison is deferred.</p>':mission.result?.rulesVerified===false?'<p>Primary rules reference awaiting official verification. Confirm the agreed tabletop result before recording the award.</p>':''}
      ${scoringRequirementMarkup(windows)}
      ${renderCheckpointScore(state,group,mission)}
      ${(mission.result?.referenceNotes??[]).map(note=>`<p>${esc(note)}</p>`).join('')}
    </details>`;
}

export function renderScoringCheckpointGroups(state, reminder) {
  return (reminder.groups??[]).map(group=>{
    const liveReview=evaluateScoringCheckpoint(state,{checkpoint:group.checkpoint,scoringPlayerId:group.playerId,activePlayerId:reminder.activePlayerId});
    const primaryDue=primaryOpportunityMarkup(state,group);
    const reviewPrimaryDue=(group.review?.primary??[]).map(mission=>reviewMissionMarkup(state,group,mission)).join('');
    const secondaryDue=liveReview.secondary.filter(mission=>!hasEffectiveVictoryPointOpportunity(
      state,group.playerId,mission.definitionId,
      [mission.instanceId,state.battle?.round??0,state.turn??0,group.checkpoint].join(':')
    )).map(mission=>reviewMissionMarkup(state,group,mission)).join('');
    const scoredCards=getSecondaryMissionHistory(state,group.playerId).filter(card=>card.status==='scored' && card.scoredTurn===state.turn && card.scoredRound===state.battle?.round);
    const receipts=scoredCards.map(card=>`<p role="status"><strong>${esc(card.definition?.name??card.definitionId)}: VP recorded.</strong> Removed from active missions.</p>`).join('');
    const anyLive=Boolean(primaryDue||reviewPrimaryDue||secondaryDue);
    return `<section class="checkpoint-player"><h3>${esc(group.playerName)} · ${esc(checkpointLabels[group.checkpoint])}</h3>
      ${receipts}${primaryDue}${reviewPrimaryDue}${secondaryDue}${!anyLive?'<p>No scoring opportunity remains at this checkpoint.</p>':''}
    </section>`;
  }).join('');
}
export function bindScoringActionReview(container, session, onError) {
  bindCheckpointScores(container,session,onError);
}
