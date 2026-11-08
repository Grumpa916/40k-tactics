import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shootingSource = fs.readFileSync(new URL('../../src/ui/shooting-screen.js', import.meta.url), 'utf8');
const shootingCss = fs.readFileSync(new URL('../../src/ui/styles/shooting-panel.css', import.meta.url), 'utf8');

test('Tabletop Shooting separates Finish unit from ending the phase', () => {
  assert.match(shootingSource, /data-finish-unit>Finish unit<\/button>[\s\S]*remaining === 0 \? .*data-complete>End Shooting/);
  assert.match(shootingSource, /data-review-end-shooting>End Shooting · Review/);
  assert.match(shootingSource, /finishShootingWithUnloggedResults\(session\)/);
});

test('Shooting uses green for ready advance and a quieter treatment for review', () => {
  assert.match(shootingCss, /\.shoot-tabletop__footer \.complete:not\(\[disabled\]\) \{ background:#c4e99b; border-color:#c4e99b; color:#17212b; \}/);
  assert.match(shootingCss, /\.shoot-tabletop__review \{ background:#1c2926;/);
});
