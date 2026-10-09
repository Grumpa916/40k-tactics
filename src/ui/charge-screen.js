import {
  getChargeViewModel,
  recordChargeOutcomeForSession,
  finishChargePhase
} from '../application/charge-workflow.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function targetRow(item, selected, measuredDistance) {
  const warning = item.rangeStatus === 'borderline'
    ? '<span class="charge-target__warning">Exact tabletop measurement required</span>'
    : '';
  const measurement = selected
    ? '<label class="charge-target__measurement">Measured charge distance (inches)' +
      '<input type="number" min="0" step="0.1" inputmode="decimal" ' +
      'data-charge-distance="' + escapeHtml(item.targetUnitId) + '" ' +
      'value="' + escapeHtml(measuredDistance ?? '') + '" placeholder="e.g. 9.5"></label>'
    : '';
  return [
    '<label class="charge-target charge-target--', escapeHtml(item.rangeStatus), '">',
    '<input type="checkbox" data-charge-target="', escapeHtml(item.targetUnitId), '" ',
    selected ? 'checked' : '', '>',
    '<span class="charge-target__main"><strong>', escapeHtml(item.target.name),
    '</strong><span>', escapeHtml(item.targetDistance), '" · ',
    escapeHtml(item.rangeStatus === 'borderline'
      ? 'Borderline · low confidence'
      : 'Within approximate range · ' + item.confidence + ' confidence'),
    '</span>', warning, measurement, '</span></label>'
  ].join('');
}

function outcomeRow(outcome) {
  const targets = outcome.targets.length
    ? outcome.targets.map((target) => {
        const distance = outcome.measuredDistances?.[target.unitId];
        return target.name + (typeof distance === 'number' ? ' (' + distance + '")' : '');
      }).join(', ')
    : 'No targets';
  return '<li class="charge-history__item"><strong>' +
    escapeHtml(outcome.unit.name) + '</strong><span>' +
    escapeHtml(outcome.outcome) + ' · ' + escapeHtml(targets) + '</span></li>';
}

