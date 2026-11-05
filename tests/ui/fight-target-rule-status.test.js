import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { renderFightTargetRuleStatus } from '../../src/ui/fight-target-rule-status.js';
import { createFightTabletopScreen } from '../../src/ui/fight-tabletop-screen.js';
import { createGameSession } from '../../src/application/game-session.js';
import { fakeDom } from '../helpers/combat-dom.js';

function matchup() {
  const state = custodesReminderState({phase:'fight',activePlayer:'p1'});
  state.units.push({id:'impulsor',name:'Impulsor',ownerId:'p2',status:'deployed',wounds:11,position:{x:22,y:20},characteristics:{toughness:9}});
  return state;
}

test('Slayer status checks target formation Toughness and never treats a reminder as eligibility', () => {
  const state = matchup();
  assert.match(renderFightTargetRuleStatus(state,{attackerId:'allarus'}), /Conditional rule.*Choose a target/);
  assert.match(renderFightTargetRuleStatus(state,{attackerId:'allarus',targetId:'impulsor'}), /Applies to selected target.*Impulsor T9 &gt; allarus T8.*\+1 to Wound/);
  assert.match(renderFightTargetRuleStatus(state,{attackerId:'allarus',targetId:'marine'}), /Does not apply to selected target.*Marine attacker T5 ≤ allarus T8/);
  assert.equal(renderFightTargetRuleStatus(state,{attackerId:'wardens',targetId:'impulsor'}),'');
  state.units.push({id:'unknown',name:'Unknown <target>',ownerId:'p2',status:'deployed',wounds:1,position:{x:22,y:20}});
  const unknown=renderFightTargetRuleStatus(state,{attackerId:'allarus',targetId:'unknown'});
  assert.match(unknown,/Check Toughness/);
  assert.match(unknown,/Unknown &lt;target&gt;/);
});

test('Fight target selection presents the matchup next to the target picker', () => {
  const state=matchup(), root=fakeDom(), session=createGameSession(state);
  const screen=createFightTabletopScreen(root,{session,perspectivePlayerId:'p1'});
  root.click('[data-fight-select]','allarus');
  assert.match(root.innerHTML,/Slayer of Tyrants · Conditional rule/);
  root.change('[data-fight-target]','impulsor');
  assert.match(root.innerHTML,/Slayer of Tyrants · Applies to selected target/);
  screen.destroy();
});
