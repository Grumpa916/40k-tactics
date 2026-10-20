import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('tabletop experiment is constrained to the landscape viewport and keeps scrolling inside the control/advisor regions', () => {
  const html = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
  assert.match(html, /height:100dvh/);
  assert.match(html, /body:has\(\.battle-shell\.is-tabletop-experiment:not\(\.is-scrollable-preparation\)\).*overflow:hidden/s);
  assert.match(html, /\.battle-shell\.is-tabletop-experiment \.battle-shell__workspace \{ flex:1; min-height:0; height:auto; overflow:hidden; \}/);
  assert.match(html, /\.battle-shell\.is-tabletop-experiment\.is-scrollable-preparation \.battle-shell__workspace \{[\s\S]*overflow:visible;/);
  assert.match(html, /\.battle-shell\.is-tabletop-experiment \.shoot-screen--tabletop \{[\s\S]*height:100%; min-height:0;/);
  assert.match(html, /\.battle-shell\.is-tabletop-experiment \.shoot-advisory__details \{ max-height:190px; overflow:auto;/);
});
