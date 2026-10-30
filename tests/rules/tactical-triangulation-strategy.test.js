import test from "node:test";
import assert from "node:assert/strict";
import {
  getTriangulationState,
  getTriangulationObjectiveOptions,
  getTriangulationTierVp
} from "../../src/rules/triangulation-state.js";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getMissionActionOptions } from "../../src/rules/mission-action-state.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return { id, name: layoutObjective, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { move = 8, oc = 2, battleShocked = false, rosterUnitId = id } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    position: { x, y },
    battleShocked,
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function rosterUnit(id, { move = 8, oc = 2 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: []
    }
  };
}

function triangulateAttempt(objectiveId, { round = 2, turn = round, unitId = `tri-${objectiveId}` } = {}) {
  return {
    type: "shooting.unit_activated",
    payload: {
      unitId,
      playerId: "p1",
      round,
      turn,
      actionType: "mission_action",
      actionId: "primary-triangulation",
      missionInstanceId: "primary:p1:primary-triangulation",
      missionDefinitionId: "primary-triangulation",
      missionName: "Triangulation — Triangulate",
      reviewTiming: "end-of-turn",
      objectiveId,
      rulesConfirmed: true
    }
  };
}

function triangulateReview(objectiveId, { round = 2, turn = round, unitId = `tri-${objectiveId}`, outcome = "completed" } = {}) {
  return {
    type: "mission_action.reviewed",
    payload: {
      actionKey: `${round}:${turn}:${unitId}`,
      playerId: "p1",
      checkpoint: "end-of-turn",
      outcome,
      missionInstanceId: "primary:p1:primary-triangulation",
      round,
      turn
    }
  };
}

function completedTriangulation(objectiveId, options = {}) {
  return [triangulateAttempt(objectiveId, options), triangulateReview(objectiveId, options)];
}

function primaryAward(id, amount, round, turn, missionDefinitionId = "prior-primary") {
  return {
    id,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId,
      scoringTiming: "end-of-turn",
      opportunityKey: id,
      round,
      turn,
      scoreBefore: 0,
      scoreAfter: amount
    }
  };
}

function priorPrimaryAwards(total) {
  const events = [];
  let remaining = total;
  let index = 0;
  while (remaining > 0) {
    const amount = Math.min(15, remaining);
    events.push(primaryAward(`prior-${index}`, amount, index + 1, 50 + index, `prior-primary-${index}`));
    remaining -= amount;
    index += 1;
  }
  return events;
}

function state({
  round = 2,
  phase = "movement",
  history = [],
  controllers = {},
  priorPrimaryVp = 0,
  omitRoles = false
} = {}) {
  const objectives = [
    objective("home", "Attacker Home", controllers.home ?? "p1", 8, 5),
    objective("central-1", "Central 1", controllers["central-1"] ?? null, 26, 18),
    objective("central-2", "Central 2", controllers["central-2"] ?? null, 34, 26),
    objective("expansion-1", "Expansion 1", controllers["expansion-1"] ?? null, 18, 32),
    objective("expansion-2", "Expansion 2", controllers["expansion-2"] ?? null, 42, 12),
    objective("enemy-home", "Defender Home", controllers["enemy-home"] ?? "p2", 52, 39)
  ];
  const friendly = [
    unit("runner", "p1", 26, 18, { rosterUnitId: "r-runner" }),
    unit("holder", "p1", 18, 32, { move: 6, oc: 3, rosterUnitId: "r-holder" })
  ];
  return {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: omitRoles ? {} : { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Reconnaissance", opponentDisposition: "Purge the Foe", layout: "A" } },
    objectives,
    units: [...friendly, unit("enemy", "p2", 45, 35, { rosterUnitId: "r-enemy" })],
    history: [...priorPrimaryAwards(priorPrimaryVp), ...history],
    victoryPoints: { p1: priorPrimaryVp, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner"), rosterUnit("r-holder", { move: 6, oc: 3 })] },
      p2: { units: [rosterUnit("r-enemy")] }
    }
  };
}

function strategy(s) {
  return getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
}

function signal(s, objectiveId, options = {}) {
  const primaryStrategy = strategy(s);
  return getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId,
    primaryStrategy,
    ...options
  });
}

test("router selects the dedicated Triangulation strategy", () => {
  const context = strategy(state());
  assert.equal(context.active, true);
  assert.equal(context.supported, true);
  assert.equal(context.missionName, "Triangulation");
  assert.equal(context.disposition, "Reconnaissance");
});

test("Triangulation tiers are 0, 3, 6 and 10 VP", () => {
  assert.equal(getTriangulationTierVp(0), 0);
  assert.equal(getTriangulationTierVp(1), 3);
  assert.equal(getTriangulationTierVp(2), 6);
  assert.equal(getTriangulationTierVp(3), 10);
  assert.equal(getTriangulationTierVp(5), 10);
});

