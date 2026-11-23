import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Fight tabletop makes Overrun explicit and treats Charge targets as context only', () => {
  const source = read('src/ui/fight-tabletop-screen.js');
  const workflow = read('src/application/fight-workflow.js');
  assert.match(source, /Charged, no recorded engagement/);
  assert.match(source, /data-fight-pile-in/);
  assert.match(source, /data-fight-consolidate/);
  assert.doesNotMatch(source, /up to 3″|within 5″/);
  assert.doesNotMatch(source, /Other deployed formations: tap their map marker/);
  assert.doesNotMatch(source, /Choose weapon and target\. The first recorded attack/);
  assert.doesNotMatch(source, /Confirm Fight legality from the tabletop now/);
  assert.match(workflow, /targetSelectionPolicy: "tabletop-confirmed"/);
  assert.doesNotMatch(source, /No eligible targets remain in the recorded engagement context/);
});

test('Charge tabletop states that recorded targets do not lock Fight targets', () => {
  const source = read('src/ui/charge-tabletop-screen.js');
  assert.match(source, /Fight confirms its legal targets fresh from the tabletop/);
  assert.doesNotMatch(source, /Selected Target Analysis/);
});
