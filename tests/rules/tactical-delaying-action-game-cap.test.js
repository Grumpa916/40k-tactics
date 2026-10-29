import test from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryStrategyContext,
  getPrimaryObjectiveStrategySignal
} from "../../src/rules/tactical-primary-strategy-router.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
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
        turn: 100 + index,
        scoreBefore: index * 15,
        scoreAfter: index * 15 + amount
      }
    });
    remaining -= amount;
    index += 1;
  }
  return events;
}

function killEvent(index, turn) {
  return {
    type: "unit.destroyed",
    payload: { turn, unitId: `enemy-${index}`, ownerId: "p2" }
  };
}

function state({ priorPrimaryVp = 0, kills = 0, centralController = "p2", expansionController = "p2" } = {}) {
  const round = 5;
  const turn = 5;
  return {
    phase: "shooting",
    turn,
    activePlayer: "p1",
    battle: { status: "active", round, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Disruption",
        opponentDisposition: "Purge the Foe",
        layout: "A"
      }
    },
    objectives: [
      { id: "event-companion:Attacker Home", layoutObjective: "Attacker Home", position: { x: 50, y: 5 }, control: control("p1") },
      { id: "event-companion:Central 1", layoutObjective: "Central 1", position: { x: 30, y: 22 }, control: control(centralController) },
      { id: "event-companion:Expansion 1", layoutObjective: "Expansion 1", position: { x: 18, y: 14 }, control: control(expansionController) },
      { id: "event-companion:Expansion 2", layoutObjective: "Expansion 2", position: { x: 42, y: 30 }, control: control("p2") },
      { id: "event-companion:Defender Home", layoutObjective: "Defender Home", position: { x: 10, y: 39 }, control: control("p2") }
    ],
    units: [
      { id: "friendly", ownerId: "p1", name: "Friendly", status: "deployed", position: { x: 28, y: 22 }, wounds: 5 },
      { id: "enemy-live", ownerId: "p2", name: "Enemy Live", status: "deployed", position: { x: 34, y: 22 }, wounds: 5 },
      ...Array.from({ length: kills }, (_, index) => ({
        id: `enemy-${index + 1}`,
        ownerId: "p2",
        name: `Enemy ${index + 1}`,
        status: "destroyed",
        position: { x: 40, y: 30 },
        wounds: 0
      }))
    ],
    history: [
      ...priorPrimaryAwards(priorPrimaryVp),
      ...Array.from({ length: kills }, (_, index) => killEvent(index + 1, turn))
    ],
    scoring: { turnSnapshots: [], secondaryMissions: [] },
    victoryPoints: { p1: priorPrimaryVp, p2: 0 },
    commandPoints: { p1: 0, p2: 0 }
  };
}

test("45 Primary VP suppresses further Delaying Action kill leverage", () => {
  const context = getPrimaryStrategyContext(state({ priorPrimaryVp: 45 }), {
    playerId: "p1",
    perspectivePlayerId: "p1",
    targetUnitId: "enemy-live"
  });
  assert.equal(context.additionalPrimaryAllowance, 0);
  assert.equal(context.remainingPrimaryVp, 0);
  assert.equal(context.nextKillVpLeverage, 0);
  assert.ok(context.targetingScore <= 0.05);
  assert.match(context.reason, /no additional Primary VP|no Delaying Action scoring premium/i);
});

test("45 Primary VP suppresses Round 5 objective capture leverage", () => {
  const s = state({ priorPrimaryVp: 45 });
  const context = getPrimaryStrategyContext(s, { playerId: "p1", perspectivePlayerId: "p1" });
  const signal = getPrimaryObjectiveStrategySignal(s, {
    playerId: "p1",
    perspectivePlayerId: "p1",
    objectiveId: "event-companion:Central 1",
    control: "enemy-controlled",
    purpose: "contest-objective",
    primaryStrategy: context
  });
  assert.equal(context.remainingPrimaryVp, 0);
  assert.equal(signal.rawControlVpLeverage, 4);
  assert.equal(signal.controlVpLeverage, 0);
  assert.equal(signal.vpLeverage, 0);
  assert.ok(signal.score < 0.18);
  assert.match(signal.reason, /45 VP Primary game cap/i);
});

test("a projected kill consumes the last two VP of partial game allowance", () => {
  const beforeKill = getPrimaryStrategyContext(state({ priorPrimaryVp: 43, kills: 0 }), {
    playerId: "p1",
    perspectivePlayerId: "p1",
    targetUnitId: "enemy-live"
  });
  assert.equal(beforeKill.additionalPrimaryAllowance, 2);
  assert.equal(beforeKill.nextKillVpLeverage, 2);

  const afterKill = getPrimaryStrategyContext(state({ priorPrimaryVp: 43, kills: 1 }), {
    playerId: "p1",
    perspectivePlayerId: "p1",
    targetUnitId: "enemy-live"
  });
  assert.equal(afterKill.rawRecordedVp, 2);
  assert.equal(afterKill.cappedRecordedVp, 2);
  assert.equal(afterKill.remainingPrimaryVp, 0);
  assert.equal(afterKill.nextKillVpLeverage, 0);
  assert.ok(afterKill.targetingScore <= 0.05);
});
