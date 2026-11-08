import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIMARY_MISSION_MATRIX } from '../../src/data/primary-mission-catalog.js';

// Direct visual comparison with previously uploaded Primary Mission card photos.
// IMG_0178.jpeg and IMG_0179.jpeg, uploaded 2026-10-10.
// IMG_0182.jpeg / IMG_0183.jpeg provide close-up confirmation for several cards.
// Only the front-side VP tiers are asserted: action backs and conditions
// not fully visible in a photograph must not be labelled verified.
const PHOTOGRAPHED = [
  ['Battlefield Dominance', [[2],[3,2]], 'IMG_6700A944-0A87-4143-80AE-D186E14863F9.jpeg'],
  ['Purge and Secure', [[3],[4],[3]], 'IMG_6700A944-0A87-4143-80AE-D186E14863F9.jpeg'],
  ['Determined Acquisition', [[2],[3,3]], 'IMG_6700A944-0A87-4143-80AE-D186E14863F9.jpeg'],
  ['Smoke and Mirrors', [[2,2],[4],[10]], 'IMG_CBC6160D-BB92-46BA-B6D5-5B09859CC60C.jpeg'],
  ['Death Trap', [[2,3,3],[4]], 'IMG_CBC6160D-BB92-46BA-B6D5-5B09859CC60C.jpeg'],
  ['Inescapable Dominion', [[4],[5,4],[5]], 'IMG_CBC6160D-BB92-46BA-B6D5-5B09859CC60C.jpeg'],
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

test('20 photographed Primary Mission scoring tier sequences match the catalog',()=>{
  assert.equal(PHOTOGRAPHED.length,20);
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

test('six new official printed scoring faces preserve timing, alternative tiers and conditions',()=>{
  const expected = new Map([
    ['Battlefield Dominance',[['R1–2 end of your turn',[2]],['R2+ Command phase / R5 end of turn',[3,2]]]],
    ['Purge and Secure',[['End of your turn',[3]],['R2+ Command phase / R5 end of turn',[4]],['R2+ end of your turn',[3]]]],
    ['Determined Acquisition',[['End of your turn',[2]],['R2+ Command phase / R5 end of turn',[3,3]]]],
    ['Smoke and Mirrors',[['End of your turn',[2,2]],['R2+ Command phase / R5 end of turn',[4]],['End of battle',[10]]]],
    ['Death Trap',[['End of your turn',[2,3,3]],['R2+ Command phase / R5 end of turn',[4]]]],
    ['Inescapable Dominion',[['End of your turn',[4]],['R2+ Command phase / R5 end of turn',[5,4]],['End of battle',[5]]]]
  ]);
  for(const [name,windows] of expected) {
    const card=all.find(m=>m.name===name);
    assert.ok(card,name);
    assert.deepEqual(card.scoring.map(w=>[w.when,w.items.map(i=>i.vp)]),windows,name);
    assert.match(card.photographedScoringFace,/^IMG_/);
    assert.equal(card.officialCardVerified,false,'scoring face does not alone certify full card');
  }
  const purge=all.find(m=>m.name==='Purge and Secure');
  assert.match(purge.scoring[0].items[0].summary,/OR/);
  assert.match(purge.scoring[0].items[0].summary,/not cumulative/i);
  const deathTrap=all.find(m=>m.name==='Death Trap');
  assert.equal(deathTrap.scoring[0].items[1].bonus,true);
  assert.match(deathTrap.scoring[0].items[2].summary,/need not have been trapped when/i);
  assert.equal(deathTrap.scoring[0].items[2].vp,3);
  const mirrors=all.find(m=>m.name==='Smoke and Mirrors');
  assert.equal(mirrors.scoring[0].items[1].bonus,true);
  assert.match(mirrors.scoring[0].items[1].summary,/enemy territory/i);
  const acquisition=all.find(m=>m.name==='Determined Acquisition');
  assert.equal(acquisition.scoring[1].items[1].bonus,true);
  assert.match(acquisition.scoring[1].items[1].summary,/enemy territory/i);
});
