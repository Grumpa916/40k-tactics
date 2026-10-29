import test from "node:test";
import assert from "node:assert/strict";
import {
  getReconnaissanceSweepQuarterState
} from "../../src/rules/tactical-reconnaissance-sweep-strategy.js";
import {
  enhanceReconnaissanceSweepMovementRecommendations
} from "../../src/rules/tactical-reconnaissance-sweep-movement.js";

function unit(id, x, y, { status = "deployed", models = null } = {}) {
  return {
    id,
    ownerId: "p1",
    name: id,
    status,
    position: status === "deployed" ? { x, y } : null,
    ...(models ? { models } : {}),
    wounds: 5,
    metadata: { rosterUnitId: `r-${id}`, modelCount: 1 },
    profile: { characteristics: { movement: 8, objectiveControl: 2, toughness: 5, save: 3, wounds: 5 } }
  };
}

function priorPrimaryAwards() {
  return [1, 2, 3].map((round, index) => ({
    id: `primary-${index}`,
    type: "victory_points.awarded",
    payload: {
      playerId: "p1",
      amount: 15,
      category: "primary",
      missionDefinitionId: `prior-primary-${index}`,
      opportunityKey: `prior:${index}`,
      round,
      turn: 50 + index,
      scoreBefore: index * 15,
      scoreAfter: (index + 1) * 15
    }
  }));
}

function state({ capped = false } = {}) {
  return {
    phase: "movement",
    turn: 4,
    activePlayer: "p1",
    battle: { status: "active", round: 4, activePlayerId: "p1" },
    preGameSetup: { attackerPlayerId: "p1", defenderPlayerId: "p2" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Reconnaissance",
        opponentDisposition: "Take and Hold",
        layout: "A"
      }
    },
    victoryPoints: { p1: capped ? 45 : 0, p2: 0 },
    objectives: [],
    units: [
      unit("ul", 10, 10),
      unit("ur", 50, 10),
      unit("ll", 10, 34),
      unit("dup", 12, 12)
    ],
    history: capped ? priorPrimaryAwards() : [],
    scoring: { turnSnapshots: [], secondaryMissions: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
    armyRosters: {
      p1: { units: ["ul", "ur", "ll", "dup"].map((id) => ({
        id: `r-${id}`,
        loadoutValidation: { status: "valid" },
        datasheet: { characteristics: { Move: '8"', OC: 2, Wounds: 5, Toughness: 5, Save: "3+" }, weapons: [] }
      })) },
      p2: { units: [] }
    }
  };
}

test("reserve and embarked units with stale model positions do not represent table quarters", () => {
  const s = state();
  s.units = [
    unit("ul", 10, 10),
    unit("ur", 50, 10),
    unit("reserve", 10, 34, {
      status: "reserves",
      models: [{ id: "reserve-model", position: { x: 10, y: 34 } }]
    }),
    unit("embarked", 50, 34, {
      status: "embarked",
      models: [{ id: "embarked-model", position: { x: 50, y: 34 } }]
    })
  ];

  const quarters = getReconnaissanceSweepQuarterState(s, { playerId: "p1" });
  assert.equal(quarters.representedQuarterCount, 2);
  assert.equal(quarters.mapQuarterVpEstimate, 0);
  assert.deepEqual(quarters.representedQuarterIds.sort(), ["upper-left", "upper-right"]);
  assert.equal(quarters.units.some((entry) => entry.unitId === "reserve"), false);
  assert.equal(quarters.units.some((entry) => entry.unitId === "embarked"), false);
});

test("the 45 VP Primary game cap suppresses quarter-spread movement promotion", () => {
  const s = state({ capped: true });
  const base = {
    primaryStrategy: null,
    recommendations: Object.freeze([Object.freeze({
      unitId: "dup",
      unitName: "dup",
      movement: 8,
      effectiveOc: 2,
      battleShocked: false,
      score: 0.1,
      priority: 1,
      purpose: "reposition",
      confidence: "moderate",
      actionHint: "Reposition",
      recommendation: "dup: maintain a flexible position.",
      reason: "Baseline movement advice.",
      alternatives: Object.freeze([])
    })])
  };

  const result = enhanceReconnaissanceSweepMovementRecommendations(s, base, {
    playerId: "p1",
    perspectivePlayerId: "p1"
  });
  assert.equal(result.primaryStrategy.remainingPrimaryGameVp, 0);
  assert.equal(result.primaryStrategy.additionalPrimaryAllowance, 0);
  assert.equal(result.recommendations[0].score, 0.1);
  assert.equal(result.recommendations[0].territoryTarget, undefined);
  assert.doesNotMatch(result.recommendations[0].recommendation, /quarter/i);
});
