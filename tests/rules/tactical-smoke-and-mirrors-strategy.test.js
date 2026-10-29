import test from "node:test";
import assert from "node:assert/strict";
import { getEventCompanionMapForForceDispositions } from "../../src/rules/event-companion-map-catalog.js";
import { getTerritoryStatusForPosition } from "../../src/rules/battlefield-territory.js";
import {
  getSmokeAndMirrorsState,
  getSmokeAndMirrorsObjectiveOptions
} from "../../src/rules/smoke-and-mirrors-state.js";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";
import { getMovementStrategicRecommendations } from "../../src/rules/tactical-movement-router.js";
import { getMovementStrategicRecommendations as getBaseMovementStrategicRecommendations } from "../../src/rules/tactical-movement-opportunities.js";
import { createMissionActionPicker } from "../../src/ui/mission-action-picker.js";
import { recordShootingActivation } from "../../src/engine/shooting-transitions.js";

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

function decoyAttempt(objectiveId, { round = 1, turn = round, unitId = `decoy-${objectiveId}` } = {}) {
  return {
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
  };
}

function decoyReview(objectiveId, { round = 1, turn = round, unitId = `decoy-${objectiveId}`, outcome = "completed" } = {}) {
  return {
    type: "mission_action.reviewed",
    payload: {
      actionKey: `${round}:${turn}:${unitId}`,
      playerId: "p1",
      checkpoint: "end-of-turn",
      outcome,
      missionInstanceId: "primary:p1:primary-smoke-and-mirrors",
      round,
      turn
    }
  };
}

function completedDecoy(objectiveId, options = {}) {
  return [decoyAttempt(objectiveId, options), decoyReview(objectiveId, options)];
}

function removedDecoy(objectiveId, { round = 2, turn = round } = {}) {
  return {
    type: "mission_marker.removed",
    payload: {
      markerType: "smoke-and-mirrors-decoy",
      ownerPlayerId: "p1",
      objectiveId,
      playerId: "p2",
      round,
      turn
    }
  };
}

