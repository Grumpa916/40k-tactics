import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../../src/state/game-state.js';
import { getOverwatchOffer, recordOverwatchUse, declineOverwatch } from '../../src/rules/overwatch-interrupt.js';
import { transferMapReserve } from '../../src/engine/map-reserve-transitions.js';
import { getEmbarkedPassengers } from '../../src/rules/firing-deck.js';
import { renderMovementReserveDock } from '../../src/ui/map-reserve-tray.js';

function battle(){
  return createGameState({
    phase:'movement',turn:2,activePlayer:'opponent',
    battle:{id:'live',status:'active',round:2,activePlayerId:'opponent'},
    players:[{id:'you',name:'You'},{id:'opponent',name:'Opponent'}],
    commandPoints:{you:2,opponent:2},history:[],
    units:[
      {id:'custodes',ownerId:'you',name:'Allarus Custodians',status:'deployed',wounds:18,position:{x:14,y:12}},
      {id:'impulsor',ownerId:'opponent',name:'Impulsor',status:'deployed',wounds:11,position:{x:36,y:22}},
      {id:'eradicators',ownerId:'opponent',name:'Eradicator Squad',status:'embarked',wounds:9,transportId:'impulsor',position:null}
    ],
    preparation:{formations:{impulsor:{kind:'field'},eradicators:{kind:'embarked',transportId:'impulsor'}}}
  });
}
test('end-of-Movement Overwatch spends CP and records a target and tabletop damage',()=>{
  const state=battle(), offer=getOverwatchOffer(state);
  assert.equal(offer?.playerId,'you');
  assert.equal(offer?.targets.length,1);
  assert.throws(()=>recordOverwatchUse(state,{triggerKey:offer.triggerKey,firingUnitId:'custodes',targetUnitId:'impulsor'}),/Confirm/);
  const next=recordOverwatchUse(state,{triggerKey:offer.triggerKey,firingUnitId:'custodes',targetUnitId:'impulsor',
    timingConfirmed:true,inRangeConfirmed:true,visibilityConfirmed:true,unengagedConfirmed:true,actualDamage:2});
  assert.equal(next.commandPoints.you,1);
  assert.equal(next.units.find(unit=>unit.id==='impulsor').wounds,9);
  assert.equal(next.history.at(-1).payload.actualDamage,2);
  assert.equal(getOverwatchOffer(next),null);
  assert.equal(state.commandPoints.you,2);
});
test('declined Overwatch does not spend CP',()=>{
  const state=battle(), next=declineOverwatch(state,{triggerKey:getOverwatchOffer(state).triggerKey});
  assert.equal(next.commandPoints.you,2);
  assert.equal(getOverwatchOffer(next),null);
});
test('an embarked Eradicator squad appears in dock and can disembark without remaining a passenger',()=>{
  const state=battle();
  assert.match(renderMovementReserveDock(state,{playerId:'opponent'}),/Embarked · 1/);
  assert.match(renderMovementReserveDock(state,{playerId:'opponent'}),/data-map-reserve-select="eradicators"/);
  const next=transferMapReserve(state,{unitId:'eradicators',destination:'battlefield',position:{x:33,y:21}});
  assert.equal(next.units.find(unit=>unit.id==='eradicators').status,'deployed');
  assert.deepEqual(next.units.find(unit=>unit.id==='eradicators').position,{x:33,y:21});
  assert.equal(next.units.find(unit=>unit.id==='eradicators').transportId,null);
  assert.equal(next.preparation.formations.eradicators.kind,'field');
  assert.equal(getEmbarkedPassengers(next,next.units.find(unit=>unit.id==='impulsor')).length,0);
  assert.equal(next.history.at(-1).type,'unit.disembarked');
});
