import { COMMAND_TYPES } from '../commands/game-commands.js';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

export const MAP_OBJECTIVE_CONTROL_CHOICES = Object.freeze([
  Object.freeze({ id: 'mine', label: 'You', description: 'Controlled by you' }),
  Object.freeze({ id: 'opponent', label: 'Opponent', description: 'Controlled by opponent' }),
  Object.freeze({ id: 'contested', label: 'Contested', description: 'Neither side controls' }),
  Object.freeze({ id: 'uncontrolled', label: 'Uncontrolled', description: 'Not controlled' })
]);

function playerIds(state, perspectivePlayerId) {
  const players = Array.isArray(state?.players) ? state.players.map(player => player.id).filter(Boolean) : [];
  const mine = perspectivePlayerId ?? players[0] ?? state?.activePlayer ?? null;
  const opponent = players.find(id => id !== mine) ?? null;
  return { mine, opponent, players };
}

export function selectedMapObjectiveControl(state, objectiveId, perspectivePlayerId = null) {
  const objective = (state?.objectives ?? []).find(item => item?.id === objectiveId);
  if (!objective) return null;
  const { mine } = playerIds(state, perspectivePlayerId);
  const control = objective.control;
  if (control?.controlState === 'contested') return 'contested';
  if (control?.controlState === 'controlled') {
    return control.controllerId === mine ? 'mine' : 'opponent';
  }
  return 'uncontrolled';
}

export function nextMapObjectiveControl(state, objectiveId, perspectivePlayerId = null) {
  const current = selectedMapObjectiveControl(state, objectiveId, perspectivePlayerId);
  if (current === null) return null;
  const choices = MAP_OBJECTIVE_CONTROL_CHOICES.map(choice => choice.id);
  return choices[(choices.indexOf(current) + 1) % choices.length];
}

/** All map control edits go through the normal event-sourced battle command. */
export function mapObjectiveControlCommand(state, { objectiveId, choice, perspectivePlayerId = null } = {}) {
  if (!objectiveId || !(state?.objectives ?? []).some(item => item?.id === objectiveId)) {
    throw new Error('The selected objective is not in this battle.');
  }
  if (!MAP_OBJECTIVE_CONTROL_CHOICES.some(item => item.id === choice)) {
    throw new RangeError('Choose a valid objective-control state.');
  }
  const { mine, opponent, players } = playerIds(state, perspectivePlayerId);
  const payload = { objectiveId, controllerId: null, contestingPlayerIds: [], controlState: 'uncontrolled' };
  if (choice === 'mine' || choice === 'opponent') {
    const controllerId = choice === 'mine' ? mine : opponent;
    if (!controllerId) throw new Error('Both players must be configured to record control.');
    payload.controllerId = controllerId;
    payload.controlState = 'controlled';
  } else if (choice === 'contested') {
    if (players.length < 2) throw new Error('Both players must be configured to record a contested objective.');
    payload.controlState = 'contested';
    payload.contestingPlayerIds = players;
  }
  return { type: COMMAND_TYPES.RECORD_OBJECTIVE_CONTROL, payload };
}

export function renderMapObjectiveControlPicker(state, { objectiveId, label, perspectivePlayerId = null } = {}) {
  const current = selectedMapObjectiveControl(state, objectiveId, perspectivePlayerId);
  if (current === null) return '';
  const { mine, opponent } = playerIds(state, perspectivePlayerId);
  const options = MAP_OBJECTIVE_CONTROL_CHOICES.map(option => {
    const available = option.id === 'mine' ? Boolean(mine) : option.id === 'opponent' || option.id === 'contested'
      ? Boolean(opponent) : true;
    return '<button type="button" class="live-map__objective-choice is-' + esc(option.id) + '" data-map-objective-control-choice="' +
      esc(option.id) + '" aria-pressed="' + (current === option.id) + '" aria-label="' +
      esc(option.description) + '"' + (available ? '' : ' disabled') + '>' + esc(option.label) + '</button>';
  }).join('');
  return '<div class="live-map__objective-picker-heading"><strong>' + esc(label || objectiveId) +
    '</strong><button type="button" data-map-objective-control-close aria-label="Close objective control choices">×</button></div>' +
    '<small>Set objective control</small><div class="live-map__objective-choices">' + options + '</div>' +
    '<small>Records tabletop control; does not award VP.</small><small role="alert" data-map-objective-control-error></small>';
}
