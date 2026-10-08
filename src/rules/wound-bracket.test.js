import test from "node:test";
import assert from "node:assert/strict";
import { getWoundBracketModifiers } from "./wound-bracket.js";

test("does not invent degradation for units without wound brackets", () => {
  assert.deepEqual(getWoundBracketModifiers({ wounds: 4, characteristics: {} }), { hitModifier: 0 });
});

test("applies the data-defined bracket at its threshold", () => {
  const unit = {
    wounds: 5,
    characteristics: {
      woundBrackets: [{ maxWoundsRemaining: 5, hitRollModifier: -1 }]
    }
  };
  assert.deepEqual(getWoundBracketModifiers(unit), { hitModifier: 1 });
});

test("does not apply a lower-wound bracket while above its threshold", () => {
  const unit = {
    wounds: 6,
    characteristics: {
      woundBrackets: [{ maxWoundsRemaining: 5, hitRollModifier: -1 }]
    }
  };
  assert.deepEqual(getWoundBracketModifiers(unit), { hitModifier: 0 });
});

test("selects the most specific eligible bracket", () => {
  const unit = {
    characteristics: {
      woundBrackets: [
        { maxWoundsRemaining: 10, hitRollModifier: -1 },
        { maxWoundsRemaining: 5, hitRollModifier: -2 }
      ]
    }
  };
  assert.equal(getWoundBracketModifiers(unit, { remainingWounds: 4 }).hitModifier, 2);
  assert.equal(getWoundBracketModifiers(unit, { remainingWounds: 7 }).hitModifier, 1);
});
