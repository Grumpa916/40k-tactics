import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Tabletop is the authoritative default and classic remains explicit rollback', () => {
  const demo = readFileSync(new URL('../../src/ui/battle-demo.js', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('../../src/ui/battle-shell.js', import.meta.url), 'utf8');
  const shooting = readFileSync(new URL('../../src/ui/shooting-screen.js', import.meta.url), 'utf8');
  assert.match(demo, /get\("ui"\) === "classic"[\s\S]*\? "classic"[\s\S]*: "tabletop"/);
  assert.match(shell, /layoutMode = "tabletop"/);
  assert.match(shooting, /layoutMode = "tabletop"/);
  assert.match(shell, /\?ui=classic/);
});
