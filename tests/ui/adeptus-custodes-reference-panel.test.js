import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReferencePanel } from '../../src/ui/battle-context-panels.js';
import { createRulesDataRevisionStamp } from '../../src/data/rules-data-revisions.js';

test('reference panel derives Custodes army rules and selected detachment metadata from saved roster', () => {
  const html = renderReferencePanel({
    phase: 'command',
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    armyRosters: {
      p1: {
        faction: 'Adeptus Custodes',
        detachment: 'Guardians of the Throne',
        rulesDataRevision: createRulesDataRevisionStamp('Adeptus Custodes')
      },
      p2: { faction: 'Tyranids', detachment: 'Invasion Fleet' }
    }
  }, {}, 'p1');
  assert.match(html, /Martial Ka&#0?39;tah/);
  assert.match(html, /Aegis of the Emperor/);
  assert.match(html, /Guardians of the Throne/);
  assert.match(html, /Priority Assets and Purge the Foe/);
  assert.match(html, /3 DP/);
});
