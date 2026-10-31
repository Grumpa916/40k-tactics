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

test('mission review uses the iPad viewport as a stacked scrollable review workspace', () => {
  const summary = '<section class="battle-mission-summary">' +
    '<details class="battle-mission-summary__section" data-mission-summary-key="mission-section-primary"><summary>Primary Missions</summary><div class="battle-mission-summary__section-content">Primary detail</div></details>' +
    '<details class="battle-mission-summary__section" data-mission-summary-key="mission-section-secondary"><summary>Secondary Missions</summary><div class="battle-mission-summary__section-content">Secondary detail</div></details>' +
    '</section>';
  const html = renderMissionReviewPanel(summary, { open: true });
  assert.match(html, /data-mission-review-layout/);
  assert.match(html, /width:min\(1180px,calc\(100vw - 24px\)\)/);
  assert.match(html, /height:calc\(100dvh - 24px\)/);
  assert.match(html, /overflow-y:auto/);
  assert.match(html, /battle-mission-summary\{box-sizing:border-box;display:grid!important;grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(html, /battle-mission-summary__section-content\{position:static!important;inset:auto!important;top:auto!important;left:auto!important;right:auto!important;z-index:auto!important;display:grid!important;grid-template-columns:minmax\(0,1fr\)!important[\s\S]*max-height:none!important;overflow:visible!important/);
  assert.match(html, /data-mission-summary-key="mission-section-primary" open>/);
  assert.match(html, /data-mission-summary-key="mission-section-secondary" open>/);
});
