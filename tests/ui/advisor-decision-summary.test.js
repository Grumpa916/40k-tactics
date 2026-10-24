import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAdvisorDecisionSummary } from '../../src/ui/advisor-decision-summary.js';

test('strategy summary exposes supporting fire without asserting a combined kill chance', () => {
  const html = renderAdvisorDecisionSummary({ recommendation: 'Protect the objective.', fireCoordination: {
    concentratedFireViable: true, combinedExpectedDamage: 8.14,
    contributors: [{ unitName: '<Exocrine>' }, { unitName: 'Biovores' }],
    betterMatch: true, bestAlternative: { unitName: '<Exocrine>', weaponName: 'Cannon', expectedDamage: 5.12 }, likelyOverkill: true
  } });
  assert.match(html, /Why this target/);
  assert.match(html, /&lt;Exocrine&gt; \+ Biovores/);
  assert.match(html, /8.1 combined mean damage, including this activation/);
  assert.match(html, /Not a combined kill probability/);
  assert.match(html, /Stronger match/);
  assert.match(html, /Possible overkill/);
});

test('phase references remain collapsed, escaped and explicitly unmodeled', () => {
  const html = renderAdvisorDecisionSummary({ recommendation: '<Target>', stratagemContext: {
    own: { cp: 2, affordable: [{ name: '<Boost>', cpCost: 1, timing: 'Shooting phase', description: 'Check <keywords>.' }] },
    opponent: { cp: 1, defence: [{ name: 'Defence', cpCost: 1 }] }
  } });
  assert.match(html, /<details data-view-key="shoot-phase-rules">/);
  assert.doesNotMatch(html, /<details[^>]*open/);
  assert.match(html, /&lt;Boost&gt;/);
  assert.match(html, /not automatically applied/);
  assert.match(html, /Opponent defensive references/);
});

test('Battle-shocked target suppresses opponent defensive references', () => {
  const html = renderAdvisorDecisionSummary({ stratagemContext: { own: { cp: 1 }, opponent: { cp: 2, defence: [{ name: 'Hidden defence' }] }, targetBattleShocked: true } });
  assert.match(html, /target is Battle-shocked/);
  assert.doesNotMatch(html, /Hidden defence/);
  assert.equal(renderAdvisorDecisionSummary(null), '');
});
