import { primaryWindowDue } from '../rules/checkpoint-mission-evidence.js';
import { evaluateScoringCheckpoint } from '../engine/scoring-check-coordinator.js';
import { hasEffectiveVictoryPointOpportunity } from '../engine/victory-points-ledger.js';
import { getBattlePrimaryMissionDefinitions } from '../data/primary-mission-catalog.js';

const checkpointKey = (state, playerId, checkpoint) =>
  [state?.battle?.round ?? 0, state?.turn ?? 0, playerId, checkpoint].join(':');

function unscoredPrimaryReview(state, group, mission) {
  return !hasEffectiveVictoryPointOpportunity(
    state,
    group.playerId,
    mission.definitionId,
    checkpointKey(state, group.playerId, group.checkpoint)
  );
}

export function getScoringCheckpointReminder(state, { previousPhase, missionDefinitions=[], perspectivePlayerId=null } = {}) {
  const timing=previousPhase==='command'&&state.phase==='movement'?'command-phase':state.phase==='end_turn'&&previousPhase!=='end_turn'?'end-of-turn':null;
  if (!timing) return null;
  const activePlayerId=state.activePlayer??state.battle?.activePlayerId;
  const players=state.players??[];
  const groups=players.filter(player=>timing==='end-of-turn'||player.id===activePlayerId).map(player=>{
    const checkpoint=player.id===activePlayerId?timing:'end-of-opponent-turn';
    const review=evaluateScoringCheckpoint(state,{checkpoint,scoringPlayerId:player.id,activePlayerId,primaryDefinitions:missionDefinitions});
    return {playerId:player.id,playerName:player.name??player.id,checkpoint,review};
  });
  const setup=state.battlefieldMap?.missionSetup;
  const primaries=setup?.myDisposition&&setup?.opponentDisposition
    ? getBattlePrimaryMissionDefinitions(setup.myDisposition,setup.opponentDisposition)
    : null;
  const myPlayer=perspectivePlayerId??players[0]?.id;
  for (const group of groups) {
    group.primaryReference=primaries?(group.playerId===myPlayer?primaries.myMission:primaries.opponentMission):null;
    group.primaryScoringWindows=(group.primaryReference?.scoring??[]).filter(window =>
      primaryWindowDue(window.when, group.checkpoint, state.battle?.round));
    if (group.primaryReference && group.primaryScoringWindows.length &&
        hasEffectiveVictoryPointOpportunity(
          state,
          group.playerId,
          group.primaryReference.id,
          checkpointKey(state, group.playerId, group.checkpoint)
        )) {
      group.primaryScoringWindows=[];
    }
    group.review={
      ...group.review,
      primary:(group.review?.primary??[]).filter(mission=>unscoredPrimaryReview(state,group,mission))
    };
  }
  const actionableGroups=groups.filter(group=>
    group.primaryScoringWindows.length>0 ||
    (group.review?.primary?.length??0)>0 ||
    (group.review?.secondary?.length??0)>0
  );
  if (!actionableGroups.length) return null;
  const activeName=players.find(p=>p.id===activePlayerId)?.name??'active player';
  return {timing,label:`End of ${activeName}'s ${timing==='command-phase'?'Command phase':'turn'}`,
    activePlayerId,scoringPlayerId:activePlayerId,perspectivePlayerId:myPlayer,groups:actionableGroups,
    requiresObjectiveConfirmation:false,
    missions:actionableGroups.flatMap(group=>[
      ...(group.primaryScoringWindows.length&&group.primaryReference?[`${group.playerName}: ${group.primaryReference.name}`]:[]),
      ...(group.review?.primary??[]).map(entry=>`${group.playerName}: ${entry.definitionName??entry.definitionId}`),
      ...(group.review?.secondary??[]).map(entry=>`${group.playerName}: ${entry.definitionName??entry.definitionId}`)
    ])};
}
