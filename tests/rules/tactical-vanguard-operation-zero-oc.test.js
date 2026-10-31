import test from "node:test";
import assert from "node:assert/strict";
import { enhanceVanguardOperationMovementRecommendations } from "../../src/rules/tactical-vanguard-operation-movement.js";

function control(controllerId) {
  return controllerId == null
    ? { controlState: "uncontrolled", controllerId: null, contestingPlayerIds: [] }
    : { controlState: "controlled", controllerId, contestingPlayerIds: [] };
}

function state() {
  return {
    phase: "movement",
    turn: 5,
    activePlayer: "p1",
    battle: { id: "b", status: "active", round: 5, activePlayerId: "p1", firstPlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: { myDisposition: "Priority Assets", opponentDisposition: "Reconnaissance", layout: "A" }
    },
    objectives: [
      {
        id: "home-p1",
        name: "Attacker Home",
        layoutObjective: "Attacker Home",
        position: { x: 7, y: 22 },
        control: control("p1")
      },
      {
        id: "central-1",
        name: "Central 1",
        layoutObjective: "Central 1",
        position: { x: 30, y: 22 },
        control: control("p1")
      },
      {
        id: "home-p2",
        name: "Defender Home",
        layoutObjective: "Defender Home",
        position: { x: 53, y: 22 },
        control: control("p2")
      }
    ],
    units: [
      {
        id: "runner",
        ownerId: "p1",
        name: "Runner",
        status: "deployed",
        position: { x: 52, y: 22 },
        battleShocked: true,
        wounds: 5,
        startingStrength: 1,
        currentStrength: 1,
        startingWounds: 5,
        metadata: { modelCount: 1 },
        profile: { characteristics: { movement: 8, objectiveControl: 2, toughness: 5, save: 3, wounds: 5 } }
      }
    ],
    history: [
      {
        type: "shooting.unit_activated",
        payload: {
          unitId: "runner",
          playerId: "p1",
          round: 5,
          turn: 5,
          actionType: "mission_action",
          actionId: "primary-vanguard-operation",
          missionDefinitionId: "primary-vanguard-operation",
          terrainAreaId: "terrain-test",
          reviewTiming: "end-of-turn"
        }
      }
    ],
    victoryPoints: { p1: 0, p2: 0 },
    commandPoints: { p1: 0, p2: 0 },
    scoring: { turnSnapshots: [], secondaryMissions: [] }
  };
}

test("Battle-shocked zero-OC units do not get elevated for Vanguard Operation opponent-home endgame scoring", () => {
  const base = Object.freeze({
    playerId: "p1",
    recommendations: Object.freeze([
      Object.freeze({
        unitId: "runner",
        unitName: "Runner",
        score: 0.5,
        priority: 3,
        purpose: "reposition",
        confidence: "moderate",
        actionHint: "Keep the unit flexible",
        objectiveId: null,
        objectiveName: null,
        terrainAreaId: null,
        targetUnitId: null,
        targetName: null,
        territoryTarget: null,
        distance: null,
        strategicContext: null,
        primaryStrategySignal: null,
        movement: 8,
        battleShocked: true,
        effectiveOc: 0,
        recommendation: "Runner: keep the current flexible movement plan.",
        reason: "A useful non-control movement plan is already available.",
        alternatives: Object.freeze([])
      })
    ])
  });

  const result = enhanceVanguardOperationMovementRecommendations(state(), base, {
    playerId: "p1",
    perspectivePlayerId: "p1"
  });
  const runner = result.recommendations.find((item) => item.unitId === "runner");
  assert.ok(runner);
  assert.equal(runner.purpose, "reposition");
  assert.equal(runner.score, 0.5);

  const opponentHome = (runner.alternatives ?? []).find((item) => item.objectiveId === "home-p2");
  assert.ok(opponentHome, "expected opponent-home Vanguard option to remain visible as a low-priority alternative");
  assert.equal(opponentHome.primaryStrategySignal?.endgameVpLeverage, 10);
  assert.equal(opponentHome.score <= 0.22, true);
  assert.match(opponentHome.actionHint, /effective OC|control-dependent/i);
  assert.match(opponentHome.reason, /no reliable effective OC|control-dependent/i);
});
