import { createLiveMapView } from './live-map-view.js';
import { getChargeViewModel, recordChargeOutcomeForSession, recordChargeDeclinedForSession, finishChargePhase } from '../application/charge-workflow.js';
import { renderCombatWorkspace, bindCombatMap, escapeHtml as esc } from './combat-workspace.js';

export function createChargeTabletopScreen(container, { session, perspectivePlayerId = null }) {
  const mapView = createLiveMapView();
  let selectedUnitId = null;
  let targetIds = new Set();
  let distances = new Map();
  let error = '';
  const clearSelection = () => { selectedUnitId = null; targetIds = new Set(); distances = new Map(); };
  const completeMeasurements = () => targetIds.size > 0 && [...targetIds].every(id => Number.isFinite(distances.get(id)));

  function render() {
    const state = session.getState();
    const model = getChargeViewModel(state, { perspectivePlayerId: perspectivePlayerId ?? state.activePlayer });
    if (!model.candidates.some(item => item.unit.unitId === selectedUnitId)) clearSelection();
    const candidate = model.candidates.find(item => item.unit.unitId === selectedUnitId);
    const valid = new Set((candidate?.targets ?? []).map(item => item.targetUnitId));
    for (const id of targetIds) if (!valid.has(id)) { targetIds.delete(id); distances.delete(id); }
    const targets = candidate?.targets ?? [];
    const controls = `<h1>${esc(candidate?.unit.name ?? 'Select a charging unit')}</h1>
      ${state.phase !== 'charge' ? '<p class="combat-workspace__error" role="status">Viewing Charge. Return to the current game phase and advance to Charge to record an outcome.</p>' : ''}
      ${error ? `<p class="combat-workspace__error" role="alert">${esc(error)}</p>` : ''}
      <details ${selectedUnitId ? '' : 'open'}><summary>Available chargers · ${model.candidates.length}</summary>
        <div class="combat-workspace__choices">${model.candidates.map(item => `<button type="button" data-charge-unit="${esc(item.unit.unitId)}" aria-pressed="${item.unit.unitId === selectedUnitId}">${esc(item.unit.name)}</button>`).join('') || '<p>No approximate charge opportunities. Check tabletop distances and map positions.</p>'}</div></details>
      ${candidate ? `<h2>Targets</h2>
        ${targets.map(item => `<section class="combat-workspace__card">
          <button type="button" data-charge-target-toggle="${esc(item.targetUnitId)}" aria-pressed="${targetIds.has(item.targetUnitId)}">${targetIds.has(item.targetUnitId) ? '✓ ' : '+ '}${esc(item.target.name)}</button>
          <small>Map ≈ ${esc(item.targetDistance)}″ · ${esc(item.rangeStatus === 'borderline' ? 'borderline · measure on table' : item.confidence + ' confidence')}</small>
          ${targetIds.has(item.targetUnitId) ? `<div class="combat-workspace__presets">${Array.from({ length:11 }, (_, i) => i + 2).map(n => `<button type="button" data-charge-distance="${esc(item.targetUnitId)}" data-charge-distance-value="${n}" aria-label="${esc(item.target.name)} measured distance ${n} inches" aria-pressed="${distances.get(item.targetUnitId) === n}">${n}″</button>`).join('')}</div><small>Measured: ${distances.has(item.targetUnitId) ? distances.get(item.targetUnitId) + '″' : 'choose distance'}</small>` : ''}
        </section>`).join('')}
        <div class="combat-workspace__choices"><button type="button" data-charge-success ${completeMeasurements() ? '' : 'disabled'}>Charge successful</button><button type="button" data-charge-failed ${completeMeasurements() ? '' : 'disabled'}>Charge failed</button><button type="button" data-charge-decline>Do not charge</button></div>` : ''}
      <aside class="combat-workspace__card combat-workspace__advisor" aria-label="Charge Tactical Advisor"><h2>Tactical Advisor</h2>
        ${targetIds.size ? targets.filter(item => targetIds.has(item.targetUnitId)).map(item => `<p><strong>${esc(item.target.name)}</strong><br>${esc(item.reason)}</p>`).join('') : '<p>Select a charger and targets to review approximate range context.</p>'}

      </aside>
      <details><summary>Charge history · ${model.outcomes.length}</summary><ol>${model.outcomes.map(item => `<li>${esc(item.unit.name)} · ${esc(item.outcome)} · ${item.targets.map(t => esc(t.name) + ' (' + esc(item.measuredDistances?.[t.unitId]) + '″)').join(', ')}</li>`).join('')}</ol></details>`;
    container.innerHTML = renderCombatWorkspace({ state, mapView, phase:'charge', perspectivePlayerId:perspectivePlayerId ?? state.activePlayer, selectedUnitId, controls, footer:`<button type="button" data-charge-complete ${model.canComplete ? '' : 'disabled'}>End Charge · Fight →</button>` });

    mapView.bind(container);
    const chooseUnit = id => { selectedUnitId = id; targetIds = new Set(); distances = new Map(); error = ''; render(); };
    const toggleTarget = id => {
      if (targetIds.has(id)) { targetIds.delete(id); distances.delete(id); } else targetIds.add(id);
      error = ''; render();
    };
    bindCombatMap(container, { selectedUnitId, targetIds:[...targetIds], selectableIds:[...model.candidates.map(item => item.unit.unitId), ...valid], onSelect:id => {
      if (valid.has(id)) toggleTarget(id);
      else if (model.candidates.some(item => item.unit.unitId === id)) chooseUnit(id);
      else { error = 'Select an available charger, then one of its recommended enemy targets. Map range remains approximate.'; render(); }
    } });
    container.querySelectorAll('[data-charge-unit]').forEach(button => button.addEventListener('click', () => chooseUnit(button.getAttribute('data-charge-unit'))));
    container.querySelectorAll('[data-charge-target-toggle]').forEach(button => button.addEventListener('click', () => toggleTarget(button.getAttribute('data-charge-target-toggle'))));
    container.querySelectorAll('[data-charge-distance-value]').forEach(button => button.addEventListener('click', () => {
      distances.set(button.getAttribute('data-charge-distance'), Number(button.getAttribute('data-charge-distance-value')));
      error = ''; render();
    }));
    const record = succeeded => {
      if (!selectedUnitId || !completeMeasurements()) return;
      const payload = { unitId:selectedUnitId, succeeded, targetIds:[...targetIds], measuredDistances:Object.fromEntries(distances) };
      try {
        recordChargeOutcomeForSession(session, payload);
        clearSelection(); error = '';
      } catch (cause) { error = cause?.message ?? String(cause); }
      render();
    };
    container.querySelector('[data-charge-success]')?.addEventListener('click', () => record(true));
    container.querySelector('[data-charge-failed]')?.addEventListener('click', () => record(false));
    container.querySelector('[data-charge-decline]')?.addEventListener('click', () => {
      if (!selectedUnitId) return;
      try { recordChargeDeclinedForSession(session, { unitId:selectedUnitId }); clearSelection(); error = ''; }
      catch (cause) { error = cause?.message ?? String(cause); }
      render();
    });
    container.querySelector('[data-charge-complete]')?.addEventListener('click', () => {
      try { finishChargePhase(session); } catch (cause) { error = cause?.message ?? String(cause); render(); }
    });
    return model;
  }
  const unsubscribe = session.subscribe(render);
  render();
  return { getState:session.getState, render, destroy:() => { unsubscribe(); container.replaceChildren(); } };
}
