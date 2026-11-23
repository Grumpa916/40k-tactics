import test from 'node:test';
import assert from 'node:assert/strict';
import { custodesReminderState } from '../helpers/custodes-reminder-state.js';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS as sheets } from '../../src/data/adeptus-custodes-datasheet-details.js';
import { getBattleRulesReminders } from '../../src/rules/battle-rules-reminders.js';
import { getCustodesDetachmentRuleReminders } from '../../src/rules/custodes-detachment-rule-reminders.js';
import { isAdeptusCustodesKeywordUnit } from '../../src/rules/custodes-keyword-eligibility.js';

const anathemaSheets = ['knight-centura', 'prosecutor-squad', 'vigilator-squad', 'witchseeker-squad'];

function addSheet(state, id, slug, name) {
  state.armyRosters.p1.units.push({
    id: 'r-' + id, name, modelCount: id === 'knight' ? 1 : 4,
    datasheet: structuredClone(sheets['adeptus-custodes:' + slug])
  });
  state.units.push({
    id, name, ownerId: 'p1', status: 'deployed', wounds: 4, position: { x: 20, y: 20 },
    metadata: { rosterUnitId: 'r-' + id }
  });
}

function battle(phase = 'shooting') {
  const state = custodesReminderState({ phase, activePlayer: 'p1' });
  state.battle.firstPlayerId = 'p1';
  state.armyRosters.p1.detachment = "Emperor's Chosen";
  state.armyRosters.p1.detachments = ["Emperor's Chosen"];
  addSheet(state, 'vigilators', 'vigilator-squad', 'Vigilators');
  addSheet(state, 'witchseekers', 'witchseeker-squad', 'Witchseekers');
  addSheet(state, 'knight', 'knight-centura', 'Knight-Centura');
  return state;
}

test('Anathema Psykana datasheets do not carry the Adeptus Custodes keyword', () => {
  for (const slug of anathemaSheets) {
    const keywords = sheets['adeptus-custodes:' + slug].keywords.map(keyword => keyword.toLowerCase());
    assert.ok(keywords.includes('anathema psykana'), slug);
    assert.equal(keywords.includes('adeptus custodes'), false, slug);
  }
  const state = battle();
  assert.equal(isAdeptusCustodesKeywordUnit(state, state.units.find(unit => unit.id === 'wardens')), true);
  for (const id of ['prosecutors', 'vigilators', 'witchseekers', 'knight']) {
    assert.equal(isAdeptusCustodesKeywordUnit(state, state.units.find(unit => unit.id === id)), false, id);
  }
});

test('Magna Imperator and the Captain-General aura follow datasheet keywords', () => {
  const state = battle('shooting');
  const magna = unitId => getCustodesDetachmentRuleReminders(state, { playerId: 'p1', unitId })
    .some(entry => entry.ruleId === "detachment-rule:Emperor's Chosen");
  const aura = unitId => getBattleRulesReminders(state, { playerId: 'p1', unitId })
    .some(entry => entry.ruleId === 'captain-general' || entry.ruleId === 'captain-general-range-check');
  assert.equal(magna('wardens'), true);
  assert.equal(aura('sentinel'), true);
  assert.equal(aura('wardens'), true);
  for (const id of ['prosecutors', 'vigilators', 'witchseekers', 'knight']) {
    assert.equal(magna(id), false, id);
    assert.equal(aura(id), false, id);
  }
});

test('Martial Mastery is not offered for a selected Anathema Psykana unit', () => {
  const state = battle('fight');
  state.armyRosters.p1.detachment = 'Guardians of the Throne';
  state.armyRosters.p1.detachments = ['Guardians of the Throne'];
  const mastery = unitId => getBattleRulesReminders(state, { playerId: 'p1', unitId })
    .some(entry => entry.ruleId === 'martial-mastery');
  assert.equal(mastery('wardens'), true);
  assert.equal(mastery('prosecutors'), false);
  assert.equal(mastery('knight'), false);
});
