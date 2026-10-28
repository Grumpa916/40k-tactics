import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shootingSource = fs.readFileSync(new URL('../../src/ui/shooting-screen.js', import.meta.url), 'utf8');
const shootingCss = fs.readFileSync(new URL('../../src/ui/styles/shooting-panel.css', import.meta.url), 'utf8');

test('Shooting phase advance button is enabled only when the phase can complete', () => {
  assert.match(
    shootingSource,
    /data-complete \$\{model\.canComplete \? "" : "disabled"\}>\$\{model\.canComplete \? "Next phase →" : "Finish remaining units"\}<\/button>/
  );
});

test('enabled Shooting phase advance button uses the ready green treatment', () => {
  assert.match(
    shootingCss,
    /\.shoot-tabletop__footer \.complete:not\(\[disabled\]\) \{ background:#c4e99b; border-color:#c4e99b; color:#17212b; \}/
  );
});
