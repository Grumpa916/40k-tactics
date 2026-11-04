import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIMARY_MISSION_MATRIX } from '../../src/data/primary-mission-catalog.js';

// Direct visual comparison with previously uploaded Primary Mission card photos.
// IMG_0178.jpeg and IMG_0179.jpeg, uploaded 2026-10-10.
// IMG_0182.jpeg / IMG_0183.jpeg provide close-up confirmation for several cards.
// Only the front-side VP tiers are asserted: action backs and conditions
// not fully visible in a photograph must not be labelled verified.
const PHOTOGRAPHED = [
  ['Meatgrinder',         [[3],[4],[5,5]], 'IMG_0178.jpeg'],
  ['Search and Scour',    [[3,2],[4],[5]], 'IMG_0178.jpeg'],
  ['Immovable Object',    [[3],[5]], 'IMG_0178.jpeg'],
  ['Unstoppable Force',   [[3],[4],[3],[5]], 'IMG_0178.jpeg'],
  ['Delaying Action',     [[2],[4],[3]], 'IMG_0178.jpeg'],
  ['Outmanoeuvre',        [[10],[4],[5],[6]], 'IMG_0178.jpeg'],
  ['Consecrate',          [[3,6],[4,4],[5]], 'IMG_0178.jpeg'],
  ['Punishment',          [[5],[4,5],[8]], 'IMG_0182.jpeg'],
  ['Sabotage',            [[3,2],[4]], 'IMG_0182.jpeg'],
  ['Extract Relic',       [[4,3,4],[4],[5]], 'IMG_0183.jpeg'],
  ['Vital Link',          [[2,1],[4,4],[10]], 'IMG_0183.jpeg'],
  ["Destroyer's Wrath",  [[3],[4,6],[4]], 'IMG_0179.jpeg'],
  ['Gather Intel',        [[6],[4],[7],[5,5]], 'IMG_0179.jpeg'],
  ['Vanguard Operation',  [[4,2],[4],[10]], 'IMG_0179.jpeg']
];
const all=[...new Map(Object.values(PRIMARY_MISSION_MATRIX).flatMap(row=>
  Object.values(row).map(mission=>[mission.name,mission]))).values()];

test('14 photographed Primary Mission scoring tier sequences match the catalog',()=>{
  assert.equal(PHOTOGRAPHED.length,14);
  assert.equal(all.length,25);
  for(const [name,tiers,photo] of PHOTOGRAPHED){
    const mission=all.find(item=>item.name===name);
    assert.ok(mission,name+' must exist');
    assert.deepEqual(mission.scoring.map(window=>window.items.map(item=>item.vp)),
      tiers,name+' differs from photograph '+photo);
  }
});

test('photographed scoring tiers do not falsely certify the unseen Primary card backs',()=>{
  for(const [name] of PHOTOGRAPHED){
    const mission=all.find(item=>item.name===name);
    assert.equal(mission.officialCardVerified,false,
      name+' still needs full card face/reverse and official errata certification');
    assert.equal(mission.sourceVerification,'community-structured-reference');
  }
});
