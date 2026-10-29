import { createGameState } from '../../src/state/game-state.js';
import { ADEPTUS_CUSTODES_DATASHEET_DETAILS as sheets } from '../../src/data/adeptus-custodes-datasheet-details.js';

export function custodesReminderState({phase='shooting',activePlayer='p2'}={}) {
  const entries=[['wardens','custodian-wardens'],['trajann','trajann-valoris'],['sentinel','sentinel-guard-sodality'],['allarus','allarus-custodians'],['galatus','contemptor-galatus-dreadnought'],['telemon','telemon-heavy-dreadnought'],['venatari','venatari-with-verutum-lances'],['venatari2','venatari-with-verutum-lances'],['prosecutors','prosecutor-squad']];
  const rosterUnits=entries.map(([id,sheet])=>({id:'r-'+id,name:id,modelCount:sheet.includes('dreadnought')||id==='trajann'?1:3,datasheet:structuredClone(sheets['adeptus-custodes:'+sheet])}));
  rosterUnits.find(unit=>unit.id==='r-trajann').attachedToBodyguardId='r-wardens';
  rosterUnits.find(unit=>unit.id==='r-wardens').attachedLeaderIds=['r-trajann'];
  return createGameState({phase,turn:1,activePlayer,players:[{id:'p1',name:'You'},{id:'p2',name:'Ultramarines'}],battle:{id:'b',status:'active',round:1,activePlayerId:activePlayer,firstPlayerId:'p2'},commandPoints:{p1:3,p2:3},
    armyRosters:{p1:{faction:'Adeptus Custodes',detachment:'Guardians of the Throne',units:rosterUnits},p2:{faction:'Space Marines',units:[]}},
    units:[...entries.map(([id])=>({id,name:id,ownerId:'p1',status:'deployed',position:{x:20,y:20},metadata:{rosterUnitId:'r-'+id},wounds:id==='trajann'?10:12})),{id:'marine',name:'Marine attacker',ownerId:'p2',status:'deployed',wounds:12,position:{x:22,y:20},profile:{weaponIds:['bolter'],characteristics:{toughness:5,save:3,ballisticSkill:3,weaponSkill:3}}}],history:[]});
}
