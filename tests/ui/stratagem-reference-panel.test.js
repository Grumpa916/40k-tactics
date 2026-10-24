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

test('all ten Tyranid detachments have complete 40K.app stratagem coverage', () => {
  const revision = createRulesDataRevisionStamp('Tyranids');
  const detachments = revision.factionRules.detachments;
  const expectedCounts = {
    'Ambush Predators': 3,
    'Assimilation Swarm': 6,
    'Crusher Stampede': 6,
    'Invasion Fleet': 6,
    'Subterranean Assault': 6,
    'Synaptic Nexus': 6,
    'Talons of the Norn Queen': 3,
    'Unending Swarm': 6,
    'Vanguard Onslaught': 6,
    'Warrior Bioform Onslaught': 3
  };
  assert.equal(detachments.length, 10);
  assert.equal(detachments.reduce((sum, detachment) => sum + detachment.stratagems.length, 0), 51);
  const crusher = detachments.find((detachment) => detachment.name === 'Crusher Stampede');
  assert.match(crusher.stratagems.find((stratagem) => stratagem.name === 'Untrammelled Ferocity').description, /non-TITANIC/);
  const synaptic = detachments.find((detachment) => detachment.name === 'Synaptic Nexus');
  assert.match(synaptic.stratagems.find((stratagem) => stratagem.name === 'Imperative Dominance').description, /replaces? the active imperative/i);
  const vanguard = detachments.find((detachment) => detachment.name === 'Vanguard Onslaught');
  assert.match(vanguard.stratagems.find((stratagem) => stratagem.name === 'Surprise Assault').description, /selected enemy/);
  for (const detachment of detachments) {
    assert.equal(detachment.stratagemCatalogStatus, 'complete', detachment.name);
    assert.equal(detachment.stratagems.length, expectedCounts[detachment.name], detachment.name);
    assert.equal(detachment.stratagemSource.sourceName, '40K.app', detachment.name);
  }
});

test('selected Tyranid stratagems are filtered to the current phase without incomplete-catalog warnings', () => {
  const html = renderReferencePanel({
    phase: 'fight',
    activePlayer: 'p1',
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    armyRosters: {
      p1: {
        faction: 'Tyranids',
        detachment: 'Crusher Stampede',
        detachments: ['Talons of the Norn Queen', 'Synaptic Nexus', 'Vanguard Onslaught'],
        rulesDataRevision: createRulesDataRevisionStamp('Tyranids')
      }
    }
  }, {}, 'p1');
  assert.match(html, /Rampaging Monstrosities/);
  assert.match(html, /Savage Roar/);
  assert.match(html, /Lesser Prey/);
  assert.match(html, /attacks against that enemy gain \+1 to Hit/);
  assert.doesNotMatch(html, /Tanglestrike Rounds/);
  assert.doesNotMatch(html, /partial catalog|not been imported yet/);
});
