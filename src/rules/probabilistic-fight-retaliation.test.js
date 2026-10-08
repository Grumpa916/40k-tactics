import test from "node:test";
import assert from "node:assert/strict";
import { getProbabilisticFightRetaliation } from "./probabilistic-fight-retaliation.js";

test("weights retaliation by post-Fight survival and degradation", () => {
  const state = {
    units: [
      {
        id: "attacker", ownerId: "p1", status: "deployed", wounds: 8,
        characteristics: { weaponSkill: 3, toughness: 4, save: 4 },
        weapons: [{ id: "blade", type: "melee", characteristics: { attacks: 4, strength: 4, ap: 0, damage: 1 } }]
      },
      {
        id: "enemy", ownerId: "p2", status: "deployed", wounds: 5,
        characteristics: {
          weaponSkill: 3, toughness: 4, save: 4,
          woundBrackets: [{ maxWoundsRemaining: 2, hitRollModifier: -1 }]
        },
        weapons: [{ id: "claws", type: "melee", characteristics: { attacks: 4, strength: 4, ap: 0, damage: 1 } }]
      }
    ],
    history: [{
      type: "charge.outcome_recorded",
      payload: { unitId: "enemy", outcome: "successful", targetIds: ["attacker"] }
    }]
  };

  const result = getProbabilisticFightRetaliation(state, {
    playerId: "p1", attackerId: "attacker", targetId: "enemy", weapon: state.units[0].weapons[0],
    distribution: { outcomes: [
      { damage: 0, probability: 0.25 },
      { damage: 3, probability: 0.5 },
      { damage: 5, probability: 0.25 }
    ] }
  });

  assert.equal(result.survivalProbability, 0.75);
  assert.equal(result.destructionProbability, 0.25);
  assert.equal(result.outcomes[2].retaliationExpectedDamage, 0);
  assert.ok(result.outcomes[1].retaliationExpectedDamage > result.outcomes[0].retaliationExpectedDamage);
  assert.ok(result.expectedRetaliationDamage > 0);
});

test("does not treat expected damage as guaranteed destruction", () => {
  const state = {
    units: [
      {
        id: "attacker", ownerId: "p1", status: "deployed", wounds: 8,
        characteristics: { weaponSkill: 3, toughness: 4, save: 4 }
      },
      {
        id: "enemy", ownerId: "p2", status: "deployed", wounds: 3,
        characteristics: { weaponSkill: 3, toughness: 4, save: 4 },
        weapons: [{ id: "claws", type: "melee", characteristics: { attacks: 4, strength: 4, ap: 0, damage: 1 } }]
      }
    ],
    history: [{ type: "charge.outcome_recorded", payload: { unitId: "enemy", outcome: "successful", targetIds: ["attacker"] } }]
  };

  const result = getProbabilisticFightRetaliation(state, {
    playerId: "p1", attackerId: "attacker", targetId: "enemy", weapon: { type: "melee", characteristics: { attacks: 20, strength: 10, ap: -4, damage: 6 } },
    distribution: { outcomes: [{ damage: 10, probability: 0.5 }, { damage: 0, probability: 0.5 }] }
  });

  assert.equal(result.destructionProbability, 0.5);
  assert.equal(result.outcomes[0].retaliationExpectedDamage, 0);
  assert.ok(result.outcomes[1].retaliationExpectedDamage > 0);
});
