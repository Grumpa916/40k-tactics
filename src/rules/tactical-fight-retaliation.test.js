import test from "node:test";
import assert from "node:assert/strict";
import { getFightOpportunityRecommendations } from "./tactical-fight-opportunities.js";

test("derives strongest retaliation from current Fight engagement", () => {
  const state = {
    turn: 1,
    battle: { round: 1 },
    units: [
      {
        id: "attacker",
        ownerId: "p1",
        status: "deployed",
        wounds: 8,
        maxWounds: 8,
        characteristics: { weaponSkill: 3, toughness: 4, save: 4 },
        weapons: [{
          id: "blade",
          type: "melee",
          characteristics: {
            attacks: 4,
            strength: 4,
            ap: 0,
            damage: 1
          }
        }]
      },
      {
        id: "enemy",
        ownerId: "p2",
        status: "deployed",
        wounds: 10,
        characteristics: { weaponSkill: 3, toughness: 4, save: 4 },
        weapons: [
          {
            id: "weak",
            type: "melee",
            characteristics: { attacks: 2, strength: 4, ap: 0, damage: 1 }
          },
          {
            id: "strong",
            type: "melee",
            characteristics: { attacks: 6, strength: 5, ap: 1, damage: 2 }
          }
        ]
      }
    ],
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "enemy",
        outcome: "successful",
        targetIds: ["attacker"]
      }
    }]
  };

  const result = getFightOpportunityRecommendations(state, {
    playerId: "p1",
    options: [{
      unitId: "attacker",
      targetUnitId: "enemy",
      weapon: state.units[0].weapons[0]
    }]
  });

  assert.equal(result.length, 1);
  assert.ok(result[0].retaliationExpectedDamage > 0);
  assert.equal(result[0].confidence, "moderate");
});

test("does not invent retaliation when no authoritative engagement exists", () => {
  const state = {
    units: [
      {
        id: "attacker",
        ownerId: "p1",
        status: "deployed",
        wounds: 8,
        characteristics: { weaponSkill: 3 }
      },
      {
        id: "enemy",
        ownerId: "p2",
        status: "deployed",
        wounds: 8,
        characteristics: { weaponSkill: 3 },
        weapons: [{
          id: "claws",
          type: "melee",
          characteristics: { attacks: 4, strength: 4, ap: 0, damage: 1 }
        }]
      }
    ]
  };

  const result = getFightOpportunityRecommendations(state, {
    playerId: "p1",
    options: [{
      unitId: "attacker",
      targetUnitId: "enemy",
      expectedDamage: 2
    }]
  });

  assert.equal(result[0].retaliationExpectedDamage, 0);
  assert.equal(result[0].confidence, "low");
});

test("does not retaliate after the attack destroys the target", () => {
  const state = {
    units: [
      {
        id: "attacker",
        ownerId: "p1",
        status: "deployed",
        wounds: 8,
        characteristics: { weaponSkill: 3 }
      },
      {
        id: "enemy",
        ownerId: "p2",
        status: "deployed",
        wounds: 3,
        characteristics: { weaponSkill: 3 },
        weapons: [{
          id: "claws",
          type: "melee",
          characteristics: { attacks: 4, strength: 4, ap: 0, damage: 1 }
        }]
      }
    ],
    history: [{
      type: "charge.outcome_recorded",
      payload: {
        unitId: "enemy",
        outcome: "successful",
        targetIds: ["attacker"]
      }
    }]
  };

  const result = getFightOpportunityRecommendations(state, {
    playerId: "p1",
    options: [{
      unitId: "attacker",
      targetUnitId: "enemy",
      expectedDamage: 3
    }]
  });

  assert.equal(result[0].retaliationExpectedDamage, 0);
});
