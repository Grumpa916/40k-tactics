import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('deployment remains vertically scrollable while live Tabletop phases keep viewport lock', () => {
  const shell = readFileSync(new URL('../../src/ui/battle-shell.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
  const pwa = readFileSync(new URL('../../src/ui/styles/pwa.css', import.meta.url), 'utf8');
  assert.match(shell, /isScrollablePreparationView = viewedPhase === "deployment"/);
  assert.match(shell, /is-scrollable-preparation/);
  assert.match(html, /is-tabletop-experiment:not\(\.is-scrollable-preparation\)/);
  assert.match(html, /is-tabletop-experiment\.is-scrollable-preparation[\s\S]*height:auto; min-height:100dvh; overflow:visible/);
  assert.match(pwa, /is-tabletop-experiment:not\(\.is-scrollable-preparation\)/);
});
