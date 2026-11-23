import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../../src/ui/styles/' + path, import.meta.url), 'utf8');

test('landscape live phase actions occupy the right panel area and free map height', () => {
  const css = read('prototype-workspace.css');
  const pwa = read('pwa.css');
  const layout = css.slice(css.indexOf('/* Live phase actions sit in the right-hand control column'));
  assert.match(layout, /--live-phase-action-width:285px/);
  assert.match(layout, /> \[data-phase-progression-host\] \{[\s\S]*?left:auto;[\s\S]*?right:calc\(10px \+ env\(safe-area-inset-right,0px\)\);[\s\S]*?width:var\(--live-phase-action-width\)/);
  assert.match(layout, /\[data-workspace-panel\] \{[\s\S]*?bottom:calc\(72px/);
  assert.match(layout, /padding-bottom:calc\(8px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(pwa, /padding-bottom: calc\(8px \+ var\(--pwa-safe-bottom\)\)/);
});

test('phase-specific completion controls share the same fixed, touch-sized position', () => {
  const css = read('prototype-workspace.css');
  const layout = css.slice(css.indexOf('/* Live phase actions sit in the right-hand control column'));
  for (const control of ['data-complete', 'data-review-end-shooting', 'data-confirm-end-shooting',
    'data-charge-complete', 'data-fight-complete', 'data-fight-confirm-end', 'data-phase-end-disabled']) {
    assert.ok(layout.includes('[' + control + ']'), control);
  }
  assert.match(layout, /position:fixed;[\s\S]*?right:calc\(10px[\s\S]*?bottom:calc\(10px[\s\S]*?height:56px/);
  assert.match(layout, /\.phase-end__primary:disabled \{[\s\S]*?background:#233037 !important/);
});
