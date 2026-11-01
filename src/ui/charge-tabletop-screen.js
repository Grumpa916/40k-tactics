import { createLiveMapView } from './live-map-view.js';
import { getChargeViewModel, recordChargeOutcomeForSession, recordChargeDeclinedForSession, finishChargePhase } from '../application/charge-workflow.js';
import { renderCombatWorkspace, bindCombatMap, escapeHtml as esc } from './combat-workspace.js';
import { captureViewContinuity } from './view-continuity.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';
import { getChargeOpportunity, getChargeTargetPriorities } from '../rules/tactical-charge-opportunity.js';
import { getCombatFormationMembers } from '../rules/battle-unit-reference.js';

function modelsFor(unit) {
  return Array.isArray(unit.models) && unit.models.length
    ? unit.models
    : unit.position ? [{ id: unit.id, position: unit.position }] : [];
}

function clampFormationDelta(formation, dx, dy) {
  const positions = formation
    .flatMap(modelsFor)
    .map(model => model?.position)
    .filter(position => Number.isFinite(position?.x) && Number.isFinite(position?.y));
  if (!positions.length) return { dx, dy };
  const minX = Math.min(...positions.map(position => position.x));
  const maxX = Math.max(...positions.map(position => position.x));
  const minY = Math.min(...positions.map(position => position.y));
  const maxY = Math.max(...positions.map(position => position.y));
  return {
    dx: Math.max(-minX, Math.min(60 - maxX, dx)),
    dy: Math.max(-minY, Math.min(44 - maxY, dy))
  };
}

function percent(value) {
  return Number.isFinite(value) ? Math.round(value * 100) + '%' : '—';
}

function chargePrioritySummary(advice) {
  const chance = Number.isFinite(advice?.successProbability)
    ? `${advice.measuredDistance}″ · ${percent(advice.successProbability)} success`
    : Number.isFinite(advice?.mapSuccessProbability)
      ? `Map ≈ ${advice.mapDistance}″ · ~${percent(advice.mapSuccessProbability)} success`
      : 'Measure on table for exact charge chance';
  const fight = advice?.projectedFight?.available
    ? `${advice.projectedFight.expectedDamage.toFixed(1)} expected Fight damage`
    : 'Fight damage unavailable';
  const counter = advice?.projectedCounterFight?.available
    ? ` · counter ≈ ${advice.projectedCounterFight.expectedDamage.toFixed(1)}`
    : '';
  const strategic = advice?.strategicContext?.label ?? 'unknown';
  const flip = advice?.strategicContext?.objectiveSwing?.potentialFlip ? ' · objective swing possible' : '';
  return { chance, fight: fight + counter, strategic: `Strategic value: ${strategic}${flip}` };
}

