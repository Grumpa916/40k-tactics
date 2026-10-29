import { getBattlePrimaryMissionDefinitions } from "../data/primary-mission-catalog.js";
import { isPlayerHomeObjective } from "./consecrate-state.js";
import { getEnemyUnitDestructionsForTurn } from "./scoring-evidence-state.js";
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

export function isDelayingActionMissionForPlayer(state, playerId, perspectivePlayerId = defaultPerspectivePlayerId(state)) {
  return missionForPlayer(state, playerId, perspectivePlayerId)?.id === "primary-delaying-action";
}

function controlledBy(control, playerId) {
  return control?.controlState === "controlled" && control?.controllerId === playerId;
}

function layoutObjectiveName(objective) {
  if (objective?.layoutObjective) return objective.layoutObjective;
  if (typeof objective?.id === "string" && objective.id.startsWith("event-companion:")) {
    return objective.id.slice("event-companion:".length);
  }
  return objective?.name ?? objective?.id ?? "";
}

function objectiveRole(objective) {
  const name = layoutObjectiveName(objective);
  if (/^Central\s/i.test(name)) return "central";
  if (/^Expansion\s/i.test(name)) return "expansion";
  return "other";
}

function objectiveSnapshot(state, playerId, perspectivePlayerId) {
  const all = Array.isArray(state?.objectives) ? state.objectives : [];
  const known = all.length > 0 && all.every((objective) => objective?.control != null);
  const homeObjectives = all.filter((objective) => isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId));
  const playerHomeObjectiveIds = Object.freeze(homeObjectives.map((objective) => objective.id));
  const centralObjectiveIds = Object.freeze(all.filter((objective) => objectiveRole(objective) === "central").map((objective) => objective.id));
  const expansionObjectiveIds = Object.freeze(all.filter((objective) => objectiveRole(objective) === "expansion").map((objective) => objective.id));

  if (!known) {
    return Object.freeze({
      known: false,
      homeRoleKnown: homeObjectives.length > 0,
      playerHomeObjectiveIds,
      centralObjectiveIds,
      expansionObjectiveIds,
      controlled: 0,
      controlledIds: Object.freeze([]),
      nonHomeControlled: 0,
      nonHomeControlledIds: Object.freeze([]),
      centralControlled: 0,
      centralControlledIds: Object.freeze([]),
      expansionControlled: 0,
      expansionControlledIds: Object.freeze([])
    });
  }

  const controlled = all.filter((objective) => controlledBy(objective.control, playerId));
  const nonHomeControlled = controlled.filter((objective) => !playerHomeObjectiveIds.includes(objective.id));
  const centralControlled = controlled.filter((objective) => objectiveRole(objective) === "central");
  const expansionControlled = controlled.filter((objective) => objectiveRole(objective) === "expansion");
  return Object.freeze({
    known: true,
    homeRoleKnown: homeObjectives.length > 0,
    playerHomeObjectiveIds,
    centralObjectiveIds,
    expansionObjectiveIds,
    controlled: controlled.length,
    controlledIds: Object.freeze(controlled.map((objective) => objective.id)),
    nonHomeControlled: nonHomeControlled.length,
    nonHomeControlledIds: Object.freeze(nonHomeControlled.map((objective) => objective.id)),
    centralControlled: centralControlled.length,
    centralControlledIds: Object.freeze(centralControlled.map((objective) => objective.id)),
    expansionControlled: expansionControlled.length,
    expansionControlledIds: Object.freeze(expansionControlled.map((objective) => objective.id))
  });
}

function targetKillOpportunity(state, { playerId, targetUnitId, effectiveLeverage }) {
  if (!targetUnitId) {
    return Object.freeze({ active: false, eligibleEnemy: false, vpLeverage: 0 });
  }
  const target = (Array.isArray(state?.units) ? state.units : []).find((unit) => unit?.id === targetUnitId) ?? null;
  const eligibleEnemy = Boolean(target && target.ownerId !== playerId && target.status !== "destroyed");
  return Object.freeze({
    active: true,
    eligibleEnemy,
    targetUnitId,
    vpLeverage: eligibleEnemy ? effectiveLeverage : 0
  });
}

