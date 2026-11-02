import test from 'node:test';
import assert from 'node:assert/strict';
import { SPACE_MARINES_ARMY_CATALOG } from '../../src/data/space-marines-army-catalog.js';

test('Marneus Calgar is available in the Space Marines Army Builder with a combat profile',()=>{
  const calgar=SPACE_MARINES_ARMY_CATALOG.find(unit=>unit.name==='Marneus Calgar');
  assert.ok(calgar);
  assert.equal(calgar.id,'space-marines:marneus-calgar');
  assert.equal(calgar.defaultModelCount,1);
  assert.equal(calgar.defaultPoints,180);
  assert.equal(calgar.datasheet?.characteristics?.Toughness,'6');
  assert.equal(calgar.datasheet?.characteristics?.['Invulnerable save'],'4+');
  assert.ok(calgar.datasheet?.weapons?.some(weapon=>weapon.name==='Gauntlets of Ultramar'&&weapon.range==='18"'));
  assert.ok(calgar.datasheet?.weapons?.some(weapon=>weapon.name==='Gauntlets of Ultramar - Overhead Smash'&&weapon.range==='Melee'));
  assert.ok(calgar.datasheet?.abilities?.some(ability=>ability.name==='Master Tactician'));
});
