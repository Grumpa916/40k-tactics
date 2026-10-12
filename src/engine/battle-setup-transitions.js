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

/**
 * Records the agreed battle size separately from reusable roster metadata.
 * The currently verified 11th-edition public muster table defines Incursion
 * and Strike Force; other sizes are intentionally not inferred here.
 */
export const BATTLE_SIZE_RULES = Object.freeze({
  incursion: Object.freeze({ id: "incursion", label: "Incursion", pointsLimit: 1000, detachmentPoints: 2, enhancementLimit: 2, unitLimit: 2 }),
  strike_force: Object.freeze({ id: "strike_force", label: "Strike Force", pointsLimit: 2000, detachmentPoints: 3, enhancementLimit: 4, unitLimit: 3 })
});

export function setBattleSize(state, { battleSize = null } = {}) {
  if (state.battle && state.battle.status !== "setup") {
    throw new Error("Battle size is locked after deployment begins.");
  }
  if (battleSize != null && !Object.hasOwn(BATTLE_SIZE_RULES, battleSize)) {
    throw new RangeError("Choose a supported battle size.");
  }
  const previous = state.battleSetup ?? {};
  if ((previous.battleSize ?? null) === battleSize) return state;
  const battleSetup = { ...previous, battleSize };
  return appendHistoryEntry({
    ...state,
    battleSetup
  }, createEvent("battle.size_set", {
    battleSize,
    rules: battleSize ? BATTLE_SIZE_RULES[battleSize] : null,
    previousBattleSize: previous.battleSize ?? null
  }));
}
