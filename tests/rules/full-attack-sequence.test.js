import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFullAttack } from '../../src/rules/full-attack-sequence.js';
const certain = damage => [{ damage, probability: 1 }];
test('shooting kills end the sequence without consulting melee or retaliation', () => {
  const result = evaluateFullAttack({ targetWounds: 5, shootingOutcomes: certain(9),
    chargeProbability: 0.5, meleeForRemainingWounds: () => { throw Error('unexpected'); } });
  assert.equal(result.expectedDamage, 5);
  assert.equal(result.destructionProbability, 1);
  assert.equal(result.exposureProbability, 0);
});
test('failed charges contribute no melee damage', () => {
  const result = evaluateFullAttack({ targetWounds: 10, shootingOutcomes: certain(2),
    chargeProbability: 0, meleeForRemainingWounds: () => { throw Error('unexpected'); } });
  assert.equal(result.expectedDamage, 2);
  assert.equal(result.destructionProbability, 0);
});
test('survival branches use remaining wounds and conserve probability', () => {
  const seen = [];
  const result = evaluateFullAttack({ targetWounds: 10,
    shootingOutcomes: [{damage: 10, probability: 0.25}, {damage: 2, probability: 0.75}],
    chargeProbability: 0.5, meleeForRemainingWounds: wounds => {
      seen.push(wounds);
      return [{damage: 8, probability: 0.5}, {damage: 3, probability: 0.5}];
    }, retaliationForRemainingWounds: wounds => { assert.equal(wounds, 5); return 4; } });
  assert.deepEqual(seen, [8]);
  assert.equal(result.destructionProbability, 0.4375);
  assert.equal(result.expectedDamage, 6.0625);
  assert.equal(result.retaliationExpectedDamage, 0.75);
  assert.equal(result.outcomes.reduce((n,x) => n+x.probability, 0), 1);
});
test('missing retaliation remains unknown, not zero risk', () => {
  const result = evaluateFullAttack({ targetWounds: 10, shootingOutcomes: certain(1),
    chargeProbability: 1, meleeForRemainingWounds: () => certain(1) });
  assert.equal(result.retaliationExpectedDamage, null);
  assert.equal(result.exposureProbability, 1);
});
test('unknown charge and malformed distributions withhold forecast', () => {
  for (const chargeProbability of [null, NaN, -1, 2]) {
    assert.equal(evaluateFullAttack({targetWounds: 10, shootingOutcomes: certain(1), chargeProbability}).available, false);
  }
  assert.equal(evaluateFullAttack({targetWounds: 10, shootingOutcomes: [{damage: 1, probability: 0.2}], chargeProbability: 1}).available, false);
});
