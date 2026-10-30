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
import {
  getDelayingActionPrimaryStrategyContext,
  getDelayingActionObjectiveStrategySignal,
  isDelayingActionMissionForPlayer
} from "./tactical-delaying-action-strategy.js";
import {
  getOutmanoeuvrePrimaryStrategyContext,
  getOutmanoeuvreObjectiveStrategySignal,
  isOutmanoeuvreMissionForPlayer
} from "./tactical-outmanoeuvre-strategy.js";
import {
  getSmokeAndMirrorsPrimaryStrategyContext,
  getSmokeAndMirrorsObjectiveStrategySignal
} from "./tactical-smoke-and-mirrors-strategy.js";
import { isSmokeAndMirrorsMissionForPlayer } from "./smoke-and-mirrors-state.js";
import {
  getLocateAndDenyPrimaryStrategyContext,
  getLocateAndDenyObjectiveStrategySignal,
  isLocateAndDenyMissionForPlayer
} from "./tactical-locate-and-deny-strategy.js";
import {
  getReconnaissanceSweepPrimaryStrategyContext,
  getReconnaissanceSweepObjectiveStrategySignal,
  isReconnaissanceSweepMissionForPlayer
} from "./tactical-reconnaissance-sweep-strategy.js";
import {
  getTriangulationPrimaryStrategyContext,
  getTriangulationObjectiveStrategySignal,
  isTriangulationMissionForPlayer
} from "./tactical-triangulation-strategy.js";
import {
  getSurveilTheFoePrimaryStrategyContext,
  getSurveilTheFoeObjectiveStrategySignal,
  isSurveilTheFoeMissionForPlayer
} from "./tactical-surveil-the-foe-strategy.js";
import {
  getGatherIntelPrimaryStrategyContext,
  getGatherIntelObjectiveStrategySignal
} from "./tactical-gather-intel-strategy.js";
import { isGatherIntelMissionForPlayer } from "./gather-intel-state.js";
import {
  getVitalLinkPrimaryStrategyContext,
  getVitalLinkObjectiveStrategySignal,
  isVitalLinkMissionForPlayer
} from "./tactical-vital-link-strategy.js";
import {
  getSearchAndScourPrimaryStrategyContext,
  getSearchAndScourObjectiveStrategySignal,
  isSearchAndScourMissionForPlayer
} from "./tactical-search-and-scour-strategy.js";
import { isSecureAssetMissionForPlayer } from "./secure-asset-state.js";
import { getSecureAssetPrimaryStrategyContext, getSecureAssetObjectiveStrategySignal } from "./tactical-secure-asset-strategy.js";

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
  if (playerId && isDelayingActionMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getDelayingActionPrimaryStrategyContext(state, options);
  }
  if (playerId && isOutmanoeuvreMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getOutmanoeuvrePrimaryStrategyContext(state, options);
  }
  if (playerId && isSmokeAndMirrorsMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSmokeAndMirrorsPrimaryStrategyContext(state, options);
  }
  if (playerId && isLocateAndDenyMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getLocateAndDenyPrimaryStrategyContext(state, options);
  }
  if (playerId && isReconnaissanceSweepMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getReconnaissanceSweepPrimaryStrategyContext(state, options);
  }
  if (playerId && isTriangulationMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getTriangulationPrimaryStrategyContext(state, options);
  }
  if (playerId && isSurveilTheFoeMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSurveilTheFoePrimaryStrategyContext(state, options);
  }
  if (playerId && isGatherIntelMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getGatherIntelPrimaryStrategyContext(state, options);
  }
  if (playerId && isVitalLinkMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getVitalLinkPrimaryStrategyContext(state, options);
  }
  if (playerId && isSearchAndScourMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSearchAndScourPrimaryStrategyContext(state, options);
  }
  if (playerId && isSecureAssetMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSecureAssetPrimaryStrategyContext(state, options);
  }
  if (playerId && isSecureAssetMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSecureAssetPrimaryStrategyContext(state, options);
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
  if (playerId && isDelayingActionMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getDelayingActionObjectiveStrategySignal(state, options);
  }
  if (playerId && isOutmanoeuvreMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getOutmanoeuvreObjectiveStrategySignal(state, options);
  }
  if (playerId && isSmokeAndMirrorsMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSmokeAndMirrorsObjectiveStrategySignal(state, options);
  }
  if (playerId && isLocateAndDenyMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getLocateAndDenyObjectiveStrategySignal(state, options);
  }
  if (playerId && isReconnaissanceSweepMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getReconnaissanceSweepObjectiveStrategySignal(state, options);
  }
  if (playerId && isTriangulationMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getTriangulationObjectiveStrategySignal(state, options);
  }
  if (playerId && isSurveilTheFoeMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSurveilTheFoeObjectiveStrategySignal(state, options);
  }
  if (playerId && isGatherIntelMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getGatherIntelObjectiveStrategySignal(state, options);
  }
  if (playerId && isVitalLinkMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getVitalLinkObjectiveStrategySignal(state, options);
  }
  if (playerId && isSearchAndScourMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSearchAndScourObjectiveStrategySignal(state, options);
  }
  if (playerId && isSecureAssetMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getSecureAssetObjectiveStrategySignal(state, options);
  }
  if (playerId && isConsecrateMissionForPlayer(state, playerId, options.perspectivePlayerId ?? undefined)) {
    return getConsecrateObjectiveStrategySignal(state, options);
  }
  return getBasePrimaryObjectiveStrategySignal(state, options);
}
