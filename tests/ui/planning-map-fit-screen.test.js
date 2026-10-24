import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Step 2 planning map fits the iPad landscape viewport without changing map proportions', () => {
  const css = readFileSync(new URL('../../src/ui/styles/planning-map-fit.css', import.meta.url), 'utf8');
  const workspace = readFileSync(new URL('../../src/ui/prototype-workspace.js', import.meta.url), 'utf8');

  assert.match(css, /\[data-map-mode="planning"\] \.battlefield-map__board/);
  assert.match(css, /100dvh - 285px/);
  assert.match(css, /\* 15 \/ 11\)/);
  assert.match(css, /margin-inline: auto/);
  assert.match(workspace, /planning-map-fit\.css/);
});