function commandAward(round, amount = 4) {
  return {
    id: `smoke-command-${round}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount,
      category: "primary",
      missionDefinitionId: "primary-smoke-and-mirrors",
      scoringTiming: "command-phase",
      opportunityKey: `${round}:${round}:p1:command-phase`,
      round,
      turn: round,
      scoreBefore: 0,
      scoreAfter: amount
    }
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
  return result;
}

function seed({
  round = 2,
  phase = "movement",
  history = [],
  runnerBattleShocked = false,
  runnerOc = 3,
  controlledObjectiveId = null,
  omitRoles = false
} = {}) {
  const map = getEventCompanionMapForForceDispositions("Disruption", "Reconnaissance", "A");
  assert.ok(map, "Smoke and Mirrors Layout A geometry must exist");
  const objectives = Object.entries(map.objectivePositions).map(([label, position]) => ({
    id: `event-companion:${label}`,
    name: label,
    layoutObjective: label,
    position: { ...position },
    control: control(
      label === "Attacker Home" ? "p1" :
      controlledObjectiveId === `event-companion:${label}` ? "p1" :
      label === "Defender Home" ? "p2" : null
    )
  }));
  const enemyHome = objectives.find((objective) => objective.layoutObjective === "Defender Home");
  const friendlyHome = objectives.find((objective) => objective.layoutObjective === "Attacker Home");
  assert.ok(enemyHome && friendlyHome);
  const other = objectives.find((objective) => ![friendlyHome.id, enemyHome.id].includes(objective.id));
  assert.ok(other);
  const state = {
    phase,
    turn: round,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: omitRoles ? {} : { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: { missionSetup: { myDisposition: "Disruption", opponentDisposition: "Reconnaissance", layout: "A" } },
    objectives,
    units: [
      unit("runner", "p1", enemyHome.position, { move: 8, oc: runnerOc, battleShocked: runnerBattleShocked, rosterUnitId: "r-runner" }),
      unit("holder", "p1", other.position, { move: 6, oc: 3, rosterUnitId: "r-holder" }),
      unit("enemy", "p2", { x: 30, y: 22 }, { move: 6, oc: 2, rosterUnitId: "r-enemy" })
    ],
    history: [...history],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 2, p2: 2 },
    scoring: {
      turnSnapshots: [],
      secondaryMissions: [],
      secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" }
    },
    armyRosters: {
      p1: { units: [rosterUnit("r-runner", { move: 8, oc: runnerOc }), rosterUnit("r-holder", { move: 6, oc: 3 })] },
      p2: { units: [rosterUnit("r-enemy", { move: 6, oc: 2 })] }
    }
  };
  return { state, map, friendlyHome, enemyHome, other };
}

function strategy(state, options = {}) {
  return getPrimaryStrategyContext(state, { playerId: "p1", perspectivePlayerId: "p1", ...options });
}

function signal(state, objectiveId, options = {}) {
  const primaryStrategy = strategy(state);
  return getPrimaryObjectiveStrategySignal(state, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId,
    primaryStrategy,
    ...options
  });
}

test("completed Decoys persist into later turns and enemy-territory Decoys score four raw VP", () => {
  const { state, enemyHome } = seed({ round: 3 });
  state.history.push(...completedDecoy(enemyHome.id, { round: 1, turn: 1, unitId: "marker-a" }));
  const decoys = getSmokeAndMirrorsState(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.deepEqual(decoys.decoyObjectiveIds, [enemyHome.id]);
  assert.deepEqual(decoys.enemyTerritoryDecoyObjectiveIds, [enemyHome.id]);
  assert.equal(decoys.recurringDecoyVp, 4);
  assert.equal(decoys.decoysNeededForEndgame, 3);
});

test("an Action attempt is not a Decoy until its end-turn review is completed", () => {
  const { state, enemyHome } = seed({ round: 2, phase: "shooting" });
  state.history.push(decoyAttempt(enemyHome.id, { round: 2, turn: 2, unitId: "runner" }));
  const decoys = getSmokeAndMirrorsState(state, { playerId: "p1" });
  assert.equal(decoys.decoyCount, 0);
  assert.deepEqual(decoys.pendingObjectiveIds, [enemyHome.id]);
});

test("a failed Decoy review never creates a persistent marker", () => {
  const { state, enemyHome } = seed({ round: 2 });
  state.history.push(
    decoyAttempt(enemyHome.id, { round: 2, unitId: "runner" }),
    decoyReview(enemyHome.id, { round: 2, unitId: "runner", outcome: "failed" })
  );
  assert.equal(getSmokeAndMirrorsState(state, { playerId: "p1" }).decoyCount, 0);
});

test("recorded marker removal clears a persistent Decoy and makes the objective eligible again", () => {
  const { state, enemyHome } = seed({ round: 3 });
  state.history.push(
    ...completedDecoy(enemyHome.id, { round: 1, unitId: "marker-a" }),
    removedDecoy(enemyHome.id, { round: 2 })
  );
  const decoys = getSmokeAndMirrorsState(state, { playerId: "p1" });
  assert.equal(decoys.decoyCount, 0);
  assert.ok(getSmokeAndMirrorsObjectiveOptions(state, { playerId: "p1" }).some((item) => item.objectiveId === enemyHome.id));
});

test("Decoy picker options exclude your home objective, existing Decoys and same-turn pending targets", () => {
  const { state, friendlyHome, enemyHome, other } = seed({ round: 2, phase: "shooting" });
  state.history.push(
    ...completedDecoy(enemyHome.id, { round: 1, turn: 1, unitId: "marker-a" }),
    decoyAttempt(other.id, { round: 2, turn: 2, unitId: "holder" })
  );
  const optionIds = getSmokeAndMirrorsObjectiveOptions(state, { playerId: "p1" }).map((item) => item.objectiveId);
  assert.equal(optionIds.includes(friendlyHome.id), false);
  assert.equal(optionIds.includes(enemyHome.id), false);
  assert.equal(optionIds.includes(other.id), false);
  const html = createMissionActionPicker().render(state, "runner");
  assert.doesNotMatch(html, new RegExp(`value=["']${friendlyHome.id}["']`));
  assert.doesNotMatch(html, new RegExp(`value=["']${enemyHome.id}["']`));
  assert.doesNotMatch(html, new RegExp(`value=["']${other.id}["']`));
  assert.match(html, /Objective to Decoy/);
});

test("Shooting engine rejects your home objective and duplicate same-turn Decoy targets", () => {
  const { state, friendlyHome, enemyHome } = seed({ round: 2, phase: "shooting" });
  assert.throws(() => recordShootingActivation(state, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-smoke-and-mirrors",
    missionInstanceId: "primary:p1:primary-smoke-and-mirrors",
    objectiveId: friendlyHome.id,
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  }), /non-home objective/i);

  const first = recordShootingActivation(state, {
    unitId: "runner",
    actionType: "mission_action",
    actionId: "primary-smoke-and-mirrors",
    missionInstanceId: "primary:p1:primary-smoke-and-mirrors",
    objectiveId: enemyHome.id,
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  });
  const secondRunner = {
    ...first,
    units: first.units.map((entry) => entry.id === "holder" ? { ...entry } : entry)
  };
  assert.throws(() => recordShootingActivation(secondRunner, {
    unitId: "holder",
    actionType: "mission_action",
    actionId: "primary-smoke-and-mirrors",
    missionInstanceId: "primary:p1:primary-smoke-and-mirrors",
    objectiveId: enemyHome.id,
    reviewTiming: "end-of-turn",
    rulesConfirmed: true
  }), /not already Decoyed|another Decoy attempt/i);
});

