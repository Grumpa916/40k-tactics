import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRosterDetachmentSelection, normalizeRosterDetachmentSelection } from '../../src/rules/roster-detachment-selection.js';

test('Tyranids can combine detachments up to three DP',()=>{
 const result=assessRosterDetachmentSelection('Tyranids',['Ambush Predators','Talons of the Norn Queen','Warrior Bioform Onslaught']);
 assert.equal(result.status,'valid');
 assert.equal(result.used,3);
 assert.equal(result.remaining,0);
 const invalid=assessRosterDetachmentSelection('Tyranids',['Assimilation Swarm','Crusher Stampede']);
 assert.equal(invalid.status,'invalid');
 assert.match(invalid.issues.join(' '),/4\/3 DP/);
});

test('Space Marines use the same global three DP budget',()=>{
 const valid=assessRosterDetachmentSelection('Space Marines',['Fulguris Task Force','Librarius Conclave','Subversion Assets']);
 assert.equal(valid.status,'valid');
 assert.equal(valid.used,3);
 const invalid=assessRosterDetachmentSelection('Space Marines',['Gladius Task Force','Fulguris Task Force']);
 assert.equal(invalid.status,'invalid');
});

test('normalization preserves multiple faction detachments and legacy primary field',()=>{
 const roster={id:'r',faction:'Tyranids',detachment:'Invasion Fleet',units:[]};
 const updated=normalizeRosterDetachmentSelection(roster,['Ambush Predators','Talons of the Norn Queen']);
 assert.deepEqual(updated.detachments,['Ambush Predators','Talons of the Norn Queen']);
 assert.equal(updated.detachment,'Ambush Predators');
});
