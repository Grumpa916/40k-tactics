import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getTurnSnapshot } from "./scoring-evidence-state.js";
import { getTerritoryStatusForPosition } from "./battlefield-territory.js";
import { clamp01 } from "./tactical-context-utils.js";

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

export function isDeterminedAcquisitionMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-determined-acquisition";
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function territoryForObjective(state, playerId, objective) {
  if (!Number.isFinite(objective?.position?.x) || !Number.isFinite(objective?.position?.y)) {
    return Object.freeze({ territory: "unknown", confidence: "low", distanceToBoundary: null });
  }
  return getTerritoryStatusForPosition(state, { playerId, position: objective.position });
}

function objectiveSnapshot(state, playerId, perspectivePlayerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const known = all.length > 0 && all.every((objective) => objective?.control != null);
  const homeObjectives = all.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const homeRoleKnown = homeObjectives.length > 0;
  const playerHomeObjectiveIds = Object.freeze(homeObjectives.map((objective) => objective.id));

  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown,
      playerHomeObjectiveIds,
      controlled: 0,
      controlledObjectiveIds: Object.freeze([]),
      enemyTerritoryControlled: null,
      enemyTerritoryControlledIds: Object.freeze([]),
      territoryUncertainControlledIds: Object.freeze([])
    });
  }

  const controlled = all.filter((objective) => controlledBy(objective.control, playerId));
  const enemyTerritoryControlled = [];
  const territoryUncertainControlled = [];
  for (const objective of controlled) {
    const territory = territoryForObjective(state, playerId, objective);
    if (territory.territory === "opponent") enemyTerritoryControlled.push(objective);
    else if (territory.territory === "boundary" || territory.territory === "unknown") territoryUncertainControlled.push(objective);
  }

  return Object.freeze({
    known: true,
    homeRoleKnown,
    playerHomeObjectiveIds,
    controlled: controlled.length,
    controlledObjectiveIds: Object.freeze(controlled.map((objective) => objective.id)),
    enemyTerritoryControlled: enemyTerritoryControlled.length,
    enemyTerritoryControlledIds: Object.freeze(enemyTerritoryControlled.map((objective) => objective.id)),
    territoryUncertainControlledIds: Object.freeze(territoryUncertainControlled.map((objective) => objective.id))
  });
}

