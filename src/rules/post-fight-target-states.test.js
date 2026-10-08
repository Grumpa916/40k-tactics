import test from "node:test";
import assert from "node:assert/strict";
import { getPostFightTargetStates } from "./post-fight-target-states.js";

test("converts damage outcomes into probabilistic post-Fight wounds", () => {
  const result = getPostFightTargetStates({
    target: { wounds: 5 },
    distribution: {
      outcomes: [
        { damage: 0, probability: 0.25 },
        { damage: 2, probability: 0.5 },
        { damage: 6, probability: 0.25 }
      ]
    }
  });

  assert.deepEqual(result.states, [
    { damage: 0, probability: 0.25, remainingWounds: 5, destroyed: false },
    { damage: 2, probability: 0.5, remainingWounds: 3, destroyed: false },
    { damage: 6, probability: 0.25, remainingWounds: 0, destroyed: true }
  ]);
  assert.equal(result.survivalProbability, 0.75);
  assert.equal(result.destructionProbability, 0.25);
});

test("does not treat expected damage as the target's actual wounds", () => {
  const result = getPostFightTargetStates({
    target: { wounds: 3 },
    distribution: {
      outcomes: [
        { damage: 1, probability: 0.75 },
        { damage: 5, probability: 0.25 }
      ]
    }
  });

  assert.equal(result.states[0].remainingWounds, 2);
  assert.equal(result.states[1].remainingWounds, 0);
  assert.equal(result.survivalProbability, 0.75);
});
