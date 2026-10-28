import {
  getPrimaryStrategyContext as getBasePrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal as getBasePrimaryObjectiveStrategySignal
} from "./tactical-primary-strategy.js";
import { isConsecrateMissionForPlayer } from "./consecrate-state.js";
import {
  getConsecratePrimaryStrategyContext,
  getConsecrateObjectiveStrategySignal
} from "./tactical-consecrate-strategy.js";
import {
  getBattlefieldDominancePrimaryStrategyContext,
  getBattlefieldDominanceObjectiveStrategySignal,
  isBattlefieldDominanceMissionForPlayer
} from "./tactical-battlefield-dominance-strategy.js";

export function getPrimaryStrategyContext(state, options = {}) {
  const playerId = options.playerId;
  if (playerId && isBattlefieldDominanceMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getBattlefieldDominancePrimaryStrategyContext(state, options);
  }
  if (playerId && isConsecrateMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getConsecratePrimaryStrategyContext(state, options);
  }
  return getBasePrimaryStrategyContext(state, options);
}

export function getPrimaryObjectiveStrategySignal(state, options = {}) {
  const playerId = options.playerId;
  if (playerId && isBattlefieldDominanceMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getBattlefieldDominanceObjectiveStrategySignal(state, options);
  }
  if (playerId && isConsecrateMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getConsecrateObjectiveStrategySignal(state, options);
  }
  return getBasePrimaryObjectiveStrategySignal(state, options);
}