export function createChargeScreen(
  container,
  { session, perspectivePlayerId = null } = {}
) {
  if (!container || typeof container.replaceChildren !== 'function') {
    throw new TypeError('A browser container element is required.');
  }
  if (!session || typeof session.getState !== 'function' || typeof session.subscribe !== 'function') {
    throw new TypeError('A game session is required.');
  }

  let selectedUnitId = null;
  let selectedTargetIds = new Set();
  let measuredDistances = new Map();

  function render() {
    const state = session.getState();
    const perspective = perspectivePlayerId ?? state.activePlayer;
    const model = getChargeViewModel(state, { perspectivePlayerId: perspective });

    if (!model.candidates.some((item) => item.unit.unitId === selectedUnitId)) {
      selectedUnitId = model.candidates[0]?.unit.unitId ?? null;
      selectedTargetIds = new Set();
      measuredDistances = new Map();
    }

    const candidate = model.candidates.find((item) => item.unit.unitId === selectedUnitId);
    const validTargets = new Set((candidate?.targets ?? []).map((item) => item.targetUnitId));
    selectedTargetIds = new Set([...selectedTargetIds].filter((id) => validTargets.has(id)));
    measuredDistances = new Map(
      [...measuredDistances].filter(([id]) => validTargets.has(id) && selectedTargetIds.has(id))
    );

    const hasCompleteMeasurements = selectedTargetIds.size > 0 &&
      [...selectedTargetIds].every((id) => {
        const value = measuredDistances.get(id);
        return typeof value === 'number' && Number.isFinite(value) && value >= 0;
      });

    const chargers = model.candidates.length
      ? model.candidates.map((item) =>
          '<button type="button" class="charge-charger ' +
          (item.unit.unitId === selectedUnitId ? 'is-selected' : '') +
          '" data-charge-unit="' + escapeHtml(item.unit.unitId) + '">' +
          '<strong>' + escapeHtml(item.unit.name) + '</strong><span>' +
          item.targets.length + ' recommended target' + (item.targets.length === 1 ? '' : 's') +
          '</span></button>'
        ).join('')
      : '<div class="charge-empty">No approximate charge opportunities are available from the map.</div>';

    const targets = candidate
      ? candidate.targets.map((item) =>
          targetRow(item, selectedTargetIds.has(item.targetUnitId), measuredDistances.get(item.targetUnitId))
        ).join('')
      : '';

    const measuredPayload = Object.fromEntries(
      [...selectedTargetIds].map((id) => [id, measuredDistances.get(id)])
    );

    container.innerHTML = [
      '<main class="charge-screen"><header class="charge-header"><div>',
      '<div class="charge-kicker">LIVE BATTLE</div><h1>Charge Phase</h1><p>Round ',
      escapeHtml(model.round), ' · Turn ', escapeHtml(model.turn),
      '</p></div><div class="charge-status">',
      model.candidates.length
        ? model.candidates.length + ' charger' + (model.candidates.length === 1 ? '' : 's') + ' available'
        : 'No recommended charges',
      '</div></header>',
      '<div class="charge-note">Map distances are approximate. Before rolling, measure each declared charger-to-target distance on the tabletop and enter it here. Exact tabletop measurement is authoritative.</div>',
      '<section class="charge-section"><div class="charge-section__heading"><h2>Available chargers</h2><span>',
      model.candidates.length, ' available</span></div><div class="charge-chargers">', chargers, '</div></section>',
      candidate
        ? '<section class="charge-section"><div class="charge-section__heading"><h2>Declare targets and measure</h2><span>Select every target included in the physical charge declaration</span></div><div class="charge-targets">' +
          targets + '</div><div class="charge-actions"><button type="button" data-charge-success ' +
          (hasCompleteMeasurements ? '' : 'disabled') +
          '>Charge successful</button><button type="button" data-charge-failed ' +
          (hasCompleteMeasurements ? '' : 'disabled') +
          '>Charge failed</button></div></section>'
        : '',
      '<section class="charge-section"><div class="charge-section__heading"><h2>Charge history</h2><span>',
      model.outcomes.length, ' recorded</span></div><ol class="charge-history">',
      model.outcomes.length
        ? model.outcomes.map(outcomeRow).join('')
        : '<li class="charge-history__empty">No Charge outcomes recorded yet.</li>',
      '</ol></section><footer class="charge-footer"><button type="button" data-charge-complete ',
      model.canComplete ? '' : 'disabled',
      '>End Charge Phase</button></footer></main>'
    ].join('');

    container.querySelectorAll('[data-charge-unit]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedUnitId = button.getAttribute('data-charge-unit');
        selectedTargetIds = new Set();
        measuredDistances = new Map();
        render();
      });
    });

    container.querySelectorAll('[data-charge-target]').forEach((input) => {
      input.addEventListener('change', () => {
        const targetId = input.getAttribute('data-charge-target');
        if (input.checked) selectedTargetIds.add(targetId);
        else {
          selectedTargetIds.delete(targetId);
          measuredDistances.delete(targetId);
        }
        render();
      });
    });

    container.querySelectorAll('[data-charge-distance]').forEach((input) => {
      input.addEventListener('input', () => {
        const targetId = input.getAttribute('data-charge-distance');
        if (input.value === '') measuredDistances.delete(targetId);
        else measuredDistances.set(targetId, Number(input.value));

        const complete = selectedTargetIds.size > 0 &&
          [...selectedTargetIds].every((id) => {
            const value = measuredDistances.get(id);
            return typeof value === 'number' && Number.isFinite(value) && value >= 0;
          });
        container.querySelector('[data-charge-success]')?.toggleAttribute('disabled', !complete);
        container.querySelector('[data-charge-failed]')?.toggleAttribute('disabled', !complete);
      });
    });

    container.querySelector('[data-charge-success]')?.addEventListener('click', () => {
      if (!selectedUnitId || !hasCompleteMeasurements) return;
      recordChargeOutcomeForSession(session, {
        unitId: selectedUnitId,
        succeeded: true,
        targetIds: [...selectedTargetIds],
        measuredDistances: measuredPayload
      });
      selectedUnitId = null;
      selectedTargetIds = new Set();
      measuredDistances = new Map();
      render();
    });

    container.querySelector('[data-charge-failed]')?.addEventListener('click', () => {
      if (!selectedUnitId || !hasCompleteMeasurements) return;
      recordChargeOutcomeForSession(session, {
        unitId: selectedUnitId,
        succeeded: false,
        targetIds: [...selectedTargetIds],
        measuredDistances: measuredPayload
      });
      selectedUnitId = null;
      selectedTargetIds = new Set();
      measuredDistances = new Map();
      render();
    });

    container.querySelector('[data-charge-complete]')?.addEventListener('click', () => {
      finishChargePhase(session);
    });

    return model;
  }

  const unsubscribe = session.subscribe(render);
  render();

  return {
    getState: () => session.getState(),
    render,
    destroy: () => {
      unsubscribe();
      container.replaceChildren();
    }
  };
}
