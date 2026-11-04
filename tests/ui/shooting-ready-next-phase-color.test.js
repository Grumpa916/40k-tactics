import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shootingSource = fs.readFileSync(new URL('../../src/ui/shooting-screen.js', import.meta.url), 'utf8');
const shootingCss = fs.readFileSync(new URL('../../src/ui/styles/shooting-panel.css', import.meta.url), 'utf8');

test('Shooting offers a skip action while units remain and a normal advance after choices are complete', () => {
  assert.match(shootingSource, /model\.canComplete \? .*data-complete>Next phase →.* : .*data-skip-shooting>Skip remaining/);
  assert.match(shootingSource, /data-finish-unit>Finish unit<\/button>[\s\S]*data-skip-shooting>Skip remaining/);
  assert.match(shootingSource, /skipRemainingShootingUnits\(session\)/);
});

test('Shooting phase buttons use the ready green treatment', () => {
  assert.match(shootingCss, /\.shoot-tabletop__footer \.complete:not\(\[disabled\]\) \{ background:#c4e99b; border-color:#c4e99b; color:#17212b; \}/);
  assert.match(shootingCss, /\.shoot-tabletop__footer \.shoot-tabletop__skip \{ grid-column:1\/-1; background:#c4e99b;/);
});