test("only completed Triangulate reviews create persistent triangulated objectives", () => {
  const s = state({ history: [
    ...completedTriangulation("central-1", { round: 2, turn: 2, unitId: "runner" }),
    triangulateAttempt("central-2", { round: 3, turn: 3, unitId: "holder" }),
    triangulateReview("central-2", { round: 3, turn: 3, unitId: "holder", outcome: "failed" })
  ], round: 4 });
  const triangulation = getTriangulationState(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.deepEqual(triangulation.triangulatedObjectiveIds, ["central-1"]);
  assert.equal(triangulation.triangulatedCount, 1);
  assert.equal(triangulation.triangulatedTierVp, 3);
});

test("an attempt spends the once-per-turn Triangulate use even before review", () => {
  const s = state({ phase: "shooting", history: [triangulateAttempt("central-1", { round: 2, turn: 2, unitId: "runner" })] });
  const triangulation = getTriangulationState(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(triangulation.usedThisTurn, true);
  assert.deepEqual(triangulation.pendingObjectiveIds, ["central-1"]);
  assert.equal(triangulation.actionAvailableThisTurn, false);
  assert.equal(getMissionActionOptions(s, "p1").some((option) => option.definitionId === "primary-triangulation"), false);
});

test("Triangulate objective options exclude the home objective and completed markers", () => {
  const s = state({ round: 3, history: completedTriangulation("central-2", { round: 2, turn: 2, unitId: "runner" }) });
  const options = getTriangulationObjectiveOptions(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(options.some((option) => option.objectiveId === "home"), false);
  assert.equal(options.some((option) => option.objectiveId === "central-2"), false);
  assert.equal(options.some((option) => option.objectiveId === "central-1"), true);
});

test("Round 2 movement after Command cannot retroactively earn the 4 VP control checkpoint", () => {
  const s = state({ round: 2, phase: "movement", controllers: { "central-1": "p1" } });
  const context = strategy(s);
  const objectiveSignal = signal(s, "central-1", { control: "controlled", purpose: "hold-objective" });
  assert.equal(context.commandCheckpointCompleted, true);
  assert.equal(context.controlVpForProjection, 0);
  assert.equal(objectiveSignal.controlVpLeverage, 0);
  assert.equal(objectiveSignal.stagingVpLeverage, 4);
  assert.match(objectiveSignal.reason, /checkpoint|stages/i);
});

test("four controlled objectives meet the 10 VP end-of-battle threshold", () => {
  const s = state({ controllers: { "central-1": "p1", "central-2": "p1", "expansion-1": "p1" } });
  const context = strategy(s);
  assert.equal(context.controlledObjectiveCount, 4);
  assert.equal(context.endgameControlThresholdMet, true);
  assert.equal(context.endgameVpIfThreshold, 10);
});

test("movement routing promotes an untriangulated non-home objective while the action is available", () => {
  const s = state({ round: 2, phase: "movement" });
  const movement = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(movement.primaryStrategy?.missionName, "Triangulation");
  const recommendation = movement.recommendations.find((entry) => entry.purpose === "triangulate-objective");
  assert.ok(recommendation);
  assert.match(recommendation.recommendation, /Triangulate/i);
});

test("the 45 VP Primary game cap removes further Triangulation leverage", () => {
  const s = state({ round: 4, priorPrimaryVp: 45, controllers: { "central-1": "p1", "central-2": "p1", "expansion-1": "p1" } });
  const context = strategy(s);
  const objectiveSignal = signal(s, "expansion-2", { control: "uncontrolled" });
  assert.equal(context.remainingPrimaryGameVp, 0);
  assert.equal(context.nextTriangulationVpLeverage, 0);
  assert.equal(context.endgameVpIfThreshold, 0);
  assert.equal(objectiveSignal.vpLeverage, 0);
});

test("the Action picker requires and labels an eligible Triangulate objective", () => {
  const s = state({ round: 2, phase: "shooting" });
  const html = createMissionActionPicker().render(s, "runner");
  assert.match(html, /Objective to Triangulate/);
  assert.match(html, /Choose eligible objective/);
  assert.match(html, /Central 1/);
  assert.doesNotMatch(html, />Attacker Home</);
});

test("recording Triangulate stores the selected objective and blocks a second use that turn", () => {
  const s = state({ round: 2, phase: "shooting" });
  const next = recordShootingActivation(s, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-triangulation",
    missionInstanceId: "primary:p1:primary-triangulation",
    objectiveId: "central-1",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });
  const event = next.history.at(-1);
  assert.equal(event.type, "shooting.unit_activated");
  assert.equal(event.payload.missionDefinitionId, "primary-triangulation");
  assert.equal(event.payload.objectiveId, "central-1");
  assert.throws(() => recordShootingActivation(next, {
    unitId: "holder",
    actionType: "mission_action",
    actionId: "primary-triangulation",
    missionInstanceId: "primary:p1:primary-triangulation",
    objectiveId: "central-2",
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  }), /active secondary mission Actions|available primary mission Actions|once per turn/i);
});

test("Triangulate fails closed when the home-objective role is unknown", () => {
  const s = state({ round: 2, phase: "shooting", omitRoles: true });
  const triangulation = getTriangulationState(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(triangulation.homeRoleKnown, false);
  assert.equal(triangulation.actionAvailableThisTurn, false);
  assert.deepEqual(getTriangulationObjectiveOptions(s, { playerId: "p1", perspectivePlayerId: "p1" }), []);
});
