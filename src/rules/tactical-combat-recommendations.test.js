import test from "node:test";
import assert from "node:assert/strict";
import { getTacticalCombatRecommendations } from "./tactical-combat-recommendations.js";

function baseState() {
  return {
    battle: { status: "active", round: 1 },
    turn: 1,
    activePlayer: "p1",
    units: [
      {
        id: "shooter",
        ownerId: "p1",
        status: "deployed",
        position: { x: 0, y: 0 },
        characteristics: { ballisticSkill: 3 }
      },
      {
        id: "fighter",
        ownerId: "p1",
        status: "deployed",
        position: { x: 0, y: 3 }
      },
      {
        id: "near-target",
        ownerId: "p2",
        status: "deployed",
        wounds: 5,
        position: { x: 6, y: 0 },
        characteristics: { toughness: 4, save: 4 }
      },
      {
        id: "far-target",
        ownerId: "p2",
        status: "deployed",
        wounds: 5,
        position: { x: 30, y: 0 }
      }
    ],
    objectives: [],
    history: []
  };
}

test("surfaces shooting recommendations through the unified combat layer", () => {
  const state = { ...baseState(), phase: "shooting" };
  const result = getTacticalCombatRecommendations(state, {
    playerId: "p1",
    shootingContext: {
      attackerId: "shooter",
      weapon: {
        id: "rifle",
        type: "ranged",
        characteristics: { range: 24 }
      }
    }
  });

  assert.equal(result.shooting[0].type, "shooting-target");
  assert.equal(result.shooting[0].targetUnitId, "near-target");
  assert.equal(result.shooting[0].confidence, "high");
});

test("surfaces charge candidates only inside the approximate maximum charge envelope", () => {
  const state = { ...baseState(), phase: "charge" };
  const result = getTacticalCombatRecommendations(state, { playerId: "p1" });

  assert.ok(result.charge.some((item) => item.targetUnitId === "near-target"));
  assert.equal(result.charge.some((item) => item.targetUnitId === "far-target"), false);
  assert.equal("legal" in result.charge[0], false);
  assert.equal("canReach" in result.charge[0], false);
});

test("surfaces existing Fight candidates without duplicating eligibility rules", () => {
  const state = {
    ...baseState(),
    phase: "fight",
    history: [
      {
        type: "charge.outcome_recorded",
        payload: {
          unitId: "fighter",
          playerId: "p1",
          outcome: "successful",
          targetIds: ["near-target"],
          round: 1,
          turn: 1
        }
      }
    ]
  };

  const result = getTacticalCombatRecommendations(state, { playerId: "p1" });

  assert.ok(result.fight.some((item) => item.unitId === "fighter"));
  assert.equal(result.fight[0].type, "fight");
});

test("does not recommend destroyed units as charge candidates", () => {
  const state = {
    ...baseState(),
    phase: "charge",
    units: baseState().units.map((unit) =>
      unit.id === "fighter" ? { ...unit, status: "destroyed" } : unit
    )
  };

  const result = getTacticalCombatRecommendations(state, { playerId: "p1" });
  assert.equal(result.charge.some((item) => item.unitId === "fighter"), false);
});
