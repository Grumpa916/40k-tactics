import test from 'node:test';
import assert from 'node:assert/strict';
import { ARMY_UNIT_CATALOG } from '../../src/data/army-unit-catalog.js';
import { resolveBuilderUnitCost } from '../../src/rules/army-builder-cost.js';
import { createArmyUnitEditorController } from '../../src/ui/army-unit-editor-controller.js';

function warden(id, modelCount = 2) {
  const candidate = ARMY_UNIT_CATALOG.find(item => item.id === 'adeptus-custodes:custodian-wardens');
  return { ...structuredClone(candidate), id, datasheetId: candidate.id, modelCount };
}

test('Custodian Wardens resolve reviewed first-unit and second-plus prices at both published sizes', () => {
  const first = warden('wardens-1', 3);
  const second = warden('wardens-2', 3);
  const roster = { units: [first, second] };

  assert.equal(resolveBuilderUnitCost(first, roster).points, 295);
  assert.equal(resolveBuilderUnitCost(second, roster).points, 325);
  assert.equal(resolveBuilderUnitCost({ ...first, modelCount: 2 }, roster).points, 200);
  assert.equal(resolveBuilderUnitCost({ ...second, modelCount: 2 }, roster).points, 230);
});

test('Army Builder can select and save a three-model first Custodian Warden unit', () => {
  const existing = warden('wardens-1', 2);
  const roster = { units: [existing] };
  const container = {
    contains: () => true,
    querySelector: () => null
  };
  const controller = createArmyUnitEditorController(container, {
    getUnit: () => existing,
    getRoster: () => roster,
    render: () => {}
  });
  const sizeButton = {
    disabled: false,
    matches: selector => selector === '[data-unit-size]',
    getAttribute: name => name === 'data-unit-size' ? '3' : null
  };

  const handled = controller.handleClick({
    preventDefault() {},
    target: { closest: () => sizeButton }
  });
  assert.equal(handled, true);

  const prepared = controller.prepareSave(existing);
  assert.equal(prepared.unit.modelCount, 3);
  assert.equal(prepared.unit.points, 295);
  assert.equal(prepared.selections.find(item => item.name === 'Guardian Spear')?.quantity, 3);
});
