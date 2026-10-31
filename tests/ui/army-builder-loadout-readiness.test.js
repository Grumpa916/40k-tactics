import test from 'node:test';
import assert from 'node:assert/strict';
import { renderArmyBuilder } from '../../src/ui/army-builder-view.js';

function baseRoster(unit) {
  return {
    id: 'r1',
    name: 'Loadout gate test',
    faction: 'Tyranids',
    detachment: 'Vanguard Onslaught',
    detachments: ['Vanguard Onslaught'],
    pointsLimit: 2000,
    units: [unit]
  };
}

function render(roster) {
  return renderArmyBuilder({
    current: roster,
    busy: false,
    page: 'editor',
    records: [],
    openUnitDetailId: '',
    previewId: '',
    unitDraft: null,
    message: '',
    unitSearch: '',
    category: '',
    sort: 'name',
    fits: false,
    players: [{ id: 'p1', name: 'You' }],
    canApply: true,
    onApplyRoster() {}
  });
}

test('Army Builder flags unresolved reviewed loadouts and disables battle assignment', () => {
  const html = render(baseRoster({
    id: 'gants', name: 'Termagants', datasheetId: 'tyranids:termagants', modelCount: 10, points: 120,
    loadoutValidation: { status: 'manual-selection-required' }
  }));
  assert.match(html, /Loadouts need attention/);
  assert.match(html, /Loadout needs confirmation/);
  assert.match(html, /data-roster-apply disabled/);
  assert.match(html, /Resolve the loadout items above before using this roster in a battle/);
});

test('Army Builder accepts a legal reviewed loadout and enables battle assignment', () => {
  const html = render(baseRoster({
    id: 'gants', name: 'Termagants', datasheetId: 'tyranids:termagants', modelCount: 10, points: 120,
    equippedWargear: [
      { name: 'Chitinous claws and teeth', quantity: 10 },
      { name: 'Fleshborer', quantity: 10 }
    ]
  }));
  assert.match(html, /Loadouts Battle Ready/);
  assert.match(html, /Loadout ready/);
  assert.match(html, /data-roster-apply >/);
  assert.doesNotMatch(html, /data-roster-apply disabled/);
});
