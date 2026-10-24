import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReferencePanel } from '../../src/ui/battle-context-panels.js';
import { createRulesDataRevisionStamp } from '../../src/data/rules-data-revisions.js';

test('selected Space Marine detachment stratagems appear with phase filtering', () => {
  const html = renderReferencePanel({
    phase: 'shooting',
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    armyRosters: {
      p1: { faction: 'Space Marines', detachment: 'Armoured Speartip', rulesDataRevision: createRulesDataRevisionStamp('Space Marines') }
    }
  }, {}, 'p1');
  assert.match(html, /Purgation Doctrine/);
  assert.match(html, /Machine Wrath/);
  assert.doesNotMatch(html, /Advanced Deployment/);
});

test('Tyranid stratagem coverage is surfaced as partial and filtered to the current phase', () => {
  const html = renderReferencePanel({
    phase: 'fight',
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    armyRosters: {
      p1: {
        faction: 'Tyranids',
        detachment: 'Crusher Stampede',
        detachments: ['Talons of the Norn Queen'],
        rulesDataRevision: createRulesDataRevisionStamp('Tyranids')
      }
    }
  }, {}, 'p1');
  assert.match(html, /Lesser Prey/);
  assert.match(html, /Catalytic Biofortification/);
  assert.doesNotMatch(html, /Tanglestrike Rounds/);
  assert.match(html, /Talons of the Norn Queen: partial catalog/);
  assert.match(html, /Crusher Stampede: stratagem entries have not been imported yet/);
});