function timingSummary(round) {
  if (round === 1) {
    return "Round 1: Delaying Action scores 2 VP for each enemy unit destroyed this turn; objective scoring begins in Round 2.";
  }
  if (round < 5) {
    return `Round ${round}: the 4 VP non-home control check occurs in the Command phase; each enemy destroyed is worth 2 VP at end of turn, and controlling both a central and an expansion objective is worth 3 VP at end of turn.`;
  }
  return "Round 5: the 4 VP non-home control check moves to end of turn, alongside the 3 VP central-plus-expansion condition and 2 VP per enemy unit destroyed, so Movement and combat can directly change every Delaying Action scoring component before the 15 VP round cap.";
}

export function getDelayingActionPrimaryStrategyContext(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  targetUnitId = null
} = {}) {
  if (!playerId) throw new TypeError("playerId is required.");
  if (!isDelayingActionMissionForPlayer(state, playerId, perspectivePlayerId)) {
    return Object.freeze({
      active: false,
      supported: false,
      missionId: null,
      missionName: null,
      targetingScore: 0,
      objectivePreservationScore: 0,
      nextKillVpLeverage: 0,
      summary: Object.freeze([]),
      reason: "Delaying Action strategy is not active for this player."
    });
  }

  const mission = missionForPlayer(state, playerId, perspectivePlayerId);
  const round = Math.max(1, Number(state?.battle?.round) || 1);
  const turn = Number.isInteger(state?.turn) ? state.turn : 0;
  const objectives = objectiveSnapshot(state, playerId, perspectivePlayerId);
  const kills = getEnemyUnitDestructionsForTurn(state, playerId, turn);
  const controlScoringActive = round >= 2;
  const controlSatisfied = controlScoringActive && objectives.known && objectives.nonHomeControlled > 0;
  const controlVp = controlSatisfied ? 4 : 0;
  const centralExpansionScoringActive = round >= 2;
  const centralExpansionSatisfied = centralExpansionScoringActive && objectives.known && objectives.centralControlled > 0 && objectives.expansionControlled > 0;
  const centralExpansionVp = centralExpansionSatisfied ? 3 : 0;
  const killVp = kills.length * 2;
  const rawRecordedVp = killVp + controlVp + centralExpansionVp;
  const cappedRecordedVp = Math.min(15, rawRecordedVp);
  const remainingRoundCap = Math.max(0, 15 - cappedRecordedVp);
  const effectiveNextKillVp = Math.min(2, remainingRoundCap);
  const killOpportunity = targetKillOpportunity(state, { playerId, targetUnitId, effectiveLeverage: effectiveNextKillVp });
  const nextKillVpLeverage = targetUnitId ? killOpportunity.vpLeverage : effectiveNextKillVp;
  const targetingScore = nextKillVpLeverage >= 2 ? 0.66 : nextKillVpLeverage === 1 ? 0.38 : 0.05;

  let objectivePreservationScore = round === 1 ? 0.2 : !objectives.known ? 0.38 : 0.64;
  if (centralExpansionSatisfied) objectivePreservationScore = Math.max(objectivePreservationScore, 0.93);
  else if (objectives.centralControlled > 0 || objectives.expansionControlled > 0) objectivePreservationScore = Math.max(objectivePreservationScore, 0.86);
  if (controlSatisfied && objectives.nonHomeControlled === 1) objectivePreservationScore = Math.max(objectivePreservationScore, 0.9);
  if (round === 5) objectivePreservationScore = Math.max(objectivePreservationScore, 0.95);

  const controlProgress = !controlScoringActive
    ? "The 4 VP non-home control condition begins in Round 2."
    : !objectives.known
      ? "Objective control is incomplete; confirm controllers before relying on the 4 VP non-home control condition."
      : controlSatisfied
        ? `At least one non-home objective is controlled, satisfying the binary 4 VP control condition at the applicable checkpoint.`
        : "No non-home objective is currently controlled; establish one for the binary 4 VP control condition.";
  const pairProgress = !centralExpansionScoringActive
    ? "The 3 VP central-plus-expansion condition begins in Round 2."
    : !objectives.known
      ? "Objective control is incomplete; confirm central and expansion controllers before relying on the 3 VP end-of-turn condition."
      : centralExpansionSatisfied
        ? `${objectives.centralControlled} central and ${objectives.expansionControlled} expansion objective${objectives.expansionControlled === 1 ? " is" : "s are"} controlled, satisfying the 3 VP end-of-turn pairing condition.`
        : objectives.centralControlled > 0
          ? "A central objective is controlled but no expansion objective is; taking or preserving an expansion objective can complete the 3 VP end-of-turn pair."
          : objectives.expansionControlled > 0
            ? "An expansion objective is controlled but no central objective is; taking or preserving a central objective can complete the 3 VP end-of-turn pair."
            : "No central-plus-expansion pair is currently established; both roles are needed for the 3 VP end-of-turn condition.";
  const killProgress = kills.length > 0
    ? `${kills.length} enemy unit${kills.length === 1 ? " has" : "s have"} been destroyed this turn, representing ${killVp} VP before the 15 VP round cap.`
    : "No enemy unit has been destroyed this turn; every enemy unit destroyed is worth 2 VP at end of turn before the round cap.";

  let reason;
  if (targetUnitId && killOpportunity.eligibleEnemy && nextKillVpLeverage > 0) {
    reason = `This enemy is a direct Delaying Action scoring target: destroying it can add ${nextKillVpLeverage} Primary VP before the 15 VP round cap.`;
  } else if (targetUnitId && nextKillVpLeverage === 0) {
    reason = "The recorded Delaying Action state has already reached the 15 VP round cap, so another destruction has no additional Primary VP leverage this round.";
  } else if (round >= 2 && objectives.known && objectives.centralControlled > 0 && objectives.expansionControlled === 0) {
    reason = "The central half of the 3 VP end-of-turn pair is already controlled. An expansion objective is the clearest Delaying Action positional need.";
  } else if (round >= 2 && objectives.known && objectives.expansionControlled > 0 && objectives.centralControlled === 0) {
    reason = "The expansion half of the 3 VP end-of-turn pair is already controlled. A central objective is the clearest Delaying Action positional need.";
  } else if (round >= 2 && objectives.known && !controlSatisfied) {
    reason = "No non-home objective is controlled. Establishing one is required for the 4 VP control condition and can also contribute to the central-plus-expansion pair.";
  } else if (centralExpansionSatisfied) {
    reason = "The central-plus-expansion condition is currently satisfied. Preserve the pair while taking efficient kills worth 2 VP each rather than abandoning a scoring role unnecessarily.";
  } else {
    reason = "Delaying Action rewards efficient enemy-unit destruction while maintaining enough objective presence to satisfy its binary control and central-plus-expansion conditions.";
  }

  return Object.freeze({
    active: true,
    supported: true,
    disposition: "Disruption",
    missionId: mission.id,
    missionName: mission.name,
    round,
    turn,
    targetUnitId,
    objectiveStateKnown: objectives.known,
    homeRoleKnown: objectives.homeRoleKnown,
    playerHomeObjectiveIds: objectives.playerHomeObjectiveIds,
    centralObjectiveIds: objectives.centralObjectiveIds,
    expansionObjectiveIds: objectives.expansionObjectiveIds,
    controlledObjectives: objectives.controlled,
    controlledObjectiveIds: objectives.controlledIds,
    nonHomeControlled: objectives.nonHomeControlled,
    nonHomeControlledObjectiveIds: objectives.nonHomeControlledIds,
    centralControlled: objectives.centralControlled,
    centralControlledObjectiveIds: objectives.centralControlledIds,
    expansionControlled: objectives.expansionControlled,
    expansionControlledObjectiveIds: objectives.expansionControlledIds,
    controlScoringActive,
    controlSatisfied,
    controlCheckpointTiming: round >= 5 ? "end-of-turn" : round >= 2 ? "end-of-command" : null,
    controlVp,
    centralExpansionScoringActive,
    centralExpansionSatisfied,
    centralExpansionVp,
    enemyKillsThisTurn: kills.length,
    killVp,
    killOpportunity,
    nextKillVpLeverage,
    targetingScore,
    objectivePreservationScore,
    rawRecordedVp,
    cappedRecordedVp,
    remainingRoundCap,
    protectCheapUnits: false,
    summary: Object.freeze([
      timingSummary(round),
      killProgress,
      controlProgress,
      pairProgress,
      `Recorded/known conditions currently represent up to ${cappedRecordedVp}/15 Primary VP for the round before tabletop confirmation.`
    ]),
    reason,
    assumptions: Object.freeze([
      "Each enemy unit destroyed this turn is worth 2 VP, subject to the 15 VP Primary cap for the round.",
      "The 4 VP non-home condition is binary: controlling additional non-home objectives does not multiply that award.",
      "The 3 VP end-of-turn condition is binary and requires at least one controlled central objective and at least one controlled expansion objective.",
      "In rounds 2–4, Movement occurs after the Command-phase 4 VP checkpoint and cannot retroactively change that completed checkpoint; positioning can still affect the 3 VP end-of-turn pair and prepare the next round.",
      "In round 5, the 4 VP non-home control condition and 3 VP central-plus-expansion condition both resolve at end of turn."
    ])
  });
}

