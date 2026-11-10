import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('battlefield layout previews fill their cards at full width', () => {
  const css = fs.readFileSync(new URL('../../src/ui/styles/prototype-workspace.css', import.meta.url), 'utf8');
  assert.match(css, /event-companion-layout-diagrams \.event-companion-layout-thumbnail[\s\S]*width:100% !important/);
  assert.match(css, /max-width:100% !important/);
  assert.match(css, /min-width:0 !important/);
});

test('primary mission window can toggle without requiring a text-span click', () => {
  const shell = fs.readFileSync(new URL('../../src/ui/battle-shell.js', import.meta.url), 'utf8');
  assert.match(shell, /mission-section-primary/);
  assert.match(shell, /primaryWindow && !event\.target\?\.closest\?\.\('.battle-mission-summary__section-content'\)/);
  assert.match(shell, /details\.open = !details\.open/);
});
