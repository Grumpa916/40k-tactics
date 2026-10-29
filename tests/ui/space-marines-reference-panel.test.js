import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReferencePanel } from '../../src/ui/battle-context-panels.js';
import { createRulesDataRevisionStamp } from '../../src/data/rules-data-revisions.js';

test('reference panel derives Space Marines army rule and detachment from the saved roster', () => {
  const html = renderReferencePanel({
    phase: 'command',
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    armyRosters: {
      p1: { faction: 'Space Marines', detachment: 'Anvil Siege Force', rulesDataRevision: createRulesDataRevisionStamp('Space Marines') },
      p2: { faction: 'Tyranids', detachment: 'Invasion Fleet' }
    }
  }, {}, 'p1');
  assert.match(html, /Combat Doctrines/);
  assert.match(html, /Take and Hold/);
  assert.match(html, /2 DP/);
});
