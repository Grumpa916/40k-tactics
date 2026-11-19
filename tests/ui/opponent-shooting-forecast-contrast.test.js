import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderIncomingDamageForecast } from '../../src/ui/incoming-damage-forecast-view.js';

const theme = readFileSync(new URL('../../src/ui/styles/custodes-theme.css',import.meta.url),'utf8');
const shooting = readFileSync(new URL('../../src/ui/shooting-screen.js',import.meta.url),'utf8');
const optionView = readFileSync(new URL('../../src/ui/advisor-option-impact.js',import.meta.url),'utf8');

test('incoming defensive forecast is the opponent Shooting path, not offensive selected-target detail', () => {
  assert.match(shooting,/incomingAttackMode\s*\? renderIncomingDamageForecast\(/);
  assert.match(shooting,/class="shoot-tabletop__target-comparisons"/);
  assert.match(renderIncomingDamageForecast({},{}),/Select the attacking unit, weapon and your targeted unit/);
  assert.match(readFileSync(new URL('../../src/ui/incoming-damage-forecast-view.js',import.meta.url),'utf8'),
    /class="shoot-advisory incoming-damage-forecast"/);
});

test('Custodes defensive forecast uses parchment background with dark, visible headings, numbers and notes', () => {
  const css=theme.slice(theme.indexOf('/* Defensive Shooting is a separate target-comparison path'));
  assert.ok(css.length>900);
  const scope='.shoot-tabletop__target-comparisons .incoming-damage-forecast';
  assert.ok(css.includes(scope));
  assert.match(css,/background:#faf1dc !important;/);
  assert.match(css,/color:#261d1a !important;/);
  assert.match(css,/:is\(h3,strong,p,span,li,summary\)/);
  assert.match(css,/:is\(small,\.shoot-advisory__heading span,\.shoot-advisory__grid span\)/);
  assert.match(css,/color:#554936 !important;/);
  assert.match(css,/\.shoot-advisory__grid > div \{[\s\S]*?background:#f2e4c5 !important;/);
});

test('Defensive option impact retains distinct visible subcard and comparison rows', () => {
  const css=theme.slice(theme.indexOf('/* Defensive Shooting is a separate target-comparison path'));
  assert.match(optionView,/class="advisor-option-impact"/);
  assert.match(optionView,/advisor-option-impact__numbers/);
  assert.match(css,/\.advisor-option-impact \{[\s\S]*?background:#fff8e8 !important;/);
  assert.match(css,/\.advisor-option-impact__row \{[\s\S]*?border-top-color:#c6a46b;/);
  assert.doesNotMatch(css,/data-map-unit-id|\.battlefield-map__unit|\.shoot-tabletop__footer/);
});
