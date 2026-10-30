import test from 'node:test';
import assert from 'node:assert/strict';
import { getArmyUnitDisplayGroups } from '../../src/ui/army-unit-display-groups.js';
import { renderPhaseArmyRoster } from '../../src/ui/phase-army-roster.js';
import { renderMovementRosterRail } from '../../src/ui/movement-dashboard-view.js';
import { renderArmyRosterOverlay, renderArmyUnitDialog } from '../../src/ui/battle-context-panels.js';

function attachedState() {
  const sheet = (name, wounds, strength, ability) => ({
    characteristics: { movement: 6, toughness: strength, save: '2+', wounds },
    keywords: ['Infantry', name],
    weapons: [
      { name: name + ' weapon', type: 'melee', range: 'Melee', attacks: 4, skill: '2+', strength, ap: -2, damage: 2, abilities: ['Precision'] },
      { name: 'Unequipped option', range: 24, attacks: 2, skill: '3+', strength: 4, ap: 0, damage: 1 }
    ],
    abilities: [{ name: ability, description: name + ' ability text.' }]
  });
  return {
    phase: 'shooting', activePlayer: 'p1', turn: 1, battle: { round: 1 }, history: [],
    players: [{ id: 'p1', name: 'You' }, { id: 'p2', name: 'Opponent' }],
    // A Leader can precede its Bodyguard in the saved battle order.
    units: [
      { id: 'leader', ownerId: 'p1', name: 'Leader & B', status: 'deployed', wounds: 6, startingStrength: 1, metadata: { rosterUnitId: 'rl' } },
      { id: 'guard', ownerId: 'p1', name: 'Bodyguard <A>', status: 'deployed', wounds: 7, startingStrength: 3, currentStrength: 2, metadata: { rosterUnitId: 'rg' } },
      { id: 'enemy-leader', ownerId: 'p2', name: 'Enemy Leader', status: 'deployed', wounds: 4, startingStrength: 1, metadata: { rosterUnitId: 'rl' } },
      { id: 'enemy-guard', ownerId: 'p2', name: 'Enemy Bodyguard', status: 'deployed', wounds: 10, startingStrength: 3, metadata: { rosterUnitId: 'rg' } }
    ],
    armyRosters: {
      p1: { units: [
        { id: 'rl', attachedToBodyguardId: 'rg', modelCount: 1, notes: 'Leader note <only>', datasheet: sheet('Leader', 8, 7, 'While Leading'), equippedWeapons: [{ name: 'Leader weapon', quantity: 1 }] },
        { id: 'rg', attachedLeaderIds: ['rl'], modelCount: 3, notes: 'Bodyguard note', datasheet: sheet('Bodyguard', 5, 6, 'Bodyguard Rule'), equippedWeapons: [{ name: 'Bodyguard weapon', quantity: 3 }] }
      ] },
      p2: { units: [
        { id: 'rl', attachedToBodyguardId: 'rg', modelCount: 1, datasheet: sheet('Enemy Leader', 4, 4, 'Enemy Rule') },
        { id: 'rg', attachedLeaderIds: ['rl'], modelCount: 3, datasheet: sheet('Enemy Bodyguard', 4, 4, 'Enemy Guard Rule') }
      ] }
    }
  };
}

function panel(html, tab) {
  return html.split('data-unit-detail-panel="' + tab + '"')[1].split('<div id="army-unit-panel-')[0];
}

test('saved attachments group once, retain Bodyguard first and stay isolated by player', () => {
  const state = attachedState();
  const before = JSON.stringify(state);
  const groups = getArmyUnitDisplayGroups(state);
  assert.deepEqual(groups.map(group => group.members.map(unit => unit.id)), [
    ['guard', 'leader'], ['enemy-guard', 'enemy-leader']
  ]);
  assert.equal(JSON.stringify(state), before);
});

test('multiple Leaders and older reciprocal-only attachment links remain grouped', () => {
  const state = attachedState();
  delete state.armyRosters.p1.units[0].attachedToBodyguardId;
  state.units.push({ id: 'second', ownerId: 'p1', name: 'Second Leader', status: 'deployed', metadata: { rosterUnitId: 'r2' } });
  state.armyRosters.p1.units.push({ id: 'r2', attachedToBodyguardId: 'rg' });
  assert.deepEqual(getArmyUnitDisplayGroups(state)[0].members.map(unit => unit.id), ['guard', 'leader', 'second']);
});

test('destroyed and separated members appear independently; reserves stay grouped', () => {
  for (const id of ['leader', 'guard']) {
    const state = attachedState();
    state.units.find(unit => unit.id === id).status = 'destroyed';
    const groups = getArmyUnitDisplayGroups(state, state.units.filter(unit => unit.ownerId === 'p1'));
    assert.equal(groups.length, 2);
    assert.ok(groups.every(group => !group.attached));
  }
  const state = attachedState();
  state.units[0].status = 'reserves';
  assert.equal(getArmyUnitDisplayGroups(state)[0].attached, false);
  state.units[1].status = 'reserves';
  assert.equal(getArmyUnitDisplayGroups(state)[0].attached, true);
});

