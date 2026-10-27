import { COMMAND_TYPES } from '../commands/game-commands.js';
import { objectiveAdvisorLabel } from '../rules/objective-display-labels.js';
import { areObjectiveControlsFresh } from '../application/scoring-checkpoint-opportunities.js';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function perspectivePlayers(state, reminder) {
  const players = Array.isArray(state?.players) ? state.players : [];
  const playerId = reminder?.perspectivePlayerId ?? players[0]?.id ?? null;
  const opponentId = players.find((player) => player.id !== playerId)?.id ?? null;
  return { playerId, opponentId };
}

function statusFor(objective, playerId) {
  const control = objective?.control;
  if (!control || control.controlState === 'uncontrolled') return 'uncontrolled';
  if (control.controlState === 'contested') return 'contested';
  return control.controllerId === playerId ? 'mine' : 'opponent';
}

function statusLabel(status) {
  return ({ mine: 'YOU', opponent: 'OPP', contested: 'CONTESTED', uncontrolled: '—' })[status] ?? '—';
}

function payloadForStatus(objectiveId, status, playerId, opponentId) {
  const payload = { objectiveId, controllerId: null, contestingPlayerIds: [], controlState: 'uncontrolled' };
  if (status === 'mine') {
    payload.controlState = 'controlled';
    payload.controllerId = playerId;
  } else if (status === 'opponent') {
    payload.controlState = 'controlled';
    payload.controllerId = opponentId;
  } else if (status === 'contested') {
    payload.controlState = 'contested';
    payload.contestingPlayerIds = [playerId, opponentId].filter(Boolean);
  }
  return payload;
}

function currentPayload(objective, playerId, opponentId) {
  return payloadForStatus(objective.id, statusFor(objective, playerId), playerId, opponentId);
}

function nextStatus(status) {
  return ({ mine: 'opponent', opponent: 'contested', contested: 'uncontrolled', uncontrolled: 'mine' })[status] ?? 'mine';
}

export function renderCheckpointObjectiveConfirmation(state, reminder) {
  if (!reminder?.requiresObjectiveConfirmation || areObjectiveControlsFresh(state)) return '';
  const objectives = Array.isArray(state?.objectives) ? state.objectives : [];
  if (!objectives.length) return '';
  const { playerId } = perspectivePlayers(state, reminder);
  const currentRound = state?.battle?.round ?? 0;
  const currentTurn = state?.turn ?? 0;
  const confirmed = objectives.filter((objective) =>
    objective?.controlRecordedAt?.round === currentRound && objective?.controlRecordedAt?.turn === currentTurn
  ).length;
  const rows = objectives.map((objective) => {
    const status = statusFor(objective, playerId);
    const label = objectiveAdvisorLabel(state, objective.id, playerId);
    return `<button type="button" class="checkpoint-objective-confirmation__objective" data-checkpoint-objective-cycle="${esc(objective.id)}"><strong>${esc(label)}</strong><span>${esc(statusLabel(status))}</span></button>`;
  }).join('');
  return `<section class="checkpoint-objective-confirmation" data-checkpoint-objective-confirmation>
    <h3>Confirm objective control before scoring</h3>
    <p>This scoring opportunity depends on objective control. ${confirmed}/${objectives.length} objective states were confirmed this turn. Tap only anything that changed, or confirm the recorded state unchanged.</p>
    <div class="checkpoint-objective-confirmation__grid">${rows}</div>
    <button type="button" data-confirm-checkpoint-objectives>Confirm recorded objective state</button>
    <small>The physical tabletop remains authoritative. This confirmation updates scoring evidence; it does not move units.</small>
  </section>`;
}

export function bindCheckpointObjectiveConfirmation(container, session, reminder, onError = () => {}) {
  const confirmation = container.querySelector?.('[data-checkpoint-objective-confirmation]');
  if (!confirmation) return;
  confirmation.querySelectorAll?.('[data-checkpoint-objective-cycle]').forEach((button) => button.addEventListener('click', () => {
    try {
      const state = session.getState();
      const objectiveId = button.getAttribute('data-checkpoint-objective-cycle');
      const objective = (state.objectives ?? []).find((item) => item?.id === objectiveId);
      if (!objective) return;
      const { playerId, opponentId } = perspectivePlayers(state, reminder);
      session.dispatch({
        type: COMMAND_TYPES.RECORD_OBJECTIVE_CONTROL,
        payload: payloadForStatus(objectiveId, nextStatus(statusFor(objective, playerId)), playerId, opponentId)
      });
    } catch (error) {
      onError(error?.message ?? String(error));
    }
  }));
  confirmation.querySelector?.('[data-confirm-checkpoint-objectives]')?.addEventListener('click', () => {
    try {
      let state = session.getState();
      const { playerId, opponentId } = perspectivePlayers(state, reminder);
      const objectives = [...(state.objectives ?? [])];
      for (const objective of objectives) {
        state = session.getState();
        const current = (state.objectives ?? []).find((item) => item?.id === objective.id) ?? objective;
        session.dispatch({
          type: COMMAND_TYPES.RECORD_OBJECTIVE_CONTROL,
          payload: currentPayload(current, playerId, opponentId)
        });
      }
    } catch (error) {
      onError(error?.message ?? String(error));
    }
  });
}