function acquisitionSnapshot(state, playerId, perspectivePlayerId) {
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const relevant = all.filter((objective) => !isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const snapshot = getTurnSnapshot(state, turn);
  if (!snapshot) {
    return Object.freeze({
      known: false,
      turn,
      eligibleObjectiveIds: Object.freeze([]),
      newlyControlledObjectiveIds: Object.freeze([]),
      startControlledObjectiveIds: Object.freeze([])
    });
  }

  const startById = new Map((snapshot.objectives ?? []).map((objective) => [objective.id, objective]));
  if (!relevant.every((objective) => startById.has(objective.id))) {
    return Object.freeze({
      known: false,
      turn,
      eligibleObjectiveIds: Object.freeze([]),
      newlyControlledObjectiveIds: Object.freeze([]),
      startControlledObjectiveIds: Object.freeze([])
    });
  }

  const startControlled = relevant.filter((objective) => controlledBy(startById.get(objective.id)?.control, playerId));
  const eligible = relevant.filter((objective) => !controlledBy(startById.get(objective.id)?.control, playerId));
  const newlyControlled = eligible.filter((objective) => controlledBy(objective.control, playerId));
  return Object.freeze({
    known: true,
    turn,
    eligibleObjectiveIds: Object.freeze(eligible.map((objective) => objective.id)),
    newlyControlledObjectiveIds: Object.freeze(newlyControlled.map((objective) => objective.id)),
    startControlledObjectiveIds: Object.freeze(startControlled.map((objective) => objective.id))
  });
}

function timingSummary(round) {
  if (round === 1) {
    return "Round 1: the active Determined Acquisition scoring is 2 VP at end of turn for each non-home objective you control that you did not control at the start of the turn.";
  }
  if (round < 5) {
    return `Round ${round}: controlled objectives score 3 VP each at the end of your Command phase, with +3 VP for each controlled objective in enemy territory. Newly acquired non-home objectives also score 2 VP each at end of turn.`;
  }
  return "Round 5: objective control, enemy-territory bonuses, and newly acquired non-home objectives all resolve at end of turn, so movement can directly change every Determined Acquisition scoring component this turn.";
}

export function getDeterminedAcquisitionPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isDeterminedAcquisitionMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Determined Acquisition strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const phase = String(state?.phase ?? "");
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const acquisition = acquisitionSnapshot(state, playerId, perspectivePlayerId);
  const controlScoringActive = round >= 2;
  const baseControlVp = controlScoringActive && objectives.known ? objectives.controlled * 3 : 0;
  const enemyTerritoryBonusVp = controlScoringActive && objectives.known
    ? (objectives.enemyTerritoryControlled ?? 0) * 3
    : 0;
  const acquisitionVp = acquisition.known ? acquisition.newlyControlledObjectiveIds.length * 2 : 0;
  const rawRecordedVp = baseControlVp + enemyTerritoryBonusVp + acquisitionVp;
  const cappedRecordedVp = Math.min(15, rawRecordedVp);

  let objectivePreservationScore = objectives.known ? 0.58 : 0.34;
  if (acquisition.known && acquisition.newlyControlledObjectiveIds.length > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (controlScoringActive && (objectives.enemyTerritoryControlled ?? 0) > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.92);
  if (round === 5) objectivePreservationScore = Math.max(objectivePreservationScore, 0.95);

  const acquisitionProgress = !acquisition.known
    ? "Turn-start objective control is unavailable; confirm which non-home objectives were not controlled at the start of this turn before relying on the 2 VP acquisition calculation."
    : acquisition.newlyControlledObjectiveIds.length > 0
      ? `${acquisition.newlyControlledObjectiveIds.length} non-home objective${acquisition.newlyControlledObjectiveIds.length === 1 ? "" : "s"} currently qualify as newly acquired this turn, representing ${acquisitionVp} VP if held through the end-of-turn checkpoint.`
      : "No currently controlled non-home objective is recorded as newly acquired this turn; capturing an eligible non-home objective can still create the 2 VP end-of-turn award.";

  const controlProgress = !controlScoringActive
    ? "The 3 VP per controlled objective and +3 VP enemy-territory bonus begin in Round 2."
    : !objectives.known
      ? "Objective control is incomplete; confirm controllers before relying on the Round 2+ control calculation."
      : `You currently control ${objectives.controlled} objective${objectives.controlled === 1 ? "" : "s"}, representing ${baseControlVp} base VP. ${objectives.enemyTerritoryControlled ?? 0} of those are confirmed in enemy territory for ${enemyTerritoryBonusVp} additional VP before the round cap.`;

  const territoryProgress = objectives.territoryUncertainControlledIds.length > 0
    ? `${objectives.territoryUncertainControlledIds.length} controlled objective${objectives.territoryUncertainControlledIds.length === 1 ? " is" : "s are"} inside the map's territory uncertainty band or lack a confirmed territory classification; no +3 VP territory bonus is assumed for those objectives.`
    : "All currently controlled objectives used for the territory bonus are clear of the advisory territory boundary.";

  let reason;
  if (!objectives.known) {
    reason = "Confirm objective control first. Determined Acquisition depends on exact current control, turn-start control, and enemy-territory status.";
  } else if (!acquisition.known) {
    reason = "The turn-start snapshot is unavailable. Preserve valuable controlled objectives, but confirm which non-home captures are actually eligible for the 2 VP acquisition award.";
  } else if (round === 1) {
    reason = "Round 1 is an acquisition race: prioritize reachable non-home objectives you did not control at turn start, because each can score 2 VP at end of turn.";
  } else if (round === 5) {
    reason = "Round 5 makes acquisition and control simultaneous at end of turn. A newly captured enemy-territory objective can be worth 8 VP before the 15 VP cap: 2 VP acquisition, 3 VP control, and 3 VP enemy-territory bonus.";
  } else if (acquisition.newlyControlledObjectiveIds.length > 0) {
    reason = "Preserve newly acquired non-home objectives through end of turn for their 2 VP awards. Enemy-territory control is especially valuable because each such objective also represents 6 VP at the applicable Command-phase checkpoint before the round cap.";
  } else {
    reason = "Look for a reliable non-home acquisition for the 2 VP end-of-turn award while preserving controlled objectives for the next applicable Command checkpoint; enemy-territory objectives carry the highest control value.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Take and Hold",
    missionId: mission.id,
    missionName: mission.name,
    round,
    phase,
    turn: Number.isInteger(state?.turn) ? state.turn : 0,
    targetUnitId,
    objectiveStateKnown: objectives.known,
    homeRoleKnown: objectives.homeRoleKnown,
    playerHomeObjectiveIds: objectives.playerHomeObjectiveIds,
    controlledObjectives: objectives.controlled,
    controlledObjectiveIds: objectives.controlledObjectiveIds,
    enemyTerritoryControlled: objectives.enemyTerritoryControlled,
    enemyTerritoryControlledObjectiveIds: objectives.enemyTerritoryControlledIds,
    territoryUncertainControlledObjectiveIds: objectives.territoryUncertainControlledIds,
    turnStartKnown: acquisition.known,
    acquisitionEligibleObjectiveIds: acquisition.eligibleObjectiveIds,
    newlyControlledObjectiveIds: acquisition.newlyControlledObjectiveIds,
    startControlledObjectiveIds: acquisition.startControlledObjectiveIds,
    acquisitionVp,
    controlScoringActive,
    controlCheckpointTiming: round >= 5 ? "end-of-turn" : round >= 2 ? "end-of-command" : null,
    baseControlVp,
    enemyTerritoryBonusVp,
    rawRecordedVp,
    cappedRecordedVp,
    nextKillVpLeverage: 0,
    targetingScore: 0.05,
    objectivePreservationScore,
    protectCheapUnits: false,
    summary: Object.freeze([
      timingSummary(round),
      acquisitionProgress,
      controlProgress,
      territoryProgress,
      `Recorded current-position conditions represent up to ${cappedRecordedVp}/15 Primary VP for the round before timing and player confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Objective control comes from recorded tabletop confirmation; approximate unit position does not determine control.",
      "Turn-start objective control comes from the recorded turn snapshot. Without that snapshot, the 2 VP newly acquired condition remains player-confirmed.",
      "Enemy-territory bonuses use the verified battlefield territory geometry. Objectives inside the ±3-inch advisory boundary band are not automatically credited with the +3 VP bonus.",
      "In Rounds 2–4, movement after the Command phase can score acquisition VP this turn and prepare future control scoring, but does not retroactively change a completed Command-phase checkpoint.",
      "Determined Acquisition has no direct kill-scoring condition, so destroying a unit receives no automatic Primary VP premium.",
      "The 15 VP Primary cap is applied to the current-round outlook."
    ])
  });
}

export function getDeterminedAcquisitionObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  if (!playerId || !objectiveId) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const context = primaryStrategy ?? getDeterminedAcquisitionPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context?.active) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });
  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId);
  if (!objective) return Object.freeze({ active: false, score: 0, vpLeverage: 0, reason: "" });

  const controlledNow = control === "controlled" || controlledBy(objective.control, playerId);
  const ownHome = context.playerHomeObjectiveIds.includes(objectiveId);
  const territory = territoryForObjective(state, playerId, objective);
  const enemyTerritory = territory.territory === "opponent";
  const territoryUncertain = territory.territory === "boundary" || territory.territory === "unknown";
  const startKnown = context.turnStartKnown;
  const startedControlled = context.startControlledObjectiveIds.includes(objectiveId);
  const acquisitionEligible = !ownHome && startKnown && context.acquisitionEligibleObjectiveIds.includes(objectiveId);
  const acquisitionAlreadySecured = acquisitionEligible && controlledNow;
  const round = context.round;
  let score = 0.04;
  let acquisitionVpLeverage = 0;
  let checkpointVpLeverage = 0;
  const notes = [];

  if (acquisitionEligible) {
    acquisitionVpLeverage = 2;
    score += controlledNow ? (purpose === "hold-objective" ? 0.28 : 0.2) : 0.34;
    notes.push(controlledNow
      ? "This non-home objective was not controlled at turn start; preserving it through end of turn protects a 2 VP acquisition award."
      : "This non-home objective was not controlled at turn start; taking it can create a 2 VP acquisition award at end of turn.");
  } else if (!ownHome && !startKnown) {
    score += 0.08;
    notes.push("Turn-start control is unavailable, so potential 2 VP acquisition value must be confirmed on the tabletop before being counted.");
  } else if (!ownHome && startedControlled) {
    notes.push("You already controlled this objective at turn start, so it cannot generate the 2 VP acquisition award this turn.");
  } else if (ownHome) {
    notes.push("Your home objective is excluded from the 2 VP newly acquired condition.");
  }

  if (round >= 2) {
    checkpointVpLeverage += 3;
    score += controlledNow ? (purpose === "hold-objective" ? 0.2 : 0.14) : 0.22;
    notes.push(round === 5
      ? "This objective is worth 3 VP at the Round 5 end-of-turn control checkpoint before the round cap."
      : "This objective is worth 3 VP at the applicable Command-phase control checkpoint; movement after that checkpoint protects or prepares future scoring rather than rewriting it.");

    if (enemyTerritory) {
      checkpointVpLeverage += 3;
      score += 0.24;
      notes.push("Its position is confirmed in enemy territory, adding another 3 VP at the applicable control checkpoint before the round cap.");
    } else if (territoryUncertain) {
      notes.push("This objective is within the territory uncertainty band or lacks a confirmed territory classification, so no automatic +3 VP enemy-territory bonus is assumed.");
    }
  } else if (enemyTerritory) {
    score += 0.08;
    notes.push("Enemy-territory control bonuses begin in Round 2; this position can still prepare that future scoring value.");
  }

  if (round === 5 && acquisitionVpLeverage > 0 && checkpointVpLeverage > 0) {
    score += 0.1;
    notes.push(`Round 5 resolves both components at end of turn, so this objective can represent ${acquisitionVpLeverage + checkpointVpLeverage} VP of same-turn leverage before the round cap.`);
  }

  if (controlledNow && purpose === "hold-objective") score += 0.06;
  if (!controlledNow && (purpose === "contest-objective" || purpose === "swing-objective")) score += 0.05;

  return Object.freeze({
    active: true,
    missionName: context.missionName,
    objectiveId,
    ownHome,
    enemyTerritory,
    territory: territory.territory,
    territoryConfidence: territory.confidence,
    territoryUncertain,
    controlledNow,
    startKnown,
    startedControlled,
    acquisitionEligible,
    acquisitionAlreadySecured,
    acquisitionVpLeverage,
    checkpointVpLeverage,
    vpLeverage: acquisitionVpLeverage + checkpointVpLeverage,
    score: clamp01(score),
    reason: notes.join(" "),
    assumptions: context.assumptions
  });
}
