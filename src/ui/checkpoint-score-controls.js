import { hasEffectiveVictoryPointOpportunity, hasEffectiveZeroVictoryPointConfirmation } from '../engine/victory-points-ledger.js';
import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_MODES } from '../rules/secondary-mission-lifecycle.js';
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const checkpointScoreKey = (state, playerId, checkpoint) => [state.battle?.round ?? 0, state.turn ?? 0, playerId, checkpoint].join(':');

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
    if (window?.scoringModel === 'fixed-character-kills') {
      // Fixed Assassination: 3 VP per destroyed CHARACTER, plus 1 VP for
      // each one with 4+ Wounds. A 1 VP bonus cannot score independently.
      const totals = new Set();
      for (let small = 0; small <= 5; small++) {
        for (let large = 0; large <= 5; large++) {
          const points = small * 3 + large * 4;
          if (points > 0 && points <= 15) totals.add(points);
        }
      }
      return [...totals].sort((a, b) => a - b).map(vp => ({vp, tiers:window.tiers ?? [], timingLabel:window.timingLabel ?? ''}));
    }
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
        for (let score = value; score <= max; score += value) {
          choices.push({ vp: Math.min(score, max), tiers: requiredTiers, timingLabel: window?.timingLabel ?? '' });
        }
        if (max % value !== 0) {
          choices.push({ vp: max, tiers: requiredTiers, timingLabel: window?.timingLabel ?? '' });
        }
      } else {
        choices.push({ vp: runningTotal, tiers: requiredTiers, timingLabel: window?.timingLabel ?? '' });
      }
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

function renderSecondaryTierChoices(mission, formAttrs, fixedCard = false) {
  const choices = secondaryTierChoices(mission);
  if (choices.length <= 1) return null;
  const unique = [];
  const seen = new Set();
  for (const choice of choices) {
    if (seen.has(choice.vp)) continue;
    seen.add(choice.vp);
    unique.push(choice);
  }
  // Large repeatable score ranges fit a compact dropdown better than dozens of buttons.
  if (unique.length > 6) return null;
  const rows = unique.map(choice => {
    const requirements = choice.tiers.map(tier =>
      `<p class="checkpoint-vp-requirement"><strong>${esc(tier.vp)} VP condition</strong> · ${esc(tier.summary ?? '')}</p>`
    ).join('');
    return `<section class="checkpoint-vp-option" data-vp-option="${choice.vp}">
      <h4>${choice.vp} VP</h4>
      ${requirements}
      <button type="submit" name="vp" value="${choice.vp}">Record ${choice.vp} VP${mission.category === 'secondary' && !fixedCard ? ' & remove card' : ''}</button>
    </section>`;
  }).join('');
  return `<form ${formAttrs}>
    <div class="checkpoint-vp-options" role="group" aria-label="Scoring options for ${esc(mission.definitionName)}">
      <h4>Scoring options</h4>
      <section class="checkpoint-vp-option" data-vp-option="0">
        <h4>0 VP</h4><p>No scoring conditions were achieved this window.</p>
        <button type="submit" name="vp" value="0">Confirm 0 VP · No points earned</button>
      </section>
      ${rows}
    </div>
    <p>Choose the VP both players agree was earned on the tabletop. The app records the result; it does not decide whether the condition was completed.</p>
  </form>`;
}

