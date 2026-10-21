import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('formations page is removed from the guided preparation sequence',()=>{
 const src=fs.readFileSync(new URL('../../src/rules/event-preparation.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/\['formations', 'Declare battle formations'/);
});

test('deployment begins after the secondary-choice checkpoint',()=>{
 const state=fs.readFileSync(new URL('../../src/engine/state-transitions.js',import.meta.url),'utf8');
 assert.match(state,/requirePreparationComplete\(state, \"secondaries\"\)/);
});

test('command screen uses active player for secondary entry and ledger CP balance',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/command-screen.js',import.meta.url),'utf8');
 assert.match(src,/String\(getCommandPointBalance\(state, playerId\)\)/);
 assert.doesNotMatch(src,/Player<select data-secondary-player/);
 assert.doesNotMatch(src,/Card scoring checkpoint<select data-secondary-timing/);
});

test('redundant setup and deployment copy is removed',()=>{
 const setup=fs.readFileSync(new URL('../../src/ui/battle-setup-screen.js',import.meta.url),'utf8');
 const deploy=fs.readFileSync(new URL('../../src/ui/deployment-screen.js',import.meta.url),'utf8');
 assert.doesNotMatch(setup,/Set each player’s mode independently/);
 assert.doesNotMatch(setup,/Card rules remain manual-review-only/);
 assert.doesNotMatch(deploy,/Record where both armies actually deploy/);
 assert.doesNotMatch(deploy,/map is approximate context, not a measurement tool/);
});
