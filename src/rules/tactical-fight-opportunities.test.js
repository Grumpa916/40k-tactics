import test from "node:test";
import assert from "node:assert/strict";
import { getFightOpportunityRecommendations } from "./tactical-fight-opportunities.js";

test("evaluates a supplied Fight option without using map legality", () => {
  const state = {
    units: [
      {
        id: "attacker",
        ownerId: "p1",
        status: "deployed",
        wounds: 4,
        maxWounds: 8,
        characteristics: { weaponSkill: 3 }
      },
      {
        id: "target",
        ownerId: "p2",
        status: "deployed",
        wounds: 8,
        characteristics: { toughness: 4, save: 4 }
      }
    ]
  };

  const result = getFightOpportunityRecommendations(state, {
    playerId: "p1",
    options: [{
      unitId: "attacker",
      targetUnitId: "target",
      expectedDamage: 6,
      retaliationExpectedDamage: 5,
      retaliationConfidence: "moderate"
    }]
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].type, "fight-opportunity");
  assert.equal(result[0].netCombatValue, 1);
  assert.equal(result[0].risk, "high");
  assert.equal(result[0].confidence, "moderate");
});

test("uses weapon profiles when expected damage is not supplied", () => {
  const state = {
    units: [
      {
        id: "attacker",
        ownerId: "p1",
        status: "deployed",
        wounds: 5,
        characteristics: { weaponSkill: 3 }
      },
      {
        id: "target",
        ownerId: "p2",
        status: "deployed",
        wounds: 5,
        characteristics: { toughness: 4, save: 4 }
      }
    ]
  };

  const result = getFightOpportunityRecommendations(state, {
    playerId: "p1",
    options: [{
      unitId: "attacker",
      targetUnitId: "target",
      weapon: {
        id: "blade",
        type: "melee",
        characteristics: {
          attacks: 4,
          weaponSkill: 3,
          strength: 4,
          ap: 0,
          damage: 1
        }
      }
    }]
  });

  assert.equal(result.length, 1);
  assert.ok(result[0].expectedDamage > 0);
  assert.equal(result[0].retaliationExpectedDamage, 0);
  assert.equal(result[0].confidence, "low");
});

test("rejects options that do not belong to the player's army", () => {
  const state = {
    units: [
      { id: "enemy", ownerId: "p2", status: "deployed", wounds: 5 },
      { id: "target", ownerId: "p1", status: "deployed", wounds: 5 }
    ]
  };

  const result = getFightOpportunityRecommendations(state, {
    playerId: "p1",
    options: [{ unitId: "enemy", targetUnitId: "target", expectedDamage: 5 }]
  });

  assert.deepEqual(result, []);
});


test("uses probabilistic retaliation when Fight weapon data is available", () => {
  const state = {
    units: [
      {
        id: "attacker", ownerId: "p1", status: "deployed", wounds: 8,
        characteristics: { weaponSkill: 3, toughness: 4, save: 4 },
        weapons: [{ id: "blade", type: "melee", characteristics: { attacks: 4, strength: 4, ap: 0, damage: 1 } }]
      },
      {
        id: "enemy", ownerId: "p2", status: "deployed", wounds: 1,
        characteristics: { weaponSkill: 3, toughness: 4, save: 4 },
        weapons: [{ id: "claws", type: "melee", characteristics: { attacks: 4, strength: 4, ap: 0, damage: 1 } }]
      }
    ],
    history: [{
      type: "charge.outcome_recorded",
      payload: { unitId: "enemy", outcome: "successful", targetIds: ["attacker"] }
    }]
  };

  const result = getFightOpportunityRecommendations(state, {
    playerId: "p1",
    options: [{ unitId: "attacker", targetUnitId: "enemy", weapon: state.units[0].weapons[0] }]
  });

  assert.equal(result.length, 1);
  assert.ok(result[0].retaliationExpectedDamage > 0);
  assert.ok(result[0].targetSurvivalProbability > 0);
  assert.ok(result[0].targetDestructionProbability > 0);
  assert.ok(result[0].targetSurvivalProbability < 1);
});
