import test from 'node:test';
import assert from 'node:assert/strict';
import { renderArmyBuilder } from '../../src/ui/army-builder-view.js';

const baseState = {
  current: null,
  busy: false,
  page: 'new',
  records: [],
  openUnitDetailId: null,
  previewId: null,
  message: '',
  players: [],
  canApply: false,
  onApplyRoster: null,
  fits: false,
  sort: 'name'
};

test('Army Builder faction dropdown only shows factions with loaded unit catalogs', () => {
  const html = renderArmyBuilder(baseState);
  assert.match(html, /Adeptus Custodes/);
  assert.match(html, /Space Marines/);
  assert.match(html, /Tyranids/);
  for (const unsupported of ['Orks','Necrons','Aeldari','Astra Militarum','Other \/ custom']) {
    assert.doesNotMatch(html, new RegExp(`>${unsupported}<`));
  }
});

test('Warhammer App import faction dropdown uses the same loaded-faction list', () => {
  const html = renderArmyBuilder({ ...baseState, page: 'import' });
  assert.match(html, /Adeptus Custodes/);
  assert.match(html, /Space Marines/);
  assert.match(html, /Tyranids/);
  assert.doesNotMatch(html, />Orks</);
});
