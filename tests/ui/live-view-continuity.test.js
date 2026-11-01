import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { captureViewContinuity } from '../../src/ui/view-continuity.js';
import { createShootingComparisonCache } from '../../src/rules/tactical-shooting-comparison.js';
import { shootingTargetComparisonCards } from '../../src/ui/shooting-advisor-view.js';
import { renderActionReceipt } from '../../src/ui/action-receipt.js';

test('target browsing reuses comparison; accepted state or weapon characteristic changes invalidate it', () => {
  let calls=0;
  const compare=createShootingComparisonCache((state,options)=>({call:++calls,turn:state.turn,damage:options.weapon.damage}));
  const state={turn:1},options={attackerId:'a',weapon:{id:'w',damage:1}};
  const first=compare(state,options);
  assert.equal(compare(state,structuredClone(options)),first);
  assert.equal(calls,1);
  assert.equal(compare({...state,turn:2},options).turn,2);
  assert.equal(compare(state,{...options,weapon:{id:'w',damage:2}}).damage,2);
  assert.equal(calls,3);
});
test('view refresh retains panel scroll position and expanded additional targets', () => {
  let nodes={'.shoot-tabletop__control-scroll':{scrollTop:180},'.combat-workspace__scroll':{scrollTop:95},'[data-comparison-more]':{open:true}};
  const restore=captureViewContinuity({querySelector:s=>nodes[s]});
  nodes={'.shoot-tabletop__control-scroll':{scrollTop:0},'.combat-workspace__scroll':{scrollTop:0},'[data-comparison-more]':{open:false}};
  restore();assert.equal(nodes['.shoot-tabletop__control-scroll'].scrollTop,180);assert.equal(nodes['.combat-workspace__scroll'].scrollTop,95);assert.equal(nodes['[data-comparison-more]'].open,true);
});
test('shooting target and weapon changes preserve panel scroll while acting-unit changes may reset it', () => {
  const source=readFileSync(new URL('../../src/ui/shooting-screen.js', import.meta.url), 'utf8');
  assert.match(source,/let lastRenderedActiveUnitId = null;/);
  assert.match(source,/const renderedActiveUnitId = selectedAttackerId \?\? pendingUnitId \?\? null;/);
  assert.match(source,/if \(renderedActiveUnitId !== lastRenderedActiveUnitId\)/);
  assert.doesNotMatch(source,/lastRenderedSelection/);
  assert.doesNotMatch(source,/\[selectedAttackerId, selectedWeaponId, selectedTargetId\]\.join/);
});
test('phase redraw retains collapsed and expanded menus after a secondary is recorded', () => {
  const detail = (label, open, key = null) => ({
    open,
    hasAttribute: name => name === 'data-view-key' && key !== null,
    getAttribute: () => key,
    querySelector: () => ({ textContent: label })
  });
  let menus = [detail('Martial Ka’tah · Command Phase', false, 'command-katah'),
    detail('Secondaries', true), detail('Scoring review', false)];
  const container = { querySelectorAll: selector => selector === '[data-view-key]'
    ? menus.filter(menu => menu.hasAttribute('data-view-key')) : selector === 'details' ? menus : [] };
  const restore = captureViewContinuity(container);
  menus = [detail('Martial Ka’tah · Command Phase', true, 'command-katah'),
    detail('Secondaries', false), detail('Scoring review', true)];
  restore();
  assert.deepEqual(menus.map(menu => menu.open), [false, true, false]);
});
test('top three comparisons remain compact while all additional targets stay reachable', () => {
  const comparisons=Array.from({length:5},(_,i)=>({targetUnitId:'t'+i,targetName:'Target '+i,rank:i+1}));
  const html=shootingTargetComparisonCards('a','w',null,{units:[{id:'a',ownerId:'p1'}]},[{id:'w'}],'p1',{comparisons});
  const detail=html.indexOf('<details');
  assert.equal((html.slice(0,detail).match(/data-advisor-target/g)??[]).length,3);
  assert.equal((html.slice(detail).match(/data-advisor-target/g)??[]).length,2);
  assert.match(html,/More targets \(2\)/);
});
test('target cycling retains keyed disclosures and restores the active selector without scrolling', () => {
  const detail = open => ({ open, getAttribute: () => 'shoot-assumptions' });
  const previous = { disabled: false };
  let current = previous, section = detail(true), focusOptions = null;
  const container = { ownerDocument: { activeElement: previous },
    querySelector: selector => selector === '[data-target]' ? current : null,
    querySelectorAll: selector => selector === '[data-view-key]' ? [section] : [] };
  const restore = captureViewContinuity(container);
  current = { focus: options => { focusOptions = options; } }; section = detail(false);
  restore();
  assert.equal(section.open, true);
  assert.deepEqual(focusOptions, { preventScroll: true });
});
test('removed target comparison focus does not jump to another target', () => {
  const previous = { getAttribute: () => 'removed-target' };
  let nodes = [previous], focused = false;
  const container = { ownerDocument: { activeElement: previous }, querySelector: () => null,
    querySelectorAll: selector => selector === '[data-advisor-target]' ? nodes : [] };
  const restore = captureViewContinuity(container);
  nodes = [{ getAttribute: () => 'other', focus: () => { focused = true; } }];
  restore(); assert.equal(focused, false);
});
test('attack receipt escapes imported names and offers one immediate correction', () => {
  const html=renderActionReceipt({getLastCorrection:()=>({label:'attack',detail:'<Shooter> → Target · 3 damage'})});
  assert.match(html,/&lt;Shooter&gt;/);assert.match(html,/data-live-undo/);
  assert.equal(renderActionReceipt({getLastCorrection:()=>null}),'');
});
