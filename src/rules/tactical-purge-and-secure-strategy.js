import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import {
  getEnemyUnitDestructionsForTurn,
  getTurnSnapshot,
  getUnitStateAtTurnStart
} from "./scoring-evidence-state.js";
import { clamp01 } from "./tactical-context-utils.js";

const OBJECTIVE_RANGE = 3;

function players(state) {
  return Array.isArray(state?.players) ? state.players : [];
}

function defaultPerspectivePlayerId(state) {
  return players(state)[0]?.id ?? state?.activePlayer ?? state?.battle?.activePlayerId ?? null;
}

function missionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  const setup = state?.battlefieldMap?.missionSetup;
  if (!playerId || !setup?.myDisposition || !setup?.opponentDisposition) return null;
  const definitions = getBattlePrimaryMissionDefinitions(setup.myDisposition, setup.opponentDisposition);
  if (!definitions) return null;
  return playerId === perspectivePlayerId ? definitions.myMission : definitions.opponentMission;
}

export function isPurgeAndSecureMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-purge-and-secure";
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function finitePosition(position) {
  return Number.isFinite(position?.x) && Number.isFinite(position?.y);
}

function nearestObjectiveDistance(state, position) {
  if (!finitePosition(position)) return null;
  let nearest = null;
  for (const objective of Array.isArray(state?.objectives) ? state.objectives : []) {
    if (!finitePosition(objective?.position)) continue;
    const distance = Math.hypot(objective.position.x - position.x, objective.position.y - position.y);
    if (nearest == null || distance < nearest) nearest = distance;
  }
  return nearest;
}

function objectiveRangeEvidence(state, position) {
  const distance = nearestObjectiveDistance(state, position);
  return Object.freeze({
    known: Number.isFinite(distance),
    approximateDistance: distance,
    withinApproximateRange: Number.isFinite(distance) ? distance <= OBJECTIVE_RANGE : null
  });
}

function objectiveSnapshot(state, playerId, perspectivePlayerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const known = all.length > 0 && all.every((objective) => objective?.control != null);
  const homeObjectives = all.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const playerHomeObjectiveIds = Object.freeze(homeObjectives.map((objective) => objective.id));
  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown: homeObjectives.length > 0,
      playerHomeObjectiveIds,
      controlled: 0,
      controlledIds: Object.freeze([]),
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([])
    });
  }
  const controlled = all.filter((objective) => controlledBy(objective.control, playerId));
  const nonHomeControlled = controlled.filter((objective) => !playerHomeObjectiveIds.includes(objective.id));
  return Object.freeze({
    known: true,
    homeRoleKnown: homeObjectives.length > 0,
    playerHomeObjectiveIds,
    controlled: controlled.length,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlled: nonHomeControlled.length,
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id))
  });
}

