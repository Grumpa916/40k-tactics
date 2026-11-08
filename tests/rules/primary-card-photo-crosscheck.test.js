import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIMARY_MISSION_MATRIX } from '../../src/data/primary-mission-catalog.js';

// Direct visual comparison with previously uploaded Primary Mission card photos.
// IMG_0178.jpeg and IMG_0179.jpeg, uploaded 2026-10-10.
// IMG_0182.jpeg / IMG_0183.jpeg provide close-up confirmation for several cards.
// Only the front-side VP tiers are asserted: action backs and conditions
// not fully visible in a photograph must not be labelled verified.
const PHOTOGRAPHED = [
  ['Surveil the Foe', [[4],[4,4],[5]], 'IMG_4A7684A0-3C51-4E8B-A46A-AF5D17A548E5.jpeg'],
  ['Locate and Deny', [[4,4],[4],[5]], 'IMG_4A7684A0-3C51-4E8B-A46A-AF5D17A548E5.jpeg'],
  ['Triangulation', [[4],[3,6,10],[10]], 'IMG_4A7684A0-3C51-4E8B-A46A-AF5D17A548E5.jpeg'],
  ['Reconnaissance Sweep', [[3,6,1],[3]], 'IMG_036DC38C-9A7B-42B0-8253-F2849AECE7F7.jpeg'],
  ['Secure Asset', [[4,2],[4,4]], 'IMG_9AABC8D9-D31D-4874-8521-07E4C8F38BA3.jpeg'],
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

test('all 25 photographed Primary Mission scoring tier sequences match the catalog',()=>{
  assert.equal(PHOTOGRAPHED.length,25);
  assert.equal(all.length,25);
  for(const [name,tiers,photo] of PHOTOGRAPHED){
    const mission=all.find(item=>item.name===name);
    assert.ok(mission,name+' must exist');
    assert.deepEqual(mission.scoring.map(window=>window.items.map(item=>item.vp)),
      tiers,name+' differs from photograph '+photo);
  }
});

test('photographed scoring tiers do not falsely imply full official/FAQ certification',()=>{
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

test('Reconnaissance Sweep and Secure Asset match printed Primary VP and timing conditions', () => {
  const recon = all.find(m=>m.name==='Reconnaissance Sweep');
  assert.deepEqual(recon.scoring.map(w=>[w.when,w.items.map(i=>i.vp)]),[
    ['End of your turn',[3,6,1]],
    ['R2+ Command phase / R5 end of turn',[3]]
  ]);
  assert.match(recon.scoring[0].items[0].summary,/three different table quarters/);
  assert.match(recon.scoring[0].items[1].summary,/four different table quarters/);
  assert.match(recon.scoring[0].items[0].summary,/6 inches/);
  assert.match(recon.scoring[0].items[2].summary,/Per enemy unit destroyed this turn/);
  const secure=all.find(m=>m.name==='Secure Asset');
  assert.deepEqual(secure.scoring.map(w=>[w.when,w.items.map(i=>i.vp)]),[
    ['End of your turn',[4,2]],
    ['R2+ Command phase / R5 end of turn',[4,4]]
  ]);
  assert.match(secure.scoring[0].items[1].summary,/central objective/);
  assert.match(secure.scoring[1].items[0].summary,/non-home objective/);
  assert.match(secure.scoring[1].items[1].summary,/three or more objectives/);
  assert.equal(secure.officialCardVerified,false,'scoring photograph does not certify entire physical card');
});

test('rephotographed Triangulate and Surveil the Foe Actions preserve exact printed triggers',()=>{
  const triangulate=all.find(m=>m.name==='Triangulation').action;
  assert.equal(triangulate.phase,'shooting');
  assert.equal(triangulate.minRound,2);
  assert.equal(triangulate.reviewTiming,'end-of-turn');
  assert.match(triangulate.summary,/once per turn/i);
  assert.match(triangulate.summary,/non-home objective/);
  assert.match(triangulate.summary,/place an operation marker/);
  assert.match(triangulate.summary,/if that unit controls the objective/);

  const surveil=all.find(m=>m.name==='Surveil the Foe').action;
  assert.equal(surveil.phase,'shooting');
  assert.equal(surveil.reviewTiming,'end-of-turn','action reference review remains at end of turn');
  assert.match(surveil.summary,/within 18 inches/);
  assert.match(surveil.summary,/visible enemy unit/);
  assert.match(surveil.summary,/Unlimited use/);
  assert.match(surveil.summary,/completes immediately/);
  assert.match(surveil.summary,/until the end of this turn/);
});

test('final three printed Primary scoring faces retain scoring windows and marker rules',()=>{
  const byName=(name)=>all.find(m=>m.name===name);
  const surveil=byName('Surveil the Foe');
  assert.deepEqual(surveil.scoring.map(w=>[w.when,w.items.map(i=>i.vp)]),[
    ['End of your turn',[4]],
    ['R2+ Command phase / R5 end of turn',[4,4]],
    ['R2+ end of your turn',[5]]
  ]);
  assert.match(surveil.scoring[0].items[0].summary,/unless every surveilled unit/i);
  assert.match(surveil.scoring[1].items[0].summary,/non-home objective/i);
  assert.match(surveil.scoring[1].items[1].summary,/more objectives than your opponent/i);
  assert.match(surveil.scoring[2].items[0].summary,/No enemy mission markers remain/i);
  assert.match(surveil.setup,/Each time a friendly unit ends a move/i);
  assert.match(surveil.setup,/remove those operation markers from the battlefield/i);

  const locate=byName('Locate and Deny');
  assert.deepEqual(locate.scoring.map(w=>[w.when,w.items.map(i=>i.vp)]),[
    ['End of your turn',[4,4]],
    ['R2+ Command phase / R5 end of turn',[4]],
    ['End of battle',[5]]
  ]);
  for(const index of [1,2]){
    const entry=index===1?locate.scoring[0].items[1]:locate.scoring[2].items[0];
    assert.match(entry.summary,/Exactly one of your operation markers remains/);
    assert.match(entry.summary,/same terrain area/);
    assert.match(entry.summary,/no enemy unit/i);
  }
  assert.match(locate.setup,/start of battle/i);
  assert.match(locate.setup,/five terrain areas outside your deployment zone/i);
  assert.match(locate.setup,/If fewer than five are available/i);

  const triangulation=byName('Triangulation');
  assert.deepEqual(triangulation.scoring.map(w=>[w.when,w.items.map(i=>i.vp)]),[
    ['R2+ Command phase / R5 end of turn',[4]],
    ['R2+ end of your turn',[3,6,10]],
    ['End of battle',[10]]
  ]);
  assert.match(triangulation.scoring[2].items[0].summary,/four or more objectives/i);
  for(const card of [surveil,locate,triangulation]){
    assert.equal(card.photographedScoringFace,'IMG_4A7684A0-3C51-4E8B-A46A-AF5D17A548E5.jpeg');
    assert.equal(card.officialCardVerified,false,'current full official card and errata certification is distinct');
  }
});
