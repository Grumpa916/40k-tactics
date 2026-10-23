import test from 'node:test';
import assert from 'node:assert/strict';
import { getRulesDataRevisionForFaction } from '../../src/data/rules-data-revisions.js';
import { SPACE_MARINES_DETACHMENTS, SPACE_MARINES_ARMY_RULES } from '../../src/data/space-marines-rules.js';
import { detachmentOptions } from '../../src/ui/army-builder-options.js';

test('Space Marines rules revision exposes Oath of Moment and official source metadata', () => {
  const revision = getRulesDataRevisionForFaction('Space Marines');
  assert.equal(revision.edition, '11th');
  assert.equal(revision.factionRules.armyRules[0].name, 'Oath of Moment');
  assert.equal(SPACE_MARINES_ARMY_RULES.implementationStatus, 'reference-only');
  assert.match(revision.factionRules.source.sourceUrl, /warhammer-community\.com/);
});

test('Space Marines detachment catalog includes dispositions and detachment points', () => {
  assert.equal(SPACE_MARINES_DETACHMENTS.length, 22);
  const siege = SPACE_MARINES_DETACHMENTS.find(item => item.name === 'Anvil Siege Force');
  assert.deepEqual({ disposition: siege.forceDisposition, points: siege.detachmentPoints }, { disposition: 'Take and Hold', points: 2 });
  const options = detachmentOptions('Space Marines');
  assert.match(options, /Gladius Task Force/);
  assert.match(options, /Priority Assets/);
});

