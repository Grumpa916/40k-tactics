import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('formations remains an engine checkpoint but its page is skipped by the UI',()=>{
 const rules=fs.readFileSync(new URL('../../src/rules/event-preparation.js',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../../src/ui/event-preparation-screen.js',import.meta.url),'utf8');
 assert.match(rules,/\['formations', 'Declare battle formations'/);
 assert.match(ui,/stage==='secondaries'&&preparationStep\(session.getState\(\)\)==='formations'/);
});

test('deployment still requires formations to be confirmed in engine state',()=>{
 const state=fs.readFileSync(new URL('../../src/engine/state-transitions.js',import.meta.url),'utf8');
 assert.match(state,/requirePreparationComplete\(state, \"formations\"\)/);
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