test("Round 2-4 post-Command live control does not retroactively fabricate the four VP control award", () => {
  const base = seed({ round: 3, phase: "movement" });
  const target = base.other.id;
  base.state.objectives.find((objective) => objective.id === target).control = control("p1");
  const context = strategy(base.state);
  assert.equal(context.commandCheckpointCompleted, true);
  assert.equal(context.liveControlVp, 4);
  assert.equal(context.commandAwardAmount, 0);
  assert.equal(context.controlVpForRoundCap, 0);
  assert.equal(context.rawRecordedVp, 0);
  const objectiveSignal = signal(base.state, target, { control: "controlled" });
  assert.equal(objectiveSignal.stagingVpLeverage, 4);
});

test("a recorded Command award remains in the current turn cap projection after Movement begins", () => {
  const { state, other } = seed({ round: 3, phase: "movement", controlledObjectiveId: null });
  state.history.push(commandAward(3, 4));
  const context = strategy(state);
  assert.equal(context.commandAwardAmount, 4);
  assert.equal(context.controlVpForRoundCap, 4);
  assert.equal(context.cappedRecordedVp, 4);
  assert.equal(signal(state, other.id).stagingVpLeverage, 4);
});

test("Round 5 movement can create the same-turn four VP non-home control condition", () => {
  const { state, other } = seed({ round: 5, phase: "movement" });
  const objectiveSignal = signal(state, other.id, { control: "uncontrolled" });
  assert.equal(strategy(state).commandCheckpointCompleted, false);
  assert.equal(objectiveSignal.controlVpLeverage, 4);
});

test("the fourth Decoy exposes the separate ten VP endgame threshold without adding it to the round cap", () => {
  const { state, friendlyHome } = seed({ round: 4, phase: "movement" });
  const eligible = state.objectives.filter((objective) => objective.id !== friendlyHome.id).slice(0, 4);
  state.history.push(...eligible.slice(0, 3).flatMap((objective, index) => completedDecoy(objective.id, { round: index + 1, turn: index + 1, unitId: `marker-${index}` })));
  const fourth = eligible[3];
  const context = strategy(state);
  const objectiveSignal = signal(state, fourth.id);
  assert.equal(context.decoyCount, 3);
  assert.ok(objectiveSignal.endgameVpLeverage > 0);
  assert.ok(objectiveSignal.endgameVpLeverage <= 10);
  assert.equal(context.rawRecordedVp, context.recurringDecoyVp + context.controlVpForRoundCap);
});

test("four persistent Decoys establish the endgame threshold and retain a separate endgame projection", () => {
  const { state, friendlyHome } = seed({ round: 5, phase: "movement" });
  const targets = state.objectives.filter((objective) => objective.id !== friendlyHome.id).slice(0, 4);
  state.history.push(...targets.flatMap((objective, index) => completedDecoy(objective.id, { round: Math.min(index + 1, 4), turn: Math.min(index + 1, 4), unitId: `marker-${index}` })));
  const context = strategy(state);
  assert.equal(context.decoyCount, 4);
  assert.equal(context.endgameThresholdMet, true);
  assert.ok(context.endgameVpIfThreshold > 0);
  assert.ok(context.cappedRecordedVp <= 15);
});

