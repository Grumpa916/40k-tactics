import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getMissionActionOptions } from "../../src/rules/mission-action-state.js";
import { getTriangulationObjectiveOptions, getTriangulationState } from "../../src/rules/triangulation-state.js";
import { getPrimaryObjectiveStrategySignal, getPrimaryStrategyContext } from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function rosterUnit(id, { move = 8, oc = 2 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: [{ name: "test gun", type: "ranged", range: "24\"", attacks: 1, skill: "3+", strength: 4, ap: 0, damage: 1 }]
    }
  };
}

function unit(id, ownerId, position, { move = 8, oc = 2, status = "deployed", battleShocked = false } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status,
    battleShocked,
    position: { ...position },
    wounds: status === "destroyed" ? 0 : 5,
    startingStrength: 1,
    currentStrength: status === "destroyed" ? 0 : 1,
    startingWounds: 5,
    metadata: { rosterUnitId: `r-${id}`, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function priorPrimaryAwards(total) {
  const result = [];
  let remaining = total;
  let index = 0;
  while (remaining > 0) {
    const amount = Math.min(15, remaining);
    result.push({
      id: `prior-primary-${index}`,
      type: "victory_points.awarded",
      payload: {
        playerId: "p1",
        amount,
        category: "primary",
        missionDefinitionId: `prior-${index}`,
        scoringTiming: "end-of-turn",
        opportunityKey: `prior:${index}`,
        round: index + 1,
        turn: 40 + index,
        scoreBefore: index * 15,
        scoreAfter: index * 15 + amount
      }
    });
    remaining -= amount;
    index += 1;
  }
  return result;
}

function triangulationAttempt(objectiveId, { round = 2, turn = round, unitId = "runner" } = {}) {
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

function state({
  round = 2,
  phase = "shooting",
  history = [],
  controllers = {},
  priorPrimaryVp = 0,
  omitRoles = false
} = {}) {
  const map = getEventCompanionMapForForceDispositions("Triangulation", "Triangulation", "A");
  assert.ok(map, "Triangulation Layout A geometry must exist");
  const positions = map.objectivePositions;
  const objectives = [
    ["home-p1", "Attacker Home"],
    ["central-1", "Central 1"],
    ["central-2", "Central 2"],
    ["expansion-1", "Expansion 1"],
    ["expansion-2", "Expansion 2"],
    ["home-p2", "Defender Home"]
  ].map(([id, name]) => ({
    id,
    name,
    layoutObjective: name,
    position: { ...positions[name] },
    control: control(controllers[id] ?? null)
  }));
  const units = [
    unit("runner", "p1", positions["Central 1"]),
    unit("holder", "p1", positions["Central 2"]),
    unit("enemy", "p2", positions["Defender Home"])
  ];
  return {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    ...(omitRoles ? {} : { preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" } }),
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Triangulation", opponentDisposition: "Triangulation", layout: "A" } },
    objectives,
    units,
    history: [...priorPrimaryAwards(priorPrimaryVp), ...history],
    victoryPoints: { p1: priorPrimaryVp, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner"), rosterUnit("r-holder")] },
      p2: { units: [rosterUnit("r-enemy")] }
    }
  };
}

function strategy(s) {
  return getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
}

function signal(s, objectiveId, overrides = {}) {
  return getPrimaryObjectiveStrategySignal(s, objectiveId, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    ...overrides
  });
}

test("Triangulation routes to its dedicated strategy and exposes valid mission Action", () => {
  const s = state();
  const context = strategy(s);
  assert.equal(context.missionId, "primary-triangulation");
  assert.equal(context.homeRoleKnown, true);
  assert.equal(context.actionAvailableThisTurn, true);
  assert.ok(getMissionActionOptions(s, "p1").some((item) => item.definitionId === "primary-triangulation"));
});

test("Triangulation counts only completed unique non-home objectives", () => {
  const history = [
    triangulationAttempt("central-1", { round: 1, turn: 1 }),
    { type: "mission_action.reviewed", payload: { actionKey: "1:1:runner", playerId: "p1", checkpoint: "end-of-turn", outcome: "completed", missionInstanceId: "primary:p1:primary-triangulation", round: 1, turn: 1 } },
    triangulationAttempt("central-1", { round: 2, turn: 2, unitId: "holder" }),
    { type: "mission_action.reviewed", payload: { actionKey: "2:2:holder", playerId: "p1", checkpoint: "end-of-turn", outcome: "completed", missionInstanceId: "primary:p1:primary-triangulation", round: 2, turn: 2 } },
    triangulationAttempt("central-2", { round: 3, turn: 3, unitId: "runner" }),
    { type: "mission_action.reviewed", payload: { actionKey: "3:3:runner", playerId: "p1", checkpoint: "end-of-turn", outcome: "failed", missionInstanceId: "primary:p1:primary-triangulation", round: 3, turn: 3 } }
  ];
  const context = strategy(state({ round: 4, history }));
  assert.equal(context.triangulatedCount, 1);
  assert.deepEqual(context.triangulatedObjectiveIds, ["central-1"]);
});

test("Triangulation signals prioritize untriangulated non-home objectives", () => {
  const s = state({ round: 2 });
  const central = signal(s, "central-1", { control: "uncontrolled" });
  const home = signal(s, "home-p1", { control: "friendly" });
  assert.equal(central.missionRelevant, true);
  assert.equal(central.canTriangulate, true);
  assert.ok(central.vpLeverage > 0);
  assert.equal(home.canTriangulate, false);
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
  }), /active secondary mission Actions|available primary mission Action|once per turn/i);
});

test("Triangulate fails closed when the home-objective role is unknown", () => {
  const s = state({ round: 2, phase: "shooting", omitRoles: true });
  const triangulation = getTriangulationState(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(triangulation.homeRoleKnown, false);
  assert.equal(triangulation.actionAvailableThisTurn, false);
  assert.deepEqual(getTriangulationObjectiveOptions(s, { playerId: "p1", perspectivePlayerId: "p1" }), []);
});

test("Triangulation implementation remains source-bounded to Primary strategy wiring", () => {
  const source = readFileSync(new URL("../../src/rules/triangulation-state.js", import.meta.url), "utf8");
  assert.match(source, /primary-triangulation/);
  assert.doesNotMatch(source, /secondary-/);
});
