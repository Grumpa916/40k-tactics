import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPLETE_SECONDARY_MISSION_CATALOG,
  SECONDARY_MISSION_IMPORT_SOURCE,
  getCompleteSecondaryMissionById
} from '../../src/data/secondary-mission-complete-catalog.js';

test('complete 11th-edition secondary mission import exposes all 18 cards', () => {
  assert.equal(COMPLETE_SECONDARY_MISSION_CATALOG.length, 18);
  assert.equal(new Set(COMPLETE_SECONDARY_MISSION_CATALOG.map((mission) => mission.id)).size, 18);
  assert.equal(SECONDARY_MISSION_IMPORT_SOURCE.edition, '11th');
  assert.equal(SECONDARY_MISSION_IMPORT_SOURCE.missionPack, 'Chapter Approved 2026–27');
});

test('all imported secondary missions keep scoring metadata and manual scoring authority', () => {
  for (const mission of COMPLETE_SECONDARY_MISSION_CATALOG) {
    assert.equal(mission.category, 'secondary');
    assert.ok(Array.isArray(mission.scoringWindows));
    assert.ok(mission.scoringWindows.length > 0, `${mission.name} is missing scoring windows`);
    assert.equal(mission.scoringAuthority, 'manual-player-confirmation');
    assert.ok(Array.isArray(mission.notes));
  }
});

test('fixed availability matches the four Fixed-capable cards', () => {
  const fixed = COMPLETE_SECONDARY_MISSION_CATALOG
    .filter((mission) => mission.fixedAvailable)
    .map((mission) => mission.name)
    .sort();
  assert.deepEqual(fixed, [
    'A Grievous Blow',
    'Assassination',
    'Bring it Down',
    'Engage on All Fronts'
  ]);
});

test('Cleanse and Plunder carry Shooting-phase mission-action metadata', () => {
  const cleanse = getCompleteSecondaryMissionById('secondary-cleanse');
  const plunder = getCompleteSecondaryMissionById('secondary-plunder');
  assert.equal(cleanse?.missionAction?.phase, 'shooting');
  assert.equal(cleanse?.missionAction?.completion, 'end-of-turn');
  assert.equal(plunder?.missionAction?.phase, 'shooting');
  assert.equal(plunder?.missionAction?.completion, 'immediate');
  assert.match(cleanse?.whenDrawn ?? '', /Plunder/);
  assert.match(plunder?.whenDrawn ?? '', /Cleanse/);
});

test('round-one replacement and target-selection instructions are imported where relevant', () => {
  assert.match(getCompleteSecondaryMissionById('secondary-defend-stronghold')?.whenDrawn ?? '', /round 1/i);
  assert.match(getCompleteSecondaryMissionById('secondary-behind-enemy-lines')?.whenDrawn ?? '', /round 1/i);
  assert.match(getCompleteSecondaryMissionById('secondary-forward-position')?.whenDrawn ?? '', /round 1/i);
  assert.match(getCompleteSecondaryMissionById('secondary-a-tempting-target')?.whenDrawn ?? '', /opponent/i);
  assert.match(getCompleteSecondaryMissionById('secondary-beacon')?.whenDrawn ?? '', /beacon unit/i);
});