function acquisitionSnapshot(state, playerId, perspectivePlayerId) {
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const relevant = all.filter((objective) => !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const snapshot = getTurnSnapshot(state, turn);
  if (!snapshot) {
    return Object.freeze({ known: false, turn, eligibleObjectiveIds: Object.freeze([]), newlyControlledObjectiveIds: Object.freeze([]), startControlledObjectiveIds: Object.freeze([]) });
  }
  const startById = new Map((snapshot.objectives ?? []).map((objective) => [objective.id, objective]));
  if (!relevant.every((objective) => startById.has(objective.id) && startById.get(objective.id)?.control != null)) {
    return Object.freeze({ known: false, turn, eligibleObjectiveIds: Object.freeze([]), newlyControlledObjectiveIds: Object.freeze([]), startControlledObjectiveIds: Object.freeze([]) });
  }
  const startControlled = relevant.filter((objective) => controlledBy(startById.get(objective.id).control, playerId));
  const eligible = relevant.filter((objective) => !controlledBy(startById.get(objective.id).control, playerId));
  const newlyControlled = eligible.filter((objective) => controlledBy(objective.control, playerId));
  return Object.freeze({
    known: true,
    turn,
    eligibleObjectiveIds: Object.freeze(eligible.map((objective) => objective.id)),
    newlyControlledObjectiveIds: Object.freeze(newlyControlled.map((objective) => objective.id)),
    startControlledObjectiveIds: Object.freeze(startControlled.map((objective) => objective.id))
  });
}

function killSnapshot(state, playerId, turn) {
  const kills = getEnemyUnitDestructionsForTurn(state, playerId, turn);
  const mapSupported = [];
  const unresolved = [];
  for (const kill of kills) {
    const start = getUnitStateAtTurnStart(state, kill.unitId, turn);
    const targetRange = objectiveRangeEvidence(state, start?.position);
    if (targetRange.withinApproximateRange === true) {
      mapSupported.push(Object.freeze({ ...kill, targetStartObjectiveRange: targetRange }));
    } else {
      unresolved.push(Object.freeze({ ...kill, targetStartObjectiveRange: targetRange }));
    }
  }
  return Object.freeze({
    kills: Object.freeze(kills),
    mapSupportedQualifyingKills: Object.freeze(mapSupported),
    unresolvedKills: Object.freeze(unresolved),
    mapSupportedSatisfied: mapSupported.length > 0
  });
}

function targetKillOpportunity(state, { playerId, targetUnitId, attackerId, turn, killSatisfied }) {
  if (!targetUnitId) {
    return Object.freeze({ active: false, targetStartedNearObjective: null, attackerNearObjective: null, qualifiesOnApproximateMap: false, vpLeverage: 0 });
  }
  const targetStart = getUnitStateAtTurnStart(state, targetUnitId, turn);
  const targetRange = objectiveRangeEvidence(state, targetStart?.position);
  const attacker = (Array.isArray(state?.units) ? state.units : []).find((unit) => unit?.id === attackerId) ?? null;
  const attackerRange = objectiveRangeEvidence(state, attacker?.position);
  const qualifies = targetRange.withinApproximateRange === true || attackerRange.withinApproximateRange === true;
  return Object.freeze({
    active: true,
    targetStartedNearObjective: targetRange.withinApproximateRange,
    targetStartApproximateDistance: targetRange.approximateDistance,
    attackerNearObjective: attackerRange.withinApproximateRange,
    attackerApproximateDistance: attackerRange.approximateDistance,
    qualifiesOnApproximateMap: qualifies,
    vpLeverage: !killSatisfied && qualifies ? 3 : 0
  });
}

function timingSummary(round) {
  if (round === 1) return "Round 1: Purge and Secure can score the 3 VP objective-linked destruction condition at end of turn; objective-control and new-capture scoring begin in Round 2.";
  if (round < 5) return `Round ${round}: controlled non-home objectives score 4 VP each at the Command checkpoint; at end of turn, one objective-linked destruction can score 3 VP and taking at least one new non-home objective can score 3 VP.`;
  return "Round 5: non-home objective control moves to end of turn, alongside the 3 VP new-capture and objective-linked destruction conditions, so movement and combat can directly change every Purge and Secure scoring component this turn.";
}

export function getPurgeAndSecurePrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null,
  attackerId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isPurgeAndSecureMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Purge and Secure strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const acquisition = acquisitionSnapshot(state, playerId, perspectivePlayerId);
  const kills = killSnapshot(state, playerId, turn);
  const killOpportunity = targetKillOpportunity(state, { playerId, targetUnitId, attackerId, turn, killSatisfied: kills.mapSupportedSatisfied });
  const controlScoringActive = round >= 2;
  const controlVp = controlScoringActive && objectives.known ? objectives.nonHomeControlled * 4 : 0;
  const acquisitionSatisfied = controlScoringActive && acquisition.known && acquisition.newlyControlledObjectiveIds.length > 0;
  const acquisitionVp = acquisitionSatisfied ? 3 : 0;
  const killVp = kills.mapSupportedSatisfied ? 3 : 0;
  const rawRecordedVp = controlVp + acquisitionVp + killVp;
  const cappedRecordedVp = Math.min(15, rawRecordedVp);
  const nextKillVpLeverage = killOpportunity.vpLeverage;
  const targetingScore = nextKillVpLeverage > 0 ? 0.84 : kills.mapSupportedSatisfied ? 0.06 : 0.12;

  let objectivePreservationScore = !objectives.known ? 0.34 : round < 2 ? 0.4 : objectives.nonHomeControlled === 0 ? 0.84 : objectives.nonHomeControlled === 1 ? 0.9 : 0.76;
  if (acquisitionSatisfied) objectivePreservationScore = Math.max(objectivePreservationScore, 0.92);
  if (round === 5) objectivePreservationScore = Math.max(objectivePreservationScore, 0.95);

  const controlProgress = !controlScoringActive
    ? "The 4 VP-per-non-home-objective control condition begins in Round 2."
    : !objectives.known
      ? "Objective control is incomplete; confirm controllers before relying on the 4 VP non-home calculation."
      : `${objectives.nonHomeControlled} non-home objective${objectives.nonHomeControlled === 1 ? " is" : "s are"} currently controlled, representing ${controlVp} VP at the applicable control checkpoint before the round cap.`;
  const acquisitionProgress = !controlScoringActive
    ? "The 3 VP new non-home capture condition begins in Round 2."
    : !acquisition.known
      ? "Turn-start control is incomplete; confirm which non-home objectives were not controlled at the start of this turn before relying on the 3 VP capture condition."
      : acquisitionSatisfied
        ? `${acquisition.newlyControlledObjectiveIds.length} newly controlled non-home objective${acquisition.newlyControlledObjectiveIds.length === 1 ? " currently satisfies" : "s currently satisfy"} the single 3 VP end-of-turn capture condition.`
        : "No newly controlled non-home objective is recorded yet; taking at least one eligible non-home objective can satisfy the single 3 VP end-of-turn capture condition.";
  const killProgress = kills.mapSupportedSatisfied
    ? `${kills.mapSupportedQualifyingKills.length} recorded enemy destruction${kills.mapSupportedQualifyingKills.length === 1 ? " has" : "s have"} turn-start map position within about 3\" of an objective; this supports the single 3 VP destruction condition, subject to tabletop confirmation.`
    : kills.kills.length > 0
      ? `${kills.kills.length} enemy destruction${kills.kills.length === 1 ? " is" : "s are"} recorded this turn, but the saved evidence does not yet establish the mission's objective-position requirement. Confirm the killer/target positioning on the tabletop.`
      : "No enemy destruction is recorded this turn. The first qualifying objective-linked destruction can score 3 VP at end of turn.";

  let reason;
  if (nextKillVpLeverage > 0) {
    reason = "This target has map-supported Purge and Secure kill eligibility: either it began the turn near an objective or the selected attacker is currently near one. A successful destruction can be worth 3 Primary VP, but confirm actual objective range on the tabletop.";
  } else if (round >= 2 && objectives.known && objectives.nonHomeControlled === 0) {
    reason = "No non-home objective is currently controlled. Establishing one is the highest-confidence Purge and Secure scoring need because each is worth 4 VP at the applicable checkpoint and a new capture can also satisfy the 3 VP end-of-turn condition.";
  } else if (round >= 2 && acquisition.known && !acquisitionSatisfied && acquisition.eligibleObjectiveIds.length > 0) {
    reason = "The 3 VP new-capture condition is still open. Taking one eligible non-home objective adds that end-of-turn condition while improving non-home control scoring.";
  } else if (!kills.mapSupportedSatisfied) {
    reason = "The 3 VP destruction condition is still open, but ordinary kills do not receive a Purge and Secure premium unless the objective-position requirement is supported and confirmed.";
  } else {
    reason = "Recorded Purge and Secure conditions are favorable. Preserve non-home control and avoid abandoning scoring positions for kills that do not improve the mission state.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Take and Hold",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn,
    targetUnitId,
    attackerId,
    objectiveStateKnown: objectives.known,
    homeRoleKnown: objectives.homeRoleKnown,
    playerHomeObjectiveIds: objectives.playerHomeObjectiveIds,
    controlledObjectives: objectives.controlled,
    controlledObjectiveIds: objectives.controlledIds,
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledObjectiveIds: objectives.nonHomeControlledIds,
    turnStartKnown: acquisition.known,
    acquisitionEligibleObjectiveIds: acquisition.eligibleObjectiveIds,
    newlyControlledObjectiveIds: acquisition.newlyControlledObjectiveIds,
    startControlledObjectiveIds: acquisition.startControlledObjectiveIds,
    acquisitionSatisfied,
    controlScoringActive,
    controlCheckpointTiming: round >= 5 ? "end-of-turn" : round >= 2 ? "end-of-command" : null,
    controlVp,
    acquisitionVp,
    enemyKillsThisTurn: kills.kills.length,
    mapSupportedQualifyingKillCount: kills.mapSupportedQualifyingKills.length,
    mapSupportedKillSatisfied: kills.mapSupportedSatisfied,
    killVp,
    killOpportunity,
    nextKillVpLeverage,
    targetingScore,
    objectivePreservationScore,
    rawRecordedVp,
    cappedRecordedVp,
    protectCheapUnits: false,
    summary: Object.freeze([
      timingSummary(round),
      controlProgress,
      acquisitionProgress,
      killProgress,
      `Recorded/map-supported conditions currently represent up to ${cappedRecordedVp}/15 Primary VP for the round before timing and tabletop confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Objective control comes from recorded tabletop confirmation; approximate unit position does not determine control.",
      "Turn-start objective control must be explicitly recorded for every relevant non-home objective before the 3 VP new-capture condition is treated as known.",
      "The objective-linked destruction condition scores 3 VP once per turn even if both positioning alternatives or multiple kills qualify.",
      "Approximate map distance can identify a likely objective-linked kill opportunity, but the tabletop measurement is authoritative and VP is never awarded automatically.",
      "For a destroyed target, its saved turn-start position can support the target-position branch. Current attacker position is used only for target prioritization because the combat event does not preserve exact attacker position at the moment of destruction.",
      "In Rounds 2–4, movement after the Command phase does not retroactively change a completed control checkpoint; new non-home control can still satisfy the end-of-turn capture condition and prepare the next checkpoint.",
      "The 15 VP per-round Primary cap is applied to the outlook."
    ])
  });
}

export function getPurgeAndSecureObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getPurgeAndSecurePrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const controlledNow = control === "controlled" || controlledBy(objective.control, playerId);
  const ownHome = context.playerHomeObjectiveIds.includes(objectiveId) || isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId);
  if (ownHome) {
    return Object.freeze({
      active: true,
      missionName: context.missionName,
      objectiveId,
      ownHome: true,
      controlledNow,
      acquisitionEligible: false,
      acquisitionAlreadySecured: false,
      checkpointVpLeverage: 0,
      acquisitionVpLeverage: 0,
      vpLeverage: 0,
      score: purpose === "hold-objective" ? 0.03 : 0.01,
      reason: "Your home objective is excluded from both Purge and Secure objective-scoring conditions, so it receives no direct mission VP elevation."
    });
  }

  const round = context.round;
  const startedControlled = context.startControlledObjectiveIds.includes(objectiveId);
  const acquisitionEligible = round >= 2 && context.turnStartKnown && context.acquisitionEligibleObjectiveIds.includes(objectiveId);
  const acquisitionAlreadySecured = acquisitionEligible && controlledNow;
  const otherNewlyControlled = context.newlyControlledObjectiveIds.some((id) => id !== objectiveId);
  const acquisitionIncremental = acquisitionEligible && (!context.acquisitionSatisfied || acquisitionAlreadySecured && !otherNewlyControlled);
  const checkpointVpLeverage = round >= 2 ? 4 : 0;
  const acquisitionVpLeverage = acquisitionIncremental ? 3 : 0;
  const vpLeverage = checkpointVpLeverage + acquisitionVpLeverage;
  let score = round >= 2 ? 0.34 : 0.12;
  if (controlledNow) score += 0.18;
  if (acquisitionEligible && !controlledNow && !context.acquisitionSatisfied) score += 0.28;
  if (acquisitionAlreadySecured && acquisitionVpLeverage > 0) score += 0.24;
  if (round === 5 && vpLeverage >= 7) score += 0.12;
  score = clamp01(score);

  const timing = round === 5
    ? "Round 5 resolves both the 4 VP control value and the 3 VP new-capture condition at end of turn."
    : round >= 2
      ? "The 4 VP control value applies at the Command checkpoint, while the 3 VP new-capture condition resolves at end of turn."
      : "Round 1 has no direct Purge and Secure objective-control scoring.";
  let reason = timing;
  if (round >= 2 && acquisitionEligible && !context.acquisitionSatisfied && !controlledNow) {
    reason += " You did not control this non-home objective at turn start; taking it can satisfy the single 3 VP new-capture condition.";
  } else if (acquisitionAlreadySecured && acquisitionVpLeverage > 0) {
    reason += " This objective currently carries the single 3 VP new-capture condition, so preserving it through end of turn matters.";
  } else if (context.acquisitionSatisfied && otherNewlyControlled) {
    reason += " The 3 VP new-capture condition is already supported by another objective, so this objective adds no second acquisition award.";
  } else if (startedControlled) {
    reason += " You already controlled this objective at turn start, so it cannot create the 3 VP new-capture condition this turn.";
  }
  if (round >= 2) reason += " As a non-home objective it also carries 4 VP of control value at the applicable checkpoint.";

  return Object.freeze({
    active: true,
    missionName: context.missionName,
    objectiveId,
    ownHome: false,
    controlledNow,
    startedControlled,
    acquisitionEligible,
    acquisitionAlreadySecured,
    acquisitionIncremental,
    checkpointVpLeverage,
    acquisitionVpLeverage,
    vpLeverage,
    score,
    reason
  });
}
