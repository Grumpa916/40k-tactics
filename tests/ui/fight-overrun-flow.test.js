import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Fight tabletop makes Overrun explicit and treats Charge targets as context only', () => {
  const source = read('src/ui/fight-tabletop-screen.js');
  assert.match(source, /Overrun Fight available/);
  assert.match(source, /choose an enemy within 5″/);
  assert.match(source, /Pile In move of up to 3″/);
  assert.match(source, /Charge targets are history and Tactical Advisor context only/);
  assert.match(source, /targetSelectionPolicy: "tabletop-confirmed"|tabletop-confirmed/);
  assert.doesNotMatch(source, /No eligible targets remain in the recorded engagement context/);
});

test('Charge tabletop states that recorded targets do not lock Fight targets', () => {
  const source = read('src/ui/charge-tabletop-screen.js');
  assert.match(source, /Fight confirms its legal targets fresh from the tabletop/);
  assert.doesNotMatch(source, /Selected Target Analysis/);
});
