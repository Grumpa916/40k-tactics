import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCustodesDetachmentSelection, getRosterDetachmentNames, normalizeRosterDetachmentSelection } from '../../src/rules/roster-detachment-selection.js';

test('Custodes can combine up to three one-DP detachments',()=>{
 const result=assessCustodesDetachmentSelection(["Emperor's Chosen",'Lions of the Emperor','Might of the Moritoi']);
 assert.equal(result.status,'valid');
 assert.equal(result.used,3);
 assert.equal(result.remaining,0);
});

test('Custodes cannot exceed three DP or select multiple Unique Shield Hosts',()=>{
 assert.equal(assessCustodesDetachmentSelection(['Guardians of the Throne','Lions of the Emperor']).status,'invalid');
 const hosts=assessCustodesDetachmentSelection(['Solar Watch','Dread Host']);
 assert.equal(hosts.status,'invalid');
 assert.match(hosts.issues.join(' '),/Shield Host/);
});

test('rosters preserve multiple detachments while retaining legacy primary detachment',()=>{
 const roster={id:'r',name:'Custodes',faction:'Adeptus Custodes',units:[],detachment:'Solar Watch'};
 assert.deepEqual(getRosterDetachmentNames(roster),['Solar Watch']);
 const updated=normalizeRosterDetachmentSelection(roster,['Solar Watch','Honoured Companions','Null Maiden Vigil']);
 assert.equal(updated.detachment,'Solar Watch');
 assert.deepEqual(updated.detachments,['Solar Watch','Honoured Companions','Null Maiden Vigil']);
});
