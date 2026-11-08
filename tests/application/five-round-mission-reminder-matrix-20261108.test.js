import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_COMPANION_MAP_CATALOG } from '../../src/data/event-companion-map-catalog.js';
import { getBattlePrimaryMissionDefinitions } from '../../src/data/primary-mission-catalog.js';
import { primaryWindowDue } from '../../src/rules/checkpoint-mission-evidence.js';
import { getScoringCheckpointReminder } from '../../src/application/scoring-checkpoint-reminders.js';
import { renderScoringCheckpointDialog } from '../../src/ui/scoring-checkpoint-dialog.js';

// Regression-only five-round synthetic exercise of live checkpoint timing.
// This is NOT a physical iPad Safari acceptance result. No VP is auto-awarded.
const players = [{ id:'p1',name:'You' },{ id:'p2',name:'Opponent' }];
const stateFor=(myDisposition,opponentDisposition,round,activePlayer,phase)=>({
  phase,
  turn:(round-1)*2+(activePlayer==='p1'?1:2),
  activePlayer,
  battle:{status:'active',round,activePlayerId:activePlayer,firstPlayerId:'p1'},
  players,units:[],objectives:[],history:[],
  battlefieldMap:{missionSetup:{myDisposition,opponentDisposition,layout:'A'}},
  scoring:{secondaryMissions:[],secondaryMissionModeByPlayer:{p1:'tactical',p2:'tactical'},turnSnapshots:[]}
});
const groupFor=(reminder,playerId)=>reminder?.groups?.find(group=>group.playerId===playerId);
const list=(windows)=>windows.map(window=>[window.when,window.items.map(item=>item.vp)]);
const inactivate=(mission,round)=>mission.scoring.filter(w=>primaryWindowDue(w.when,'end-of-opponent-turn',round));

test('all 25 disposition pairings show due manual Primary scoring at both players\' five-round checkpoints',()=>{
  let checks=0;
  for(const mine of EVENT_COMPANION_MAP_CATALOG.forceDispositions){
    for(const theirs of EVENT_COMPANION_MAP_CATALOG.forceDispositions){
      const definitions=getBattlePrimaryMissionDefinitions(mine,theirs);
      assert.ok(definitions,'missing mission pair '+mine+' vs '+theirs);
      for(let round=1;round<=5;round++){
        for(const activePlayer of ['p1','p2']){
          const expectedMission=activePlayer==='p1'?definitions.myMission:definitions.opponentMission;
          const movement=stateFor(mine,theirs,round,activePlayer,'movement');
          const command=getScoringCheckpointReminder(movement,{previousPhase:'command',perspectivePlayerId:'p1'});
          const expectedCommand=expectedMission.scoring.filter(w=>primaryWindowDue(w.when,'command-phase',round));
          assert.deepEqual(list(groupFor(command,activePlayer)?.primaryScoringWindows??[]),list(expectedCommand),
            expectedMission.name+' R'+round+' '+activePlayer+' Command');
          if(round===1)assert.equal(expectedCommand.length,0,'no turn-one Primary Command scoring');
          if(expectedCommand.length){
            assert.equal(command.timing,'command-phase');
            assert.equal(groupFor(command,activePlayer).primaryReference.name,expectedMission.name);
            assert.equal(groupFor(command,activePlayer).checkpoint,'command-phase');
            assert.equal(command.requiresObjectiveConfirmation,false);
          }
          const endTurn=stateFor(mine,theirs,round,activePlayer,'end_turn');
          const reminder=getScoringCheckpointReminder(endTurn,{previousPhase:'fight',perspectivePlayerId:'p1'});
          const expectedEnd=expectedMission.scoring.filter(w=>primaryWindowDue(w.when,'end-of-turn',round));
          const group=groupFor(reminder,activePlayer);
          assert.deepEqual(list(group?.primaryScoringWindows??[]),list(expectedEnd),
            expectedMission.name+' R'+round+' '+activePlayer+' end turn');
          if(expectedEnd.length){
            assert.equal(group.primaryReference.name,expectedMission.name);
            assert.equal(group.checkpoint,'end-of-turn');
            assert.equal(reminder.requiresObjectiveConfirmation,false);
            assert.ok(renderScoringCheckpointDialog(endTurn,reminder).match(/manual scoring/i),
              'live popup remains a manual scoring review');
          }
          // Some Primary Missions (e.g. Punishment) explicitly score at
          // the end of either player's turn. Keep those opponent-turn
          // opportunities while suppressing ordinary own-turn windows.
          const inactive=activePlayer==='p1'?'p2':'p1';
          const inactiveMission=activePlayer==='p1'?definitions.opponentMission:definitions.myMission;
          const expectedOpponent=inactivate(inactiveMission,round);
          assert.deepEqual(list(groupFor(reminder,inactive)?.primaryScoringWindows??[]),list(expectedOpponent),
            inactiveMission.name+' R'+round+' '+inactive+' opponent-turn Primary eligibility');
          checks++;
        }
      }
    }
  }
  assert.equal(checks,250,'25 mission pairs x 5 rounds x 2 active players');
});

test('fifth-round end-turn replaces Command-phase scoring for both players without suggesting extra Command VP',()=>{
  for(const mine of EVENT_COMPANION_MAP_CATALOG.forceDispositions){
    for(const theirs of EVENT_COMPANION_MAP_CATALOG.forceDispositions){
      for(const activePlayer of ['p1','p2']){
        const state=stateFor(mine,theirs,5,activePlayer,'end_turn');
        const reminder=getScoringCheckpointReminder(state,{previousPhase:'fight',perspectivePlayerId:'p1'});
        const group=groupFor(reminder,activePlayer);
        const mission=activePlayer==='p1'
          ?getBattlePrimaryMissionDefinitions(mine,theirs).myMission
          :getBattlePrimaryMissionDefinitions(mine,theirs).opponentMission;
        const shift=mission.scoring.filter(w=>/R5 end of turn/i.test(w.when));
        for(const window of shift){
          assert.ok(group?.primaryScoringWindows.includes(window),
            mission.name+' missing final-turn substitute for '+activePlayer);
        }
      }
    }
  }
});
