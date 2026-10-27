import { COMMAND_TYPES } from "../commands/game-commands.js";
import { getConsecrateReviewState } from "../rules/consecrate-state.js";
import { getLiveUnitPosition } from "../rules/spatial-context.js";

const escapeHtml = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function objectiveLabel(objective) {
  const layout = objective?.layoutObjective;
  if (layout) return String(layout);
  const id = String(objective?.id ?? "Objective");
  return id.startsWith("event-companion:") ? id.slice("event-companion:".length) : String(objective?.name ?? id);
}

function approximateDistance(state, unit, objective) {
  const from = getLiveUnitPosition(state, unit);
  const to = objective?.position;
  if (!Number.isFinite(from?.x) || !Number.isFinite(from?.y) || !Number.isFinite(to?.x) || !Number.isFinite(to?.y)) return null;
  return Math.round(Math.hypot(to.x - from.x, to.y - from.y));
}

function objectiveOptions(state, unit, objectives) {
  return [...objectives]
    .map((objective) => ({ objective, distance: approximateDistance(state, unit, objective) }))
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    .map(({ objective, distance }) =>
      '<option value="' + escapeHtml(objective.id) + '">' + escapeHtml(objectiveLabel(objective)) +
      (distance == null ? '' : ' · map ≈' + distance + '"') + '</option>'
    ).join("");
}

export function renderConsecrateReviewSection(state) {
  const review = getConsecrateReviewState(state);
  if (!review.required) return "";
  const rows = review.deployedConsecrationUnits.map((unit) =>
    '<label class="battle-consecrate-review__row"><span><strong>' + escapeHtml(unit.name ?? unit.id) +
    '</strong><small>Remains a consecration unit until it actually marks an objective.</small></span>' +
    '<select data-consecrate-objective-select data-consecrate-unit-id="' + escapeHtml(unit.id) + '">' +
    '<option value="">No consecration this turn</option>' + objectiveOptions(state, unit, review.availableObjectives) +
    '</select></label>'
  ).join("");
  const nextTier = review.consecratedCount === 0
    ? 'The first consecrated objective establishes the 3 VP end-of-turn tier.'
    : review.consecratedCount === 1
      ? 'A second objective keeps the same 3 VP tier; the third raises it to 6 VP.'
      : review.consecratedCount === 2
        ? 'A third consecrated objective raises the end-of-turn tier from 3 VP to 6 VP.'
        : 'Three or more objectives are already in the 6 VP end-of-turn tier.';
  return '<section class="battle-consecrate-review"><h3>Consecrate objectives</h3>' +
    '<p>' + review.deployedConsecrationUnits.length + ' deployed consecration unit' +
    (review.deployedConsecrationUnits.length === 1 ? '' : 's') + ' can be reviewed. ' +
    review.consecratedCount + ' objective' + (review.consecratedCount === 1 ? ' is' : 's are') +
    ' already consecrated. ' + escapeHtml(nextTier) + '</p>' +
    '<p><strong>Use the physical tabletop for range.</strong> Map distances below are approximate and never determine legality.</p>' +
    '<form data-consecrate-review-form>' + rows +
    '<label class="battle-consecrate-review__confirm"><input type="checkbox" data-consecrate-table-confirmed> I confirmed every selected unit is within range of its chosen objective on the tabletop.</label>' +
    '<p role="alert" data-consecrate-review-error></p>' +
    '<button type="submit">Record Consecrate review</button></form>' +
    '<p><small>After recording a selection, place an operation marker within range of each chosen objective. A unit you leave unassigned remains a consecration unit for a later turn.</small></p></section>';
}

export function bindConsecrateReview(container, session, onError = () => {}) {
  const form = container?.querySelector?.('[data-consecrate-review-form]');
  if (!form || !session?.dispatch) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const assignments = [];
    const objectiveIds = new Set();
    for (const select of form.querySelectorAll?.('[data-consecrate-objective-select]') ?? []) {
      const objectiveId = String(select.value ?? '').trim();
      if (!objectiveId) continue;
      const unitId = select.getAttribute('data-consecrate-unit-id');
      if (objectiveIds.has(objectiveId)) {
        const message = 'Choose a different objective for each consecration unit.';
        const errorNode = form.querySelector?.('[data-consecrate-review-error]');
        if (errorNode) errorNode.textContent = message;
        onError(message);
        return;
      }
      objectiveIds.add(objectiveId);
      assignments.push({ unitId, objectiveId });
    }
    const confirmed = form.querySelector?.('[data-consecrate-table-confirmed]')?.checked === true;
    if (assignments.length > 0 && !confirmed) {
      const message = 'Confirm tabletop range before recording selected objectives.';
      const errorNode = form.querySelector?.('[data-consecrate-review-error]');
      if (errorNode) errorNode.textContent = message;
      onError(message);
      return;
    }
    try {
      const state = session.getState();
      session.dispatch({
        type: COMMAND_TYPES.RECORD_CONSECRATE_REVIEW,
        payload: {
          playerId: state.activePlayer ?? state.battle?.activePlayerId ?? null,
          assignments,
          tabletopConfirmed: confirmed
        }
      });
    } catch (error) {
      const message = error?.message ?? String(error);
      const errorNode = form.querySelector?.('[data-consecrate-review-error]');
      if (errorNode) errorNode.textContent = message;
      onError(message);
    }
  });
}
