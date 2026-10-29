import test from "node:test";
import assert from "node:assert/strict";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { getPrimaryStrategyContext, getPrimaryObjectiveStrategySignal } from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations as getBaseMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function rosterUnit(id, { move = 8, oc = 3 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: []
    }
  };
}

function unit(id, ownerId, position, { move = 8, oc = 3, battleShocked = false, rosterUnitId = id } = {}) {
  return {
    id,
    ownerId,
    name: id,
    status: "deployed",
    position: { ...position },
    battleShocked,
    wounds: 5,
    startingStrength: 1,
    currentStrength: 1,
    startingWounds: 5,
    metadata: { rosterUnitId, modelCount: 1 },
    profile: { characteristics: { movement: move, objectiveControl: oc, toughness: 5, save: 3, wounds: 5 } }
  };
}

function completedDecoy(objectiveId, { round = 1, turn = round, unitId = `decoy-${objectiveId}` } = {}) {
  return [
    {
      type: "shooting.unit_activated",
      payload: {
        unitId,
        playerId: "p1",
        round,
        turn,
        actionType: "mission_action",
        actionId: "primary-smoke-and-mirrors",
        missionInstanceId: "primary:p1:primary-smoke-and-mirrors",
        missionDefinitionId: "primary-smoke-and-mirrors",
        missionName: "Smoke and Mirrors — Decoy",
        reviewTiming: "end-of-turn",
        objectiveId,
        rulesConfirmed: true
      }
    },
    {
      type: "mission_action.reviewed",
      payload: {
        actionKey: `${round}:${turn}:${unitId}`,
        playerId: "p1",
        checkpoint: "end-of-turn",
        outcome: "completed",
        missionInstanceId: "primary:p1:primary-smoke-and-mirrors",
        round,
        turn
      }
    }
  ];
}

function priorPrimaryAwards(total) {
  const events = [];
  let remaining = total;
  let index = 0;
  while (remaining > 0) {
    const amount = Math.min(15, remaining);
    events.push({
      id: `prior-primary-${index}`,
      type: "victory_points.awarded",
      payload: {
        playerId: "p1",
        amount,
        category: "primary",
        missionDefinitionId: `prior-primary-${index}`,
        opportunityKey: `prior:${index}`,
        scoringTiming: "end-of-turn",
        round: index + 1,
        turn: 50 + index,
        scoreBefore: index * 15,
        scoreAfter: index * 15 + amount
      }
    });
    remaining -= amount;
    index += 1;
  }
  return events;
}

function seed({ round = 4, phase = "movement", runnerBattleShocked = false, runnerOc = 3 } = {}) {
  const map = getEventCompanionMapForForceDispositions("Disruption", "Reconnaissance", "A");
  assert.ok(map);
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(label === "Attacker Home" ? "p1" : label === "Defender Home" ? "p2" : null)
  }));
  const friendlyHome = objectives.find((objective) => objective.layoutObjective === "Attacker Home");
  const enemyHome = objectives.find((objective) => objective.layoutObjective === "Defender Home");
  const nonHome = objectives.filter((objective) => objective.id !== friendlyHome.id);
  assert.ok(friendlyHome && enemyHome && nonHome.length >= 4);

  return {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Disruption", opponentDisposition: "Reconnaissance", layout: "A" } },
    objectives,
    units: [
      unit("runner", "p1", enemyHome.position, { move: 8, oc: runnerOc, battleShocked: runnerBattleShocked, rosterUnitId: "r-runner" }),
      unit("holder", "p1", nonHome[1].position, { move: 6, oc: 3, rosterUnitId: "r-holder" }),
      unit("enemy", "p2", { x: 30, y: 22 }, { move: 6, oc: 2, rosterUnitId: "r-enemy" })
    ],
    history: [],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner", { move: 8, oc: runnerOc }), rosterUnit("r-holder", { move: 6, oc: 3 })] },
      p2: { units: [rosterUnit("r-enemy", { move: 6, oc: 2 })] }
    }
  };
}

function strategy(state) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1" });
}

function signal(state, objectiveId) {
  const primaryStrategy = strategy(state);
  return getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId,
    primaryStrategy
  });
}

test("fourth Decoy reserves its same-turn VP before projecting endgame game-cap leverage", () => {
  const state = seed({ round: 4, phase: "movement" });
  const friendlyHome = state.objectives.find((objective) => objective.layoutObjective === "Attacker Home");
  const eligible = state.objectives.filter((objective) => objective.id !== friendlyHome.id).slice(0, 4);
  state.history.push(...eligible.slice(0, 3).flatMap((objective, index) =>
    completedDecoy(objective.id, { round: index + 1, turn: index + 1, unitId: `marker-${index}` })));

  const beforeCap = strategy(state);
  assert.equal(beforeCap.decoyCount, 3);
  const priorVp = 45 - beforeCap.recurringDecoyVp - 1;
  assert.ok(priorVp >= 0);
  state.history.push(...priorPrimaryAwards(priorVp));

  const fourthSignal = signal(state, eligible[3].id);
  assert.equal(fourthSignal.prospectiveSameTurnGain, 1);
  assert.equal(fourthSignal.remainingGameAfterProspective, 0);
  assert.equal(fourthSignal.endgameVpLeverage, 0);
});

test("post-Command binary control staging is not multiplied across extra non-home objectives", () => {
  const state = seed({ round: 3, phase: "movement" });
  const friendlyHome = state.objectives.find((objective) => objective.layoutObjective === "Attacker Home");
  const nonHome = state.objectives.filter((objective) => objective.id !== friendlyHome.id);
  nonHome[0].control = control("p1");
  nonHome[1].control = control("p1");

  const existingA = signal(state, nonHome[0].id);
  const existingB = signal(state, nonHome[1].id);
  const extra = signal(state, nonHome[2].id);
  assert.equal(existingA.stagingVpLeverage, 0);
  assert.equal(existingB.stagingVpLeverage, 0);
  assert.equal(extra.stagingVpLeverage, 0);
});

test("base Movement scorer applies zero Smoke premium to Battle-shocked or zero-OC formations", () => {
  for (const settings of [
    { runnerBattleShocked: true, runnerOc: 3 },
    { runnerBattleShocked: false, runnerOc: 0 }
  ]) {
    const state = seed({ round: 2, phase: "movement", ...settings });
    const friendlyHome = state.objectives.find((objective) => objective.layoutObjective === "Attacker Home");
    const enemyHome = state.objectives.find((objective) => objective.layoutObjective === "Defender Home");
    assert.ok(friendlyHome && enemyHome);
    state.objectives = [friendlyHome, enemyHome];
    state.units = state.units.filter((item) => item.id === "runner");
    const base = getBaseMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
    const runner = base.recommendations.find((item) => item.unitId === "runner");
    assert.ok(runner);
    const candidates = [runner, ...(runner.alternatives ?? [])];
    const smokeObjective = candidates.find((item) => item.kind === "objective" && item.objectiveId === enemyHome.id && item.primaryStrategySignal?.active === true);
    assert.ok(smokeObjective, "expected the enemy-home Smoke and Mirrors objective candidate in base Movement output");
    assert.ok(smokeObjective.primaryStrategySignal.score > 0, "strategy signal should exist so this proves score suppression rather than signal absence");
    assert.equal(smokeObjective.primaryStrategyScoreApplied, 0);
    assert.match(smokeObjective.reason, /bonuses are suppressed|no usable OC/i);
  }
});