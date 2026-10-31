import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { renderArmyUnitDialog } from '../../src/ui/battle-context-panels.js';

const trajann = findArmyUnitCandidates({ faction: 'Adeptus Custodes' })
  .find(unit => unit.id === 'adeptus-custodes:trajann-valoris');

function referenceState() {
  assert.ok(trajann);
  return {
    phase: 'command', turn: 1, activePlayer: 'p1', history: [], battle: { round: 1 },
    players: [{ id: 'p1', name: 'You' }],
    armyRosters: { p1: { faction: 'Adeptus Custodes', units: [{
      ...structuredClone(trajann), id: 'saved-trajann', datasheetId: trajann.id, modelCount: 1
    }] } },
    units: [{
      id: 'battle-trajann', ownerId: 'p1', name: 'Trajann Valoris', status: 'deployed',
      wounds: 10, startingWounds: 10, startingStrength: 1, currentStrength: 1,
      metadata: { rosterUnitId: 'saved-trajann', datasheetId: trajann.id, modelCount: 1 }
    }]
  };
}

function panel(state, tab) {
  return renderArmyUnitDialog(state, 'battle-trajann', {}, tab)
    .split('data-unit-detail-panel="' + tab + '"')[1].split('</dl>')[0];
}

test('Trajann has separate invulnerable and Feel No Pain boxes below his armour save without changing battle data', () => {
  const state = referenceState();
  const before = structuredClone(state);
  const html = panel(state, 'profile');
  assert.match(html, /--unit-stat-count:6/);
  assert.match(html, /<dt>Save<\/dt><dd>2\+<\/dd><\/div>/);
  assert.match(html, /data-unit-defence="invulnerable" style="--unit-defence-column:3"><dt>Invulnerable Save<\/dt><dd>4\+<\/dd><\/div>/);
  assert.match(html, /data-unit-defence="feel-no-pain" style="--unit-defence-column:4"><dt>Feel No Pain<\/dt><dd>5\+<\/dd><\/div>/);
  assert.doesNotMatch(html, /prototype-unit-invulnerable-save/);
  assert.deepEqual(state, before);
});

test('defence boxes follow the Save column in an older snapshot with the screenshot ordering', () => {
  const state = referenceState();
  const saved = state.armyRosters.p1.units[0];
  const c = saved.datasheet.characteristics;
  saved.datasheet.characteristics = Object.fromEntries([
    'Move', 'Save', 'Wounds', 'Toughness', 'Leadership', 'Invulnerable save', 'Objective Control'
  ].map(key => [key, c[key]]));
  const html = panel(state, 'profile');
  assert.match(html, /data-unit-defence="invulnerable" style="--unit-defence-column:2"/);
  assert.match(html, /data-unit-defence="feel-no-pain" style="--unit-defence-column:3"/);
});

test('save presentation accepts existing invulnerable-save key formats and numeric values', () => {
  for (const key of ['Invulnerable Save', 'invulnerableSave', 'invulnerable']) {
    const state = referenceState();
    const c = state.armyRosters.p1.units[0].datasheet.characteristics;
    delete c['Invulnerable save'];
    c.Save = 2;
    c[key] = 4;
    const html = panel(state, 'profile');
    assert.match(html, /<dt>Save<\/dt><dd>2\+</);
    assert.equal((html.match(/data-unit-defence="invulnerable"/g) ?? []).length, 1);
    assert.match(html, /<dt>Invulnerable Save<\/dt><dd>4\+<\/dd>/);
  }
});

test('missing armour or invulnerable saves are not invented or discarded', () => {
  const withoutInvulnerable = referenceState();
  delete withoutInvulnerable.armyRosters.p1.units[0].datasheet.characteristics['Invulnerable save'];
  assert.doesNotMatch(panel(withoutInvulnerable, 'profile'), /data-unit-defence="invulnerable"/);

  const withoutArmour = referenceState();
  withoutArmour.armyRosters.p1.units[0].datasheet.characteristics = { 'Invulnerable save': '4+' };
  const html = panel(withoutArmour, 'profile');
  assert.match(html, /<dt>Invulnerable Save<\/dt><dd>4\+<\/dd>/);
  assert.doesNotMatch(html, /<dt>Save<\/dt>/);
});

test('conditional or missing Feel No Pain is not presented as general protection', () => {
  for (const abilities of [[], [
    { name: 'Aegis of the Emperor', description: 'This unit has Feel No Pain 5+ against mortal wounds.' },
    { name: 'Feel No Pain 5+', description: 'This model has Feel No Pain 5+ against psychic attacks.' }
  ]]) {
    const state = referenceState();
    state.armyRosters.p1.units[0].datasheet.abilities = abilities;
    assert.doesNotMatch(panel(state, 'profile'), /data-unit-defence="feel-no-pain"/);
  }
});

test('Trajann weapon references match the October 2026 profiles and keep loadout confirmation explicit', () => {
  // Current Codex-derived reference used by the project; GW preview source:
  // https://www.warhammer-community.com/en-gb/articles/2xxurx9j/first-look-adeptus-custodes-datasheets/
  const state = referenceState();
  const saved = state.armyRosters.p1.units[0];
  const fields = ['name', 'range', 'attacks', 'skill', 'strength', 'ap', 'damage', 'abilities'];
  assert.deepEqual(saved.datasheet.weapons.map(weapon => fields.map(key => weapon[key])), [
    ["Eagle's Scream", '24"', 2, '2+', 6, -2, 2, 'Assault, Rapid Fire 2'],
    ["Watcher's Axe", 'Melee', 6, '2+', 12, -3, 4, 'Cleave 1']
  ]);
  const reference = renderArmyUnitDialog(state, 'battle-trajann', {}, 'weapons');
  assert.match(reference, /No confirmed equipped weapon selection/);
  assert.equal((reference.match(/>Reference profile<\/span>/g) ?? []).length, 2);
  assert.match(reference, /\[Assault, Rapid Fire 2\]/);
  assert.match(reference, /\[Cleave 1\]/);

  saved.equippedWeapons = saved.datasheet.weapons.map(weapon => ({ name: weapon.name, quantity: 1 }));
  saved.loadoutValidation = { status: 'profile-matched' };
  const confirmed = renderArmyUnitDialog(state, 'battle-trajann', {}, 'weapons');
  assert.equal((confirmed.match(/1 active · 1 equipped/g) ?? []).length, 2);
  assert.doesNotMatch(confirmed, /No confirmed equipped weapon selection|>Reference profile<\/span>/);
});
