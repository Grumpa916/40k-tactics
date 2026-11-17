import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const shooting = source('src/ui/shooting-screen.js');
const charge = source('src/ui/charge-tabletop-screen.js');
const fight = source('src/ui/fight-tabletop-screen.js');
const styles = source('src/ui/styles/live-map.css');

test('Shooting, Charge and Fight use the same primary end-phase control treatment', () => {
  assert.match(shooting, /class="complete phase-end__primary" type="button" data-complete/);
  assert.match(shooting, /class="phase-end__primary" type="button" data-confirm-end-shooting/);
  assert.match(charge, /class="phase-end__primary" type="button" data-charge-complete/);
  assert.match(fight, /class="phase-end__primary" type="button" data-fight-confirm-end/);
});

test('Review and stay-in-phase actions have a quieter treatment and preserve existing confirmation handlers', () => {
  assert.match(shooting, /class="shoot-tabletop__review phase-end__review-button" type="button" data-review-end-shooting/);
  assert.match(shooting, /class="phase-end__secondary" type="button" data-cancel-end-shooting/);
  assert.match(fight, /class="phase-end__review-button" type="button" data-fight-complete/);
  assert.match(fight, /class="phase-end__secondary" type="button" data-fight-cancel-end/);
  assert.match(shooting, /finishShootingWithUnloggedResults\(session\)/);
  assert.match(charge, /finishChargePhase\(session\)/);
  assert.match(fight, /finishFightPhase\(session, \{ confirmRemaining:true \}\)/);
  assert.match(fight, /querySelector\('\[data-fight-cancel-end\]'\)\?\.focus/);
});

test('Shared iPad phase-end styling keeps controls full width, touch sized and visually distinct', () => {
  assert.match(styles, /phase-end__primary,\.phase-end__secondary,\.phase-end__review-button/);
  assert.match(styles, /min-height:48px;/);
  assert.match(styles, /width:100%;/);
  assert.match(styles, /\.phase-end__primary:not\(:disabled\) \{[\s\S]*?background:#c4e99b/);
  assert.match(styles, /:is\(\.phase-end__secondary,\.phase-end__review-button\) \{[\s\S]*?background:#1c2926/);
});
