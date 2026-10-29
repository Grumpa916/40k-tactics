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
import {
  getImmovableObjectPrimaryStrategyContext,
  getImmovableObjectObjectiveStrategySignal,
  isImmovableObjectMissionForPlayer
} from "./tactical-immovable-object-strategy.js";
import {
  getDeterminedAcquisitionPrimaryStrategyContext,
  getDeterminedAcquisitionObjectiveStrategySignal,
  isDeterminedAcquisitionMissionForPlayer
} from "./tactical-determined-acquisition-strategy.js";
import {
  getPurgeAndSecurePrimaryStrategyContext,
  getPurgeAndSecureObjectiveStrategySignal,
  isPurgeAndSecureMissionForPlayer
} from "./tactical-purge-and-secure-strategy.js";
import {
  getInescapableDominionPrimaryStrategyContext,
  getInescapableDominionObjectiveStrategySignal,
  isInescapableDominionMissionForPlayer
} from "./tactical-inescapable-dominion-strategy.js";
import {
  getDeathTrapPrimaryStrategyContext,
  getDeathTrapObjectiveStrategySignal,
  isDeathTrapMissionForPlayer
} from "./tactical-death-trap-strategy.js";

export function getPrimaryStrategyContext(state, options = {}) {
  const playerId = options.playerId;
  if (playerId && isBattlefieldDominanceMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getBattlefieldDominancePrimaryStrategyContext(state, options);
  }
  if (playerId && isImmovableObjectMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getImmovableObjectPrimaryStrategyContext(state, options);
  }
  if (playerId && isDeterminedAcquisitionMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getDeterminedAcquisitionPrimaryStrategyContext(state, options);
  }
  if (playerId && isPurgeAndSecureMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getPurgeAndSecurePrimaryStrategyContext(state, options);
  }
  if (playerId && isInescapableDominionMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getInescapableDominionPrimaryStrategyContext(state, options);
  }
  if (playerId && isDeathTrapMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getDeathTrapPrimaryStrategyContext(state, options);
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
  if (playerId && isImmovableObjectMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getImmovableObjectObjectiveStrategySignal(state, options);
  }
  if (playerId && isDeterminedAcquisitionMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getDeterminedAcquisitionObjectiveStrategySignal(state, options);
  }
  if (playerId && isPurgeAndSecureMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getPurgeAndSecureObjectiveStrategySignal(state, options);
  }
  if (playerId && isInescapableDominionMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getInescapableDominionObjectiveStrategySignal(state, options);
  }
  if (playerId && isDeathTrapMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getDeathTrapObjectiveStrategySignal(state, options);
  }
  if (playerId && isConsecrateMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getConsecrateObjectiveStrategySignal(state, options);
  }
  return getBasePrimaryObjectiveStrategySignal(state, options);
}
