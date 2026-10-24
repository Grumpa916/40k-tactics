import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('battle shell retains standalone PWA metadata after Tabletop integration', () => {
  const html = readFileSync(new URL('../../battle.html', import.meta.url), 'utf8');
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /src\/ui\/styles\/pwa\.css/);
  assert.match(html, /viewport-fit=cover/);
});

test('root entry supports Home Screen installation and redirects to the integrated app', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /location\.replace\(new URL\("\.\/battle\.html"/);
});

test('standalone viewport locking is landscape-only and focused maps respect system insets', () => {
  const css = readFileSync(new URL('../../src/ui/styles/pwa.css', import.meta.url), 'utf8');
  const landscape = css.indexOf('@media (display-mode: standalone) and (orientation: landscape) and (min-width: 761px)');
  assert.ok(landscape > 0);
  assert.doesNotMatch(css.slice(0, landscape), /position: fixed|overflow: hidden/);
  assert.match(css.slice(landscape), /data-battle-focus="true"[\s\S]*inset: var\(--pwa-safe-top\)[\s\S]*height: auto/);
  assert.match(css.slice(landscape), /:not\(\.is-scrollable-preparation\)/);
});
