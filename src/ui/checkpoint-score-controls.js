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
      if (tier?.relationship === 'cumulative' && requiredTiers.length) {
        runningTotal += value;
        requiredTiers = [...requiredTiers, tier];
      } else {
        runningTotal = value;
        requiredTiers = [tier];
      }
      choices.push({ vp: runningTotal, tiers: requiredTiers, timingLabel: window?.timingLabel ?? '' });
    }
    return choices;
  });
}

export function getMissionVpOptions(mission = {}) {
  const windows = scoreWindowsFor(mission);
  if (mission.category === 'secondary' || mission.instanceId) {
    const choices = secondaryTierChoices(mission);
    const values = choices.map(choice => choice.vp);
    const configured = positiveVp(mission.victoryPoints ?? mission.result?.victoryPoints);
    if (!values.length && configured) values.push(configured);
    return [...new Set(values)].filter(value => value <= 15).sort((a,b) => a-b);
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

function directCalculatedPoints(mission, estimate, vpOptions) {
  const supplied = Number(mission?.calculatedPoints);
  if (Number.isInteger(supplied) && supplied > 0 && mission?.calculatedPartial !== true && vpOptions.includes(supplied)) return supplied;
  if (estimate && estimate.partial !== true && Number(estimate.points) > 0 && vpOptions.includes(Number(estimate.points))) {
    return Number(estimate.points);
  }
  if (!estimate && mission?.result?.eligible === true && vpOptions.length === 1) return vpOptions[0];
  return null;
}

function evidenceLabel(evidence) {
  if (evidence.count == null) return 'Confirm on tabletop';
  return evidence.count > 0 ? 'Completed in recorded state' : 'Still needed';
}

function renderSecondaryTierChoices(state, playerId, mission, suppliedPoints, formAttrs) {
  const choices = secondaryTierChoices(mission);
  if (choices.length <= 1) return null;
  const unique = [];
  const seen = new Set();
  for (const choice of choices) {
    if (seen.has(choice.vp)) continue;
    seen.add(choice.vp);
    unique.push(choice);
  }
  const rows = unique.map(choice => {
    const current = suppliedPoints === choice.vp;
    const requirements = choice.tiers.map(tier => {
      const evidence = missionConditionEvidence(state, playerId, tier);
      return `<p class="checkpoint-vp-requirement"><strong>${esc(evidenceLabel(evidence))}</strong> · ${esc(tier.summary ?? '')}${evidence.detail ? `<br>${esc(evidence.detail)}` : ''}</p>`;
    }).join('');
    const buttonLabel = current
      ? `Score ${choice.vp} VP now${mission.category === 'secondary' ? ' & remove card' : ''}`
      : `Confirm ${choice.vp} VP${mission.category === 'secondary' ? ' & remove card' : ''}`;
    return `<section class="checkpoint-vp-option${current ? ' checkpoint-vp-option--current' : ''}" data-vp-option="${choice.vp}">
      <h4>${choice.vp} VP${current ? ' · Current recorded-state result' : ''}</h4>
      ${requirements}
      <button type="submit" name="vp" value="${choice.vp}">${buttonLabel}</button>
    </section>`;
  }).join('');
  return `<form ${formAttrs}>
    <div class="checkpoint-vp-options" role="group" aria-label="Scoring options for ${esc(mission.definitionName)}">
      <h4>Scoring options</h4>
      ${rows}
    </div>
    <p>Choose the score you are confirming now. Higher-value options stay visible so you can see what still needs to be completed or confirmed. Existing VP caps apply.</p>
  </form>`;
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
  const estimate = estimateCheckpointVp(state, group.playerId, mission, group.checkpoint);
  const suppliedPoints = Number(mission?.calculatedPoints) > 0 ? Number(mission.calculatedPoints) : null;
  const directPoints = directCalculatedPoints(mission, estimate, vpOptions);
  const estimateMarkup = estimate
    ? `<p class="checkpoint-vp-estimate" role="status"><strong>Potential score from recorded state: ${estimate.points} VP</strong>${estimate.partial ? ' · Partial evidence; tabletop confirmation may change this total.' : ''}${estimate.capped ? ' · Limited by remaining Primary VP cap.' : ''}</p>`
    : suppliedPoints
      ? `<p class="checkpoint-vp-estimate" role="status"><strong>Potential score from recorded state: ${suppliedPoints} VP</strong>${mission?.calculatedPartial ? ' · Partial evidence; verify the final award on the tabletop.' : ''}</p>`
      : directPoints
        ? `<p class="checkpoint-vp-estimate" role="status"><strong>Potential completion: ${directPoints} VP</strong> · Recorded conditions support completion.</p>`
        : '';
  const formAttrs = `data-checkpoint-score data-player="${esc(group.playerId)}" data-checkpoint="${esc(group.checkpoint)}" data-mission="${esc(definitionId)}" data-name="${esc(definitionName)}" data-category="${esc(category)}" data-instance="${esc(instanceId ?? '')}"`;
  const tierMarkup = category === 'secondary'
    ? renderSecondaryTierChoices(state, group.playerId, mission, suppliedPoints, formAttrs)
    : null;
  if (tierMarkup) return `${estimateMarkup}${tierMarkup}`;
  if (directPoints) {
    return `<form ${formAttrs}>${estimateMarkup}<input type="hidden" name="vp" value="${directPoints}"><button type="submit">Confirm +${directPoints} VP${category === 'secondary' ? ' & remove card' : ''}</button><p>Player confirmation remains authoritative.</p></form>`;
  }
  const optionMarkup = vpOptions.map(value => `<option value="${value}">${value} VP</option>`).join('');
  return `<form ${formAttrs}>
    ${estimateMarkup}
    <label>Confirm VP earned <select name="vp" required aria-label="VP for ${esc(definitionName)}" ${vpOptions.length ? '' : 'disabled'}><option value="">${vpOptions.length ? 'Choose VP…' : 'No configured VP value'}</option>${optionMarkup}</select></label>
    <button type="submit" ${vpOptions.length ? '' : 'disabled'}>Confirm score${category === 'secondary' ? ' & remove card' : ''}</button>
    <p>Use this manual choice only when recorded evidence cannot determine the exact award. Existing VP caps apply.</p>
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
