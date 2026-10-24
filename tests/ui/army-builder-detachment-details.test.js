import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDetachmentChecklist } from '../../src/ui/army-builder-options.js';

test('Army Builder detachment names expand to loaded rules text', () => {
  const html = renderDetachmentChecklist('Adeptus Custodes', ['Solar Watch']);
  assert.match(html, /Tap a detachment name to view its rules/);
  assert.match(html, /ab-detachment-details/);
  assert.match(html, /Solar Watch/);
  assert.match(html, /Talon Sortie/);
  assert.match(html, /Falls Back can remain eligible to charge/);
  assert.match(html, /Favoured Ka&#0?39;tah: Calistus/);
});

test('detachment details never invent missing rule text', () => {
  const html = renderDetachmentChecklist('Tyranids', ['Ambush Predators']);
  assert.match(html, /Ambush Predators/);
  assert.match(html, /1 DP/);
  assert.match(html, /Disruption/);
  assert.match(html, /Detachment rules text has not been loaded into the app yet/);
});
