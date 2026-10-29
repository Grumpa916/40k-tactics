import test from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getMovementStrategicRecommendations as getBaseMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function objective(id, layoutObjective, controllerId, x, y) {
  return { id, name: id, layoutObjective, position: { x, y }, control: control(controllerId) };
}

function unit(id, ownerId, x, y, { move = 6, oc = 2, rosterUnitId = id, battleShocked = false } = {}) {
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

function rosterUnit(id, { move = 6, oc = 2 } = {}) {
  return {
    id,
    loadoutValidation: { status: "valid" },
    datasheet: {
      characteristics: { Move: `${move}\"`, OC: oc, Wounds: 5, Toughness: 5, Save: "3+" },
      weapons: []
    }
  };
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

function commandAwardEvent(round, turn, amount) {
  return {
    id: `outmanoeuvre-command-${round}-${turn}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId: "primary-outmanoeuvre",
      scoringTiming: "command-phase",
      opportunityKey: `${round}:${turn}:p1:command-phase`,
      round,
      turn,
      scoreBefore: 10,
      scoreAfter: 10 + amount
    }
  };
}

function state({
  round = 1,
  phase = "movement",
  centralController = "p1",
  expansionOneController = "p2",
  expansionTwoController = "p2",
  opponentHomeController = "p2",
  nullObjectiveId = null,
  commandAwardAmount = 0,
  priorPrimaryVp = 0,
  runnerBattleShocked = false,
  runnerOc = 3,
  rolesKnown = true
} = {}) {
  const turn = round;
  const objectives = [
    objective("event-companion:Attacker Home", "Attacker Home", "p1", 50, 5),
    objective("event-companion:Expansion 1", "Expansion 1", expansionOneController, 18, 14),
    objective("event-companion:Central 1", "Central 1", centralController, 30, 22),
    objective("event-companion:Expansion 2", "Expansion 2", expansionTwoController, 42, 30),
    objective("event-companion:Defender Home", "Defender Home", opponentHomeController, 10, 39)
  ];
  if (nullObjectiveId) objectives.find((item) => item.id === nullObjectiveId).control = null;

  const history = [
    ...priorPrimaryAwards(priorPrimaryVp),
    ...(commandAwardAmount > 0 ? [commandAwardEvent(round, turn, commandAwardAmount)] : [])
  ];

  return {
    phase,
    turn,
    activePlayer: "p1",
    battle: { status: "active", round, activePlayerId: "p1" },
    preGameSetup: rolesKnown ? { attackerPlayerId: "p1", defenderPlayerId: "p2" } : {},
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Disruption",
        opponentDisposition: "Disruption",
        layout: "A"
      }
    },
    victoryPoints: { p1: priorPrimaryVp + commandAwardAmount, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    objectives,
    units: [
      unit("runner", "p1", 12, 34, { move: 8, oc: runnerOc, rosterUnitId: "r-runner", battleShocked: runnerBattleShocked }),
      unit("holder", "p1", 30, 22, { move: 6, oc: 3, rosterUnitId: "r-holder" }),
      unit("enemy-live", "p2", 15, 38, { rosterUnitId: "r-enemy" })
    ],
    history,
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [
        rosterUnit("r-runner", { move: 8, oc: runnerOc }),
        rosterUnit("r-holder", { move: 6, oc: 3 })
      ] },
      p2: { units: [rosterUnit("r-enemy")] }
    }
  };
}

function strategy(s, options = {}) {
  return getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1", ...options });
}

function signal(s, objectiveId, options = {}) {
  const context = strategy(s);
  return getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId,
    primaryStrategy: context,
    ...options
  });
}

test("Round 1 scores four VP per controlled non-home objective", () => {
  const context = strategy(state({ round: 1, centralController: "p1", expansionOneController: "p1" }));
  assert.equal(context.active, true);
  assert.equal(context.missionName, "Outmanoeuvre");
  assert.equal(context.nonHomeVpEach, 4);
  assert.equal(context.nonHomeControlled, 2);
  assert.equal(context.liveNonHomeVp, 8);
  assert.equal(context.opponentHomeVp, 0);
  assert.equal(context.rawRecordedVp, 8);
  assert.equal(context.cappedRecordedVp, 8);
});

test("the enemy home objective also counts as a non-home objective in Round 1", () => {
  const context = strategy(state({
    round: 1,
    centralController: "p2",
    opponentHomeController: "p1"
  }));
  assert.equal(context.nonHomeControlled, 1);
  assert.equal(context.liveNonHomeVp, 4);
  assert.equal(context.opponentHomeVp, 10);
  assert.equal(context.rawRecordedVp, 14);
  assert.equal(context.cappedRecordedVp, 14);
});

test("enemy home plus another Round 1 non-home objective is capped at fifteen", () => {
  const context = strategy(state({ round: 1, centralController: "p1", opponentHomeController: "p1" }));
  assert.equal(context.rawRecordedVp, 18);
  assert.equal(context.cappedRecordedVp, 15);
  assert.equal(context.remainingRoundCap, 0);
});

test("Round 2 Command phase uses five VP per live non-home objective", () => {
  const context = strategy(state({
    round: 2,
    phase: "command",
    centralController: "p1",
    expansionOneController: "p1"
  }));
  assert.equal(context.commandCheckpointCompleted, false);
  assert.equal(context.nonHomeCheckpointTiming, "end-of-command");
  assert.equal(context.nonHomeVpEach, 5);
  assert.equal(context.nonHomeVpForRoundCap, 10);
  assert.equal(context.rawRecordedVp, 10);
});

test("post-Command live control does not retroactively add Round 2-3 non-home VP", () => {
  const context = strategy(state({
    round: 2,
    phase: "movement",
    centralController: "p1",
    commandAwardAmount: 0
  }));
  assert.equal(context.liveNonHomeVp, 5);
  assert.equal(context.commandCheckpointCompleted, true);
  assert.equal(context.commandAwardAmount, 0);
  assert.equal(context.nonHomeVpForRoundCap, 0);
  assert.equal(context.rawRecordedVp, 0);

  const objectiveSignal = signal(state({
    round: 2,
    phase: "movement",
    centralController: "p2",
    commandAwardAmount: 0
  }), "event-companion:Central 1", { control: "enemy-controlled", purpose: "contest-objective" });
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.equal(objectiveSignal.stagingVpLeverage, 5);
  assert.equal(objectiveSignal.nextCheckpointSetup, true);
  assert.match(objectiveSignal.reason, /cannot score retroactively/i);
});

test("Round 3 post-Command captures stage the Round 4 six-VP checkpoint", () => {
  const s = state({ round: 3, phase: "movement", centralController: "p2" });
  const objectiveSignal = signal(s, "event-companion:Central 1", { control: "enemy-controlled" });
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.equal(objectiveSignal.stagingVpLeverage, 6);
  assert.equal(objectiveSignal.nextCheckpointTiming, "Round 4 end of turn");
});

test("a recorded Round 2 Command award reduces same-turn enemy-home leverage through the round cap", () => {
  const s = state({
    round: 2,
    phase: "movement",
    centralController: "p1",
    commandAwardAmount: 10,
    opponentHomeController: "p2"
  });
  const context = strategy(s);
  const objectiveSignal = signal(s, "event-companion:Defender Home", { control: "enemy-controlled" });
  assert.equal(context.commandAwardAmount, 10);
  assert.equal(context.cappedRecordedVp, 10);
  assert.equal(objectiveSignal.opponentHome, true);
  assert.equal(objectiveSignal.captureVpLeverage, 5);
  assert.equal(objectiveSignal.vpLeverage, 5);
  assert.equal(objectiveSignal.captureProjectedVp, 15);
});

test("Round 4 gives a normal non-home capture six VP of same-turn leverage", () => {
  const s = state({ round: 4, centralController: "p2" });
  const objectiveSignal = signal(s, "event-companion:Central 1", { control: "enemy-controlled" });
  assert.equal(strategy(s).nonHomeVpEach, 6);
  assert.equal(objectiveSignal.rawVpLeverage, 6);
  assert.equal(objectiveSignal.vpLeverage, 6);
});

test("Round 4 enemy-home capture carries sixteen raw VP but only fifteen capped leverage", () => {
  const s = state({ round: 4, centralController: "p2", opponentHomeController: "p2" });
  const objectiveSignal = signal(s, "event-companion:Defender Home", { control: "enemy-controlled" });
  assert.equal(objectiveSignal.opponentHome, true);
  assert.equal(objectiveSignal.rawVpLeverage, 16);
  assert.equal(objectiveSignal.captureVpLeverage, 15);
  assert.equal(objectiveSignal.vpLeverage, 15);
});

test("the player home objective carries no Outmanoeuvre mission leverage", () => {
  const s = state({ round: 4 });
  const objectiveSignal = signal(s, "event-companion:Attacker Home", { control: "controlled", purpose: "hold-objective" });
  assert.equal(objectiveSignal.ownHome, true);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.equal(objectiveSignal.stagingVpLeverage, 0);
  assert.match(objectiveSignal.reason, /does not satisfy either Outmanoeuvre/i);
});

test("missing home roles do not fabricate non-home Outmanoeuvre VP", () => {
  const s = state({ round: 4, rolesKnown: false, centralController: "p1" });
  const context = strategy(s);
  const objectiveSignal = signal(s, "event-companion:Central 1", { control: "controlled" });
  assert.equal(context.playerHomeRoleKnown, false);
  assert.equal(context.objectiveStateKnown, false);
  assert.equal(context.nonHomeControlled, 0);
  assert.equal(context.rawRecordedVp, 0);
  assert.equal(objectiveSignal.nonHome, false);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.equal(objectiveSignal.stagingVpLeverage, 0);
  assert.match(objectiveSignal.reason, /player-confirmed/i);
});

test("incomplete objective control does not fabricate exact Outmanoeuvre VP", () => {
  const s = state({ round: 4, nullObjectiveId: "event-companion:Expansion 2" });
  const context = strategy(s);
  const objectiveSignal = signal(s, "event-companion:Central 1", { control: "controlled" });
  assert.equal(context.objectiveStateKnown, false);
  assert.equal(context.rawRecordedVp, 0);
  assert.equal(context.cappedRecordedVp, 0);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.match(objectiveSignal.reason, /player-confirmed/i);
});

test("Outmanoeuvre never adds a direct kill premium", () => {
  const context = strategy(state({ round: 4, phase: "shooting" }), { targetUnitId: "enemy-live" });
  assert.equal(context.nextKillVpLeverage, 0);
  assert.equal(context.targetingScore, 0.05);
  assert.match(context.assumptions.join(" "), /no direct kill-scoring condition/i);
});

test("the 45 VP Primary game cap suppresses enemy-home capture leverage", () => {
  const s = state({
    round: 5,
    centralController: "p2",
    opponentHomeController: "p2",
    priorPrimaryVp: 45
  });
  const context = strategy(s);
  const objectiveSignal = signal(s, "event-companion:Defender Home", { control: "enemy-controlled" });
  assert.equal(context.remainingPrimaryGameVp, 0);
  assert.equal(context.additionalPrimaryAllowance, 0);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.ok(objectiveSignal.score <= 0.05);
  assert.match(objectiveSignal.reason, /45 VP Primary game cap/i);
});

test("Movement routing can elevate the opponent home objective for a usable-OC formation", () => {
  const s = state({ round: 4, centralController: "p2", opponentHomeController: "p2" });
  const routed = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(routed.primaryStrategy?.missionName, "Outmanoeuvre");
  const runner = routed.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  assert.equal(runner.primaryStrategySignal?.opponentHome, true);
  assert.equal(runner.objectiveId, "event-companion:Defender Home");
  assert.match(runner.recommendation, /opponent home/i);
});

test("Battle-shocked formations do not receive Outmanoeuvre-specific Movement elevation", () => {
  const s = state({ round: 4, centralController: "p2", opponentHomeController: "p2", runnerBattleShocked: true });
  const base = getBaseMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const routed = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const baseRunner = base.recommendations.find((item) => item.unitId === "runner");
  const routedRunner = routed.recommendations.find((item) => item.unitId === "runner");
  assert.ok(baseRunner && routedRunner);
  assert.equal(routedRunner.score, baseRunner.score);
  assert.equal(routedRunner.objectiveId, baseRunner.objectiveId);
});

test("zero-OC formations do not receive Outmanoeuvre-specific Movement elevation", () => {
  const s = state({ round: 4, centralController: "p2", opponentHomeController: "p2", runnerOc: 0 });
  const base = getBaseMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const routed = getMovementStrategicRecommendations(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const baseRunner = base.recommendations.find((item) => item.unitId === "runner");
  const routedRunner = routed.recommendations.find((item) => item.unitId === "runner");
  assert.ok(baseRunner && routedRunner);
  assert.equal(routedRunner.score, baseRunner.score);
  assert.equal(routedRunner.objectiveId, baseRunner.objectiveId);
});
