import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { getCustodesDetachmentRuleReminders } from '../../src/rules/custodes-detachment-rule-reminders.js';
import { getBattleRulesReminders } from '../../src/rules/battle-rules-reminders.js';
import { getRecordedCombatRules } from '../../src/rules/recorded-combat-rules.js';
import { applyRecordedCombatEffects } from '../../src/rules/contextual-datasheet-effects.js';
import { getExpectedDamage } from '../../src/rules/expected-damage.js';

function chosen(phase = 'shooting') {
  const state = custodesReminderState({ phase, activePlayer: 'p1' });
  state.armyRosters.p1.detachment = "Emperor's Chosen";
  state.armyRosters.p1.detachments = ["Emperor's Chosen"];
  return state;
}

test('Magna Imperator is offered only when a keyword-eligible unit is selected to attack', () => {
  const shooting = chosen('shooting');
  const selected = getCustodesDetachmentRuleReminders(shooting, { playerId: 'p1', unitId: 'wardens' });
  assert.ok(selected.some(entry => entry.title === 'Magna Imperator'));
  assert.equal(getCustodesDetachmentRuleReminders(shooting, { playerId: 'p1' }).some(entry => entry.title === 'Magna Imperator'), false);
  assert.equal(getCustodesDetachmentRuleReminders(chosen('movement'), { playerId: 'p1', unitId: 'wardens' }).some(entry => entry.title === 'Magna Imperator'), false);
  assert.equal(getCustodesDetachmentRuleReminders(shooting, { playerId: 'p1', unitId: 'prosecutors', selectedToAttack: true }).some(entry => entry.title === 'Magna Imperator'), false);
  const rules = getRecordedCombatRules(shooting, shooting.units.find(unit => unit.id === 'wardens'));
  assert.ok(rules.effects.includes('magna-imperator'));
  assert.equal(getRecordedCombatRules(chosen('movement'), shooting.units.find(unit => unit.id === 'wardens')).effects.includes('magna-imperator'), false);
});

test('Captain-General re-rolls apply only inside 6 inches and raise expected damage', () => {
  const state = chosen('shooting');
  const sentinel = state.units.find(unit => unit.id === 'sentinel');
  const near = getBattleRulesReminders(state, { playerId: 'p1', unitId: 'sentinel' });
  assert.ok(near.some(entry => entry.ruleId === 'captain-general-range-check'));
  assert.ok(getRecordedCombatRules(state, sentinel).effects.includes('captain-general-aura'));
  sentinel.position = { x: 40, y: 20 };
  assert.equal(getBattleRulesReminders(state, { playerId: 'p1', unitId: 'sentinel' }).some(entry => entry.ruleId === 'captain-general-range-check'), false);
  assert.equal(getRecordedCombatRules(state, sentinel).effects.includes('captain-general-aura'), false);
  const weapon = { type: 'ranged', characteristics: { attacks: 2, strength: 4, ap: 0, damage: 1, skill: 4 } };
  const target = { keywords: ['infantry'], characteristics: { toughness: 4, save: 4 }, combatRules: { effects: [] } };
  const withAura = getExpectedDamage({ attacker: { combatRules: { effects: ['captain-general-aura'] }, characteristics: { ballisticSkill: 4 } }, target, weapon });
  const without = getExpectedDamage({ attacker: { combatRules: { effects: [] }, characteristics: { ballisticSkill: 4 } }, target, weapon });
  assert.ok(withAura.expectedDamage > without.expectedDamage);
  const profile = applyRecordedCombatEffects({ attacker: { combatRules: { effects: ['magna-imperator'] } }, target, profile: { ap: 0, weaponType: 'ranged', hitReroll: 'none', woundReroll: 'none', strength: 4, toughness: 4 } });
  assert.equal(profile.singleHitReroll, true);
  assert.equal(profile.singleWoundReroll, true);
});
