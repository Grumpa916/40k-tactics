import test from 'node:test';
import assert from 'node:assert/strict';
import { createFullGameVerificationState } from '../../src/application/full-game-verification-preset.js';
import { getBattleRosterUnit } from '../../src/rules/battle-unit-reference.js';
import { renderArmyUnitDialog } from '../../src/ui/battle-context-panels.js';
import { renderMissionReviewPanel } from '../../src/ui/mission-review-panel.js';

test('verification attached-unit reference hydrates the full reviewed datasheet stat line', () => {
  const state = createFullGameVerificationState();
  const guard = state.units.find(unit => unit.id === 'p1:guard');
  assert.ok(guard);
  const rosterUnit = getBattleRosterUnit(state, guard);
  assert.equal(rosterUnit.datasheet.characteristics.Move, '8"');
  assert.equal(rosterUnit.datasheet.characteristics.Toughness, 7);
  assert.equal(rosterUnit.datasheet.characteristics.Save, '2+');
  assert.equal(rosterUnit.datasheet.characteristics.Wounds, 5);
  assert.equal(rosterUnit.datasheet.characteristics.Leadership, '5+');
  assert.equal(rosterUnit.datasheet.characteristics['Objective Control'], 3);
  assert.equal(rosterUnit.datasheet.characteristics['Invulnerable save'], '4+');

  const html = renderArmyUnitDialog(state, guard.id);
  for (const label of ['Move', 'Toughness', 'Save', 'Wounds', 'Leadership', 'Objective Control', 'Invulnerable Save']) {
    assert.match(html, new RegExp(label.replace(' ', '\\s')));
  }
});

test('mission review reserves the iPad viewport width and prevents nested mission cards from clipping', () => {
  const html = renderMissionReviewPanel('<section class="battle-mission-summary"><details class="battle-mission-summary__section"><summary>Primary Missions</summary></details></section>', { open: true });
  assert.match(html, /data-mission-review-layout/);
  assert.match(html, /width:min\(1180px,calc\(100vw - 24px\)\)/);
  assert.match(html, /overflow-x:hidden/);
  assert.match(html, /battle-mission-summary__card\{box-sizing:border-box;width:100%;max-width:100%;min-width:0;\}/);
  assert.match(html, /battle-mission-summary__card>summary\{flex-wrap:wrap;min-width:0;\}/);
});
