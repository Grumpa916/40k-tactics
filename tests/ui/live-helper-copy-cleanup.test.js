import test from 'node:test';
import assert from 'node:assert/strict';
import { removeRedundantLiveHelperCopy, renderPrototypeWorkspaceTools } from '../../src/ui/prototype-workspace.js';

function removable(text, tagName = 'P') {
  return {
    textContent: text,
    tagName,
    removed: false,
    remove() { this.removed = true; }
  };
}

test('live-play cleanup removes only the approved redundant helper copy', () => {
  const dragParent = removable("Drag an active player's deployed unit on the live map to update its approximate Charge position.");
  const dragSmall = removable(dragParent.textContent, 'SMALL');
  dragSmall.parentElement = dragParent;

  const recordParent = removable('Select the target(s), enter the measured tabletop distance, and record the outcome. These targets remain history and Tactical Advisor context only; Fight confirms its legal targets fresh from the tabletop.');
  const recordSmall = removable(recordParent.textContent, 'SMALL');
  recordSmall.parentElement = recordParent;

  const newOrders = removable('At the end of your Command phase, spend 1 CP to discard one active Tactical card and record one replacement drawn from the physical deck.');
  const recordedOutlook = removable('Recorded-state outlook only; mission timing, actual OC and the physical mission card remain authoritative.', 'SMALL');
  const keepWarning = removable('Viewing Charge. Return to the current game phase and advance to Charge to record an outcome.');

  const nodes = [dragSmall, recordSmall, newOrders, recordedOutlook, keepWarning];
  removeRedundantLiveHelperCopy({ querySelectorAll: () => nodes });

  assert.equal(dragParent.removed, true);
  assert.equal(recordParent.removed, true);
  assert.equal(newOrders.removed, true);
  assert.equal(recordedOutlook.removed, true);
  assert.equal(keepWarning.removed, false);
});

test('bracketed weapon abilities use the same metadata text size as active/equipped counts', () => {
  const html = renderPrototypeWorkspaceTools();
  assert.match(html, /\.prototype-unit-weapon-count,\.prototype-unit-weapon-keywords\{font-size:\.82em!important\}/);
});