export function renderCheckpointScore(state, group, mission) {
  const { definitionId, definitionName, instanceId, category } = mission;
  const card = instanceId ? getSecondaryMissionHistory(state, group.playerId).find(c => c.instanceId === instanceId) : null;
  const fixedCard = category === 'secondary' &&
    (getSecondaryMissionMode(state, group.playerId) ?? card?.definition?.missionMode) === SECONDARY_MISSION_MODES.FIXED;
  const scoreLabel = category === 'secondary' && !fixedCard ? ' & remove card' : '';
  const key = instanceId ? [instanceId, state.battle?.round ?? 0, state.turn ?? 0, group.checkpoint].join(':') : checkpointScoreKey(state, group.playerId, group.checkpoint);
  if (hasEffectiveZeroVictoryPointConfirmation(state, group.playerId, definitionId, key)) {
    const last = state.history?.at(-1);
    const canCorrect = last?.type === 'victory_points.zero_confirmed' &&
      last.payload?.playerId === group.playerId && last.payload?.missionDefinitionId === definitionId &&
      last.payload?.opportunityKey === key;
    return `<p role="status"><strong>0 VP confirmed.</strong> No points added. ${category === 'secondary'
      ? 'The card remains active until scored or discarded under its normal rules.'
      : 'Primary remains available at later checkpoints.'}</p>` +
      (canCorrect ? `<button type="button" data-checkpoint-undo-zero data-player="${esc(group.playerId)}" data-mission="${esc(definitionId)}" data-opportunity="${esc(key)}">Change 0 VP confirmation</button>` : '');
  }
  if (hasEffectiveVictoryPointOpportunity(state, group.playerId, definitionId, key)) {
    return `<p role="status"><strong>VP recorded.</strong> ${category === 'secondary' ? fixedCard ? 'Fixed card remains active for later checkpoints.' : 'Card removed from active missions.' : 'Primary remains active for later checkpoints.'}</p>`;
  }
  if (instanceId && card?.status !== 'active') return '<p>Card is no longer active.</p>';
  const vpOptions = getMissionVpOptions(mission);
  const formAttrs = `data-checkpoint-score data-player="${esc(group.playerId)}" data-checkpoint="${esc(group.checkpoint)}" data-mission="${esc(definitionId)}" data-name="${esc(definitionName)}" data-category="${esc(category)}" data-instance="${esc(instanceId ?? '')}"`;
  const tierMarkup = category === 'secondary' ? renderSecondaryTierChoices(mission, formAttrs, fixedCard) : null;
  if (tierMarkup) return tierMarkup;
  if (vpOptions.length === 1) {
    const points = vpOptions[0];
    return `<form ${formAttrs}><input type="hidden" name="vp" value="${points}"><button type="submit">Record +${points} VP${scoreLabel}</button><button type="submit" name="vp" value="0">Confirm 0 VP · No points earned</button><p>Use the tabletop result agreed by both players. Existing VP caps still apply.</p></form>`;
  }
  const optionMarkup = '<option value="0">0 VP — No points earned</option>' +
    vpOptions.map(value => `<option value="${value}">${value} VP</option>`).join('');
  return `<form ${formAttrs}>
    <label>Agreed VP earned <select name="vp" required aria-label="VP for ${esc(definitionName)}" ${vpOptions.length ? '' : 'disabled'}><option value="">${vpOptions.length ? 'Choose agreed VP…' : 'No configured VP value'}</option>${optionMarkup}</select></label>
    <button type="submit" ${vpOptions.length ? '' : 'disabled'}>Record score${scoreLabel}</button>
    <p>The app does not infer completion from objective control, unit positions, combat history, or recorded Actions. Existing VP caps apply.</p>
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
      if (submittedValue == null || String(submittedValue).trim() === '') {
        throw new Error('Select the agreed VP result before recording.');
      }
      const amount = Number(submittedValue);
      if (!Number.isInteger(amount) || amount < 0) {
        throw new Error('Agreed VP must be a non-negative whole number.');
      }
      const payload = { playerId, amount, scoringTiming,
        round: state.battle?.round ?? 0, turn: state.turn ?? 0 };
      if (instanceId) {
        const card = getSecondaryMissionHistory(state, playerId).find(item => item.instanceId === instanceId);
        const mode = getSecondaryMissionMode(state, playerId) ?? card?.definition?.missionMode;
        session.dispatch({type:'secondary_mission.record_score',payload:{...payload,instanceId,
          retireAfterScoring:mode !== SECONDARY_MISSION_MODES.FIXED}});
      }
      else session.dispatch({type:'victory_points.record_award',payload:{...payload,
        category:'primary', reason:form.getAttribute('data-name'), missionDefinitionId:form.getAttribute('data-mission'),
        opportunityKey:checkpointScoreKey(state,playerId,scoringTiming)}});
    } catch (error) { onError(error?.message ?? String(error)); }
  }));
  container.querySelectorAll?.('[data-checkpoint-undo-zero]').forEach(button=>button.addEventListener('click',()=>{
    try {
      session.dispatch({type:'victory_points.undo_zero_confirmation',payload:{
        playerId:button.getAttribute('data-player'),
        missionDefinitionId:button.getAttribute('data-mission'),
        opportunityKey:button.getAttribute('data-opportunity')
      }});
    } catch(error) {onError(error?.message ?? String(error));}
  }));
}
