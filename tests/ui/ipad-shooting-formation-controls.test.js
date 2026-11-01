import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFullGameVerificationState } from '../../src/application/full-game-verification-preset.js';
import { getCombatFormationRoot } from '../../src/rules/battle-unit-reference.js';
import { getCombatFormationWeaponOptions } from '../../src/rules/saved-roster-combat-profile.js';
import { renderCombatMapPanel } from '../../src/ui/combat-workspace.js';

function battleUnit(state, rosterUnitId) {
  return state.units.find(unit => unit.metadata?.rosterUnitId === rosterUnitId);
}

function activeVerificationState() {
  const state = createFullGameVerificationState();
  return {
    ...state,
    phase: 'shooting',
    activePlayer: 'p1',
    battle: { ...state.battle, status: 'active', round: 1, activePlayerId: 'p1' },
    units: state.units.map(unit => ({ ...unit, status: 'deployed' }))
  };
}

test('verification Wardens formation includes Trajann Eagle’s Scream ranged profile', () => {
  const state = activeVerificationState();
  const trajann = battleUnit(state, 'trajann');
  const wardens = battleUnit(state, 'wardens');
  assert.ok(trajann);
  assert.ok(wardens);
  assert.equal(getCombatFormationRoot(state, trajann)?.id, wardens.id);

  const ranged = getCombatFormationWeaponOptions(state, trajann, { type: 'ranged' });
  const eagle = ranged.find(weapon => weapon.sourceUnitId === trajann.id && weapon.profileName === "Eagle's Scream");
  assert.ok(eagle, 'attached formation should expose Trajann’s ranged weapon');
  assert.equal(eagle.characteristics.range, 24);
  assert.equal(eagle.characteristics.attacks, 2);
  assert.equal(eagle.characteristics.strength, 6);
  assert.equal(eagle.characteristics.ap, -2);
  assert.equal(eagle.characteristics.damage, 2);
});

test('combat map routes attached-member markers through the formation root in Shooting', () => {
  const state = activeVerificationState();
  const trajann = battleUnit(state, 'trajann');
  const wardens = battleUnit(state, 'wardens');
  const html = renderCombatMapPanel({
    state,
    phase: 'shooting',
    perspectivePlayerId: 'p1',
    selectedUnitId: null
  });

  assert.match(html, new RegExp(`data-map-unit-id="${wardens.id}" data-map-member-id="${trajann.id}"`));
  assert.doesNotMatch(html, new RegExp(`data-map-unit-id="${trajann.id}"`));
});

test('iPad Shooting layout surfaces attack controls before reminder content', () => {
  const css = readFileSync(new URL('../../src/ui/styles/shooting-panel.css', import.meta.url), 'utf8');
  assert.match(css, /shoot-tabletop__control-scroll\s*>\s*\*\s*\{\s*order:10;/);
  assert.match(css, /shoot-tabletop__attack-controls[^\{]*\{\s*order:2;/);
  assert.match(css, /shoot-tabletop__unit-picker\s*\{\s*order:3;/);
});
