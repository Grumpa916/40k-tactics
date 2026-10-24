import { hasEffectiveVictoryPointOpportunity } from '../engine/victory-points-ledger.js';
import { getSecondaryMissionHistory } from '../rules/secondary-mission-lifecycle.js';
import { missionConditionEvidence } from '../rules/checkpoint-mission-evidence.js';
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const checkpointScoreKey = (state, playerId, checkpoint) => [state.battle?.round ?? 0, state.turn ?? 0, playerId, checkpoint].join(':');

export function renderConditionEvidence(state, playerId, item) {
  const evidence = missionConditionEvidence(state, playerId, item);
  return `<p>${esc(item.vp)} VP · ${esc(item.summary)}<br><strong>${esc(evidence.status)}</strong>${evidence.detail ? `<br>${esc(evidence.detail)}` : ''}</p>`;
}

function positiveVp(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function scoreWindowsFor(mission) {
  if (Array.isArray(mission?.scoringWindows) && mission.scoringWindows.length) return mission.scoringWindows;
  if (Array.isArray(mission?.result?.scoringWindows) && mission.result.scoringWindows.length) return mission.result.scoringWindows;
  return mission?.result?.scoringWindow ? [mission.result.scoringWindow] : [];
}

export function getMissionVpOptions(mission = {}) {
  const windows = scoreWindowsFor(mission);
  if (mission.category === 'secondary' || mission.instanceId) {
    const tierValues = windows.flatMap(window => (window.tiers ?? []).map(tier => positiveVp(tier.vp))).filter(Boolean);
    const configured = positiveVp(mission.victoryPoints ?? mission.result?.victoryPoints);
    if (!tierValues.length && configured) tierValues.push(configured);
    return [...new Set(tierValues)].sort((a,b) => a-b);
  }

  const items = windows.flatMap(window => window.items ?? []);
  if (!items.length) {
    const configured = positiveVp(mission.victoryPoints ?? mission.result?.victoryPoints);
    return configured ? [configured] : [];
  }

  let totals = new Set([0]);
  for (const item of items) {
    const base = positiveVp(item.vp);
    if (!base) continue;
    const values = [0];
    if (/\bper\b/i.test(String(item.summary ?? ''))) {
      for (let value = base; value <= 15; value += base) values.push(value);
    } else {
      values.push(base);
    }
    const next = new Set();
    for (const total of totals) {
      for (const value of values) {
        if (total + value <= 15) next.add(total + value);
      }
    }
    totals = next;
  }
  return [...totals].filter(value => value > 0).sort((a,b) => a-b);
}

export function renderCheckpointScore(state, group, mission) {
  const { definitionId, definitionName, instanceId, category } = mission;
  const card = instanceId ? getSecondaryMissionHistory(state, group.playerId).find(c => c.instanceId === instanceId) : null;
  const key = instanceId ? [instanceId, state.battle?.round ?? 0, state.turn ?? 0, group.checkpoint].join(':') : checkpointScoreKey(state, group.playerId, group.checkpoint);
  if (hasEffectiveVictoryPointOpportunity(state, group.playerId, definitionId, key)) {
    return `<p role="status"><strong>VP recorded.</strong> ${category === 'secondary' ? 'Card removed from active missions.' : 'Primary remains active for later checkpoints.'}</p>`;
  }
  if (instanceId && card?.status !== 'active') return '<p>Card is no longer active.</p>';
  const vpOptions = getMissionVpOptions(mission);
  const optionMarkup = vpOptions.map(value => `<option value="${value}">${value} VP</option>`).join('');
  return `<form data-checkpoint-score data-player="${esc(group.playerId)}" data-checkpoint="${esc(group.checkpoint)}" data-mission="${esc(definitionId)}" data-name="${esc(definitionName)}" data-category="${esc(category)}" data-instance="${esc(instanceId ?? '')}">
    <label>Confirm VP earned <select name="vp" required aria-label="VP for ${esc(definitionName)}" ${vpOptions.length ? '' : 'disabled'}><option value="">${vpOptions.length ? 'Choose VP…' : 'No configured VP value'}</option>${optionMarkup}</select></label>
    <button type="submit" ${vpOptions.length ? '' : 'disabled'}>Confirm score${category === 'secondary' ? ' & remove card' : ''}</button>
    <p>Confirm against the tabletop before awarding. Existing VP caps apply.</p>
  </form>`;
}

export function bindCheckpointScores(container, session, onError) {
  container.querySelectorAll?.('[data-checkpoint-score]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const state = session.getState();
      const playerId = form.getAttribute('data-player');
      const scoringTiming = form.getAttribute('data-checkpoint');
      const instanceId = form.getAttribute('data-instance');
      const payload = { playerId, amount: Number(form.querySelector('[name="vp"]').value), scoringTiming,
        round: state.battle?.round ?? 0, turn: state.turn ?? 0 };
      if (instanceId) session.dispatch({type:'secondary_mission.record_score',payload:{...payload,instanceId,retireAfterScoring:true}});
      else session.dispatch({type:'victory_points.record_award',payload:{...payload,
        category:'primary', reason:form.getAttribute('data-name'), missionDefinitionId:form.getAttribute('data-mission'),
        opportunityKey:checkpointScoreKey(state,playerId,scoringTiming)}});
    } catch (error) { onError(error?.message ?? String(error)); }
  }));
}