export function createChargeTabletopScreen(container, { session, perspectivePlayerId = null }) {
  const mapView = createLiveMapView();
  let selectedUnitId = null;
  let targetIds = new Set();
  let distances = new Map();
  let error = '';
  let livePointerDrag = null;
  const clearSelection = () => { selectedUnitId = null; targetIds = new Set(); distances = new Map(); };
  const completeMeasurements = () => targetIds.size > 0 && [...targetIds].every(id => Number.isFinite(distances.get(id)));

  function render() {
    const restoreView = captureViewContinuity(container);
    const state = session.getState();
    const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId;
    const model = getChargeViewModel(state, { perspectivePlayerId: perspectivePlayerId ?? state.activePlayer });
    if (!model.candidates.some(item => item.unit.unitId === selectedUnitId)) clearSelection();
    const candidate = model.candidates.find(item => item.unit.unitId === selectedUnitId);
    const valid = new Set((candidate?.targets ?? []).map(item => item.targetUnitId));
    for (const id of targetIds) if (!valid.has(id)) { targetIds.delete(id); distances.delete(id); }
    const targets = candidate?.targets ?? [];
    const priorities = candidate ? getChargeTargetPriorities(state, {
      playerId:activePlayerId,
      attackerId:candidate.unit.unitId,
      targets,
      measuredDistances:distances,
      limit:3
    }) : [];
    const controls = `<h1>${esc(candidate?.unit.name ?? 'Select a charging unit')}</h1>
      ${state.phase !== 'charge' ? '<p class="combat-workspace__error" role="status">Viewing Charge. Return to the current game phase and advance to Charge to record an outcome.</p>' : ''}
      ${error ? `<p class="combat-workspace__error" role="alert">${esc(error)}</p>` : ''}
      <p><small>Drag an active player's deployed unit on the live map to update its approximate Charge position.</small></p>
      <details ${selectedUnitId ? '' : 'open'}><summary>Available chargers · ${model.candidates.length}</summary>
        <div class="combat-workspace__choices">${model.candidates.map(item => `<button type="button" data-charge-unit="${esc(item.unit.unitId)}" aria-pressed="${item.unit.unitId === selectedUnitId}">${esc(item.unit.name)}</button>`).join('') || '<p>No approximate charge opportunities. Check tabletop distances and map positions.</p>'}</div></details>
      ${candidate ? `<aside class="combat-workspace__card combat-workspace__advisor" aria-label="Charge Tactical Advisor priorities"><h2>Charge Priorities · Top ${priorities.length} of ${targets.length}</h2>
        ${priorities.length ? priorities.map(({ rank, target, advice }) => {
          const summary = chargePrioritySummary(advice);
          return `<section class="combat-workspace__card">
            <button type="button" data-charge-priority-target="${esc(target.targetUnitId)}"><strong>#${rank} ${esc(target.name)}</strong></button>
            <small>${esc(summary.chance)}</small>
            <p>${esc(summary.fight)}</p>
            <p><strong>${esc(summary.strategic)}</strong></p>
            <p>${esc(advice.recommendation)}</p>
          </section>`;
        }).join('') : '<p>No ranked charge targets are available for this unit.</p>'}
      </aside>
      <h2>Record Charge</h2>
      <p><small>Select the target(s), enter the measured tabletop distance, and record the outcome. These targets remain history and Tactical Advisor context only; Fight confirms its legal targets fresh from the tabletop.</small></p>
        ${targets.map(item => {
          const measured = distances.get(item.targetUnitId);
          let exactChance = null;
          if (Number.isFinite(measured)) {
            try {
              exactChance = getChargeOpportunity(state, {
                playerId:activePlayerId,
                attackerId:candidate.unit.unitId,
                targetUnitId:item.targetUnitId,
                measuredDistance:measured,
                mapDistance:item.targetDistance
              }).successProbability;
            } catch {}
          }
          return `<section class="combat-workspace__card">
          <button type="button" data-charge-target-toggle="${esc(item.targetUnitId)}" aria-pressed="${targetIds.has(item.targetUnitId)}">${targetIds.has(item.targetUnitId) ? '✓ ' : '+ '}${esc(item.target.name)}</button>
          <small>Map ≈ ${esc(item.targetDistance)}″ · ${esc(item.rangeStatus === 'borderline' ? 'borderline · measure on table' : item.confidence + ' confidence')}</small>
          ${targetIds.has(item.targetUnitId) ? `<div class="combat-workspace__presets">${Array.from({ length:11 }, (_, i) => i + 2).map(n => `<button type="button" data-charge-distance="${esc(item.targetUnitId)}" data-charge-distance-value="${n}" aria-label="${esc(item.target.name)} measured distance ${n} inches" aria-pressed="${distances.get(item.targetUnitId) === n}">${n}″</button>`).join('')}</div><small>Measured: ${Number.isFinite(measured) ? measured + '″ · ' + percent(exactChance) + ' success' : 'choose distance for exact 2D6 chance'}</small>` : ''}
        </section>`;
        }).join('')}
        <div class="combat-workspace__choices"><button type="button" data-charge-success ${completeMeasurements() ? '' : 'disabled'}>Charge successful</button><button type="button" data-charge-failed ${completeMeasurements() ? '' : 'disabled'}>Charge failed</button><button type="button" data-charge-decline>Do not charge</button></div>` : ''}
      <details><summary>Charge history · ${model.outcomes.length}</summary><ol>${model.outcomes.map(item => `<li>${esc(item.unit.name)} · ${esc(item.outcome)} · ${item.targets.map(t => esc(t.name) + ' (' + esc(item.measuredDistances?.[t.unitId]) + '″)').join(', ')}</li>`).join('')}</ol></details>`;
    container.innerHTML = renderCombatWorkspace({ state, mapView, phase:'charge', perspectivePlayerId:perspectivePlayerId ?? state.activePlayer, interactivePlayerId:state.phase === 'charge' ? activePlayerId : null, selectedUnitId, controls, footer:`<button type="button" data-charge-complete ${model.canComplete ? '' : 'disabled'}>End Charge · Fight →</button>` });

    restoreView();
    mapView.bind(container);
    const chooseUnit = id => { selectedUnitId = id; targetIds = new Set(); distances = new Map(); error = ''; render(); };
    const toggleTarget = id => {
      if (targetIds.has(id)) { targetIds.delete(id); distances.delete(id); } else targetIds.add(id);
      error = ''; render();
    };
    const selectPriorityTarget = id => {
      if (!valid.has(id)) return;
      targetIds.add(id);
      error = '';
      render();
    };
    bindCombatMap(container, { selectedUnitId, targetIds:[...targetIds], selectableIds:[...model.candidates.map(item => item.unit.unitId), ...valid], onSelect:id => {
      if (valid.has(id)) toggleTarget(id);
      else if (model.candidates.some(item => item.unit.unitId === id)) chooseUnit(id);
      else { error = 'Select an available charger, then one of its recommended enemy targets. Map range remains approximate.'; render(); }
    } });
    container.querySelectorAll('[data-charge-unit]').forEach(button => button.addEventListener('click', () => chooseUnit(button.getAttribute('data-charge-unit'))));
    container.querySelectorAll('[data-charge-priority-target]').forEach(button => button.addEventListener('click', () => selectPriorityTarget(button.getAttribute('data-charge-priority-target'))));
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

  function dragDeltaForPointer(drag, event) {
    const rect = drag.board.getBoundingClientRect?.();
    if (!rect || !rect.width || !rect.height) return null;
    const pointerX = Math.max(0, Math.min(60, (event.clientX - rect.left) / rect.width * 60));
    const pointerY = Math.max(0, Math.min(44, (1 - (event.clientY - rect.top) / rect.height) * 44));
    const state = session.getState();
    const unit = state.units.find(item => item.id === drag.unitId);
    if (!unit) return null;
    const formation = getCombatFormationMembers(state, unit);
    const delta = clampFormationDelta(formation, pointerX - drag.markerX, pointerY - drag.markerY);
    return { ...delta, formation };
  }

  function handleLivePointerDown(event) {
    const marker = event.target?.closest?.('[data-map-unit-id]');
    if (!marker || !marker.closest?.('[data-map-mode="live"]')) return;
    const state = session.getState();
    const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId;
    const unitId = marker.getAttribute('data-map-unit-id');
    const unit = state.units.find(item => item.id === unitId);
    if (state.phase !== 'charge' || state.battle?.status !== 'active') return;
    if (!unit || unit.ownerId !== activePlayerId || unit.status !== 'deployed') return;
    const board = marker.closest('[data-battlefield-map-board]');
    if (!board) return;
    livePointerDrag = {
      unitId,
      pointerId:event.pointerId,
      startX:event.clientX,
      startY:event.clientY,
      board,
      marker,
      markerX:parseFloat(marker.style.left) / 100 * 60,
      markerY:44 - parseFloat(marker.style.top) / 100 * 44,
      left:marker.style.left,
      top:marker.style.top,
      moved:false
    };
    marker.classList?.add?.('is-dragging');
    try { marker.setPointerCapture?.(event.pointerId); } catch {}
  }

  function handleLivePointerMove(event) {
    const drag = livePointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 8) drag.moved = true;
    if (!drag.moved) return;
    const dragged = dragDeltaForPointer(drag, event);
    if (!dragged) return;
    const x = drag.markerX + dragged.dx;
    const y = drag.markerY + dragged.dy;
    event.preventDefault?.();
    drag.marker.style.left = x / 60 * 100 + '%';
    drag.marker.style.top = (44 - y) / 44 * 100 + '%';
  }

  function handleLivePointerUp(event) {
    const drag = livePointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    livePointerDrag = null;
    drag.marker.classList?.remove?.('is-dragging');
    if (!drag.moved) return;
    const dragged = dragDeltaForPointer(drag, event);
    if (!dragged) return;
    try {
      const commands = dragged.formation.map(member => ({
        type:COMMAND_TYPES.ADJUST_LIVE_MAP_POSITION,
        payload:{
          unitId:member.id,
          playerId:member.ownerId,
          moves:modelsFor(member).map(model => ({
            modelId:model.id,
            position:{
              x:Math.round((model.position.x + dragged.dx) * 10) / 10,
              y:Math.round((model.position.y + dragged.dy) * 10) / 10
            }
          }))
        }
      }));
      session.dispatchBatch(commands);
      error = '';
    } catch (cause) {
      error = cause?.message ?? String(cause);
      render();
    }
  }

  function handleLivePointerCancel(event) {
    const drag = livePointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    livePointerDrag = null;
    drag.marker.classList?.remove?.('is-dragging');
    drag.marker.style.left = drag.left;
    drag.marker.style.top = drag.top;
  }

  container.addEventListener?.('pointerdown', handleLivePointerDown);
  container.addEventListener?.('pointermove', handleLivePointerMove);
  container.addEventListener?.('pointerup', handleLivePointerUp);
  container.addEventListener?.('pointercancel', handleLivePointerCancel);
  const unsubscribe = session.subscribe(render);
  render();
  return {
    getState:session.getState,
    render,
    destroy:() => {
      unsubscribe();
      container.removeEventListener?.('pointerdown', handleLivePointerDown);
      container.removeEventListener?.('pointermove', handleLivePointerMove);
      container.removeEventListener?.('pointerup', handleLivePointerUp);
      container.removeEventListener?.('pointercancel', handleLivePointerCancel);
      container.replaceChildren();
    }
  };
}