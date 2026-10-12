import {
  formatElapsedTime,
  getTurnClockElapsedMs,
  getTurnClockState
} from "../state/turn-clock.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function renderTurnClockPanel(state = {}, {
  open = false,
  message = "",
  nowMs = Date.now()
} = {}) {
  const players = Array.isArray(state.players) ? state.players : [];
  const clock = getTurnClockState(state);
  const activePlayerId = state.activePlayer ?? state.battle?.activePlayerId ?? null;
  const startAllowed = state.battle?.status === "active" && Boolean(activePlayerId);
  const displayPlayerId = clock.activePlayerId ?? activePlayerId;
  const rows = players.map((player) => {
    const elapsed = getTurnClockElapsedMs(state, player.id, nowMs);
    const isClockOwner = clock.activePlayerId === player.id;
    const status = isClockOwner && clock.running
      ? "Clock running" : isClockOwner && elapsed > 0 ? "Paused" : "Not active";
    return '<li class="battle-shell__clock-player' + (isClockOwner ? ' is-clock-owner' : '') + '">' +
      '<div><strong>' + escapeHtml(player.name ?? player.id) + '</strong><small>' + status + '</small></div>' +
      '<time data-clock-player-elapsed="' + escapeHtml(player.id) + '">' + formatElapsedTime(elapsed) + '</time></li>';
  }).join("");
  const action = clock.running
    ? '<button type="button" data-turn-clock-action="pause">Pause clock</button>'
    : '<button type="button" data-turn-clock-action="start"' + (startAllowed ? '' : ' disabled') + '>' +
      (Object.values(clock.elapsedMsByPlayer).some((value) => value > 0) ? 'Resume clock' : 'Start clock') +
      '</button>';
  const activeName = players.find((player) => player.id === displayPlayerId)?.name ?? displayPlayerId;
  const runningNote = clock.running
    ? 'Running for ' + escapeHtml(activeName ?? "the active player") + '. Phase changes do not reset the clock.'
    : startAllowed
      ? 'Clock is paused. Start or resume it for the current player.'
      : 'The clock can be started after the first player turn begins.';
  return '<section id="battle-turn-clock-panel" class="battle-shell__clock-panel" data-turn-clock-panel role="region" aria-label="Turn Clock"' +
    (open ? '' : ' hidden') + '><header class="battle-shell__clock-header"><div><h2>Turn Clock</h2>' +
    '<p>' + runningNote + '</p></div><button type="button" data-close-turn-clock aria-label="Close Turn Clock">Close</button></header>' +
    (rows ? '<ul class="battle-shell__clock-list">' + rows + '</ul>' : '<p>Add both players before using the Turn Clock.</p>') +
    (message ? '<p role="status" class="battle-shell__clock-message">' + escapeHtml(message) + '</p>' : '') +
    '<div class="battle-shell__clock-actions">' + action + '</div>' +
    '<p class="battle-shell__clock-note">Each player’s elapsed time is accumulated separately and saved with the battle. The clock switches when the player turn changes, not when the phase changes.</p></section>';
}