test("the 45 VP Primary game cap suppresses Decoy, control and endgame leverage", () => {
  const { state, enemyHome } = seed({ round: 5, phase: "movement" });
  state.history.push(...priorPrimaryAwards(45));
  const context = strategy(state);
  const objectiveSignal = signal(state, enemyHome.id);
  assert.equal(context.remainingPrimaryGameVp, 0);
  assert.equal(context.cappedRecordedVp, 0);
  assert.equal(context.endgameVpIfThreshold, 0);
  assert.equal(objectiveSignal.vpLeverage, 0);
  assert.equal(objectiveSignal.endgameVpLeverage, 0);
  assert.ok(objectiveSignal.score <= 0.05);
});

test("territory uncertainty never invents the cumulative plus-two Decoy bonus", () => {
  const { state } = seed({ round: 2 });
  const uncertain = state.objectives.find((objective) => {
    const territory = getTerritoryStatusForPosition(state, { playerId: "p1", position: objective.position });
    return territory.territory === "boundary";
  });
  if (!uncertain) return;
  state.history.push(...completedDecoy(uncertain.id, { round: 1, unitId: "boundary-marker" }));
  const decoys = getSmokeAndMirrorsState(state, { playerId: "p1" });
  assert.equal(decoys.enemyTerritoryDecoyObjectiveIds.includes(uncertain.id), false);
  assert.equal(decoys.recurringDecoyVp, 2);
});

test("missing attacker/defender home roles fail closed for Decoy eligibility and exact non-home scoring", () => {
  const { state, enemyHome } = seed({ round: 4, omitRoles: true });
  state.history.push(...completedDecoy(enemyHome.id, { round: 1, unitId: "marker-a" }));
  const context = strategy(state);
  assert.equal(context.homeRoleKnown, false);
  assert.deepEqual(getSmokeAndMirrorsObjectiveOptions(state, { playerId: "p1" }), []);
  const objectiveSignal = signal(state, enemyHome.id);
  assert.equal(objectiveSignal.decoyActionVpLeverage, 0);
  assert.equal(objectiveSignal.controlVpLeverage, 0);
});

test("Smoke and Mirrors never adds a direct kill premium", () => {
  const { state } = seed({ round: 4, phase: "shooting" });
  const context = strategy(state, { targetUnitId: "enemy" });
  assert.equal(context.nextKillVpLeverage, 0);
  assert.equal(context.targetingScore, 0.05);
  assert.match(context.assumptions.join(" "), /no direct kill-scoring condition/i);
});

test("Movement routing surfaces a high-value enemy-territory Decoy play for usable OC", () => {
  const { state, enemyHome } = seed({ round: 2, phase: "movement" });
  const routed = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
  assert.equal(routed.primaryStrategy?.missionName, "Smoke and Mirrors");
  const runner = routed.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  const options = [runner, ...(runner.alternatives ?? [])];
  const decoyOption = options.find((item) => item.objectiveId === enemyHome.id && item.primaryStrategySignal?.enemyTerritory);
  assert.ok(decoyOption);
  assert.ok(decoyOption.primaryStrategySignal.decoyActionVpLeverage > 0 || decoyOption.primaryStrategySignal.endgameVpLeverage > 0);
});

test("Battle-shocked and zero-OC formations receive no Smoke and Mirrors Movement elevation", () => {
  for (const settings of [{ runnerBattleShocked: true, runnerOc: 3 }, { runnerBattleShocked: false, runnerOc: 0 }]) {
    const { state } = seed({ round: 2, phase: "movement", ...settings });
    const base = getBaseMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
    const routed = getMovementStrategicRecommendations(state, { playerId: "p1", perspectivePlayerId: "p1" });
    const baseRunner = base.recommendations.find((item) => item.unitId === "runner");
    const routedRunner = routed.recommendations.find((item) => item.unitId === "runner");
    assert.ok(baseRunner && routedRunner);
    assert.equal(routedRunner.score, baseRunner.score);
    assert.equal(routedRunner.objectiveId, baseRunner.objectiveId);
  }
});
