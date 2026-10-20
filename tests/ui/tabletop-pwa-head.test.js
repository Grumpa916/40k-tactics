import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('battle shell retains standalone PWA metadata after Tabletop integration', () => {
  const html = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /src\/ui\/styles\/pwa\.css/);
});
