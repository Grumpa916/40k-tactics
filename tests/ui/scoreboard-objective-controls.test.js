import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('command screen no longer renders full VP and CP adjustment sections',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/command-screen.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/Victory Point score<\/h2>/);
 assert.doesNotMatch(src,/Command Point ledger<\/h2>/);
});

test('scoreboard opens compact VP and CP adjustment controls',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/battle-shell.js',import.meta.url),'utf8');
 assert.match(src,/data-open-score-adjust/);
 assert.match(src,/data-score-adjust-kind=\"vp\"/);
 assert.match(src,/data-score-adjust-kind=\"cp\"/);
});

test('live objective markers are clickable and have perspective colors',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/battlefield-map.js',import.meta.url),'utf8');
 assert.match(src,/data-map-objective-id/);
 assert.match(src,/is-mine/);
 assert.match(src,/is-opponent/);
 assert.match(src,/is-contested/);
 assert.match(src,/My Home/);
 assert.match(src,/Opponent Home/);
});

test('canonical objectives default to uncontrolled',()=>{
 const src=fs.readFileSync(new URL('../../src/engine/battlefield-map-transitions.js',import.meta.url),'utf8');
 assert.match(src,/controlState: \"uncontrolled\"/);
});


test('score adjustment can collapse, refresh in place, and report adjustment results',()=>{
 const src=fs.readFileSync(new URL('../../src/ui/battle-shell.js',import.meta.url),'utf8');
 assert.match(src,/data-toggle-score-adjust-collapse/);
 assert.match(src,/data-score-adjust-host/);
 assert.match(src,/scoreAdjustHost\.innerHTML = renderScoreAdjustOverlay/);
 assert.match(src,/scoreAdjustMessage/);
 assert.match(src,/stopPropagation/);
});
