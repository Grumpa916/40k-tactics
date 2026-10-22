import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Army Builder loads its navigation override stylesheet', () => {
  const src = read('src/ui/prototype-workspace.js');
  assert.ok(src.includes("./styles/army-builder-navigation.css"));
});

test('Army Builder back navigation no longer uses the full-width bottom overlay', () => {
  const css = read('src/ui/styles/army-builder-navigation.css');
  assert.match(css, /army-builder[^\n]*not\(\[hidden\]\)[\s\S]*battle-shell__setup-bottom-nav/);
  assert.match(css, /top:\s*calc\(env\(safe-area-inset-top/);
  assert.match(css, /bottom:\s*auto/);
  assert.match(css, /width:\s*auto/);
  assert.match(css, /battle-shell__setup-bottom-nav\s*>\s*div[\s\S]*display:\s*none/);
});
