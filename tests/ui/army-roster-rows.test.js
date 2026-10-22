import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { renderRosterRows } from '../../src/ui/army-roster-rows.js';

test('both imported attachments are grouped once with separate selectable stats and combined totals',async()=>{
 const text=await readFile(new URL('../fixtures/warhammer-app-triple-norn.txt',import.meta.url),'utf8');
 const {roster}=importWarhammerAppRoster({text,faction:'Tyranids',name:'Test',id:'r'});
 const original=structuredClone(roster);
 const html=renderRosterRows(roster.units,roster.units[0].id);
 assert.equal((html.match(/class="ab-attached-unit"/g)||[]).length,2);
 assert.equal((html.match(/21 models · 195 pts combined/g)||[]).length,2);
 assert.equal((html.match(/class="ab-unit-role">Leader/g)||[]).length,2);
 assert.equal((html.match(/class="ab-unit-role">Bodyguard/g)||[]).length,2);
 for(const unit of roster.units) assert.equal(html.split(`data-view-unit-detail="${unit.id}"`).length-1,1);
 assert.match(html,/is-selected/);assert.doesNotMatch(html,/<small>1 models/);
 assert.deepEqual(roster,original);
});
test('bodyguard-first order works, missing costs remain unknown and dangling leaders stay visible',()=>{
 const units=[{id:'b',name:'Bodyguard',modelCount:20,points:120},{id:'l',name:'Leader',modelCount:1,points:null,attachedToBodyguardId:'b'},{id:'orphan',name:'Other leader',attachedToBodyguardId:'missing'}];
 const html=renderRosterRows(units);
 assert.match(html,/Unknown pts combined/);assert.match(html,/Attachment needs review/);
 assert.equal((html.match(/data-view-unit-detail=/g)||[]).length,3);
});