test('missing or cyclic links never hide or duplicate units', () => {
  const state = attachedState();
  state.armyRosters.p1.units[0].attachedToBodyguardId = 'missing';
  state.armyRosters.p1.units[1].attachedToBodyguardId = 'rl';
  const groups = getArmyUnitDisplayGroups(state, state.units.filter(unit => unit.ownerId === 'p1'));
  assert.deepEqual(groups.flatMap(group => group.members.map(unit => unit.id)).sort(), ['guard', 'leader']);
  assert.ok(groups.every(group => !group.attached));
});

test('the live rail groups both armies and retains each member wound count and reference button', () => {
  const state = attachedState();
  const html = renderPhaseArmyRoster(state, 'p1');
  assert.equal((html.match(/class="phase-army-roster__group"/g) ?? []).length, 2);
  for (const unit of state.units) assert.equal((html.match(new RegExp('data-open-unit-details="' + unit.id + '"', 'g')) ?? []).length, 1);
  assert.match(html, /Bodyguard &lt;A&gt;/);
  assert.match(html, /Leader &amp; B/);
  assert.match(html, /W 7\/15/);
  assert.match(html, /W 6\/8/);
  assert.doesNotMatch(html, /W 13\/23/);
});

test('Movement groups members while preserving individual action selection and reference access', () => {
  const state = attachedState();
  const html = renderMovementRosterRail(state, { playerId: 'p1', perspectivePlayerId: 'p1', selectedUnitId: 'leader' });
  assert.match(html, /class="movement-roster__group"/);
  for (const id of ['guard', 'leader']) {
    assert.match(html, new RegExp('data-move-roster-unit="' + id + '"'));
    assert.match(html, new RegExp('data-open-unit-details="' + id + '"'));
  }
  assert.match(html, /W 6\/8/);
  const enemy = renderMovementRosterRail(state, { playerId: 'p1', perspectivePlayerId: 'p1', rosterView: 'opponent' });
  assert.match(enemy, /class="movement-roster__group"/);
  assert.match(enemy, /data-open-unit-details="enemy-leader"/);
  assert.doesNotMatch(enemy, /data-move-roster-unit=/);
});

test('opening either member shows the same grouped dialog and distinct member profiles and vitals', () => {
  const state = attachedState();
  const html = renderArmyUnitDialog(state, 'guard');
  assert.equal(html, renderArmyUnitDialog(state, 'leader'));
  assert.match(html, /Bodyguard &lt;A&gt; \+ Leader &amp; B/);
  assert.match(html, /W 7\/15/);
  assert.match(html, /W 6\/8/);
  const profile = panel(html, 'profile');
  assert.equal((profile.match(/prototype-unit-profile-characteristics/g) ?? []).length, 2);
  assert.match(profile, /Bodyguard/);
  assert.match(profile, /Leader/);
  assert.doesNotMatch(profile, /Enemy/);
  const overlay = renderArmyRosterOverlay(state, 'p1');
  assert.equal((overlay.match(/prototype-attached-roster/g) ?? []).length, 1);
  assert.match(overlay, /data-open-unit-details="guard"/);
  assert.match(overlay, /data-open-unit-details="leader"/);
});

test('Weapons, Abilities and Notes stay associated with their owning member', () => {
  const state = attachedState();
  const html = renderArmyUnitDialog(state, 'leader', {}, 'weapons');
  const weapons = panel(html, 'weapons');
  const guard = weapons.split('data-unit-reference-member="guard"')[1].split('</section>')[0];
  const leader = weapons.split('data-unit-reference-member="leader"')[1].split('</section>')[0];
  assert.match(guard, /Bodyguard weapon/);
  assert.doesNotMatch(guard, /Leader weapon/);
  assert.match(leader, /Leader weapon/);
  assert.doesNotMatch(leader, /Bodyguard weapon|Unequipped option/);
  assert.match(leader, /<\/dl><p class="prototype-unit-weapon-keywords">\[Precision\]<\/p>/);
  const abilities = panel(html, 'abilities');
  assert.match(abilities, /Bodyguard Rule/);
  assert.match(abilities, /While Leading/);
  assert.match(abilities, /Leader ability text/);
  const notes = panel(html, 'notes');
  assert.match(notes, /Bodyguard note/);
  assert.match(notes, /Leader note &lt;only&gt;/);
});

test('a surviving Leader opens independently after its Bodyguard is lost', () => {
  const state = attachedState();
  state.units.find(unit => unit.id === 'guard').status = 'destroyed';
  const html = renderArmyUnitDialog(state, 'leader');
  assert.match(html, /Leader &amp; B/);
  assert.doesNotMatch(html, /prototype-formation-vitals|Bodyguard weapon|Bodyguard Rule/);
});
