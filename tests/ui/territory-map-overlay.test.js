import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('battle app installs an advisory territory overlay on planning, deployment, and live maps', () => {
  const overlay = readFileSync(new URL('../../src/ui/territory-map-overlay.js', import.meta.url), 'utf8');
  const entry = readFileSync(new URL('../../src/ui/battle-demo.js', import.meta.url), 'utf8');

  assert.match(entry, /installTerritoryMapOverlay/);
  assert.match(overlay, /new Set\(\["planning", "deployment", "live"\]\)/);
  assert.match(overlay, /data-territory-overlay/);
  assert.match(overlay, /battlefield-map__territory-boundary/);
  assert.match(overlay, /My Territory/);
  assert.match(overlay, /Opponent Territory/);
  assert.match(overlay, /Attacker Territory/);
  assert.match(overlay, /Defender Territory/);
  assert.doesNotMatch(overlay, /session\.dispatch/);
});
