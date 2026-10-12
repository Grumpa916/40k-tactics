import { createEvent } from "../events/event.js";
import { appendHistoryEntry } from "../state/history.js";

/**
 * Records the pre-game attacker/defender relationship and first-player choice.
 * Defender is always derived as the other configured player.
 */
export function setPreGameRoles(state, {
  attackerPlayerId = null,
  firstPlayerId = null
} = {}) {
  if (state.battle && state.battle.status !== "setup") {
    throw new Error("Battle roles are locked after deployment begins.");
  }
  const players = Array.isArray(state.players) ? state.players : [];
  if (players.length !== 2 || players.some((player) => !player?.id)) {
    throw new Error("Configure exactly two players before assigning battle roles.");
  }
  for (const [label, playerId] of [
    ["Attacker", attackerPlayerId],
    ["First player", firstPlayerId]
  ]) {
    if (playerId != null && !players.some((player) => player.id === playerId)) {
      throw new Error(label + " must be one of the two configured players.");
    }
  }
  const defenderPlayerId = attackerPlayerId == null
    ? null
    : players.find((player) => player.id !== attackerPlayerId)?.id ?? null;
  const previous = state.preGameSetup ?? {};
  if (previous.attackerPlayerId === attackerPlayerId &&
      previous.defenderPlayerId === defenderPlayerId &&
      previous.firstPlayerId === firstPlayerId) return state;
  const preGameSetup = { ...previous, attackerPlayerId, defenderPlayerId, firstPlayerId };
  return appendHistoryEntry({
    ...state,
    preGameSetup
  }, createEvent("battle.pre_game_roles_set", {
    attackerPlayerId, defenderPlayerId, firstPlayerId,
    previous: {
      attackerPlayerId: previous.attackerPlayerId ?? null,
      defenderPlayerId: previous.defenderPlayerId ?? null,
      firstPlayerId: previous.firstPlayerId ?? null
    }
  }));
}
