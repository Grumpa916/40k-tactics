import { hasEffectiveVictoryPointOpportunity } from '../engine/victory-points-ledger.js';
import { getSecondaryMissionHistory } from '../rules/secondary-mission-lifecycle.js';
import { missionConditionEvidence } from '../rules/checkpoint-mission-evidence.js';
import { estimateCheckpointVp } from '../rules/checkpoint-vp-estimate.js';
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

function secondaryTierChoices(mission = {}) {
  return scoreWindowsFor(mission).flatMap(window => {
    const choices = [];
    let runningTotal = 0;
    let requiredTiers = [];
    for (const tier of window?.tiers ?? []) {
      const value = positiveVp(tier?.vp);
      if (!value) continue;
      const repeatedByCondition = /\b(?:per|for each)\b/i.test(String(tier?.summary ?? ''));
      if (tier?.relationship === 'cumulative' && requiredTiers.length) {
        runningTotal += value;
        requiredTiers = [...requiredTiers, tier];
      } else {
        runningTotal = value;
        requiredTiers = [tier];
      }
      if (repeatedByCondition && tier?.relationship !== 'cumulative') {
        const max = positiveVp(tier?.maxVP) ?? 15;
        for (let score = value; score <= max; score += value) choices.push(score);
        if (max % value !== 0) choices.push(max);
      } else {
        choices.push(runningTotal);
      }
    }
    return choices;
  });
}

export function getMissionVpOptions(mission = {}) {
  const windows = scoreWindowsFor(mission);
  if (mission.category === 'secondary' || mission.instanceId) {
    const values = secondaryTierChoices(mission);
    const configured = positiveVp(mission.victoryPoints ?? mission.result?.victoryPoints);
    if (!values.length && configured) values.push(configured);
    return [...new Set(values)].filter(value => value <= 45).sort((a,b) => a-b);
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
        if (total + value <= 45) next.add(total + value);
      }
    }
    totals = next;
  }
  return [...totals].filter(value => value > 0).sort((a,b) => a-b);
}

function manualVpValues(checkpoint) {
  const max = checkpoint === 'end-of-battle' ? 45 : 15;
  return Array.from({length:max}, (_,index) => index + 1);
}

function guidanceMarkup(mission) {
  const values = getMissionVpOptions(mission);
  if (!values.length) return '<p class="checkpoint-vp-guidance"><strong>Mission guidance:</strong> use the physical mission card and tabletop result.</p>';
  return `<p class="checkpoint-vp-guidance"><strong>Mission VP guidance:</strong> ${values.map(value => `${value} VP`).join(' · ')}</p>`;
}

export function renderCheckpointScore(state, group, mission) {
  const { definitionId, definitionName, instanceId, category } = mission;
  const card = instanceId ? getSecondaryMissionHistory(state, group.playerId).find(c => c.instanceId === instanceId) : null;
  const key = instanceId ? [instanceId, state.battle?.round ?? 0, state.turn ?? 0, group.checkpoint].join(':') : checkpointScoreKey(state, group.playerId, group.checkpoint);
  if (hasEffectiveVictoryPointOpportunity(state, group.playerId, definitionId, key)) {
    return `<p role="status"><strong>VP recorded.</strong> ${category === 'secondary' ? 'Card lifecycle updated.' : 'Primary remains active for later checkpoints.'}</p>`;
  }
  if (instanceId && card?.status !== 'active') return '<p>Card is no longer active.</p>';

  const estimate = estimateCheckpointVp(state, group.playerId, mission, group.checkpoint);
  const suppliedPoints = Number(mission?.calculatedPoints) > 0 ? Number(mission.calculatedPoints) : null;
  const estimateMarkup = estimate
    ? `<p class="checkpoint-vp-estimate" role="status"><strong>Recorded-state estimate: ${estimate.points} VP</strong>${estimate.partial ? ' · Evidence is incomplete; use the tabletop result.' : ''}${estimate.capped ? ' · Estimate reflects the remaining Primary VP cap.' : ''}</p>`
    : suppliedPoints
      ? `<p class="checkpoint-vp-estimate" role="status"><strong>Recorded-state estimate: ${suppliedPoints} VP</strong>${mission?.calculatedPartial ? ' · Evidence is incomplete; use the tabletop result.' : ''}</p>`
      : '';
  const formAttrs = `data-checkpoint-score data-player="${esc(group.playerId)}" data-checkpoint="${esc(group.checkpoint)}" data-mission="${esc(definitionId)}" data-name="${esc(definitionName)}" data-category="${esc(category)}" data-instance="${esc(instanceId ?? '')}"`;
  const optionMarkup = manualVpValues(group.checkpoint).map(value => `<option value="${value}">${value} VP</option>`).join('');
  return `<form ${formAttrs} class="checkpoint-vp-manual">
    ${estimateMarkup}
    ${guidanceMarkup(mission)}
    <label><strong>Manual VP from tabletop</strong>
      <select name="vp" required aria-label="Manual VP for ${esc(definitionName)}"><option value="">Choose VP…</option>${optionMarkup}</select>
    </label>
    <button type="submit">Record manual score${category === 'secondary' ? ' & update card' : ''}</button>
    <p>Tabletop confirmation is authoritative. Recorded objectives, actions, and calculated evidence are guidance only and do not block scoring. Known VP caps still apply.</p>
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
      const submittedValue = event.submitter?.name === 'vp' ? event.submitter.value : form.querySelector('[name="vp"]')?.value;
      const payload = { playerId, amount: Number(submittedValue), scoringTiming,
        round: state.battle?.round ?? 0, turn: state.turn ?? 0 };
      if (instanceId) session.dispatch({type:'secondary_mission.record_score',payload:{...payload,instanceId,retireAfterScoring:true}});
      else session.dispatch({type:'victory_points.record_award',payload:{...payload,
        category:'primary', reason:form.getAttribute('data-name'), missionDefinitionId:form.getAttribute('data-mission'),
        opportunityKey:checkpointScoreKey(state,playerId,scoringTiming)}});
    } catch (error) { onError(error?.message ?? String(error)); }
  }));
}