export function getDelayingActionObjectiveStrategySignal(state, {
  playerId,
  perspectivePlayerId = defaultPerspectivePlayerId(state),
  objectiveId,
  control = null,
  purpose = null,
  primaryStrategy = null
} = {}) {
  const context = primaryStrategy?.missionId === "primary-delaying-action"
    ? primaryStrategy
    : getDelayingActionPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  if (!context.active || !objectiveId) {
    return Object.freeze({ active: false, score: 0, vpLeverage: 0, missionId: context.missionId ?? null, missionName: context.missionName ?? null, reason: "Delaying Action objective strategy is not active." });
  }

  const objective = (Array.isArray(state?.objectives) ? state.objectives : []).find((item) => item?.id === objectiveId) ?? null;
  const ownHome = objective ? isPlayerHomeObjective(state, objective, playerId, perspectivePlayerId) : false;
  const role = objectiveRole(objective);
  const controlledNow = control === "controlled" || context.controlledObjectiveIds.includes(objectiveId);
  if (ownHome) {
    return Object.freeze({
      active: true,
      missionId: context.missionId,
      missionName: context.missionName,
      objectiveId,
      ownHome: true,
      role: "home",
      controlledNow,
      controlVpLeverage: 0,
      pairVpLeverage: 0,
      vpLeverage: 0,
      score: 0.04,
      reason: "Your home objective does not satisfy Delaying Action's non-home control condition or its central-plus-expansion pairing condition."
    });
  }

  if (!context.objectiveStateKnown || context.round < 2) {
    return Object.freeze({
      active: true,
      missionId: context.missionId,
      missionName: context.missionName,
      objectiveId,
      ownHome: false,
      role,
      controlledNow,
      controlVpLeverage: 0,
      pairVpLeverage: 0,
      vpLeverage: 0,
      nextCheckpointSetup: context.round >= 2,
      score: context.round >= 2 ? 0.18 : 0.05,
      reason: context.round < 2
        ? "Delaying Action objective scoring begins in Round 2; Round 1 Primary value comes from destroying enemy units."
        : "Objective control is incomplete, so Delaying Action objective VP remains player-confirmed."
    });
  }

  let controlVpLeverage = 0;
  let nextCheckpointSetup = false;
  if (context.round >= 5) {
    if (!context.controlSatisfied && !controlledNow) controlVpLeverage = 4;
    else if (context.controlSatisfied && controlledNow && context.nonHomeControlled === 1) controlVpLeverage = 4;
  } else {
    nextCheckpointSetup = true;
  }

  let pairVpLeverage = 0;
  let pairSetup = false;
  if (role === "central") {
    if (controlledNow && context.centralExpansionSatisfied && context.centralControlled === 1) pairVpLeverage = 3;
    else if (!controlledNow && context.centralControlled === 0 && context.expansionControlled > 0) pairVpLeverage = 3;
    else if (context.centralControlled === 0) pairSetup = true;
  } else if (role === "expansion") {
    if (controlledNow && context.centralExpansionSatisfied && context.expansionControlled === 1) pairVpLeverage = 3;
    else if (!controlledNow && context.expansionControlled === 0 && context.centralControlled > 0) pairVpLeverage = 3;
    else if (context.expansionControlled === 0) pairSetup = true;
  }

  const vpLeverage = Math.min(7, controlVpLeverage + pairVpLeverage);
  let score = 0.08;
  if (vpLeverage > 0) score += clamp01(vpLeverage / 7) * 0.72;
  if (pairSetup) score += 0.2;
  if (nextCheckpointSetup) score += controlledNow ? 0.16 : 0.12;
  if (purpose === "hold-objective" && controlledNow && (pairVpLeverage > 0 || controlVpLeverage > 0)) score += 0.08;
  score = clamp01(score);

  let reason;
  if (context.round >= 5 && controlVpLeverage > 0 && pairVpLeverage > 0) {
    reason = `Round 5 resolves both Delaying Action objective checks at end of turn; this ${role} objective carries up to 7 VP of same-turn leverage (4 VP non-home control plus 3 VP central-plus-expansion pairing).`;
  } else if (pairVpLeverage > 0 && controlledNow) {
    reason = `Preserving this ${role} objective protects the 3 VP central-plus-expansion end-of-turn condition.`;
  } else if (pairVpLeverage > 0) {
    reason = `Taking this ${role} objective can complete the 3 VP central-plus-expansion end-of-turn condition.`;
  } else if (controlVpLeverage > 0 && controlledNow) {
    reason = "Preserving this non-home objective protects the binary 4 VP Round 5 control condition.";
  } else if (controlVpLeverage > 0) {
    reason = "Taking this non-home objective can establish the binary 4 VP Round 5 control condition.";
  } else if (pairSetup && nextCheckpointSetup) {
    reason = `This ${role} objective does not complete the pair by itself, but controlling it establishes one half of the 3 VP central-plus-expansion end-of-turn condition. The current round's Command-phase control checkpoint has already passed before Movement, so this position only stages or preserves the next 4 VP control checkpoint.`;
  } else if (pairSetup) {
    reason = `This ${role} objective does not complete the pair by itself, but controlling it establishes one half of the 3 VP central-plus-expansion end-of-turn condition.`;
  } else if (nextCheckpointSetup) {
    reason = "The current round's Command-phase control checkpoint has already passed before Movement; this non-home objective can still stage or preserve the next control checkpoint.";
  } else {
    reason = "This objective has limited immediate Delaying Action leverage beyond general board control.";
  }

  return Object.freeze({
    active: true,
    missionId: context.missionId,
    missionName: context.missionName,
    objectiveId,
    ownHome: false,
    role,
    controlledNow,
    controlVpLeverage,
    pairVpLeverage,
    pairSetup,
    nextCheckpointSetup,
    vpLeverage,
    score,
    reason
  });
}
