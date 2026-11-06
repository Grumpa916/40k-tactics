import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdvisorDamageReductionNote, renderAdvisorDamageReduction } from '../../src/ui/advisor-damage-reduction.js';

test('per-attack fixed Damage reduction shows exact before and after, never subtracts from total', () => {
  const source=['Guardian Eternal: reduce ranged Damage by 1'];
  const note=getAdvisorDamageReductionNote({damageCharacteristic:4,damageReduction:1,appliedRules:source});
  assert.deepEqual(note,{source:'Guardian Eternal',original:'4',adjusted:'3',reduction:1});
  const html=renderAdvisorDamageReduction({damageCharacteristic:4,damageReduction:1,appliedRules:source});
  assert.match(html,/Guardian Eternal/);
  assert.match(html,/4 → 3 Damage per unsaved attack/);
  assert.match(html,/minimum 1/);
  assert.match(html,/before Feel No Pain/);
  assert.match(html,/record only final tabletop damage/);
  assert.doesNotMatch(html,/4 → 2/);
});

test('minimum one and dice Damage reduction describe each roll, not the mean or total', () => {
  const reductions=[
    [1,1,'1','1'],
    ['D3',1,'D3','1–2'],
    ['D6+2',1,'D6+2','2–7'],
    ['D3',2,'D3','1']
  ];
  for (const [damageCharacteristic,damageReduction,original,adjusted] of reductions) {
    const note=getAdvisorDamageReductionNote({damageCharacteristic,damageReduction});
    assert.equal(note.original,original);
    assert.equal(note.adjusted,adjusted);
    assert.match(renderAdvisorDamageReduction({damageCharacteristic,damageReduction}),/per unsaved attack/);
  }
});

test('never invent Damage reduction or show a misleading amount when the profile is unknown', () => {
  assert.equal(renderAdvisorDamageReduction({damageCharacteristic:3,damageReduction:0}),'');
  assert.equal(renderAdvisorDamageReduction({damageCharacteristic:'2D6',damageReduction:1}),'');
  assert.equal(renderAdvisorDamageReduction({damageReduction:1}),'');
  assert.equal(renderAdvisorDamageReduction({damageCharacteristic:3,damageReduction:-1}),'');
  const html=renderAdvisorDamageReduction({damageCharacteristic:3,damageReduction:1,
    appliedRules:['<script>: reduce Damage by 1']});
  assert.ok(!html.includes('<script>'));
  assert.match(html,/&lt;script&gt;/);
});
