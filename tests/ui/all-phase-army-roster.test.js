import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderPhaseArmyRoster, refreshPhaseArmyRoster } from '../../src/ui/phase-army-roster.js';
import { renderCombatWorkspace } from '../../src/ui/combat-workspace.js';
import { renderMovementRosterRail } from '../../src/ui/movement-dashboard-view.js';
const state = {phase:'command',activePlayer:'opponent',turn:1,battle:{round:1},history:[],objectives:[],players:[{id:'me'},{id:'opponent'}],units:[
 {id:'a',ownerId:'me',name:'Guard <1>',status:'deployed'},
 {id:'b',ownerId:'opponent',name:'Enemy',status:'deployed'},
 {id:'c',ownerId:'me',name:'Reserve',status:'reserves'},
 {id:'d',ownerId:'opponent',name:'Lost',status:'destroyed'},
 {id:'e',ownerId:'me',name:'Passenger',status:'embarked'}]};
test('both full army lists remain referenceable on the opponent turn without mutation',()=>{
 const before=JSON.stringify(state);const html=renderPhaseArmyRoster(state,'me');
 for(const unit of state.units) assert.ok(html.includes(`data-open-unit-details="${unit.id}"`));
 const mine=html.split('data-phase-army-list="mine">')[1].split('data-phase-army-list="opponent"')[0];
 assert.ok(mine.includes('Guard &lt;1&gt;'));assert.ok(!mine.includes('data-open-unit-details="b"'));
 assert.doesNotMatch(html,/data-move-roster-unit|data-attack|data-charge-unit/);
 assert.equal(JSON.stringify(state),before);
});
test('Command Charge and Fight render the shared rail alongside their controls',()=>{
 for(const phase of ['command','charge','fight']) {
 const html=renderCombatWorkspace({state:{...state,phase},phase,perspectivePlayerId:'me',controls:'phase controls',mapView:{render:()=>'<div>map</div>'}});
 assert.match(html,/data-phase-army-view="opponent"/);assert.match(html,/phase controls/);
 }
 const source=fs.readFileSync(new URL('../../src/ui/shooting-screen.js',import.meta.url),'utf8');
 assert.match(source,/renderPhaseArmyRoster\(state, perspectivePlayerId\)/);
});
test('switching army tabs changes only reference visibility and pressed state',()=>{
 const node=(attribute,value)=>({hidden:false,attributes:{[attribute]:value},getAttribute(k){return this.attributes[k]},setAttribute(k,v){this.attributes[k]=v}});
 const buttons=['mine','opponent'].map(x=>node('data-phase-army-view',x));
 const lists=['mine','opponent'].map(x=>node('data-phase-army-list',x));
 const container={querySelectorAll:s=>s==='[data-phase-army-view]'?buttons:lists};
 refreshPhaseArmyRoster(container,'opponent');assert.equal(lists[0].hidden,true);assert.equal(lists[1].hidden,false);assert.equal(buttons[1].attributes['aria-pressed'],'true');
 refreshPhaseArmyRoster(container,'mine');assert.equal(lists[0].hidden,false);assert.equal(buttons[1].attributes['aria-pressed'],'false');
});
test('Movement keeps acting selection separate from both armies reference buttons',()=>{
 const mine=renderMovementRosterRail(state,{playerId:'me',perspectivePlayerId:'me'});
 assert.match(mine,/data-move-roster-unit="a"/);assert.match(mine,/data-open-unit-details="a"/);
 assert.match(mine,/data-open-unit-details="e"/);assert.match(mine,/EMBARKED/);
 const other=renderMovementRosterRail(state,{playerId:'me',perspectivePlayerId:'me',rosterView:'opponent'});
 assert.match(other,/data-open-unit-details="b"/);assert.match(other,/data-open-unit-details="d"/);assert.doesNotMatch(other,/data-move-roster-unit/);
});
