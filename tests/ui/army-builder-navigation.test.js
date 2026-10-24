import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Army Builder loads its navigation override stylesheet', () => {
  const src = read('src/ui/prototype-workspace.js');
  assert.ok(src.includes("./styles/army-builder-navigation.css"));
});

test('Army Builder back navigation stays in normal flow instead of covering the roster browser', () => {
  const css = read('src/ui/styles/army-builder-navigation.css');
  assert.match(css, /army-builder[^\n]*not\(\[hidden\]\)[\s\S]*battle-shell__setup-bottom-nav/);
  assert.match(css, /position:\s*static/);
  assert.match(css, /width:\s*100%/);
  assert.match(css, /border-top:/);
  assert.match(css, /battle-shell__setup-bottom-nav\s*>\s*div[\s\S]*display:\s*none/);
});
